(() => {
  const SESSION_KEY = "crsAuthSessionV3";
  const CONTENT_KEY = "crsGestionContentV2";
  const ROUTES = new Set(["#/gestion/noticias", "#/gestion/educacion", "#/gestion/paper", "#/gestion/procedimientos"]);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const nowId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function session() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; }
  }

  function isChief() {
    const user = session();
    const role = clean(user?.role);
    const email = clean(user?.email || user?.username);
    return Boolean(user && (["admin", "owner", "desarrollador", "jefatura", "jefe", "jefe_turno"].includes(role) || email === "mdcarlosherrera@gmail.com"));
  }

  function apiUrl() { return String(window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "").trim(); }

  async function apiPost(action, payload = {}) {
    const url = apiUrl();
    if (!url) return { ok: false, error: "Falta configurar Apps Script URL" };
    const user = session();
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, email: user?.email || user?.username || "", ...payload })
    });
    return res.json();
  }

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(CONTENT_KEY) || "{}") || {}; } catch { return {}; }
  }

  function writeLocalGrouped(items) {
    const grouped = { news: [], education: [], papers: [], procedures: [] };
    (items || []).forEach((item) => {
      const type = item.type || item.kind || "news";
      if (type === "paper" || type === "papers") grouped.papers.push(normalizeContent(item, "paper"));
      else if (type === "procedure" || type === "procedures") grouped.procedures.push(normalizeContent(item, "procedure"));
      else if (type === "education") grouped.education.push(normalizeContent(item, "education"));
      else grouped.news.push(normalizeContent(item, "news"));
    });
    localStorage.setItem(CONTENT_KEY, JSON.stringify(grouped));
    return grouped;
  }

  function normalizeContent(item = {}, fallbackType = "news") {
    const type = item.type || item.kind || fallbackType;
    return {
      id: item.id || nowId(),
      type,
      title: item.title || item.titulo || "Sin título",
      description: item.description || item.descripcion || "",
      url: item.url || item.driveUrl || item.drive_url || "",
      eventUrl: item.eventUrl || item.event_url || "",
      month: item.month || "",
      fileName: item.fileName || item.file_name || "",
      fileType: item.fileType || item.file_type || "",
      thumbnailUrl: item.thumbnailUrl || item.thumbnail_url || "",
      previewUrl: item.previewUrl || item.preview_url || "",
      driveUrl: item.driveUrl || item.drive_url || "",
      createdAt: item.createdAt || item.fecha || item.created_at || "",
      remote: Boolean(item.remote || item.driveUrl || item.drive_url)
    };
  }

  async function listRemoteContent() {
    const result = await apiPost("listManagedContent", {});
    if (!result.ok) return { ok: false, error: result.error || "No se pudo leer Contenidos desde Drive" };
    return { ok: true, grouped: writeLocalGrouped(result.items || []) };
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function contentTypeFromForm(form, formData) {
    if (form.dataset.content === "paper") return "paper";
    if (form.dataset.content === "procedure") return "procedure";
    return String(formData.get("kind") || "news");
  }

  async function uploadContent(form) {
    const formData = new FormData(form);
    const file = form.file?.files?.[0] || null;
    const status = form.querySelector("[data-content-drive-status]") || document.createElement("div");
    status.className = "note";
    status.dataset.contentDriveStatus = "true";
    status.textContent = "Subiendo a Drive...";
    if (!status.parentNode) form.append(status);

    const filePayload = file ? {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataBase64: await readFileAsBase64(file)
    } : null;

    const payload = {
      content: {
        type: contentTypeFromForm(form, formData),
        title: String(formData.get("title") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        url: String(formData.get("url") || "").trim(),
        eventUrl: String(formData.get("eventUrl") || "").trim(),
        month: String(formData.get("month") || "").trim()
      },
      file: filePayload
    };

    if (!payload.content.title) {
      status.className = "note danger";
      status.textContent = "Falta título.";
      return null;
    }

    const result = await apiPost("saveManagedContent", payload);
    if (!result.ok) {
      status.className = "note danger";
      status.textContent = result.error || "No se pudo subir a Drive.";
      return null;
    }

    status.className = "note";
    status.textContent = "Publicado en Drive. Visible desde cualquier navegador/dispositivo.";
    await listRemoteContent();
    return result.content;
  }

  function addStyle() {
    if ($("#contenidos-drive-style")) return;
    const st = document.createElement("style");
    st.id = "contenidos-drive-style";
    st.textContent = `
      .drive-sync-note{padding:12px;border:1px solid #bae6fd;background:#f0f9ff;color:#075985;border-radius:10px;font-weight:750}.drive-media{width:100%;max-width:780px;height:620px;border:1px solid #dfe8e4;border-radius:12px;background:#f8fafc}.drive-image{width:100%;max-height:520px;object-fit:contain;border-radius:12px;border:1px solid #e5ebe8;background:#fff}.drive-card{display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #2563eb;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}.drive-card.news{border-left-color:#f59e0b;background:linear-gradient(135deg,#fff,#fff7ed)}.drive-card.paper{border-left-color:#7c3aed}.drive-card.procedure{border-left-color:#0f766e}.drive-actions{display:flex;gap:10px;flex-wrap:wrap}.drive-paper-layout{display:grid;grid-template-columns:minmax(240px,350px) minmax(0,1fr);gap:14px}.drive-sidebar{display:grid;gap:10px}.drive-side-card{display:grid;gap:6px;padding:12px;border:1px solid #dfe8e4;border-radius:12px;background:#fff}@media(max-width:820px){.drive-paper-layout{grid-template-columns:1fr}.drive-media{height:500px}}@media(max-width:680px){.drive-actions{display:grid}.drive-actions .document-button,.drive-actions .delete-button{width:100%;justify-content:center}.drive-media{height:420px}}
    `;
    document.head.append(st);
  }

  function nav() { return `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div>`; }

  function activateManagement(title) {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === "managementPage"));
    const h = $("#managementTitle");
    if (h) h.textContent = title;
  }

  function openButton(item, label = "Abrir") {
    const url = item.url || item.driveUrl || item.previewUrl;
    return url ? `<a class="document-button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : "";
  }

  function previewHtml(item, kind = "content") {
    if (item.previewUrl && (item.fileType || "").includes("pdf")) return `<iframe class="drive-media" src="${esc(item.previewUrl)}"></iframe>`;
    if (item.thumbnailUrl && (item.fileType || "").startsWith("image/")) return `<img class="drive-image" src="${esc(item.thumbnailUrl)}" alt="Vista previa">`;
    if (item.previewUrl) return `<iframe class="drive-media" src="${esc(item.previewUrl)}"></iframe>`;
    if (item.thumbnailUrl) return `<img class="drive-image" src="${esc(item.thumbnailUrl)}" alt="Vista previa">`;
    return `<div class="drive-sync-note">${kind === "paper" ? "Paper" : "Contenido"} publicado como enlace.</div>`;
  }

  async function deleteRemote(item, type) {
    if (!isChief()) return;
    if (!confirm("¿Eliminar esta publicación?")) return;
    const result = await apiPost("deleteManagedContent", { id: item.id });
    if (!result.ok) alert(result.error || "No se pudo eliminar");
    await renderCurrent();
  }

  function actionButtons(item, type) {
    return `<div class="drive-actions">${item.eventUrl ? `<a class="event-link" href="${esc(item.eventUrl)}" target="_blank" rel="noopener noreferrer">Inscripción / publicidad</a>` : ""}${openButton(item, type === "paper" ? "Abrir paper" : "Abrir material")}${item.driveUrl ? `<a class="document-button" href="${esc(item.driveUrl)}" target="_blank" rel="noopener noreferrer">Ver en Drive</a>` : ""}${isChief() ? `<button class="delete-button" type="button" data-drive-delete-content="${esc(item.id)}" data-drive-delete-type="${esc(type)}">Eliminar</button>` : ""}</div>`;
  }

  function renderNews(grouped) {
    activateManagement("Noticias");
    const list = grouped.news || [];
    const content = $("#managementContent");
    if (!content) return;
    content.innerHTML = `${nav()}<section class="gestion-hero"><h2>Noticias</h2><p>Noticias sincronizadas desde Drive. Visibles desde Safari, Android, PC o tablet.</p></section><div class="drive-sync-note">Fuente: Google Drive / hoja Contenidos.</div><div class="content-list">${list.length ? list.map((item) => `<article class="drive-card news"><span class="tag">Noticia</span><h3>📣 ${esc(item.title)}</h3><p>${esc(item.description)}</p>${previewHtml(item)}${actionButtons(item, "news")}</article>`).join("") : `<div class="note">Aún no hay noticias publicadas en Drive.</div>`}</div>`;
  }

  function renderEducation(grouped) {
    activateManagement("Educación médica");
    const list = grouped.education || [];
    const content = $("#managementContent");
    if (!content) return;
    content.innerHTML = `${nav()}<section class="gestion-hero"><h2>Educación médica</h2><p>Canales oficiales y material docente sincronizado.</p><div class="gestion-actions"><a class="document-button" href="https://youtube.com/@hospitalpadrehurtado9819?si=oDPWrfC0hXeBHHZs" target="_blank" rel="noopener noreferrer">Canal YouTube HPH</a><a class="document-button" href="https://open.spotify.com/show/4Yyb5LH2H6mj9NyDVajUMQ?si=LHra3q1PQl2s1-JQ8NysNg" target="_blank" rel="noopener noreferrer">Podcast Spotify</a><a class="document-button" href="#/gestion/procedimientos">Procedimientos médicos</a></div></section><div class="drive-sync-note">Material adicional cargado desde Drive.</div><div class="content-list">${list.length ? list.map((item) => `<article class="drive-card"><span class="tag">Educación</span><h3>🎓 ${esc(item.title)}</h3><p>${esc(item.description)}</p>${previewHtml(item)}${actionButtons(item, "education")}</article>`).join("") : `<div class="note">Aún no hay material educativo adicional publicado.</div>`}</div>`;
  }

  function renderPaper(grouped) {
    activateManagement("Paper del mes");
    const list = [...(grouped.papers || [])].sort((a, b) => String(b.month || b.createdAt).localeCompare(String(a.month || a.createdAt)));
    const latest = list[0];
    const older = list.slice(1);
    const content = $("#managementContent");
    if (!content) return;
    content.innerHTML = `${nav()}<section class="gestion-hero"><h2>Paper del mes</h2><p>Repositorio mensual sincronizado desde Drive.</p></section><section class="drive-paper-layout"><aside class="drive-sidebar"><h2>Repositorio</h2>${older.length ? older.map((item) => `<article class="drive-side-card"><span class="tag">${esc(item.month || String(item.createdAt).slice(0, 7) || "Sin mes")}</span><strong>${esc(item.title)}</strong><span class="mini">${esc(item.description).slice(0, 120)}</span>${actionButtons(item, "paper")}</article>`).join("") : `<div class="note">No hay papers previos.</div>`}</aside><main>${latest ? `<article class="drive-card paper"><span class="tag">Último paper · ${esc(latest.month || String(latest.createdAt).slice(0, 7))}</span><h3>${esc(latest.title)}</h3><p>${esc(latest.description)}</p>${previewHtml(latest, "paper")}${actionButtons(latest, "paper")}</article>` : `<div class="note">Aún no hay papers publicados.</div>`}</main></section>`;
  }

  function renderProcedures(grouped) {
    activateManagement("Procedimientos médicos");
    const list = grouped.procedures || [];
    const content = $("#managementContent");
    if (!content) return;
    content.innerHTML = `${nav()}<section class="gestion-hero procedures-hero"><h2>Procedimientos médicos</h2><p>Videos, documentos y enlaces cargados desde Drive.</p></section><div class="content-list">${list.length ? list.map((item) => `<article class="drive-card procedure"><span class="tag">Procedimiento</span><h3>🎥 ${esc(item.title)}</h3><p>${esc(item.description)}</p>${previewHtml(item)}${actionButtons(item, "procedure")}</article>`).join("") : `<div class="note">Aún no hay procedimientos publicados en Drive.</div>`}</div>`;
  }

  async function renderCurrent() {
    addStyle();
    const hash = location.hash.split("?")[0];
    if (!ROUTES.has(hash)) return;
    const result = await listRemoteContent();
    const grouped = result.ok ? result.grouped : { ...{ news: [], education: [], papers: [], procedures: [] }, ...readLocal() };
    if (hash === "#/gestion/noticias") renderNews(grouped);
    if (hash === "#/gestion/educacion") renderEducation(grouped);
    if (hash === "#/gestion/paper") renderPaper(grouped);
    if (hash === "#/gestion/procedimientos") renderProcedures(grouped);
    if (!result.ok) {
      const c = $("#managementContent");
      c?.insertAdjacentHTML("afterbegin", `<div class="note danger">No se pudo sincronizar con Drive: ${esc(result.error)}</div>`);
    }
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-content]");
    if (!form) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!isChief()) return alert("Requiere jefatura.");
    const item = await uploadContent(form);
    if (!item) return;
    alert("Publicado en Drive. Visible desde cualquier navegador y dispositivo.");
    form.reset();
    await renderCurrent();
  }, true);

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-drive-delete-content]");
    if (!button) return;
    event.preventDefault();
    const grouped = readLocal();
    const type = button.dataset.driveDeleteType;
    const key = type === "paper" ? "papers" : type === "procedure" ? "procedures" : type;
    const item = (grouped[key] || []).find((entry) => entry.id === button.dataset.driveDeleteContent);
    if (item) await deleteRemote(item, type);
  }, true);

  window.addEventListener("hashchange", () => setTimeout(renderCurrent, 180));
  window.addEventListener("focus", () => { if (ROUTES.has(location.hash.split("?")[0])) renderCurrent(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(renderCurrent, 250));
  else setTimeout(renderCurrent, 250);
})();
