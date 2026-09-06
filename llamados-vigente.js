(() => {
  const ROUTE = "#/llamados";
  const MONTHS = new Map([
    ["enero", 1], ["febrero", 2], ["marzo", 3], ["abril", 4], ["mayo", 5], ["junio", 6],
    ["julio", 7], ["agosto", 8], ["septiembre", 9], ["setiembre", 9], ["octubre", 10], ["noviembre", 11], ["diciembre", 12]
  ]);
  const STATIC_ROWS = window.CRS_APP_OPERATIONAL?.onCallSchedule?.rows || [];
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

  const route = () => String(location.hash || "#/inicio").split("?")[0];

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

  function aliasTerms(query) {
    const q = clean(query);
    if (!q) return [];
    const exact = STATIC_ROWS.find((row) => {
      const haystack = [row.specialty, ...(row.aliases || [])].map(clean);
      return haystack.some((term) => term.includes(q) || q.includes(term));
    });
    return exact
      ? [...new Set([exact.specialty, ...(exact.aliases || [])].map(clean).filter(Boolean))]
      : [q];
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

  function detectDayColumns(page) {
    let best = [];
    for (const row of page.rows) {
      const nums = row.items
        .map((item) => ({ item, value: /^\d{1,2}$/.test(item.text) ? Number(item.text) : NaN }))
        .filter(({ value }) => Number.isInteger(value) && value >= 1 && value <= 31);
      if (nums.length > best.length) best = nums;
    }
    if (best.length < 5) return null;
    const map = new Map();
    best.forEach(({ item, value }) => {
      if (!map.has(value)) map.set(value, item.x + item.width / 2);
    });
    return map.size >= 5 ? map : null;
  }

  function knownSpecialtyAnchors(page) {
    const labels = STATIC_ROWS.map((row) => ({ label: row.specialty, terms: [row.specialty, ...(row.aliases || [])].map(clean) }));
    const anchors = [];
    page.rows.forEach((row, index) => {
      for (const candidate of labels) {
        if (candidate.terms.some((term) => term.length >= 4 && row.norm.includes(term))) {
          anchors.push({ index, y: row.y, label: candidate.label, row });
          break;
        }
      }
    });
    return anchors.sort((a, b) => b.y - a.y);
  }

  function matchingAnchors(query) {
    const terms = aliasTerms(query);
    const matches = [];
    for (const page of pdfPages || []) {
      page.rows.forEach((row, index) => {
        if (terms.some((term) => term && (row.norm.includes(term) || term.includes(row.norm)))) {
          matches.push({ page, row, index });
        }
      });
    }
    return matches;
  }

  function doctorForDay(match, day) {
    const columns = detectDayColumns(match.page);
    if (!columns?.has(day)) return "";
    const targetX = columns.get(day);
    const sorted = [...columns.entries()].sort((a, b) => a[1] - b[1]);
    const columnIndex = sorted.findIndex(([value]) => value === day);
    const leftX = columnIndex > 0 ? (sorted[columnIndex - 1][1] + targetX) / 2 : targetX - 24;
    const rightX = columnIndex < sorted.length - 1 ? (targetX + sorted[columnIndex + 1][1]) / 2 : targetX + 24;

    const anchors = knownSpecialtyAnchors(match.page);
    const current = anchors.find((anchor) => Math.abs(anchor.y - match.row.y) <= 4) || { y: match.row.y };
    const anchorIndex = anchors.findIndex((anchor) => anchor === current || Math.abs(anchor.y - current.y) <= 0.1);
    const prevY = anchorIndex > 0 ? anchors[anchorIndex - 1].y : current.y + 18;
    const nextY = anchorIndex >= 0 && anchorIndex < anchors.length - 1 ? anchors[anchorIndex + 1].y : current.y - 18;
    const upperY = (prevY + current.y) / 2;
    const lowerY = (current.y + nextY) / 2;

    const cellItems = match.page.items
      .filter((item) => item.x + item.width / 2 >= leftX && item.x + item.width / 2 < rightX)
      .filter((item) => item.y <= upperY && item.y >= lowerY)
      .filter((item) => !/^\d{1,2}$/.test(item.text))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    const text = cellItems.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim();
    return /^x$/i.test(text) ? "Sin disponibilidad registrada" : text;
  }

  function bestLabel(match, query) {
    const q = clean(query);
    const staticMatch = STATIC_ROWS.find((row) => [row.specialty, ...(row.aliases || [])].map(clean).some((term) => term.includes(q) || q.includes(term)));
    if (staticMatch) return staticMatch.specialty;
    return match?.row?.text || query;
  }

  function buildCard(match, query, dateValue) {
    const card = document.createElement("article");
    card.className = "on-call-result available on-call-live-result";
    const specialty = bestLabel(match, query);
    const day = Number(String(dateValue || "").split("-")[2]);
    const doctor = doctorForDay(match, day);
    card.innerHTML = `
      <div class="on-call-result-head"><span class="on-call-specialty"></span><span class="on-call-badge available">Vigente</span></div>
      <strong></strong>
      <p></p>`;
    card.querySelector(".on-call-specialty").textContent = specialty;
    card.querySelector("strong").textContent = doctor || "Coincidencia encontrada en la rotativa vigente";
    card.querySelector("p").textContent = doctor
      ? `${formatDate(dateValue)} · fuente ${source?.meta?.label || source?.title || "publicada por Jefatura"}`
      : `Encontré la especialidad en el PDF vigente, pero esa celda no pudo leerse automáticamente. Usa “Documento global” para verificarla.`;
    return card;
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
        <div class="on-call-live-source" data-call-live-source><strong></strong><span>Fuente vigente publicada por Jefatura</span></div>
        <div class="on-call-controls">
          <label class="on-call-field"><span>Fecha consultada</span><input type="date" data-call-live-date></label>
          <label class="on-call-field"><span>Buscar especialidad</span><input type="search" data-call-live-query placeholder="Ej: cardiología, infectología, uro..." autocomplete="off" inputmode="search"></label>
        </div>
        <div class="on-call-live-status" data-call-live-status aria-live="polite"></div>
        <div class="on-call-results" data-call-live-results></div>
        <div class="route-actions calls-route-actions"><button class="back-link on-call-clear" type="button" data-call-live-clear>Limpiar búsqueda</button></div>
      </section>`;

    panel.querySelector("[data-call-live-source] strong").textContent = meta?.label || source.title || source.file_name || "Rotativa vigente";
    const dateInput = panel.querySelector("[data-call-live-date]");
    const queryInput = panel.querySelector("[data-call-live-query]");
    const status = panel.querySelector("[data-call-live-status]");
    const results = panel.querySelector("[data-call-live-results]");
    dateInput.value = defaultDate;
    if (min) dateInput.min = min;
    if (max) dateInput.max = max;

    const render = () => {
      const ticket = ++renderTicket;
      const query = queryInput.value.trim();
      results.replaceChildren();
      if (!query) {
        status.textContent = pdfPages ? "" : "Cargando rotativa vigente…";
        return;
      }
      if (!pdfPages) {
        status.textContent = "Cargando rotativa vigente…";
        return;
      }
      const matches = matchingAnchors(query);
      if (ticket !== renderTicket) return;
      if (!matches.length) {
        status.textContent = "No encontré esa especialidad en la rotativa vigente.";
        return;
      }
      status.textContent = "";
      const unique = [];
      const seen = new Set();
      for (const match of matches) {
        const key = `${match.page.pageNo}:${Math.round(match.row.y)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(match);
        if (unique.length >= 4) break;
      }
      unique.forEach((match) => results.append(buildCard(match, query, dateInput.value)));
    };

    queryInput.addEventListener("input", render);
    dateInput.addEventListener("change", render);
    panel.querySelector("[data-call-live-clear]").addEventListener("click", () => {
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
      source = await latestDocument();
      if (!source) return;
      mountSearch();
      try {
        pdfPages = await extractPdf(source.url);
      } catch (error) {
        console.error("No se pudo leer la rotativa vigente", error);
        const status = document.querySelector("[data-call-live-status]");
        if (status) status.textContent = "No pude leer el PDF automáticamente. Usa “Documento global” para abrir la rotativa vigente.";
        return;
      }
      mountSearch();
      const query = document.querySelector("[data-call-live-query]");
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
      if (route() === ROUTE && source) mountSearch();
    });
    observer.observe(page, { childList: true, subtree: true });
  }

  function routeChanged() {
    if (route() !== ROUTE) return;
    watch();
    boot().catch((error) => console.error("No se pudo preparar la rotativa vigente", error));
  }

  window.addEventListener("hashchange", routeChanged);
  window.addEventListener("crs:ui-section-ready", routeChanged);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", routeChanged, { once: true });
  else routeChanged();
})();
