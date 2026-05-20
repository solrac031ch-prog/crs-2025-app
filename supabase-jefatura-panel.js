(() => {
  const cfg = window.CRS_SUPABASE_CONFIG || {};
  const tables = {
    content: "crs_content_items",
    documents: "crs_documents",
    flows: "crs_flows",
    admins: "crs_admins",
    ...(cfg.tables || {})
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const route = () => location.hash.split("?")[0] || "#/inicio";

  let rendering = false;
  let scheduled = 0;

  function enabled() {
    return Boolean(window.CRS_SUPABASE?.enabled?.());
  }

  function api() {
    return window.CRS_SUPABASE?.client?.() || null;
  }

  async function currentUser() {
    const client = api();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data?.user || null;
  }

  function addStyle() {
    if ($("#supabase-jefatura-style")) return;
    const style = document.createElement("style");
    style.id = "supabase-jefatura-style";
    style.textContent = `
      .sb-chief-shell{display:grid;gap:14px}.sb-chief-hero{display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:16px;background:linear-gradient(135deg,#082f49,#0f766e 56%,#16a34a);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.22)}.sb-chief-hero h2{margin:0;color:#fff;font-size:clamp(2rem,5vw,3.35rem);line-height:1}.sb-chief-hero p{margin:0;color:#e0f7f2;max-width:900px}.sb-chief-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.sb-chief-card{display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0ea5e9;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}.sb-chief-card h3{margin:0;color:#10201c}.sb-chief-card p{margin:0;color:#52615c}.sb-chief-card label{display:grid;gap:5px;font-weight:850;color:#24312d}.sb-chief-card input,.sb-chief-card select,.sb-chief-card textarea{width:100%;min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c}.sb-chief-card textarea{min-height:86px}.sb-chief-card.amber{border-left-color:#f59e0b}.sb-chief-card.purple{border-left-color:#7c3aed}.sb-chief-card.red{border-left-color:#dc2626}.sb-chief-card.green{border-left-color:#16a34a}.sb-chief-card.teal{border-left-color:#0f766e}.sb-chief-card.blue{border-left-color:#2563eb}.sb-chief-status{grid-column:1/-1}.sb-chief-actions{display:flex;gap:10px;flex-wrap:wrap}.sb-mini{font-size:.88rem;color:#64748b}.sb-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;border:1px solid #e5ebe8;border-radius:10px;background:#fff}.sb-list{display:grid;gap:8px}.sb-ok{border:1px solid #bbf7d0;background:#f0fdf4;color:#14532d;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}.sb-warn{border:1px solid #fde68a;background:#fffbeb;color:#713f12;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}.sb-error{border:1px solid #fecaca;background:#fff1f2;color:#7f1d1d;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}@media(max-width:680px){.sb-chief-actions{display:grid}.sb-chief-actions .document-button,.sb-chief-actions .delete-button{width:100%;justify-content:center}.sb-row{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }

  function statusCard(user) {
    return `<article class="sb-chief-card sb-chief-status blue"><h3>Publicacion global con Supabase</h3><div class="sb-ok">Sesion activa: ${esc(user.email)}. Lo que publiques aqui queda disponible para todos los computadores y celulares.</div><div class="sb-chief-actions"><button class="document-button" type="button" data-sb-chief-refresh>Actualizar lista global</button><button class="delete-button" type="button" data-sb-signout>Cerrar sesion Supabase</button></div><h3>Publicaciones globales recientes</h3><div data-sb-chief-global-list><div class="sb-mini">Cargando...</div></div><h3>Usuarios con permiso</h3><div data-sb-chief-admin-list><div class="sb-mini">Cargando...</div></div></article>`;
  }

  function paperCard() {
    return `<article class="sb-chief-card amber"><h3>Paper del mes</h3><p>Publica el paper destacado y deja repositorio mensual.</p><form data-content="paper"><label>Mes<input name="month" type="month" required></label><label>Titulo<input name="title" required></label><label>Comentario<textarea name="description"></textarea></label><label>PDF / archivo<input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"></label><label>Link<input name="url" type="url"></label><button class="document-button" type="submit">Publicar paper</button></form></article>`;
  }

  function newsEducationCard() {
    return `<article class="sb-chief-card purple"><h3>Noticias / Educacion</h3><p>Publica noticias, cursos, posters, enlaces, podcast o material docente.</p><form data-content="mixed"><label>Tipo<select name="kind"><option value="news">Noticia</option><option value="education">Educacion</option></select></label><label>Titulo<input name="title" required></label><label>Texto / publicidad<textarea name="description"></textarea></label><label>Enlace inscripcion / publicidad<input name="eventUrl" type="url"></label><label>Archivo / poster<input name="file" type="file"></label><label>Link material<input name="url" type="url"></label><button class="document-button" type="submit">Publicar</button></form></article>`;
  }

  function procedureCard() {
    return `<article class="sb-chief-card red"><h3>Procedimiento medico</h3><p>Sube videos, PDF o material practico para Educacion / Procedimientos.</p><form data-content="procedure"><label>Titulo<input name="title" required></label><label>Descripcion<textarea name="description"></textarea></label><label>Video / archivo<input name="file" type="file" accept="video/*,.pdf,.ppt,.pptx"></label><label>Link de video opcional<input name="url" type="url"></label><button class="document-button" type="submit">Subir procedimiento</button></form></article>`;
  }

  function callCard(type, title, description) {
    return `<article class="sb-chief-card teal"><h3>${esc(title)}</h3><p>${esc(description)}</p><form data-upload-call data-call-type="${esc(type)}"><label>Titulo<input name="title" required></label><label>Archivo CSV/TXT/PDF o documento<input name="file" type="file"></label><label>Link opcional<input name="url" type="url"></label><button class="document-button" type="submit">Publicar globalmente</button></form></article>`;
  }

  function baseDocumentCard(key, title, description) {
    return `<article class="sb-chief-card green"><h3>${esc(title)}</h3><p>${esc(description)}</p><form data-form-base data-form-key="${esc(key)}"><label>Archivo PDF / documento<input name="file" type="file"></label><label>Link opcional<input name="url" type="url"></label><button class="document-button" type="submit">Actualizar formulario</button></form></article>`;
  }

  function newFormCard() {
    return `<article class="sb-chief-card blue"><h3>Agregar nuevo formulario</h3><p>Agrega un formulario nuevo visible para el equipo.</p><form data-new-form><label>Titulo<input name="title" required></label><label>Descripcion<textarea name="description"></textarea></label><label>Archivo<input name="file" type="file"></label><label>Link<input name="url" type="url"></label><button class="document-button" type="submit">Agregar formulario</button></form></article>`;
  }

  function newFlowCard() {
    return `<article class="sb-chief-card red"><h3>Nuevo flujo / CRS / Poli choque / Hospitalizado / Protocolo</h3><p>Publica una actualizacion global sin tocar el codigo de la app.</p><form data-new-flow><label>Tipo<select name="category"><option>Flujo</option><option>CRS</option><option>Poli choque</option><option>Hospitalizados</option><option>Protocolo</option></select></label><label>Titulo<input name="title" required></label><label>Resumen<textarea name="summary"></textarea></label><label>Archivo<input name="file" type="file"></label><label>Link<input name="url" type="url"></label><button class="document-button" type="submit">Guardar flujo</button></form></article>`;
  }

  function usersCard() {
    return `<article class="sb-chief-card blue"><h3>Administrador de usuarios</h3><p>Autoriza correos para publicar desde Jefatura. El usuario tambien debe existir en Supabase Authentication.</p><form data-backend-user><label>Correo<input name="email" type="email" required></label><label>Nombre<input name="nombre" required></label><label>Rol<select name="rol"><option value="jefatura">Jefatura</option><option value="admin">Admin</option><option value="equipo">Equipo</option></select></label><button class="document-button" type="submit">Agregar / actualizar usuario</button></form></article>`;
  }

  function deleteInfoCard() {
    return `<article class="sb-chief-card amber"><h3>Eliminar / ocultar publicaciones</h3><p>Para no perder historial, las publicaciones globales se ocultan desde la lista superior. Los documentos locales antiguos ya no son el flujo principal.</p><div class="sb-warn">Usa el boton Ocultar en publicaciones globales recientes para retirar algo de la web publica.</div></article>`;
  }

  function panelHtml(user) {
    return `<div class="sb-chief-shell" data-sb-chief-shell><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestion</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="sb-chief-hero"><h2>Modulo Jefatura global</h2><p>Panel conectado a Supabase para publicar noticias, papers, educacion, procedimientos, documentos, especialistas, UHD y flujos desde la misma web.</p></section><section class="sb-chief-grid">${statusCard(user)}${paperCard()}${newsEducationCard()}${procedureCard()}${callCard("especialistas", "Especialistas de llamado", "Publica el documento o planilla vigente de especialistas.")}${callCard("uhd", "UHD - Unidad de Hospitalizacion Domiciliaria", "Publica disponibilidad o documento vigente de UHD.")}${baseDocumentCard("medicamentosUsoOcasional", "Medicamentos de uso ocasional", "Actualiza el formulario global de medicamentos de uso ocasional.")}${baseDocumentCard("leyUrgencias", "Ley de Urgencias", "Actualiza documentos o links de activacion / consentimiento.")}${baseDocumentCard("notificacionObligatoria", "Notificacion obligatoria", "Actualiza formularios o documentos asociados a notificacion obligatoria.")}${newFormCard()}${newFlowCard()}${usersCard()}${deleteInfoCard()}</section></div>`;
  }

  async function renderGlobalList() {
    const box = $("[data-sb-chief-global-list]");
    const client = api();
    if (!box || !client) return;
    const [content, docs, flows] = await Promise.all([
      client.from(tables.content).select("id,kind,title,status,updated_at,created_at").neq("status", "archived").order("created_at", { ascending: false }).limit(12),
      client.from(tables.documents).select("id,group_name,title,status,updated_at,created_at").neq("status", "archived").order("updated_at", { ascending: false }).limit(12),
      client.from(tables.flows).select("id,category,title,status,updated_at,created_at").neq("status", "archived").order("updated_at", { ascending: false }).limit(12)
    ]);
    const error = content.error || docs.error || flows.error;
    if (error) {
      box.innerHTML = `<div class="sb-error">${esc(error.message || error)}</div>`;
      return;
    }
    const rows = [
      ...(content.data || []).map((item) => ({ type: "content", label: item.kind, ...item })),
      ...(docs.data || []).map((item) => ({ type: "document", label: item.group_name, ...item })),
      ...(flows.data || []).map((item) => ({ type: "flow", label: item.category, ...item }))
    ].sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at))).slice(0, 18);
    box.innerHTML = rows.length
      ? `<div class="sb-list">${rows.map((item) => `<div class="sb-row"><span><strong>${esc(item.title)}</strong><br><span class="sb-mini">${esc(item.label)} · ${esc(item.status)}</span></span><button class="delete-button" type="button" data-sb-archive="${esc(item.type)}" data-sb-id="${esc(item.id)}">Ocultar</button></div>`).join("")}</div>`
      : `<div class="sb-warn">Aun no hay publicaciones globales en Supabase.</div>`;
  }

  async function renderAdminList() {
    const box = $("[data-sb-chief-admin-list]");
    const client = api();
    if (!box || !client) return;
    const { data, error } = await client.from(tables.admins).select("email,display_name,role,active").order("email");
    if (error) {
      box.innerHTML = `<div class="sb-error">${esc(error.message || error)}</div>`;
      return;
    }
    box.innerHTML = (data || []).length
      ? `<div class="sb-list">${data.map((item) => `<div class="sb-row"><span><strong>${esc(item.display_name || item.email)}</strong><br><span class="sb-mini">${esc(item.email)} · ${esc(item.role)} · ${item.active ? "activo" : "inactivo"}</span></span></div>`).join("")}</div>`
      : `<div class="sb-warn">No hay usuarios registrados en crs_admins.</div>`;
  }

  async function render() {
    if (rendering || route() !== "#/jefatura" || !enabled()) return;
    const content = $("#chiefContent");
    if (!content) return;
    const user = await currentUser();
    if (!user) return;

    rendering = true;
    addStyle();
    content.dataset.sbChiefReady = "true";
    content.innerHTML = panelHtml(user);
    await Promise.all([renderGlobalList(), renderAdminList()]);
    rendering = false;
  }

  function scheduleRender(delay = 320) {
    clearTimeout(scheduled);
    scheduled = setTimeout(render, delay);
  }

  document.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-sb-chief-refresh]")) {
      ev.preventDefault();
      scheduleRender(20);
    }
    if (ev.target.closest("[data-sb-archive],[data-sb-signout]")) {
      scheduleRender(900);
    }
  }, true);

  const observer = new MutationObserver(() => {
    if (rendering || route() !== "#/jefatura" || !enabled()) return;
    const content = $("#chiefContent");
    if (!content) return;
    if (!content.querySelector("[data-sb-chief-shell]") || content.querySelector("[data-sb-panel]")) {
      scheduleRender(380);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
      scheduleRender(500);
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleRender(500);
  }
  window.addEventListener("hashchange", () => scheduleRender(500));
})();
