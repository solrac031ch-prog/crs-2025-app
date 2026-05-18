(() => {
  const CONTENT_KEY = "crsContentUploadsV2";
  const CALLS_KEY = "crsCallsUploadsV2";
  const FORMS_KEY = "crsDynamicFormsV2";
  const NEW_FLOW_KEY = "crsNewFlowsV1";
  const PHONES_KEY = "crsExtraPhonesStable";
  const SESSION_KEY = "crsAuthSessionV3";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "") || fallback; } catch { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; } }
  function isChief() {
    const user = session();
    const role = clean(user?.role);
    const email = clean(user?.email || user?.username);
    return Boolean(user && (["admin", "owner", "desarrollador", "jefatura", "jefe"].includes(role) || email === "mdcarlosherrera@gmail.com"));
  }

  function contentState() { return read(CONTENT_KEY, { news: [], education: [], papers: [] }); }
  function callsState() { return read(CALLS_KEY, []); }
  function formsState() { return read(FORMS_KEY, { base: {}, custom: [] }); }
  function flowsState() { return read(NEW_FLOW_KEY, []); }
  function phonesState() { return read(PHONES_KEY, []); }

  function addStyle() {
    if ($("#gestion-eliminaciones-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-eliminaciones-style";
    style.textContent = `
      .delete-zone{display:grid;gap:14px;padding:16px;border:1px solid #fecaca;border-left:7px solid #dc2626;border-radius:12px;background:#fff7f7;box-shadow:0 12px 28px rgba(127,29,29,.08)}
      .delete-zone h2{margin:0;color:#7f1d1d}.delete-zone p{margin:0;color:#5f2a2a;line-height:1.42}.delete-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.delete-card{display:grid;gap:8px;padding:12px;border:1px solid #fecaca;border-radius:10px;background:#fff}.delete-card h3{margin:0;color:#7f1d1d}.delete-list{display:grid;gap:7px;max-height:360px;overflow:auto}.delete-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px;border:1px solid #f3d0d0;border-radius:9px;background:#fffafa}.delete-row strong{display:block;color:#1f2937}.delete-row span{display:block;color:#64748b;font-size:.84rem;line-height:1.25}.btn-danger-mini{border:0;border-radius:8px;background:#dc2626;color:#fff;font-weight:900;min-height:34px;padding:0 10px;cursor:pointer}.btn-danger-mini:hover{background:#991b1b}.delete-empty{padding:9px;border-radius:8px;background:#f8fafc;color:#64748b;font-size:.9rem}.delete-soft{border:0;border-radius:8px;background:#f97316;color:#fff;font-weight:900;min-height:34px;padding:0 10px;cursor:pointer}
    `;
    document.head.append(style);
  }

  function row(label, meta, action, id, extra = "") {
    return `<div class="delete-row"><div><strong>${esc(label)}</strong><span>${esc(meta || "")}</span></div><button class="${extra === "reset" ? "delete-soft" : "btn-danger-mini"}" type="button" data-delete-action="${esc(action)}" data-delete-id="${esc(id)}">${extra === "reset" ? "Quitar" : "Borrar"}</button></div>`;
  }

  function listOrEmpty(items) {
    return items.length ? `<div class="delete-list">${items.join("")}</div>` : `<div class="delete-empty">No hay elementos guardados.</div>`;
  }

  function renderDeletePanel() {
    const content = $("#chiefContent");
    if (!content || !isChief()) return;
    const existing = content.querySelector("[data-delete-zone]");
    if (existing) existing.remove();

    const contents = contentState();
    const calls = callsState();
    const forms = formsState();
    const flows = flowsState();
    const phones = phonesState();

    const newsRows = (contents.news || []).map((item) => row(item.title || "Noticia", item.createdAt, "content:news", item.id));
    const educationRows = (contents.education || []).map((item) => row(item.title || "Educación", item.createdAt, "content:education", item.id));
    const paperRows = (contents.papers || []).map((item) => row(item.title || "Paper", `${item.month || "sin mes"} · ${item.createdAt || ""}`, "content:papers", item.id));
    const callRows = (calls || []).map((item) => row(item.title || "Documento", `${item.type || "documento"} · ${item.fileName || item.url || ""}`, "calls", item.id));
    const customFormRows = (forms.custom || []).map((item) => row(item.title || "Formulario", item.createdAt, "forms:custom", item.id));
    const baseFormRows = Object.entries(forms.base || {}).filter(([, value]) => value?.url || value?.fileData).map(([key, item]) => row(key, item.fileName || item.url || "Actualización local", "forms:base", key, "reset"));
    const flowRows = (flows || []).map((item) => row(item.title || "Elemento", `${item.category || ""} · ${item.createdAt || ""}`, "flows", item.id));
    const phoneRows = (phones || []).map((item, index) => row(item.name || item.title || item.phone || "Teléfono", `${item.detail || ""} ${item.phone || ""}`, "phones", String(index)));

    const panel = `<section class="delete-zone" data-delete-zone="true"><h2>Eliminar publicaciones, documentos y elementos</h2><p>Desde aquí puedes borrar lo que se haya subido desde Jefatura en este navegador. Para borrar usuarios del backend Google se usa el panel de usuarios y el botón Desactivar.</p><div class="delete-grid"><article class="delete-card"><h3>Noticias</h3>${listOrEmpty(newsRows)}</article><article class="delete-card"><h3>Educación</h3>${listOrEmpty(educationRows)}</article><article class="delete-card"><h3>Paper del mes</h3>${listOrEmpty(paperRows)}</article><article class="delete-card"><h3>Especialistas / UHD</h3>${listOrEmpty(callRows)}</article><article class="delete-card"><h3>Formularios agregados</h3>${listOrEmpty(customFormRows)}</article><article class="delete-card"><h3>Formularios existentes actualizados</h3>${listOrEmpty(baseFormRows)}</article><article class="delete-card"><h3>Flujos / CRS / Protocolos</h3>${listOrEmpty(flowRows)}</article><article class="delete-card"><h3>Teléfonos agregados</h3>${listOrEmpty(phoneRows)}</article></div></section>`;

    const uploadPanel = content.querySelector("[data-jefatura-upload-panel]");
    if (uploadPanel) uploadPanel.insertAdjacentHTML("afterend", panel);
    else content.insertAdjacentHTML("beforeend", panel);
  }

  function removeById(list, id) {
    return list.filter((item) => String(item.id) !== String(id));
  }

  function deleteItem(action, id) {
    if (!isChief()) return alert("Requiere sesión de jefatura.");
    if (!confirm("¿Seguro que quieres borrar este elemento?")) return;

    if (action.startsWith("content:")) {
      const type = action.split(":")[1];
      const current = contentState();
      current[type] = removeById(current[type] || [], id);
      write(CONTENT_KEY, current);
    }

    if (action === "calls") {
      write(CALLS_KEY, removeById(callsState(), id));
    }

    if (action === "forms:custom") {
      const current = formsState();
      current.custom = removeById(current.custom || [], id);
      write(FORMS_KEY, current);
    }

    if (action === "forms:base") {
      const current = formsState();
      current.base = current.base || {};
      delete current.base[id];
      write(FORMS_KEY, current);
    }

    if (action === "flows") {
      write(NEW_FLOW_KEY, removeById(flowsState(), id));
    }

    if (action === "phones") {
      const current = phonesState();
      current.splice(Number(id), 1);
      write(PHONES_KEY, current);
    }

    alert("Elemento eliminado.");
    renderDeletePanel();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-action]");
    if (!button) return;
    deleteItem(button.dataset.deleteAction, button.dataset.deleteId);
  }, true);

  function route() {
    addStyle();
    if (location.hash.split("?")[0] !== "#/jefatura") return;
    setTimeout(renderDeletePanel, 150);
    setTimeout(renderDeletePanel, 550);
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("crs:jefatura-rendered", route);
  const observer = new MutationObserver(() => route());
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route);
  else route();
})();
