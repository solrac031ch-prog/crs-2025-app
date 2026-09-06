(() => {
  const ROUTE = "#/llamados";
  const MONTHS = new Map([
    ["enero", 1], ["febrero", 2], ["marzo", 3], ["abril", 4], ["mayo", 5], ["junio", 6],
    ["julio", 7], ["agosto", 8], ["septiembre", 9], ["setiembre", 9], ["octubre", 10], ["noviembre", 11], ["diciembre", 12]
  ]);
  const STATIC_ROWS = window.CRS_APP_OPERATIONAL?.onCallSchedule?.rows || [];
  const PDF_LABEL_OVERRIDES = new Map([
    ["broncopulmonar", ["bronco"]],
    ["gastroenterologia", ["gastro"]],
    ["nefrologia habil", ["nefrologia habil"]],
    ["nefrologia inhabil", ["nefrologia"]],
    ["reumatologia am", ["reumatologia"]],
    ["reumatologia pm", ["reumatologia pm"]]
  ]);
  const DISALLOWED_ALIASES = new Map([
    ["urologia", new Set(["renal"])]
  ]);

  let bootPromise = null;
  let source = null;
  let pdfPages = null;
  let observer = null;
  let renderTicket = 0;

  const clean = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = (value) => clean(value).split(" ").filter(Boolean);
  const route = () => String(location.hash || "#/inicio").split("?")[0];

  function phraseContains(text, phrase) {
    const haystack = ` ${clean(text)} `;
    const needle = ` ${clean(phrase)} `;
    return Boolean(clean(phrase)) && haystack.includes(needle);
  }

  function prefixTokensMatch(text, query) {
    const haystackWords = words(text);
    const queryWords = words(query);
    if (!queryWords.length) return false;
    return queryWords.every((token) => token.length >= 2 && haystackWords.some((word) => word.startsWith(token)));
  }

  function termScore(query, term) {
    const q = clean(query);
    const value = clean(term);
    if (!q || !value) return 0;
    if (q === value) return 1000;
    if (phraseContains(value, q)) return 900;
    if (prefixTokensMatch(value, q)) return 700;
    return 0;
  }

  function aliasesForRow(row) {
    const blocked = DISALLOWED_ALIASES.get(clean(row.specialty));
    return (row.aliases || []).filter((alias) => !blocked?.has(clean(alias)));
  }

  function specialtyScore(row, query) {
    const specialty = clean(row.specialty);
    const direct = termScore(query, specialty);
    let score = direct ? direct + 120 : 0;
    for (const alias of aliasesForRow(row)) {
      score = Math.max(score, termScore(query, alias));
    }
    return score;
  }

  function specialtiesForQuery(query) {
    const q = clean(query);
    if (!q) return [];
    return STATIC_ROWS
      .map((row, index) => ({ row, index, score: specialtyScore(row, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ row }) => row);
  }

  function parseMonthYear(label = "") {
    const normalized = clean(label);
    const monthName = [...MONTHS.keys()].find((name) => normalized.includes(name));
    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    if (!monthName || !yearMatch) return null;
    return { month: MONTHS.get(monthName), year: Number(yearMatch[1]), label: String(label || "").trim() };
  }

  function localDateValue(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function formatDate(value) {
    const [year, month, day] = String(value || "").split("-").map(Number);
    if (!year || !month || !day) return "fecha seleccionada";
    return new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      .format(new Date(year, month - 1, day, 12));
  }

  async function latestDocument() {
    const api = window.CRS_SUPABASE;
    if (!api?.fetchDocuments) return null;
    const docs = await api.fetchDocuments(["llamados"]);
    const item = docs.find((doc) => doc.key === "especialistas" && doc.status === "published");
    if (!item) return null;
    const url = String(item.url || "").trim();
    if (!url) return null;
    const meta = parseMonthYear(item.title || item.file_name || "");
    return { ...item, url, meta };
  }

  function pdfJs() {
    if (window.pdfjsLib?.getDocument) return Promise.resolve(window.pdfjsLib);
    return new Promise((resolve, reject) => {
      const current = document.querySelector("script[data-pdfjs]");
      if (current) {
        current.addEventListener("load", () => resolve(window.pdfjsLib), { once: true });
        current.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
      script.dataset.pdfjs = "true";
      script.onload = () => resolve(window.pdfjsLib);
      script.onerror = () => reject(new Error("No se pudo cargar el lector de PDF."));
      document.head.append(script);
    }).then((lib) => {
      if (lib?.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      }
      return lib;
    });
  }

  function groupRows(items) {
    const rows = [];
    const sorted = [...items]
      .filter((item) => String(item.str || "").trim())
      .map((item) => ({
        text: String(item.str || "").trim(),
        x: Number(item.transform?.[4] || 0),
        y: Number(item.transform?.[5] || 0),
        width: Number(item.width || 0)
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    for (const item of sorted) {
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
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      const rows = groupRows(content.items || []);
      const items = rows.flatMap((row) => row.items.map((item) => ({ ...item, rowY: row.y })));
      pages.push({ pageNo, rows, items });
    }
    return pages;
  }

  function dayBlocks(page) {
    const headers = page.rows
      .map((row) => {
        const columns = new Map();
        row.items.forEach((item) => {
          if (!/^\d{1,2}$/.test(item.text)) return;
          const value = Number(item.text);
          if (!Number.isInteger(value) || value < 1 || value > 31 || columns.has(value)) return;
          columns.set(value, item.x + item.width / 2);
        });
        return { row, y: row.y, columns };
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

  function pdfLabelsFor(catalogRow) {
    const key = clean(catalogRow.specialty);
    const override = PDF_LABEL_OVERRIDES.get(key);
    if (override?.length) return override.map(clean);
    return [key];
  }

  function specialtyRowsForBlock(page, block) {
    if (!block?.columns?.size) return [];
    const firstDayX = Math.min(...block.columns.values());
    const labelBoundary = firstDayX - 16;

    return page.rows
      .filter((row) => row.y < block.upperY - 1 && row.y > block.lowerY + 1)
      .map((row) => {
        const label = row.items
          .filter((item) => item.x + item.width / 2 < labelBoundary)
          .map((item) => item.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        return { row, y: row.y, label, norm: clean(label) };
      })
      .filter(({ label }) => Boolean(label))
      .sort((a, b) => b.y - a.y);
  }

  function matchingRowsForDay(query, day) {
    const selected = specialtiesForQuery(query);
    const matches = [];

    for (const page of pdfPages || []) {
      const block = blockForDay(page, day);
      if (!block) continue;
      const specialtyRows = specialtyRowsForBlock(page, block);

      if (selected.length) {
        selected.forEach((catalogRow) => {
          const labels = pdfLabelsFor(catalogRow);
          const match = specialtyRows.find((candidate) => labels.includes(candidate.norm));
          if (match) {
            matches.push({
              page,
              block,
              specialtyRows,
              row: match.row,
              catalogRow,
              label: catalogRow.specialty
            });
          }
        });
        continue;
      }

      specialtyRows.forEach((candidate) => {
        if (!prefixTokensMatch(candidate.norm, query)) return;
        matches.push({
          page,
          block,
          specialtyRows,
          row: candidate.row,
          catalogRow: null,
          label: candidate.label
        });
      });
    }

    return matches;
  }

  function typicalColumnGap(columns) {
    const xs = [...columns.values()].sort((a, b) => a - b);
    const gaps = xs.slice(1).map((x, index) => x - xs[index]).filter((gap) => gap > 10);
    if (!gaps.length) return 70;
    gaps.sort((a, b) => a - b);
    return gaps[Math.floor(gaps.length / 2)];
  }

  function doctorForDay(match, day) {
    const columns = match.block?.columns;
    if (!columns?.has(day)) return "";

    const sorted = [...columns.entries()].sort((a, b) => a[1] - b[1]);
    const columnIndex = sorted.findIndex(([value]) => value === day);
    const targetX = sorted[columnIndex][1];
    const gap = typicalColumnGap(columns);
    const leftX = columnIndex > 0 ? (sorted[columnIndex - 1][1] + targetX) / 2 : targetX - gap / 2;
    const rightX = columnIndex < sorted.length - 1 ? (targetX + sorted[columnIndex + 1][1]) / 2 : targetX + gap / 2;

    const rows = match.specialtyRows || [];
    const rowIndex = rows.findIndex((candidate) => Math.abs(candidate.y - match.row.y) <= 0.2);
    const currentY = match.row.y;
    const rowGaps = rows.slice(1).map((candidate, index) => rows[index].y - candidate.y).filter((value) => value > 1);
    const rowGap = rowGaps.length ? rowGaps.sort((a, b) => a - b)[Math.floor(rowGaps.length / 2)] : 6;
    const prevY = rowIndex > 0 ? rows[rowIndex - 1].y : currentY + rowGap;
    const nextY = rowIndex >= 0 && rowIndex < rows.length - 1 ? rows[rowIndex + 1].y : currentY - rowGap;
    const upperY = (prevY + currentY) / 2;
    const lowerY = (currentY + nextY) / 2;

    const cellItems = match.page.items
      .filter((item) => item.x + item.width / 2 >= leftX && item.x + item.width / 2 < rightX)
      .filter((item) => item.y <= upperY && item.y >= lowerY)
      .filter((item) => !/^\d{1,2}$/.test(item.text))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    const text = cellItems.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim();
    if (/^x$/i.test(text)) return "Sin disponibilidad registrada";
    if (text.length > 180) return "";
    return text;
  }

  function resultForMatch(match, dateValue) {
    const day = Number(String(dateValue || "").split("-")[2]);
    const doctor = doctorForDay(match, day);
    return {
      specialty: match.label || match.catalogRow?.specialty || "Especialidad",
      doctor,
      date: formatDate(dateValue)
    };
  }

  function collectResults(query, dateValue) {
    const day = Number(String(dateValue || "").split("-")[2]);
    if (!Number.isInteger(day) || day < 1 || day > 31) return [];

    const results = [];
    const seen = new Set();
    for (const match of matchingRowsForDay(query, day)) {
      const result = resultForMatch(match, dateValue);
      const key = [result.specialty, result.doctor, result.date].map(clean).join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(result);
      if (results.length >= 4) break;
    }
    return results;
  }

  function buildCard(result) {
    const card = document.createElement("article");
    const unavailable = result.doctor === "Sin disponibilidad registrada";
    card.className = `on-call-result ${unavailable ? "unavailable" : "available"} on-call-live-result calls-live-card`;
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

  function renderLoadingShell(message = "Cargando rotativa vigente…") {
    if (route() !== ROUTE) return;
    const panel = document.querySelector("#callsSearchPanel");
    if (!panel) return;
    if (panel.querySelector("[data-call-live-search]")) return;
    panel.innerHTML = `
      <section class="on-call-search on-call-live" data-call-live-loading>
        <div class="on-call-live-status" aria-live="polite">${message}</div>
      </section>`;
  }

  function mountSearch() {
    if (route() !== ROUTE || !source) return;
    const panel = document.querySelector("#callsSearchPanel");
    if (!panel) return;
    if (panel.dataset.callsLiveSource === source.url && panel.querySelector("[data-call-live-search]")) return;

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
    const clearButton = panel.querySelector("[data-call-live-clear]");
    dateInput.value = defaultDate;
    if (min) dateInput.min = min;
    if (max) dateInput.max = max;

    const render = () => {
      const ticket = ++renderTicket;
      const query = queryInput.value.trim();
      clearButton.hidden = !query;
      results.replaceChildren();

      if (!query) {
        status.textContent = pdfPages ? "" : "Cargando rotativa vigente…";
        return;
      }
      if (!pdfPages) {
        status.textContent = "Cargando rotativa vigente…";
        return;
      }

      const found = collectResults(query, dateInput.value);
      if (ticket !== renderTicket) return;
      if (!found.length) {
        status.textContent = "No encontré esa especialidad para la fecha seleccionada en la rotativa vigente.";
        return;
      }

      status.textContent = "";
      found.forEach((result) => results.append(buildCard(result)));
    };

    queryInput.addEventListener("input", render);
    dateInput.addEventListener("change", render);
    clearButton.addEventListener("click", () => {
      queryInput.value = "";
      dateInput.value = defaultDate;
      render();
      queryInput.focus();
    });

    render();
    if (pdfPages) queryInput.focus({ preventScroll: true });
  }

  async function boot() {
    if (route() !== ROUTE) return;
    if (bootPromise) return bootPromise;

    bootPromise = (async () => {
      renderLoadingShell();
      const nextSource = await latestDocument();
      if (!nextSource) {
        renderLoadingShell("No hay una rotativa vigente publicada por Jefatura.");
        return;
      }

      const changed = source?.url !== nextSource.url;
      source = nextSource;
      if (changed) pdfPages = null;
      mountSearch();

      if (pdfPages) return;

      try {
        pdfPages = await extractPdf(source.url);
      } catch (error) {
        console.error("No se pudo leer la rotativa vigente", error);
        const status = document.querySelector("[data-call-live-status]");
        if (status) status.textContent = "No pude leer el PDF automáticamente. Usa Documento global para abrir la rotativa vigente.";
        return;
      }

      const status = document.querySelector("[data-call-live-status]");
      const query = document.querySelector("[data-call-live-query]");
      if (status && !query?.value) status.textContent = "";
      if (query?.value) query.dispatchEvent(new Event("input", { bubbles: true }));
    })().finally(() => {
      bootPromise = null;
    });

    return bootPromise;
  }

  function watch() {
    observer?.disconnect();
    const page = document.querySelector("#callsPage");
    if (!page) return;
    observer = new MutationObserver(() => {
      if (route() === ROUTE) {
        if (source) mountSearch();
        else renderLoadingShell();
      }
    });
    observer.observe(page, { childList: true, subtree: true });
  }

  function routeChanged() {
    if (route() !== ROUTE) return;
    watch();
    boot().catch((error) => {
      console.error("No se pudo preparar la rotativa vigente", error);
      renderLoadingShell("No se pudo preparar el buscador de llamados. Usa Documento global para verificar la rotativa.");
    });
  }

  if (typeof window.renderOnCallSearch === "function") {
    window.CRS_LEGACY_ONCALL_SEARCH = window.renderOnCallSearch;
    window.renderOnCallSearch = function renderOnCallSearchVigente() {
      if (source) mountSearch();
      else renderLoadingShell();
    };
  }

  window.CRS_CALLS_SEARCH_SAFE = Object.freeze({
    specialtiesForQuery,
    dayBlocks,
    version: 3
  });

  window.addEventListener("hashchange", routeChanged);
  window.addEventListener("crs:ui-section-ready", routeChanged);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", routeChanged, { once: true });
  else routeChanged();
})();