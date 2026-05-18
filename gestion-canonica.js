(() => {
  const SESSION_KEY = "crsAuthSessionV3";
  const CONTENT_KEY = "crsGestionContentV2";
  const CALLS_KEY = "crsGestionCallsV2";
  const FORMS_KEY = "crsGestionFormsV2";
  const FLOWS_KEY = "crsGestionFlowsV2";
  const COMMENTS_KEY = "crsGestionCommentsV2";
  const DB_NAME = "crs-hph-files-v2";
  const STORE = "files";

  const YOUTUBE_URL = "https://youtube.com/@hospitalpadrehurtado9819?si=oDPWrfC0hXeBHHZs";
  const SPOTIFY_URL = "https://open.spotify.com/show/4Yyb5LH2H6mj9NyDVajUMQ?si=LHra3q1PQl2s1-JQ8NysNg";
  const BASE_FORMS = [
    { key: "medicamentosUsoOcasional", title: "Medicamentos de uso ocasional", description: "Formulario de medicamentos de uso ocasional." },
    { key: "leyUrgencias", title: "Ley de Urgencias", description: "Formulario asociado a Ley de Urgencias." },
    { key: "notificacionObligatoria", title: "Notificación obligatoria", description: "Formulario de notificación obligatoria." }
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || "") || fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const session = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; } };
  const isChief = () => {
    const u = session();
    const role = clean(u?.role);
    const email = clean(u?.email || u?.username);
    return Boolean(u && (["admin", "owner", "desarrollador", "jefatura", "jefe"].includes(role) || email === "mdcarlosherrera@gmail.com"));
  };

  const emptyContent = () => ({ news: [], education: [], papers: [], procedures: [] });
  const content = () => ({ ...emptyContent(), ...read(CONTENT_KEY, emptyContent()) });
  const calls = () => read(CALLS_KEY, []);
  const forms = () => read(FORMS_KEY, { base: {}, custom: [] });
  const flows = () => read(FLOWS_KEY, []);
  const comments = () => read(COMMENTS_KEY, []);
  const saveComments = (list) => write(COMMENTS_KEY, list.slice(-1200));

  let dbPromise = null;
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }
  async function saveFile(file) {
    if (!file) return {};
    const fileId = newId();
    const database = await db();
    await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ id: fileId, blob: file, name: file.name, type: file.type, size: file.size, createdAt: new Date().toISOString() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return { fileId, fileName: file.name, fileType: file.type, fileSize: file.size };
  }
  async function getFile(fileId) {
    if (!fileId) return null;
    const database = await db();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(fileId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  async function deleteFile(fileId) {
    if (!fileId) return;
    const database = await db();
    await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(fileId);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
  async function apiPost(action, payload = {}) {
    const url = window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "";
    if (!url) return { ok: false, error: "Falta appsScriptUrl" };
    const u = session();
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, email: u?.email || u?.username || "", ...payload })
    });
    return res.json();
  }

  function style() {
    if ($("#gestion-canonica-style")) return;
    const st = document.createElement("style");
    st.id = "gestion-canonica-style";
    st.textContent = `
      .page:not(.active){display:none!important}.gestion-wrap{display:grid;gap:14px}.gestion-hero{display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:16px;background:linear-gradient(135deg,#0f172a,#14532d 55%,#0f766e);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.22)}.gestion-hero h2{margin:0;color:#fff;font-size:clamp(2rem,5vw,3.35rem);line-height:1}.gestion-hero p{margin:0;color:#def7ef;max-width:850px;line-height:1.45}.gestion-actions,.route-actions{display:flex;gap:10px;flex-wrap:wrap}.gestion-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.gestion-card,.poster-card,.paper-card,.admin-card,.education-card,.procedure-card{display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}.gestion-card.amber{border-left-color:#f59e0b}.gestion-card.blue{border-left-color:#2563eb}.gestion-card.purple{border-left-color:#7c3aed}.gestion-card.red{border-left-color:#dc2626}.gestion-card strong,.admin-card h3{color:#10201c;font-size:1.08rem}.gestion-card span,.admin-card p{color:#52615c;line-height:1.4;margin:0}.admin-card label{display:grid;gap:5px;font-weight:850;color:#24312d}.admin-card input,.admin-card select,.admin-card textarea,.comment-form input,.comment-form textarea{width:100%;min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c}.note{padding:12px;border:1px solid #f4d28a;border-radius:10px;background:#fff7e8;color:#664100;font-weight:750}.danger{border:1px solid #fecaca;background:#fff1f2;color:#7f1d1d}.delete-button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#991b1b;font-weight:900;cursor:pointer}.poster-card{position:relative;overflow:hidden;border-left-color:#f59e0b;background:linear-gradient(135deg,#fff,#fff7ed)}.poster-card:before{content:"";position:absolute;right:-70px;top:-70px;width:180px;height:180px;border-radius:50%;background:rgba(245,158,11,.16)}.poster-card>*{position:relative}.poster-card h3{font-size:1.55rem;margin:0;color:#111827}.poster-media,.paper-preview,.procedure-video{width:100%;max-width:680px;height:680px;border:1px solid #dfe8e4;border-radius:12px;background:#f8fafc}.procedure-video{height:auto;max-height:520px}.poster-image{width:100%;max-height:460px;object-fit:contain;border-radius:12px;border:1px solid #e5ebe8;background:#fff}.content-list{display:grid;gap:14px}.paper-layout{display:grid;grid-template-columns:minmax(260px,360px) minmax(0,1fr);gap:14px;align-items:start}.paper-sidebar{display:grid;gap:10px;max-height:calc(100vh - 150px);overflow:auto;position:sticky;top:12px}.paper-sidebar-year{display:grid;gap:8px}.paper-sidebar-year h3{margin:8px 0 0;color:#10201c}.paper-side-card{display:grid;gap:6px;padding:12px;border:1px solid #dfe8e4;border-radius:12px;background:#fff}.paper-side-card.active{border-left:6px solid #f59e0b;background:#fff7ed}.paper-featured{display:grid;gap:12px}.paper-card.featured h3{font-size:1.7rem;margin:0}.paper-card h3{margin:0;font-size:1.25rem}.mini{font-size:.86rem;color:#64748b}.tag{display:inline-flex;border-radius:999px;background:#eef7f5;color:#0b4f49;padding:4px 8px;font-weight:850;font-size:.8rem}.search-box{display:grid;gap:8px;padding:12px;border:1px solid #dfe8e4;border-radius:12px;background:#fbfdfc;margin-top:10px}.result-row,.manage-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;border:1px solid #e5ebe8;border-radius:10px;background:#fff}.table-wrap{overflow:auto;border:1px solid #dfe8e4;border-radius:10px}.backend-table{width:100%;border-collapse:collapse}.backend-table th,.backend-table td{padding:8px;border-bottom:1px solid #e5ebe8;text-align:left}.backend-table th{background:#f6f8f7;text-transform:uppercase;font-size:.78rem;color:#44504b}.comments-box{display:grid;gap:10px;margin-top:8px;padding:12px;border:1px solid #dfe8e4;border-radius:12px;background:#fbfdfc}.comments-list{display:grid;gap:8px}.comment-item{display:grid;gap:4px;padding:10px;border:1px solid #e5ebe8;border-radius:10px;background:#fff}.comment-item strong{color:#10201c}.comment-form{display:grid;gap:8px}.comment-form textarea{min-height:80px}.comment-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.education-card{border-left-color:#2563eb;grid-template-columns:auto 1fr;align-items:center}.education-card.spotify{border-left-color:#1db954}.edu-logo{width:72px;height:72px;display:grid;place-items:center;font-weight:900;color:#fff;box-shadow:0 10px 24px rgba(15,23,42,.14)}.edu-logo.youtube{background:#ff0000;border-radius:18px}.edu-logo.youtube:before{content:"▶";font-size:2rem}.edu-logo.spotify{background:#1db954;border-radius:50%;font-size:2.2rem}.edu-logo.spotify:before{content:"♬"}.procedures-hero{background:linear-gradient(135deg,#1e1b4b,#6d28d9 55%,#0f766e)}@media(max-width:820px){.paper-layout{grid-template-columns:1fr}.paper-sidebar{position:static;max-height:none;order:2}.paper-featured{order:1}}@media(max-width:680px){.gestion-actions,.route-actions,.comment-actions{display:grid}.document-button,.delete-button,.back-link{width:100%;justify-content:center}.poster-media,.paper-preview{height:520px}.result-row,.manage-row,.education-card{grid-template-columns:1fr}.edu-logo{width:60px;height:60px}}
    `;
    document.head.append(st);
  }

  function activate(pageId) {
    $$(".page").forEach(p => p.classList.toggle("active", p.id === pageId));
    $$("[data-route-link]").forEach(link => link.classList.toggle("active", link.dataset.routeLink === "gestion"));
  }
  function nav() { return `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div>`; }
  function fileAction(item, label = "Abrir") {
    if (item.url || item.eventUrl) return `<a class="document-button" href="${esc(item.url || item.eventUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    if (item.fileId) return `<a class="document-button" href="#" data-file-open="${esc(item.fileId)}">${label}</a><a class="document-button" href="#" data-file-download="${esc(item.fileId)}">Descargar</a>`;
    return "";
  }

  async function hydrateFiles(root = document) {
    for (const el of $$('[data-file-preview]', root)) {
      const item = await getFile(el.dataset.filePreview);
      if (!item) continue;
      const url = URL.createObjectURL(item.blob);
      if (item.type?.startsWith("image/")) el.outerHTML = `<img class="poster-image" src="${url}" alt="Vista previa">`;
      else if (item.type?.startsWith("video/")) el.outerHTML = `<video class="procedure-video" src="${url}" controls preload="metadata"></video>`;
      else if (item.type === "application/pdf") el.outerHTML = `<iframe class="${el.dataset.previewKind === "paper" ? "paper-preview" : "poster-media"}" src="${url}#page=1"></iframe>`;
      else el.textContent = `Archivo: ${item.name}`;
    }
  }

  function commentsFor(itemType, itemId) {
    return comments().filter(c => c.itemType === itemType && c.itemId === itemId).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  function commentListHtml(itemType, itemId) {
    const list = commentsFor(itemType, itemId);
    if (!list.length) return `<div class="mini">Aún no hay comentarios ni dudas.</div>`;
    return list.map(c => `<article class="comment-item"><strong>${esc(c.name || c.email || "Equipo Urgencia")}</strong><span class="mini">${esc(new Date(c.createdAt || Date.now()).toLocaleString("es-CL"))}</span><p>${esc(c.text)}</p>${isChief() ? `<button class="delete-button" type="button" data-delete-comment="${esc(c.id)}">Eliminar comentario</button>` : ""}</article>`).join("");
  }
  function commentsBox(itemType, itemId) {
    const u = session();
    const knownName = u?.name || u?.email || u?.username || "";
    return `<section class="comments-box"><strong>Comentarios y dudas del equipo</strong><div class="comments-list" data-comments-list="${esc(itemType)}:${esc(itemId)}">${commentListHtml(itemType, itemId)}</div><form class="comment-form" data-comment-form data-item-type="${esc(itemType)}" data-item-id="${esc(itemId)}">${knownName ? `<input name="name" type="hidden" value="${esc(knownName)}"><div class="mini">Comentando como: ${esc(knownName)}</div>` : `<label>Nombre<input name="name" required placeholder="Tu nombre"></label>`}<label>Duda o comentario<textarea name="text" required placeholder="Escribe una duda, comentario o sugerencia..."></textarea></label><div class="comment-actions"><button class="document-button" type="submit">Enviar comentario</button><span class="mini">Se guarda en este navegador y, si el backend está actualizado, también en Google Sheets.</span></div></form></section>`;
  }
  function mergeComments(remote) {
    if (!Array.isArray(remote) || !remote.length) return;
    const local = comments();
    const seen = new Set(local.map(c => c.id));
    remote.forEach(c => { if (c.id && !seen.has(c.id)) local.push(c); });
    saveComments(local);
  }
  async function hydrateComments(root = document) {
    for (const el of $$('[data-comments-list]', root)) {
      const [itemType, itemId] = String(el.dataset.commentsList || "").split(":");
      if (!itemType || !itemId) continue;
      try {
        const result = await apiPost("listComments", { itemType, itemId });
        if (result.ok) { mergeComments(result.comments || []); el.innerHTML = commentListHtml(itemType, itemId); }
      } catch (_) {}
    }
  }

  async function readText(file) { return new Promise(res => { if (!file) return res(""); const r = new FileReader(); r.onload = () => res(String(r.result || "")); r.onerror = () => res(""); r.readAsText(file); }); }
  async function extractRows(file) {
    if (!file) return [];
    const name = clean(file.name);
    if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
      const text = await readText(file);
      return text.split(/\r?\n/).map(line => line.split(/\t|,|;/).map(c => c.trim())).filter(row => row.some(Boolean));
    }
    return [];
  }
  function parseCalls(rows, type) {
    if (!rows.length) return [];
    const header = rows[0] || [];
    const out = [];
    rows.slice(1).forEach(row => {
      const specialty = row[0] || "Documento";
      row.slice(1).forEach((cell, i) => { if (cell) out.push({ specialty, day: header[i + 1] || "", doctor: cell, type }); });
    });
    return out.slice(0, 500);
  }
  async function uploadItem(form) {
    const data = new FormData(form);
    const file = form.file?.files?.[0] || null;
    const saved = await saveFile(file);
    return { id: newId(), title: data.get("title") || "Sin título", description: data.get("description") || data.get("summary") || "", url: data.get("url") || "", eventUrl: data.get("eventUrl") || "", month: data.get("month") || "", category: data.get("category") || "", createdAt: new Date().toISOString(), ...saved };
  }

  function renderGestion() {
    activate("managementPage");
    $("#managementTitle").textContent = "Gestión";
    $("#managementContent").innerHTML = `<div class="gestion-wrap"><section class="gestion-hero"><h2>Gestión de Urgencia</h2><p>Repositorio operativo, publicaciones y administración de jefatura en una sola versión estable.</p><div class="gestion-actions"><a class="document-button" href="#/urgencia">Módulo Equipo Urgencia</a><a class="document-button" href="#/jefatura">Módulo Jefatura</a><a class="document-button" href="#/gestion/noticias">Noticias</a><a class="document-button" href="#/gestion/educacion">Educación</a><a class="document-button" href="#/gestion/paper">Paper del mes</a></div></section><section class="gestion-grid"><a class="gestion-card blue" href="#/gestion/noticias"><strong>📰 Noticias</strong><span>Posters, eventos, cursos y enlaces de inscripción. Puede haber múltiples noticias activas.</span></a><a class="gestion-card purple" href="#/gestion/educacion"><strong>🎓 Educación</strong><span>YouTube, podcast, material docente y procedimientos.</span></a><a class="gestion-card amber" href="#/gestion/paper"><strong>📄 Paper del mes</strong><span>Último paper destacado y repositorio mensual.</span></a></section></div>`;
  }
  function renderUrgencia() {
    activate("doctorsPage");
    $("#doctorsContent").innerHTML = `${nav()}<section class="gestion-hero"><h2>Módulo Equipo Urgencia</h2><p>Acceso de lectura para todo el equipo.</p><div class="gestion-actions"><a class="document-button" href="#/especialidades">Flujos clínicos</a><a class="document-button" href="#/llamados">Especialistas / UHD</a><a class="document-button" href="#/visita">Visita diaria</a><a class="document-button" href="#/formularios">Formularios</a><a class="document-button" href="#/telefonos">Directorio</a></div></section>`;
  }

  function baseFormUpdateList() {
    const fs = forms();
    return BASE_FORMS.map(f => {
      const saved = fs.base?.[f.key] || {};
      return `<div class="admin-card"><h3>${esc(f.title)}</h3><p>${esc(f.description)}</p><form data-form-base data-form-key="${f.key}"><label>Nuevo link<input name="url" type="url" value="${esc(saved.url)}"></label><label>Archivo<input name="file" type="file"></label><button class="document-button">Actualizar</button>${saved.url || saved.fileId ? `<button class="delete-button" type="button" data-delete-base-form="${f.key}">Quitar actualización</button>` : ""}</form></div>`;
    }).join("");
  }
  function manageList() {
    const fs = forms();
    const rows = [
      ...calls().map(x => `<div class="manage-row"><span>${esc(x.type)} · ${esc(x.title)}</span><button class="delete-button" data-delete-kind="call" data-delete-id="${x.id}">Eliminar</button></div>`),
      ...(fs.custom || []).map(x => `<div class="manage-row"><span>Formulario · ${esc(x.title)}</span><button class="delete-button" data-delete-kind="form" data-delete-id="${x.id}">Eliminar</button></div>`),
      ...flows().map(x => `<div class="manage-row"><span>${esc(x.category)} · ${esc(x.title)}</span><button class="delete-button" data-delete-kind="flow" data-delete-id="${x.id}">Eliminar</button></div>`)
    ];
    return rows.length ? rows.join("") : `<span class="mini">No hay documentos locales para eliminar.</span>`;
  }
  function renderJefatura() {
    activate("chiefPage");
    const u = session();
    if (!u) {
      $("#chiefContent").innerHTML = `${nav()}<section class="gestion-hero"><h2>Módulo Jefatura</h2><p>Ingresa con Google para administrar.</p></section><section class="admin-card"><h3>Ingreso con Google</h3><div id="googleSignInButton"></div><div data-google-auth-status class="note"></div></section>`;
      window.CRS_GOOGLE_AUTH?.initGoogleButton?.();
      return;
    }
    if (!isChief()) { $("#chiefContent").innerHTML = `${nav()}<div class="note danger">Tu cuenta no tiene rol de jefatura.</div>`; return; }
    $("#chiefContent").innerHTML = `${nav()}<section class="gestion-hero"><h2>Publicaciones y documentos de jefatura</h2><p>Sesión: ${esc(u.name || u.email || u.username)}. Todo lo nuevo queda administrable y eliminable desde aquí.</p><div class="gestion-actions"><button class="document-button" data-google-logout>Cerrar sesión</button></div></section><section class="gestion-grid"><article class="admin-card"><h3>Especialistas de llamado</h3><form data-upload-call data-call-type="especialistas"><label>Título<input name="title" required></label><label>Archivo CSV/TXT o documento<input name="file" type="file"></label><label>Link Drive opcional<input name="url" type="url"></label><button class="document-button">Subir / actualizar</button></form></article><article class="admin-card"><h3>UHD - Unidad de Hospitalización Domiciliaria</h3><form data-upload-call data-call-type="uhd"><label>Título<input name="title" required></label><label>Archivo CSV/TXT o documento<input name="file" type="file"></label><label>Link Drive opcional<input name="url" type="url"></label><button class="document-button">Subir / actualizar</button></form></article>${baseFormUpdateList()}<article class="admin-card"><h3>Agregar nuevo formulario</h3><form data-new-form><label>Título<input name="title" required></label><label>Descripción<textarea name="description"></textarea></label><label>Archivo<input name="file" type="file"></label><label>Link<input name="url" type="url"></label><button class="document-button">Agregar formulario</button></form></article><article class="admin-card"><h3>Nuevo flujo / CRS / Poli choque / Hospitalizado / Protocolo</h3><form data-new-flow><label>Tipo<select name="category"><option>Flujo</option><option>CRS</option><option>Poli choque</option><option>Hospitalizados</option><option>Protocolo</option></select></label><label>Título<input name="title" required></label><label>Resumen<textarea name="summary"></textarea></label><label>Archivo<input name="file" type="file"></label><label>Link<input name="url" type="url"></label><button class="document-button">Guardar</button></form></article><article class="admin-card"><h3>Paper del mes</h3><form data-content="paper"><label>Mes<input name="month" type="month" required></label><label>Título<input name="title" required></label><label>Comentario<textarea name="description"></textarea></label><label>PDF / archivo<input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"></label><label>Link<input name="url" type="url"></label><button class="document-button">Publicar paper</button></form></article><article class="admin-card"><h3>Noticias / Educación</h3><form data-content="mixed"><label>Tipo<select name="kind"><option value="news">Noticia</option><option value="education">Educación</option></select></label><label>Título<input name="title" required></label><label>Texto / publicidad<textarea name="description"></textarea></label><label>Enlace inscripción / publicidad<input name="eventUrl" type="url"></label><label>Archivo/poster<input name="file" type="file"></label><label>Link material<input name="url" type="url"></label><button class="document-button">Publicar</button></form></article><article class="admin-card"><h3>Procedimiento médico</h3><form data-content="procedure"><label>Título<input name="title" required></label><label>Descripción<textarea name="description"></textarea></label><label>Video / archivo<input name="file" type="file" accept="video/*,.pdf,.ppt,.pptx"></label><label>Link de video opcional<input name="url" type="url"></label><button class="document-button">Subir procedimiento</button></form></article><article class="admin-card"><h3>Eliminar documentos locales</h3><div class="manage-list">${manageList()}</div></article><article class="admin-card"><h3>Usuarios CRS HPH 2025 - Backend</h3><form data-backend-user><label>Correo<input name="email" type="email" required></label><label>Nombre<input name="nombre" required></label><label>Rol<select name="rol"><option value="equipo">Equipo</option><option value="jefe_turno">Jefe de turno</option><option value="jefatura">Jefatura</option><option value="admin">Admin</option></select></label><label>Puede editar<select name="puede_editar"><option>NO</option><option>SI</option></select></label><button class="document-button">Agregar / actualizar usuario</button></form><button class="document-button" data-backend-list>Actualizar lista</button><div data-backend-status></div></article></section>`;
  }

  function paperDateValue(item) { return `${item.month || (item.createdAt || "").slice(0, 7) || "0000-00"}-${item.createdAt || ""}`; }
  function monthLabel(item) { const v = item.month || (item.createdAt || "").slice(0, 7); const [y, m] = v.split("-"); return m && y ? `${m}/${y}` : "Sin mes"; }
  function paperSideList(papers, latest) {
    const older = papers.filter(p => p.id !== latest?.id);
    if (!older.length) return `<div class="note">No hay papers previos. Cuando subas más, aparecerán aquí como repositorio mensual.</div>`;
    const byYear = older.reduce((acc, p) => { const year = (p.month || p.createdAt || "sin-año").slice(0, 4); (acc[year] ||= []).push(p); return acc; }, {});
    return Object.keys(byYear).sort().reverse().map(year => `<section class="paper-sidebar-year"><h3>${esc(year)}</h3>${byYear[year].map(p => `<article class="paper-side-card"><span class="tag">${esc(monthLabel(p))}</span><strong>${esc(p.title)}</strong><span class="mini">${esc(p.description).slice(0, 110)}</span><div class="gestion-actions">${fileAction(p, "Abrir")}${isChief() ? `<button class="delete-button" data-delete-kind="paper" data-delete-id="${p.id}">Eliminar</button>` : ""}</div>${commentsBox("paper", p.id)}</article>`).join("")}</section>`).join("");
  }
  function renderPaper() {
    activate("managementPage");
    $("#managementTitle").textContent = "Paper del mes";
    const papers = [...(content().papers || [])].sort((a, b) => paperDateValue(b).localeCompare(paperDateValue(a)));
    const latest = papers[0];
    const featured = latest ? `<article class="paper-card featured"><span class="tag">Último paper compartido · ${esc(monthLabel(latest))}</span><h3>${esc(latest.title)}</h3><p>${esc(latest.description)}</p>${latest.fileId ? `<div data-file-preview="${latest.fileId}" data-preview-kind="paper" class="note">Cargando portada...</div>` : `<div class="note">Este paper fue publicado como enlace. Usa el botón para abrirlo.</div>`}<div class="gestion-actions">${fileAction(latest, "Abrir paper")}${isChief() ? `<button class="delete-button" data-delete-kind="paper" data-delete-id="${latest.id}">Eliminar</button>` : ""}</div>${commentsBox("paper", latest.id)}</article>` : `<div class="note">Aún no hay papers publicados.</div>`;
    $("#managementContent").innerHTML = `${nav()}<section class="gestion-hero"><h2>Paper del mes</h2><p>La portada visible corresponde al último paper compartido. El repositorio queda a la izquierda por mes y año.</p></section><section class="paper-layout"><aside class="paper-sidebar"><h2>Repositorio</h2>${paperSideList(papers, latest)}</aside><main class="paper-featured">${featured}</main></section>`;
    hydrateFiles($("#managementContent")); hydrateComments($("#managementContent"));
  }
  function renderEducation() {
    activate("managementPage");
    $("#managementTitle").textContent = "Educación";
    const c = content();
    const custom = c.education || [];
    $("#managementContent").innerHTML = `${nav()}<section class="gestion-hero"><h2>Educación médica</h2><p>Canales oficiales, podcast y repositorio de procedimientos médicos.</p></section><section class="gestion-grid"><a class="education-card" href="${YOUTUBE_URL}" target="_blank" rel="noopener"><span class="edu-logo youtube"></span><span><strong>Canal de YouTube Hospital Padre Hurtado</strong><br><span class="mini">Videos institucionales y material audiovisual.</span></span></a><a class="education-card spotify" href="${SPOTIFY_URL}" target="_blank" rel="noopener"><span class="edu-logo spotify"></span><span><strong>Podcast Hospital Padre Hurtado</strong><br><span class="mini">Episodios y contenido de audio.</span></span></a><a class="gestion-card purple" href="#/gestion/procedimientos"><strong>🎥 Procedimientos médicos</strong><span>Repositorio para subir videos de procedimientos uno a uno.</span></a></section><section class="content-list">${custom.length ? custom.map(e => `<article class="poster-card"><span class="tag">Educación</span><h3>🎓 ${esc(e.title)}</h3><p>${esc(e.description)}</p>${e.fileId ? `<div data-file-preview="${e.fileId}" class="note">Cargando material...</div>` : ""}<div class="gestion-actions">${fileAction(e, "Abrir material")}${isChief() ? `<button class="delete-button" data-delete-kind="education" data-delete-id="${e.id}">Eliminar</button>` : ""}</div></article>`).join("") : `<div class="note">Aún no hay material docente adicional publicado por jefatura.</div>`}</section>`;
    hydrateFiles($("#managementContent"));
  }
  function renderProcedures() {
    activate("managementPage");
    $("#managementTitle").textContent = "Procedimientos médicos";
    const list = content().procedures || [];
    $("#managementContent").innerHTML = `${nav()}<section class="gestion-hero procedures-hero"><h2>Procedimientos médicos</h2><p>Repositorio de videos y material práctico subido por jefatura.</p></section><section class="content-list">${list.length ? list.map(p => `<article class="procedure-card"><span class="tag">Procedimiento</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>${p.fileId ? `<div data-file-preview="${p.fileId}" class="note">Cargando video/material...</div>` : ""}<div class="gestion-actions">${fileAction(p, "Abrir procedimiento")}${isChief() ? `<button class="delete-button" data-delete-kind="procedure" data-delete-id="${p.id}">Eliminar</button>` : ""}</div></article>`).join("") : `<div class="note">Aún no hay procedimientos subidos. Desde Jefatura puedes cargar videos uno a uno.</div>`}</section>`;
    hydrateFiles($("#managementContent"));
  }
  function renderNews() {
    activate("managementPage");
    $("#managementTitle").textContent = "Noticias";
    const list = content().news || [];
    $("#managementContent").innerHTML = `${nav()}<section class="gestion-hero"><h2>Noticias</h2><p>Puede haber múltiples noticias activas: posters, eventos, cursos, formularios de inscripción y publicidad.</p></section><div class="content-list">${list.length ? list.map(n => `<article class="poster-card"><span class="tag">Noticia</span><h3>📣 ${esc(n.title)}</h3><p>${esc(n.description)}</p>${n.fileId ? `<div data-file-preview="${n.fileId}" class="note">Cargando poster...</div>` : ""}<div class="gestion-actions">${n.eventUrl ? `<a class="event-link" href="${esc(n.eventUrl)}" target="_blank" rel="noopener">Inscripción / publicidad</a>` : ""}${fileAction(n, "Abrir material")}${isChief() ? `<button class="delete-button" data-delete-kind="news" data-delete-id="${n.id}">Eliminar</button>` : ""}</div>${commentsBox("news", n.id)}</article>`).join("") : `<div class="note">Aún no hay noticias publicadas.</div>`}</div>`;
    hydrateFiles($("#managementContent")); hydrateComments($("#managementContent"));
  }

  function patchForms() {
    const page = $("#formsPage.active"), list = $("#turnFormsList"); if (!page || !list || list.dataset.gestionCanonica === "true") return;
    const fs = forms(); list.dataset.gestionCanonica = "true";
    BASE_FORMS.forEach(f => { const item = fs.base?.[f.key]; if (item?.url || item?.fileId) list.insertAdjacentHTML("beforeend", `<section class="document-panel"><h2>${esc(f.title)} actualizado por jefatura</h2><p>${esc(f.description)}</p>${fileAction(item, "Abrir versión actualizada")}</section>`); });
    (fs.custom || []).forEach(item => list.insertAdjacentHTML("beforeend", `<section class="document-panel"><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p>${fileAction(item, "Abrir formulario")}</section>`));
  }
  function patchCalls() {
    const page = $("#callsPage.active"); if (!page || page.dataset.gestionCanonica === "true") return; page.dataset.gestionCanonica = "true";
    $$(".document-panel", page).forEach((panel, i) => { const type = i === 0 ? "especialistas" : "uhd"; panel.insertAdjacentHTML("beforeend", `<div class="search-box"><strong>Buscar documentos subidos por jefatura</strong><input data-call-search="${type}" type="search" placeholder="Buscar..."><div data-call-results="${type}"></div></div>`); });
  }
  function renderCallResults(type, q) {
    const box = $(`[data-call-results="${type}"]`); if (!box) return;
    const query = clean(q);
    const items = calls().filter(d => d.type === type).flatMap(d => (d.entries || []).map(e => ({ ...e, title: d.title, fileId: d.fileId, url: d.url })));
    const matches = items.filter(x => !query || clean([x.specialty, x.day, x.doctor, x.title].join(" ")).includes(query)).slice(0, 30);
    box.innerHTML = matches.length ? matches.map(x => `<div class="result-row"><span><strong>${esc(x.specialty)} ${x.day ? `· ${esc(x.day)}` : ""}</strong><br>${esc(x.doctor)}<br><span class="mini">${esc(x.title)}</span></span>${fileAction(x, "Abrir")}</div>`).join("") : `<div class="mini">Sin resultados.</div>`;
  }
  async function listBackendUsers() {
    const box = $("[data-backend-status]"); if (!box) return;
    box.innerHTML = `<div class="note">Consultando...</div>`;
    const r = await apiPost("listUsers");
    if (!r.ok) { box.innerHTML = `<div class="note danger">${esc(r.error || "Error")}</div>`; return; }
    box.innerHTML = `<div class="table-wrap"><table class="backend-table"><thead><tr><th>Email</th><th>Nombre</th><th>Rol</th><th>Activo</th><th></th></tr></thead><tbody>${(r.users || []).map(u => `<tr><td>${esc(u.email)}</td><td>${esc(u.nombre)}</td><td>${esc(u.rol)}</td><td>${esc(u.activo)}</td><td><button class="delete-button" data-backend-disable="${esc(u.email)}">Desactivar</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  document.addEventListener("submit", async ev => {
    const f = ev.target;
    if (f.matches("[data-comment-form]")) {
      ev.preventDefault();
      const d = new FormData(f); const u = session();
      const comment = { id: newId(), itemType: f.dataset.itemType, itemId: f.dataset.itemId, name: d.get("name") || u?.name || u?.email || "Equipo Urgencia", email: u?.email || u?.username || "", text: d.get("text"), createdAt: new Date().toISOString() };
      if (!comment.text) return;
      const list = comments(); list.push(comment); saveComments(list);
      try { await apiPost("addComment", { comment }); } catch (_) {}
      f.reset(); route(); return;
    }
    if (!f.closest("[data-upload-call],[data-form-base],[data-new-form],[data-new-flow],[data-content],[data-backend-user]")) return;
    ev.preventDefault(); if (!isChief()) return alert("Requiere jefatura.");
    if (f.matches("[data-upload-call]")) { const item = await uploadItem(f); item.type = f.dataset.callType; item.entries = parseCalls(await extractRows(f.file?.files?.[0]), item.type); const list = calls().filter(x => !(x.type === item.type && x.title === item.title)); list.unshift(item); write(CALLS_KEY, list.slice(0, 40)); alert("Documento guardado."); f.reset(); renderJefatura(); return; }
    if (f.matches("[data-form-base]")) { const item = await uploadItem(f); const fs = forms(); fs.base ||= {}; fs.base[f.dataset.formKey] = item; write(FORMS_KEY, fs); alert("Formulario actualizado."); f.reset(); renderJefatura(); return; }
    if (f.matches("[data-new-form]")) { const item = await uploadItem(f); const fs = forms(); fs.custom ||= []; fs.custom.unshift(item); write(FORMS_KEY, fs); alert("Formulario agregado."); f.reset(); renderJefatura(); return; }
    if (f.matches("[data-new-flow]")) { const item = await uploadItem(f); const list = flows(); list.unshift(item); write(FLOWS_KEY, list); alert("Elemento guardado."); f.reset(); renderJefatura(); return; }
    if (f.matches("[data-content]")) {
      const formData = new FormData(f);
      const key = f.dataset.content === "paper" ? "papers" : f.dataset.content === "procedure" ? "procedures" : formData.get("kind");
      const item = await uploadItem(f);
      const c = content(); c[key] ||= []; c[key].unshift(item); write(CONTENT_KEY, c);
      alert("Publicado."); f.reset(); renderJefatura(); return;
    }
    if (f.matches("[data-backend-user]")) { const d = new FormData(f); const r = await apiPost("createUser", { user: { email: d.get("email"), nombre: d.get("nombre"), rol: d.get("rol"), activo: "SI", puede_editar: d.get("puede_editar") } }); if (!r.ok) alert(r.error || "Error"); else { alert("Usuario guardado."); f.reset(); listBackendUsers(); } }
  }, true);

  async function deleteMeta(kind, deleteId) {
    if (!confirm("¿Eliminar este elemento?")) return;
    if (["news", "education", "paper", "procedure"].includes(kind)) {
      const c = content(); const key = kind === "paper" ? "papers" : kind === "procedure" ? "procedures" : kind;
      const item = (c[key] || []).find(x => x.id === deleteId); if (item?.fileId) await deleteFile(item.fileId);
      c[key] = (c[key] || []).filter(x => x.id !== deleteId);
      saveComments(comments().filter(cm => !(cm.itemType === kind && cm.itemId === deleteId)));
      write(CONTENT_KEY, c);
    }
    if (kind === "call") { const item = calls().find(x => x.id === deleteId); if (item?.fileId) await deleteFile(item.fileId); write(CALLS_KEY, calls().filter(x => x.id !== deleteId)); }
    if (kind === "form") { const fs = forms(); const item = (fs.custom || []).find(x => x.id === deleteId); if (item?.fileId) await deleteFile(item.fileId); fs.custom = (fs.custom || []).filter(x => x.id !== deleteId); write(FORMS_KEY, fs); }
    if (kind === "flow") { const item = flows().find(x => x.id === deleteId); if (item?.fileId) await deleteFile(item.fileId); write(FLOWS_KEY, flows().filter(x => x.id !== deleteId)); }
    route();
  }
  document.addEventListener("click", async ev => {
    const open = ev.target.closest("[data-file-open]"); if (open) { ev.preventDefault(); const file = await getFile(open.dataset.fileOpen); if (file) window.open(URL.createObjectURL(file.blob), "_blank"); return; }
    const down = ev.target.closest("[data-file-download]"); if (down) { ev.preventDefault(); const file = await getFile(down.dataset.fileDownload); if (file) { const a = document.createElement("a"); a.href = URL.createObjectURL(file.blob); a.download = file.name || "documento"; document.body.append(a); a.click(); a.remove(); } return; }
    const del = ev.target.closest("[data-delete-kind]"); if (del) { await deleteMeta(del.dataset.deleteKind, del.dataset.deleteId); return; }
    const delComment = ev.target.closest("[data-delete-comment]"); if (delComment && isChief() && confirm("¿Eliminar comentario?")) { saveComments(comments().filter(c => c.id !== delComment.dataset.deleteComment)); try { await apiPost("deleteComment", { commentId: delComment.dataset.deleteComment }); } catch (_) {} route(); return; }
    const base = ev.target.closest("[data-delete-base-form]"); if (base && confirm("¿Quitar actualización?")) { const fs = forms(); const item = fs.base?.[base.dataset.deleteBaseForm]; if (item?.fileId) await deleteFile(item.fileId); delete fs.base[base.dataset.deleteBaseForm]; write(FORMS_KEY, fs); renderJefatura(); return; }
    if (ev.target.closest("[data-backend-list]")) listBackendUsers();
    const dis = ev.target.closest("[data-backend-disable]"); if (dis && confirm("¿Desactivar usuario?")) { const r = await apiPost("disableUser", { targetEmail: dis.dataset.backendDisable }); if (!r.ok) alert(r.error || "Error"); listBackendUsers(); }
  }, true);
  document.addEventListener("input", ev => { const input = ev.target.closest("[data-call-search]"); if (input) renderCallResults(input.dataset.callSearch, input.value); }, true);

  function route() {
    style();
    const hash = location.hash.split("?")[0];
    if (hash === "#/gestion") return renderGestion();
    if (["#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(hash)) return renderUrgencia();
    if (hash === "#/jefatura") return renderJefatura();
    if (hash === "#/gestion/noticias") return renderNews();
    if (hash === "#/gestion/educacion") return renderEducation();
    if (hash === "#/gestion/paper") return renderPaper();
    if (hash === "#/gestion/procedimientos") return renderProcedures();
    $("#doctorsPage")?.classList.remove("active"); $("#chiefPage")?.classList.remove("active");
    patchCalls(); patchForms();
  }

  window.addEventListener("hashchange", route);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route); else route();
})();
