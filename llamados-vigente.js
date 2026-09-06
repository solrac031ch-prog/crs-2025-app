(() => {
  const ROUTE = "#/llamados";
  const MONTHS = new Map([
    ["enero", 1], ["febrero", 2], ["marzo", 3], ["abril", 4], ["mayo", 5], ["junio", 6],
    ["julio", 7], ["agosto", 8], ["septiembre", 9], ["setiembre", 9], ["octubre", 10], ["noviembre", 11], ["diciembre", 12]
  ]);

  const CATALOG = window.CRS_APP_OPERATIONAL?.onCallSchedule?.rows || [];
  const LABELS = new Map([
    ["broncopulmonar", ["bronco"]],
    ["gastroenterologia", ["gastro"]],
    ["nefrologia habil", ["nefrologia habil"]],
    ["nefrologia inhabil", ["nefrologia"]],
    ["reumatologia am", ["reumatologia"]],
    ["reumatologia pm", ["reumatologia pm"]]
  ]);
  const BLOCKED_ALIASES = new Map([
    ["urologia", new Set(["renal"])]
  ]);

  let source = null;
  let pages = null;
  let bootPromise = null;
  let renderVersion = 0;

  const clean = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = (value) => clean(value).split(" ").filter(Boolean);
  const currentRoute = () => String(location.hash || "#/inicio").split("?")[0];

  function wholePhrase(text, phrase) {
    const haystack = ` ${clean(text)} `;
    const needle = ` ${clean(phrase)} `;
    return Boolean(clean(phrase)) && haystack.includes(needle);
  }

  function tokenPrefixMatch(text, query) {
    const haystack = tokens(text);
    const wanted = tokens(query);
    if (!wanted.length) return false;
    return wanted.every((needle) => needle.length >= 2 && haystack.some((word) => word.startsWith(needle)));
  }

  function termScore(query, term) {
    const q = clean(query);
    const t = clean(term);
    if (!q || !t) return 0;
    if (q === t) return 1000;
    if (wholePhrase(t, q)) return 900;
    if (tokenPrefixMatch(t, q)) return 700;
    return 0;
  }

  function aliasesFor(row) {
    const blocked = BLOCKED_ALIASES.get(clean(row.specialty));
    return (row.aliases || []).filter((alias) => !blocked?.has(clean(alias)));
  }

  function specialtyScore(row, query) {
    let score = termScore(query, row.specialty);
    if (score) score += 120;
    aliasesFor(row).forEach((alias) => {
      score = Math.max(score, termScore(query, alias));
    });
    return score;
  }

  function specialtiesForQuery(query) {
    const q = clean(query);
    if (!q) return [];
    return CATALOG
      .map((row, index) => ({ row, index, score: specialtyScore(row, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ row }) => row);
  }

  function parseMonthYear(value) {
    const normalized = clean(value);
    const monthName = [...MONTHS.keys()].find((name) => normalized.includes(name));
    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    if (!monthName || !yearMatch) return null;
    return {
      month: MONTHS.get(monthName),
      year: Number(yearMatch[1]),
      label: String(value || "").trim()
    };
  }

  function localDateValue(date = new Date()) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function formatDate(value) {
    const [year, month, day] = String(value || "").split("-").map(Number);
    if (!year || !month || !day) return "Fecha seleccionada";
    return new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(year, month - 1, day, 12));
  }

  async function latestDocument() {
    const api = window.CRS_SUPABASE;
    if (!api?.fetchDocuments) return null;
    const docs = await api.fetchDocuments(["llamados"]);
    const item = docs.find((doc) => doc.key === "especialistas" && doc.status === "published");
    if (!item) return null;
    const url = String(item.url || "").trim();
    if (!url) return null;
    return {
      ...item,
      url,
      meta: parseMonthYear(item.title || item.file_name || "")
    };
  }

  function pdfJs() {
    if (window.pdfjsLib?.getDocument) return Promise.resolve(window.pdfjsLib);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-pdfjs]");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.pdfjsLib), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
      script.dataset.pdfjs = "true";
      script.onload = () => resolve(window.pdfjsLib);
      script.onerror = () => reject(new Error("No se pudo cargar el lector del PDF."));
      document.head.append(script);
    }).then((lib) => {
      if (lib?.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      }
      return lib;
    });
  }

  function groupRows(rawItems) {
    const rows = [];
    const items = (rawItems || [])
      .filter((item) => String(item.str || "").trim())
      .map((item) => ({
        text: String(item.str || "").trim(),
        x: Number(item.transform?.[4] || 0),
        y: Number(item.transform?.[5] || 0),
        width: Number(item.width || 0)
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    for (const item of items) {
      let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2.6);
      if (!row) {
        row = { y: item.y, items: [] };
        rows.push(row);
      }
      row.items.push(item);
    }

    rows.forEach((row) => {
      row.items.sort((a, b) => a.x - b.x);
      row.text = row.items.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim();
      row.norm = clean(row.text);
    });
    rows.sort((a, b) => b.y - a.y);
    return rows;
  }

  async function extractPdf(url) {
    const lib = await pdfJs();
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo abrir la rotativa vigente (${response.status}).`);
    const buffer = await response.arrayBuffer();
    const pdf = await lib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const extracted = [];

    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      extracted.push({ pageNo, rows: groupRows(content.items) });
    }
    return extracted;
  }

  function dayBlocks(page) {
    const headers = page.rows
      .map((row) => {
        const columns = new Map();
        row.items.forEach((item) => {
          if (!/^\d{1,2}$/.test(item.text)) return;
          const day = Number(item.text);
          if (!Number.isInteger(day) || day < 1 || day > 31 || columns.has(day)) return;
          columns.set(day, item.x + item.width / 2);
        });
        return { y: row.y, row, columns };
      })
      .filter(({ columns }) => columns.size >= 3)
      .sort((a, b) => b.y - a.y);

    return headers.map((header, index) => ({
      ...header,
      upperY: header.y,
      lowerY: headers[index + 1]?.y ?? -Infinity
    }));
  }

  function blockForDay(page, day) {
    return dayBlocks(page).find((block) => block.columns.has(day)) || null;
  }

  function rowsInBlock(page, block) {
    if (!block) return [];
    return page.rows
      .filter((row) => row.y < block.upperY - 1 && row.y > block.lowerY + 1)
      .sort((a, b) => b.y - a.y);
  }

  function labelsFor(catalogRow) {
    const key = clean(catalogRow.specialty);
    return (LABELS.get(key) || [key]).map(clean);
  }

  function rowMatchesLabel(row, label, catalogRow) {
    const norm = row.norm;
    if (!norm || !label) return false;
    const key = clean(catalogRow.specialty);

    if (key === "nefrologia inhabil") {
      return norm === "nefrologia" || (norm.startsWith("nefrologia ") && !norm.startsWith("nefrologia habil"));
    }
    if (key === "reumatologia am") {
      return norm === "reumatologia" || (norm.startsWith("reumatologia ") && !norm.startsWith("reumatologia pm"));
    }
    return norm === label || norm.startsWith(`${label} `);
  }

  function findRowForCatalog(blockRows, catalogRow) {
    for (const label of labelsFor(catalogRow)) {
      const match = blockRows.find((row) => rowMatchesLabel(row, label, catalogRow));
      if (match) return match;
    }
    return null;
  }

  function typicalGap(columns) {
    const xs = [...columns.values()].sort((a, b) => a - b);
    const gaps = xs.slice(1).map((value, index) => value - xs[index]).filter((gap) => gap > 10);
    if (!gaps.length) return 72;
    gaps.sort((a, b) => a - b);
    return gaps[Math.floor(gaps.length / 2)];
  }

  function cleanCellText(value) {
    return String(value || "")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cellForDay(row, block, day) {
    const columns = block?.columns;
    if (!columns?.has(day)) return "";

    const sorted = [...columns.entries()].sort((a, b) => a[1] - b[1]);
    const index = sorted.findIndex(([value]) => value === day);
    const x = sorted[index][1];
    const gap = typicalGap(columns);
    const left = index > 0 ? (sorted[index - 1][1] + x) / 2 : x - gap / 2;
    const right = index < sorted.length - 1 ? (x + sorted[index + 1][1]) / 2 : x + gap / 2;

    const parts = row.items
      .filter((item) => item.x >= left && item.x < right)
      .sort((a, b) => a.x - b.x)
      .map((item) => item.text)
      .filter((text) => !/^\d{1,2}$/.test(text));

    const text = cleanCellText(parts.join(" "));
    if (/^x$/i.test(text)) return "Sin disponibilidad registrada";
    return text;
  }

  function resultFor(catalogRow, row, block, dateValue) {
    const day = Number(String(dateValue || "").split("-")[2]);
    return {
      specialty: catalogRow.specialty,
      doctor: cellForDay(row, block, day),
      date: formatDate(dateValue)
    };
  }

  function resultsFor(query, dateValue) {
    const day = Number(String(dateValue || "").split("-")[2]);
    if (!Number.isInteger(day) || day < 1 || day > 31) return [];

    const selected = specialtiesForQuery(query);
    const results = [];
    const seen = new Set();

    for (const page of pages || []) {
      const block = blockForDay(page, day);
      if (!block) continue;
      const blockRows = rowsInBlock(page, block);

      for (const catalogRow of selected) {
        const row = findRowForCatalog(blockRows, catalogRow);
        if (!row) continue;
        const result = resultFor(catalogRow, row, block, dateValue);
        const key = `${clean(result.specialty)}|${clean(result.doctor)}|${result.date}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(result);
      }
    }

    return results.slice(0, 4);
  }

  function buildCard(result) {
    const unavailable = result.doctor === "Sin disponibilidad registrada";
    const card = document.createElement("article");
    card.className = `on-call-result on-call-live-result calls-live-card ${unavailable ? "unavailable" : "available"}`;
    card.innerHTML = `
      <div class="on-call-result-head"><span class="on-call-specialty"></span></div>
      <strong></strong>
      <p></p>`;
    card.querySelector(".on-call-specialty").textContent = result.specialty;
    card.querySelector("strong").textContent = result.doctor || "Sin nombre legible en esta celda";
    card.querySelector("p").textContent = result.doctor
      ? result.date
      : `${result.date} · verifica el documento global antes de usar este dato.`;
    return card;
  }

  function loadingShell(message = "Cargando rotativa vigente…") {
    const panel = document.querySelector("#callsSearchPanel");
    if (!panel || currentRoute() !== ROUTE) return;
    panel.innerHTML = `
      <section class="on-call-search on-call-live" data-call-live-loading>
        <div class="on-call-live-status" aria-live="polite">${message}</div>
      </section>`;
  }

  function mountSearch() {
    if (currentRoute() !== ROUTE || !source) return;
    const panel = document.querySelector("#callsSearchPanel");
    if (!panel) return;

    const meta = source.meta;
    const now = new Date();
    const defaultDate = meta && now.getFullYear() === meta.year && now.getMonth() + 1 === meta.month
      ? localDateValue(now)
      : meta
        ? `${meta.year}-${String(meta.month).padStart(2, "0")}-01`
        : localDateValue(now);
    const min = meta ? `${meta.year}-${String(meta.month).padStart(2, "0")}-01` : "";
    const max = meta ? `${meta.year}-${String(meta.month).padStart(2, "0")}-${String(daysInMonth(meta.year, meta.month)).padStart(2, "0")}` : "";

    panel.dataset.callsLiveSource = source.url;
    panel.innerHTML = `
      <section class="on-call-search on-call-live" data-call-live-search>
        <div class="on-call-live-source" data-call-live-source><strong></strong><span>Rotativa vigente · Jefatura</span></div>
        <div class="on-call-controls">
          <label class="on-call-field"><span>Fecha consultada</span><input type="date" data-call-live-date></label>
          <label class="on-call-field"><span>Buscar especialidad</span><input type="search" data-call-live-query placeholder="Ej: cardiología, infectología, uro..." autocomplete="off" inputmode="search"></label>
        </div>
        <div class="on-call-live-status" data-call-live-status aria-live="polite"></div>
        <div class="on-call-results" data-call-live-results></div>
        <div class="route-actions calls-route-actions"><button class="back-link on-call-clear" type="button" data-call-live-clear hidden>Limpiar</button></div>
      </section>`;

    panel.querySelector("[data-call-live-source] strong").textContent = meta?.label || source.title || source.file_name || "Rotativa vigente";
    const dateInput = panel.querySelector("[data-call-live-date]");
    const queryInput = panel.querySelector("[data-call-live-query]");
    const status = panel.querySelector("[data-call-live-status]");
    const results = panel.querySelector("[data-call-live-results]");
    const clear = panel.querySelector("[data-call-live-clear]");

    dateInput.value = defaultDate;
    if (min) dateInput.min = min;
    if (max) dateInput.max = max;

    const render = () => {
      const version = ++renderVersion;
      const query = queryInput.value.trim();
      clear.hidden = !query;
      results.replaceChildren();

      if (!query) {
        status.textContent = pages ? "" : "Cargando rotativa vigente…";
        return;
      }
      if (!pages) {
        status.textContent = "Cargando rotativa vigente…";
        return;
      }

      const found = resultsFor(query, dateInput.value);
      if (version !== renderVersion) return;
      if (!found.length) {
        status.textContent = "No encontré esa especialidad para la fecha seleccionada en la rotativa vigente.";
        return;
      }

      status.textContent = "";
      found.forEach((item) => results.append(buildCard(item)));
    };

    queryInput.addEventListener("input", render);
    dateInput.addEventListener("change", render);
    clear.addEventListener("click", () => {
      queryInput.value = "";
      dateInput.value = defaultDate;
      render();
      queryInput.focus();
    });

    render();
  }

  async function boot() {
    if (currentRoute() !== ROUTE) return;
    if (bootPromise) return bootPromise;

    bootPromise = (async () => {
      loadingShell();
      const nextSource = await latestDocument();
      if (!nextSource) {
        loadingShell("No hay una rotativa vigente publicada por Jefatura.");
        return;
      }

      const changed = source?.url !== nextSource.url;
      source = nextSource;
      if (changed) pages = null;
      mountSearch();

      if (!pages) {
        try {
          pages = await extractPdf(source.url);
        } catch (error) {
          console.error("No se pudo leer la rotativa vigente", error);
          const status = document.querySelector("[data-call-live-status]");
          if (status) status.textContent = "No pude leer el PDF automáticamente. Usa Documento global para verificar la rotativa vigente.";
          return;
        }
      }

      const query = document.querySelector("[data-call-live-query]");
      const status = document.querySelector("[data-call-live-status]");
      if (status && !query?.value) status.textContent = "";
      if (query?.value) query.dispatchEvent(new Event("input", { bubbles: true }));
    })().finally(() => {
      bootPromise = null;
    });

    return bootPromise;
  }

  window.CRS_LEGACY_ONCALL_SEARCH = window.renderOnCallSearch;
  window.renderOnCallSearch = function renderOnCallSearchVigente() {
    if (source) mountSearch();
    else loadingShell();
    boot().catch((error) => {
      console.error("No se pudo preparar la rotativa vigente", error);
      loadingShell("No se pudo preparar el buscador de llamados. Usa Documento global para verificar la rotativa.");
    });
  };

  window.CRS_CALLS_SEARCH_SAFE = Object.freeze({
    specialtiesForQuery,
    dayBlocks,
    version: 4
  });

  function routeChanged() {
    if (currentRoute() !== ROUTE) return;
    boot().catch((error) => console.error("No se pudo preparar la rotativa vigente", error));
  }

  window.addEventListener("hashchange", routeChanged);
  window.addEventListener("crs:ui-section-ready", routeChanged);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", routeChanged, { once: true });
  else routeChanged();
})();
