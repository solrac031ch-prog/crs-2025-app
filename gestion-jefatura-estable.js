(() => {
  const SESSION_KEY = "crsAuthSessionV3";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  function session() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("crsGoogleSessionV1");
  }

  function isChief(user = session()) {
    const role = clean(user?.role);
    const email = clean(user?.email || user?.username);
    return Boolean(user && (["admin", "owner", "desarrollador", "jefatura", "jefe"].includes(role) || email === "mdcarlosherrera@gmail.com"));
  }

  function addStyle() {
    if ($("#gestion-jefatura-estable-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-jefatura-estable-style";
    style.textContent = `
      .page:not(.active){display:none!important}
      #chiefPage>.page-head,#doctorsPage>.page-head{display:none!important}
      .stable-shell{display:grid;gap:14px}.stable-hero{position:relative;overflow:hidden;display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:14px;background:linear-gradient(135deg,#0f172a 0%,#14532d 48%,#0f766e 100%);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.24)}.stable-hero:after{content:"";position:absolute;right:-70px;bottom:-95px;width:250px;height:250px;border-radius:50%;background:rgba(255,255,255,.12)}.stable-hero h2{font-size:clamp(2rem,5vw,3.7rem);line-height:1;margin:0;color:#fff}.stable-hero p{max-width:820px;color:#def7ef;line-height:1.5;margin:0}.stable-actions{display:flex;flex-wrap:wrap;gap:10px;position:relative;z-index:1}.stable-actions .document-button:first-child{background:#f59e0b;border-color:#f59e0b;color:#1f1300}.stable-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.stable-card{display:grid;gap:8px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.08)}.stable-card.amber{border-left-color:#f59e0b}.stable-card.blue{border-left-color:#2563eb}.stable-card.purple{border-left-color:#7c3aed}.stable-card.red{border-left-color:#dc2626}.stable-card strong{font-size:1.08rem;color:#10201c}.stable-card span,.stable-card p{color:#52615c;line-height:1.42;margin:0}.stable-table{width:100%;border-collapse:collapse;min-width:760px}.stable-table th,.stable-table td{padding:9px 10px;border-bottom:1px solid #edf0ed;text-align:left;vertical-align:top}.stable-table th{background:#f6f8f7;font-size:.78rem;text-transform:uppercase;color:#44504b}.stable-table-wrap{overflow:auto;border:1px solid #dfe8e4;border-radius:10px;background:#fff}.stable-note{padding:12px;border:1px solid #f4d28a;border-radius:10px;background:#fff7e8;color:#664100;font-weight:750}.stable-warn{padding:12px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#7f1d1d;font-weight:750}.chief-form{display:grid;gap:10px}.chief-form label{display:grid;gap:6px;color:#24312d;font-weight:850}.chief-form input,.chief-form select,.chief-form textarea{width:100%;min-height:42px;padding:9px 11px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c}.admin-list{display:grid;gap:8px}.admin-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;border:1px solid #dfe8e4;border-radius:10px;background:#fbfdfc}.auth-tabs{display:flex;flex-wrap:wrap;gap:8px}.auth-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#eef7f5;color:#0b4f49;font-weight:850;font-size:.84rem}.route-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}@media(max-width:680px){.stable-actions,.route-actions{display:grid}.stable-actions .document-button,.route-actions .back-link{width:100%;justify-content:center}.admin-row{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }

  function activate(pageId) {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$("[data-route-link]").forEach((link) => link.classList.toggle("active", link.dataset.routeLink === "gestion" && ["managementPage", "chiefPage", "doctorsPage"].includes(pageId)));
    $("#chiefPage .page-head")?.remove();
    $("#doctorsPage .page-head")?.remove();
  }

  function getCases() {
    try { if (typeof priorityCases === "function") return priorityCases(); } catch {}
    try { return JSON.parse(localStorage.getItem("crsPriorityCases") || "[]"); } catch { return []; }
  }

  const nav = () => `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div>`;

  function renderGestion() {
    addStyle();
    activate("managementPage");
    const title = $("#managementTitle");
    if (title) title.textContent = "Gestión";
    const content = $("#managementContent");
    if (!content) return;
    const active = session();
    const cases = getCases();
    content.innerHTML = `<div class="stable-shell"><section class="stable-hero"><h2>Gestión de Urgencia</h2><p>Dos módulos: Equipo Urgencia para lectura operativa y Jefatura para publicaciones, documentos y usuarios Google.</p><div class="auth-tabs">${active ? `<span class="auth-pill">👤 ${esc(active.name || active.email || active.username)} · ${esc(active.role || "usuario")}</span>` : ""}<span class="auth-pill">🔐 Google / Apps Script</span></div><div class="stable-actions"><a class="document-button" href="#/urgencia">Módulo Equipo Urgencia</a><a class="document-button" href="#/jefatura">Módulo Jefatura</a><a class="document-button" href="#/especialidades">Ver flujos</a><a class="document-button" href="#/inicio">Inicio</a>${active ? `<button class="document-button" type="button" data-stable-logout>Cerrar sesión</button>` : ""}</div></section><section class="stable-grid"><article class="stable-card"><strong>Equipo Urgencia</strong><span>Flujos, formularios, visita, llamados y directorio.</span></article><article class="stable-card amber"><strong>Jefatura</strong><span>Publicaciones, documentos, usuarios Google y casos priorizados.</span></article><article class="stable-card blue"><strong>Casos guardados</strong><span>${cases.length}</span></article></section><div class="stable-note">La administración de usuarios debe manejarse desde CRS HPH 2025 - Backend mediante Google Apps Script.</div></div>`;
  }

  function renderUrgencia() {
    addStyle();
    activate("doctorsPage");
    const content = $("#doctorsContent");
    if (!content) return;
    content.innerHTML = `${nav()}<section class="stable-hero"><h2>Módulo Equipo Urgencia</h2><p>Área operativa para médicos, enfermería, TENS, kinesiólogos, matronería, administrativos y jefes de turno. No permite modificar planillas maestras.</p><div class="stable-actions"><a class="document-button" href="#/especialidades">Flujos clínicos</a><a class="document-button" href="#/llamados">Especialistas / UHD</a><a class="document-button" href="#/visita">Visita diaria</a><a class="document-button" href="#/formularios">Formularios</a><a class="document-button" href="#/telefonos">Directorio</a></div></section><section class="stable-grid"><article class="stable-card"><strong>Lectura clínica</strong><span>Los usuarios del equipo pueden consultar flujos y documentos.</span></article><article class="stable-card amber"><strong>Planillas Drive</strong><span>La edición real depende de permisos compartidos en Google Drive.</span></article><article class="stable-card blue"><strong>Sin administración</strong><span>No pueden crear usuarios ni modificar enlaces maestros desde este módulo.</span></article></section>`;
  }

  function authView() {
    return `${nav()}<section class="stable-hero"><h2>Módulo Jefatura</h2><p>Ingresa con una cuenta autorizada en CRS HPH 2025 - Backend.</p><div class="auth-tabs"><span class="auth-pill">👑 Jefatura</span><span class="auth-pill">🔐 Requiere Google autorizado</span></div></section><section class="document-panel"><h2>Ingreso con Google</h2><p>Correo autorizado inicial: <strong>mdcarlosherrera@gmail.com</strong>.</p><div id="googleSignInButton"></div><p data-google-auth-status class="stable-note">Si no aparece el botón, revisa Google Client ID y recarga con Ctrl + F5.</p></section>`;
  }

  function casesTable() {
    const rows = getCases().map((item) => `<tr><td>${esc(new Date(item.createdAt || Date.now()).toLocaleString("es-CL"))}</td><td>${esc(item.status || "Pendiente")}</td><td>${esc(item.flow || item.protocol || "")}</td><td>${esc(item.patientName || "")}<br>${esc(item.rut || "")}<br>${esc(item.phone || "")}</td><td>${esc(item.summary || "")}</td><td>${esc(item.need || "")}</td></tr>`).join("") || `<tr><td colspan="6">No hay casos guardados.</td></tr>`;
    return `<section class="document-panel"><h2>Casos para gestión</h2><div class="stable-table-wrap"><table class="stable-table"><thead><tr><th>Fecha</th><th>Estado</th><th>Flujo</th><th>Paciente</th><th>Resumen</th><th>Necesita</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function renderJefatura() {
    addStyle();
    activate("chiefPage");
    const content = $("#chiefContent");
    if (!content) return;
    const active = session();
    content.innerHTML = active ? `${nav()}<section class="stable-hero"><h2>Módulo Jefatura</h2><p>Sesión: ${esc(active.name || active.email || active.username)} (${esc(active.role || "usuario")})</p><div class="stable-actions"><button class="document-button" data-stable-logout>Cerrar sesión</button><a class="document-button" href="#/urgencia">Equipo Urgencia</a><a class="document-button" href="#/inicio">Inicio</a></div></section>${isChief(active) ? "" : `<div class="stable-warn">Tu usuario no tiene rol de jefatura/administrador.</div>`}${casesTable()}` : authView();
    window.CRS_GOOGLE_AUTH?.injectAuthBox?.();
    window.dispatchEvent(new CustomEvent("crs:jefatura-rendered"));
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-stable-logout]")) {
      clearSession();
      location.hash = "#/gestion";
      renderGestion();
    }
  }, true);

  function route() {
    addStyle();
    const hash = location.hash.split("?")[0];
    if (hash === "#/gestion") { renderGestion(); return; }
    if (["#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(hash)) { renderUrgencia(); return; }
    if (hash === "#/jefatura") { renderJefatura(); return; }
    ["#doctorsPage", "#chiefPage"].forEach((selector) => $(selector)?.classList.remove("active"));
  }

  addEventListener("hashchange", route);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(route, 60));
  else setTimeout(route, 60);
})();
