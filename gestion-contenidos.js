(() => {
  const CONTENT_KEY = "crsContentUploadsV1";
  const CALLS_KEY = "crsCallsUploadsV1";
  const FORMS_KEY = "crsDynamicFormsV1";
  const SESSION_KEY = "crsAuthSessionV3";
  const MAX_INLINE_BYTES = 3.8 * 1024 * 1024;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "") || fallback; } catch { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function uid() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; } }
  function isChief() {
    const user = session();
    const role = clean(user?.role);
    const email = clean(user?.email || user?.username);
    return Boolean(user && (["admin", "owner", "desarrollador", "jefatura", "jefe"].includes(role) || email === "mdcarlosherrera@gmail.com"));
  }

  function state() {
    return read(CONTENT_KEY, { news: [], education: [], papers: [] });
  }
  function callsState() { return read(CALLS_KEY, []); }
  function formsState() { return read(FORMS_KEY, []); }

  function addStyle() {
    if ($("#gestion-contenidos-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-contenidos-style";
    style.textContent = `
      .content-shortcuts{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:12px}
      .content-shortcut{display:grid;gap:5px;padding:14px;border:1px solid #dfe8e4;border-radius:12px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08);border-left:6px solid #2563eb}
      .content-shortcut strong{font-size:1.04rem;color:#10201c}.content-shortcut span{color:#52615c;font-size:.92rem;line-height:1.35}
      .jefatura-upload-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:12px}
      .jefatura-upload-card{display:grid;gap:10px;padding:15px;border:1px solid #dfe8e4;border-radius:12px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}
      .jefatura-upload-card h3{margin:0;color:#10201c}.jefatura-upload-card p{margin:0;color:#52615c;line-height:1.42}
      .jefatura-upload-card label{display:grid;gap:5px;font-weight:850;color:#24312d}.jefatura-upload-card input,.jefatura-upload-card select,.jefatura-upload-card textarea{width:100%;min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c}
      .content-list{display:grid;gap:12px}.content-item{display:grid;gap:8px;padding:15px;border:1px solid #dfe8e4;border-radius:12px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}.content-item h3{margin:0}.content-item p{margin:0;color:#52615c;line-height:1.42}.content-meta{display:flex;flex-wrap:wrap;gap:6px;color:#64748b;font-size:.86rem}.content-tag{display:inline-flex;align-items:center;border-radius:999px;background:#eef7f5;color:#0b4f49;padding:4px 8px;font-weight:850;font-size:.8rem}
      .uploaded-call-search{display:grid;gap:10px;padding:14px;border:1px solid #dfe8e4;border-radius:12px;background:#fbfdfc;margin-top:12px}.uploaded-call-results{display:grid;gap:8px}.uploaded-call-row{display:grid;gap:4px;padding:10px;border:1px solid #e5ebe8;border-radius:10px;background:#fff}.uploaded-call-row strong{color:#10201c}.uploaded-call-row span{color:#52615c}.upload-small{font-size:.86rem;color:#64748b;line-height:1.3}.upload-ok{padding:9px;border-radius:8px;background:#ecfdf5;color:#065f46;font-weight:850}.upload-warn{padding:9px;border-radius:8px;background:#fff7ed;color:#9a3412;font-weight:850}.dynamic-form-panel{border-left:6px solid #7c3aed}
    `;
    document.head.append(style);
  }

  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      if (!file || file.size > MAX_INLINE_BYTES) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }
  function readAsText(file) {
    return new Promise((resolve) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });
  }
  function readAsArrayBuffer(file) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file);
    });
  }

  function loadScript(src, test) {
    return new Promise((resolve) => {
      if (test()) return resolve(true);
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { existing.addEventListener("load", () => resolve(test()), { once: true }); return; }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(test());
      script.onerror = () => resolve(false);
      document.head.append(script);
    });
  }

  async function extractXlsx(file) {
    const ok = await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", () => Boolean(window.XLSX));
    if (!ok) return { text: "", rows: [], note: "No se pudo cargar lector Excel." };
    const buffer = await readAsArrayBuffer(file);
    if (!buffer) return { text: "", rows: [], note: "Archivo Excel sin datos." };
    const workbook = XLSX.read(buffer, { type: "array" });
    const rows = [];
    const textParts = [];
    workbook.SheetNames.forEach((name) => {
      const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" });
      sheetRows.forEach((row) => {
        const cells = row.map((cell) => String(cell || "").trim());
        if (cells.some(Boolean)) {
          rows.push(cells);
          textParts.push(cells.join("\t"));
        }
      });
    });
    return { text: textParts.join("\n"), rows, note: "Excel leído." };
  }

  async function extractDocx(file) {
    const ok = await loadScript("https://cdn.jsdelivr.net/npm/mammoth@1.7.0/mammoth.browser.min.js", () => Boolean(window.mammoth));
    if (!ok) return { text: "", rows: [], note: "No se pudo cargar lector Word." };
    const buffer = await readAsArrayBuffer(file);
    const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
    return { text: result.value || "", rows: [], note: "Word leído." };
  }

  async function extractPdf(file) {
    const ok = await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", () => Boolean(window.pdfjsLib));
    if (!ok) return { text: "", rows: [], note: "No se pudo cargar lector PDF." };
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const buffer = await readAsArrayBuffer(file);
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    return { text: pages.join("\n"), rows: [], note: "PDF leído." };
  }

  async function extractFile(file) {
    if (!file) return { text: "", rows: [], note: "Sin archivo." };
    const name = clean(file.name);
    if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
      const text = await readAsText(file);
      const rows = text.split(/\r?\n/).map((line) => line.split(/\t|,|;/).map((cell) => cell.trim())).filter((row) => row.some(Boolean));
      return { text, rows, note: "Texto/CSV leído." };
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) return extractXlsx(file);
    if (name.endsWith(".docx")) return extractDocx(file);
    if (name.endsWith(".pdf")) return extractPdf(file);
    return { text: "", rows: [], note: "Formato archivado sin extracción automática." };
  }

  function parseCallRows(rows, text, type) {
    const parsed = [];
    if (rows?.length >= 2) {
      const header = rows[0].map((cell) => String(cell || "").trim());
      rows.slice(1).forEach((row) => {
        const specialty = String(row[0] || "").trim();
        if (!specialty) return;
        row.slice(1).forEach((doctor, index) => {
          const value = String(doctor || "").trim();
          if (!value) return;
          parsed.push({ specialty, day: header[index + 1] || "", doctor: value, type });
        });
      });
    }
    if (!parsed.length && text) {
      text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
        if (/\b(dr\.?|dra\.?|doctor|doctora|eu|enfermera|kinesi)/i.test(line)) {
          parsed.push({ specialty: "Documento", day: "", doctor: line, type });
        }
      });
    }
    return parsed.slice(0, 500);
  }

  function fileOrUrl(item) {
    if (item.fileData) return item.fileData;
    return item.url || "";
  }
  function actionMarkup(item, label = "Abrir") {
    const href = fileOrUrl(item);
    return href ? `<a class="document-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}</a>` : "";
  }

  function contentButtons() {
    return `<section class="content-shortcuts" data-content-shortcuts="true"><a class="content-shortcut" href="#/gestion/noticias"><strong>📰 Noticias</strong><span>Comunicados, cursos, actividades y avisos relevantes.</span></a><a class="content-shortcut" href="#/gestion/educacion"><strong>🎓 Educación</strong><span>Material docente y recursos para el equipo.</span></a><a class="content-shortcut" href="#/gestion/paper"><strong>📄 Paper del mes</strong><span>Lectura mensual recomendada por jefatura.</span></a></section>`;
  }

  function patchGestionHome() {
    const page = $("#managementPage.active");
    const content = $("#managementContent");
    if (!page || !content || content.querySelector("[data-content-shortcuts]")) return;
    const grid = content.querySelector(".stable-grid");
    if (grid) grid.insertAdjacentHTML("afterend", contentButtons());
  }

  function renderContentRoute(type) {
    addStyle();
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === "managementPage"));
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (!content) return;
    const labels = { news: "Noticias", education: "Educación", paper: "Paper del mes" };
    if (title) title.textContent = labels[type];
    const current = state();
    const list = type === "paper" ? current.papers : current[type];
    content.innerHTML = `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="stable-hero"><h2>${labels[type]}</h2><p>Contenido publicado desde el módulo de jefatura.</p></section><section class="content-list">${(list || []).length ? list.map((item) => `<article class="content-item"><div class="content-meta"><span class="content-tag">${esc(item.kindLabel || labels[type])}</span><span>${esc(new Date(item.createdAt || Date.now()).toLocaleString("es-CL"))}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p>${actionMarkup(item, "Abrir material")}</article>`).join("") : `<div class="stable-note">Aún no hay contenido publicado.</div>`}</section>`;
  }

  function uploadPanels() {
    return `<section class="document-panel" data-jefatura-upload-panel="true"><h2>Publicaciones y documentos de jefatura</h2><p class="stable-note">Puedes subir archivos o pegar enlaces Google Drive/Forms/YouTube. Los archivos pequeños se guardan localmente; para uso institucional conviene pegar enlaces de Drive.</p><div class="jefatura-upload-grid">
      <article class="jefatura-upload-card"><h3>Especialistas de llamado / UHD</h3><p>Sube CSV, Excel, PDF o Word. CSV/Excel se transforma en filas para búsqueda; PDF/Word intenta extraer texto.</p><form data-upload-calls><label>Tipo<select name="type"><option value="especialistas">Especialistas de llamado</option><option value="uhd">UHD</option></select></label><label>Título<input name="title" required placeholder="Ej: Rotativa junio 2026"></label><label>Archivo<input name="file" type="file" accept=".csv,.tsv,.txt,.xls,.xlsx,.pdf,.docx,.doc"></label><label>Link Drive opcional<input name="url" type="url" placeholder="https://..."></label><button class="document-button" type="submit">Subir y extraer</button><div data-upload-calls-status></div></form></article>
      <article class="jefatura-upload-card"><h3>Formularios de turno</h3><p>Actualiza formularios existentes o agrega nuevos documentos.</p><form data-upload-form><label>Título<input name="title" required></label><label>Descripción<textarea name="description" rows="3"></textarea></label><label>Archivo<input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"></label><label>Link opcional<input name="url" type="url"></label><button class="document-button" type="submit">Publicar formulario</button></form></article>
      <article class="jefatura-upload-card"><h3>Paper del mes</h3><p>Publica el paper mensual.</p><form data-upload-content="paper"><label>Título<input name="title" required></label><label>Comentario<textarea name="description" rows="3"></textarea></label><label>Archivo<input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"></label><label>Link opcional<input name="url" type="url"></label><button class="document-button" type="submit">Publicar paper</button></form></article>
      <article class="jefatura-upload-card"><h3>Noticias / Educación</h3><p>Publica noticias, videos, Google Forms, PDFs, Word, Excel u otros enlaces.</p><form data-upload-content="mixed"><label>Tipo<select name="kind"><option value="news">Noticia</option><option value="education">Educación</option></select></label><label>Título<input name="title" required></label><label>Descripción<textarea name="description" rows="3"></textarea></label><label>Archivo<input name="file" type="file"></label><label>Link opcional<input name="url" type="url"></label><button class="document-button" type="submit">Publicar</button></form></article>
    </div></section>`;
  }

  function patchJefatura() {
    const page = $("#chiefPage.active");
    const content = $("#chiefContent");
    if (!page || !content || content.querySelector("[data-jefatura-upload-panel]")) return;
    if (!isChief()) return;
    const cases = content.querySelector(".document-panel:last-child");
    if (cases) cases.insertAdjacentHTML("beforebegin", uploadPanels());
    else content.insertAdjacentHTML("beforeend", uploadPanels());
  }

  function patchCallsSearch() {
    const page = $("#callsPage.active");
    if (!page || page.querySelector("[data-uploaded-call-search]")) return;
    const panel = page.querySelector(".document-panel");
    if (!panel) return;
    panel.insertAdjacentHTML("beforeend", `<section class="uploaded-call-search" data-uploaded-call-search><strong>Buscar en documentos subidos por jefatura</strong><input data-uploaded-call-query type="search" placeholder="Especialidad, médico, UHD..."><div class="upload-small">Busca en rotativas cargadas desde Jefatura. Funciona mejor con CSV/Excel.</div><div class="uploaded-call-results" data-uploaded-call-results></div></section>`);
  }

  function renderUploadedCallResults(query = "") {
    const results = $("[data-uploaded-call-results]");
    if (!results) return;
    const q = clean(query);
    const items = callsState().flatMap((doc) => (doc.entries || []).map((entry) => ({ ...entry, docTitle: doc.title, createdAt: doc.createdAt, url: doc.url, fileData: doc.fileData })));
    const matches = items.filter((item) => !q || clean([item.specialty, item.doctor, item.day, item.docTitle, item.type].join(" ")).includes(q)).slice(0, 30);
    results.innerHTML = matches.length ? matches.map((item) => `<article class="uploaded-call-row"><strong>${esc(item.specialty)} ${item.day ? `· ${esc(item.day)}` : ""}</strong><span>${esc(item.doctor)}</span><span class="upload-small">${esc(item.docTitle)} · ${esc(item.type)}</span>${actionMarkup(item, "Abrir documento")}</article>`).join("") : `<div class="upload-small">Sin resultados en documentos subidos.</div>`;
  }

  function appendDynamicForms() {
    const page = $("#formsPage.active");
    const list = $("#turnFormsList");
    if (!page || !list || list.dataset.dynamicFormsPatched === "true") return;
    const forms = formsState();
    if (!forms.length) return;
    list.dataset.dynamicFormsPatched = "true";
    forms.forEach((form) => {
      list.insertAdjacentHTML("beforeend", `<section class="document-panel dynamic-form-panel"><h2>${esc(form.title)}</h2><p>${esc(form.description)}</p><div class="document-action">${actionMarkup(form, "Abrir formulario")}</div></section>`);
    });
  }

  async function makeUploadItem(form) {
    const data = new FormData(form);
    const file = form.file?.files?.[0] || null;
    const item = { id: uid(), title: data.get("title"), description: data.get("description") || "", url: data.get("url") || "", fileName: file?.name || "", fileType: file?.type || "", createdAt: new Date().toISOString() };
    if (file) item.fileData = await fileToDataUrl(file);
    return { item, file };
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!form.closest("[data-upload-calls],[data-upload-form],[data-upload-content]")) return;
    event.preventDefault();
    if (!isChief()) { alert("Requiere sesión de jefatura."); return; }

    if (form.matches("[data-upload-calls]")) {
      const status = form.querySelector("[data-upload-calls-status]");
      if (status) status.innerHTML = `<div class="upload-warn">Leyendo archivo...</div>`;
      const { item, file } = await makeUploadItem(form);
      const type = new FormData(form).get("type");
      const extracted = await extractFile(file);
      item.type = type;
      item.extractedText = extracted.text.slice(0, 30000);
      item.entries = parseCallRows(extracted.rows, extracted.text, type);
      const docs = callsState();
      docs.unshift(item);
      write(CALLS_KEY, docs.slice(0, 20));
      if (status) status.innerHTML = `<div class="upload-ok">Documento guardado. Filas extraídas: ${item.entries.length}. ${esc(extracted.note)}</div>`;
      form.reset();
      return;
    }

    if (form.matches("[data-upload-form]")) {
      const { item } = await makeUploadItem(form);
      const forms = formsState();
      forms.unshift(item);
      write(FORMS_KEY, forms.slice(0, 40));
      alert("Formulario publicado.");
      form.reset();
      return;
    }

    if (form.matches("[data-upload-content]")) {
      const kind = form.dataset.uploadContent === "paper" ? "paper" : new FormData(form).get("kind");
      const { item } = await makeUploadItem(form);
      const current = state();
      if (kind === "paper") {
        item.kindLabel = "Paper del mes";
        current.papers.unshift(item);
        current.papers = current.papers.slice(0, 12);
      } else {
        item.kindLabel = kind === "education" ? "Educación" : "Noticia";
        current[kind].unshift(item);
        current[kind] = current[kind].slice(0, 60);
      }
      write(CONTENT_KEY, current);
      alert("Contenido publicado.");
      form.reset();
    }
  }, true);

  document.addEventListener("input", (event) => {
    const input = event.target.closest("[data-uploaded-call-query]");
    if (input) renderUploadedCallResults(input.value);
  }, true);

  function route() {
    addStyle();
    const hash = location.hash.split("?")[0];
    if (hash === "#/gestion/noticias") { renderContentRoute("news"); return; }
    if (hash === "#/gestion/educacion") { renderContentRoute("education"); return; }
    if (hash === "#/gestion/paper") { renderContentRoute("paper"); return; }
    patchGestionHome();
    patchJefatura();
    patchCallsSearch();
    appendDynamicForms();
  }

  const observer = new MutationObserver(() => setTimeout(route, 0));
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => { setTimeout(route, 80); setTimeout(route, 280); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(route, 120));
  else setTimeout(route, 120);
})();
