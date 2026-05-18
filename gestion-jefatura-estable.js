(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations?.().then((items) => items.forEach((item) => item.unregister())).catch(() => {});
  }
  if (window.caches?.keys) caches.keys().then((keys) => keys.forEach((key) => caches.delete(key))).catch(() => {});

  const USERS_KEY = "crsAuthUsersV3";
  const SESSION_KEY = "crsAuthSessionV3";
  const LEGACY_USERS_KEY = "crsChiefUsersV2";
  const LEGACY_SESSION_KEY = "crsChiefSessionV2";
  const LINKS_KEY = "crsOperationalLinksStable";
  const CONTENT_KEY = "crsContentHubStable";
  const PHONES_KEY = "crsExtraPhonesStable";
  const FORMS_KEY = "crsFormsLinksStable";
  const ONCALL_KEY = "crsOnCallCsvStable";
  const ARSENAL_KEY = "crsArsenalCsvStable";
  const ADMINS = { desarrollador: "Dr Carlos Herrera", guti: "Dr Pablo Gutierrez", cote: "Dra Maria-Jose Marin" };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || "") || fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const nowIso = () => new Date().toISOString();

  function migrateUsers() {
    const current = read(USERS_KEY, null);
    if (Array.isArray(current)) return current;
    const legacy = read(LEGACY_USERS_KEY, []);
    if (legacy.length) {
      const migrated = legacy.map((user) => ({ ...user, role: user.role || "jefe", status: user.status || "active", createdAt: user.createdAt || nowIso(), updatedAt: nowIso() }));
      write(USERS_KEY, migrated);
      return migrated;
    }
    write(USERS_KEY, []);
    return [];
  }

  const users = () => migrateUsers();
  const saveUsers = (items) => write(USERS_KEY, items.map((item) => ({ ...item, username: clean(item.username), updatedAt: nowIso() })));
  const session = () => read(SESSION_KEY, read(LEGACY_SESSION_KEY, null));
  const isAdmin = (user = session()) => Boolean(user && (["owner", "desarrollador", "jefe"].includes(user.role) || Object.prototype.hasOwnProperty.call(ADMINS, clean(user.username))));
  const isWorker = (user = session()) => Boolean(user && ["medico", "enfermeria", "tens", "kinesio", "matroneria", "administrativo", "jefe-turno", "subrogante", "jefe", "owner", "desarrollador"].includes(user.role));

  async function hashPassword(username, password) {
    const text = `${clean(username)}::${String(password || "")}`;
    if (crypto?.subtle && window.TextEncoder) {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, "0")).join("");
    }
    return btoa(unescape(encodeURIComponent(text)));
  }

  function addStyle() {
    if ($("#gestion-jefatura-estable-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-jefatura-estable-style";
    style.textContent = `.page:not(.active){display:none!important}#chiefPage>.page-head,#doctorsPage>.page-head{display:none!important}.stable-shell{display:grid;gap:14px}.stable-hero{position:relative;overflow:hidden;display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:14px;background:linear-gradient(135deg,#0f172a 0%,#14532d 48%,#0f766e 100%);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.24)}.stable-hero:after{content:"";position:absolute;right:-70px;bottom:-95px;width:250px;height:250px;border-radius:50%;background:rgba(255,255,255,.12)}.stable-hero h2{font-size:clamp(2rem,5vw,3.7rem);line-height:1;margin:0;color:#fff}.stable-hero p{max-width:780px;color:#def7ef;line-height:1.5;margin:0}.stable-actions{display:flex;flex-wrap:wrap;gap:10px;position:relative;z-index:1}.stable-actions .document-button:first-child{background:#f59e0b;border-color:#f59e0b;color:#1f1300}.stable-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.stable-card{display:grid;gap:8px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.08)}.stable-card.amber{border-left-color:#f59e0b}.stable-card.blue{border-left-color:#2563eb}.stable-card.purple{border-left-color:#7c3aed}.stable-card.red{border-left-color:#dc2626}.stable-card strong{font-size:1.08rem;color:#10201c}.stable-card span,.stable-card p{color:#52615c;line-height:1.42;margin:0}.stable-admin{display:grid;gap:14px}.stable-admin-section{display:grid;gap:10px}.stable-table{width:100%;border-collapse:collapse;min-width:760px}.stable-table th,.stable-table td{padding:9px 10px;border-bottom:1px solid #edf0ed;text-align:left;vertical-align:top}.stable-table th{background:#f6f8f7;font-size:.78rem;text-transform:uppercase;color:#44504b}.stable-table-wrap{overflow:auto;border:1px solid #dfe8e4;border-radius:10px;background:#fff}.stable-note{padding:12px;border:1px solid #f4d28a;border-radius:10px;background:#fff7e8;color:#664100;font-weight:750}.stable-warn{padding:12px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#7f1d1d;font-weight:750}.chief-form{display:grid;gap:10px}.chief-form label{display:grid;gap:6px;color:#24312d;font-weight:850}.chief-form input,.chief-form select,.chief-form textarea{width:100%;min-height:42px;padding:9px 11px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c}.admin-list{display:grid;gap:8px}.admin-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;border:1px solid #dfe8e4;border-radius:10px;background:#fbfdfc}.admin-row.inactive{opacity:.58}.auth-tabs{display:flex;flex-wrap:wrap;gap:8px}.auth-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#eef7f5;color:#0b4f49;font-weight:850;font-size:.84rem}.route-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}@media(max-width:680px){.stable-actions,.route-actions{display:grid}.stable-actions .document-button,.route-actions .back-link{width:100%;justify-content:center}.admin-row{grid-template-columns:1fr}}`;
    document.head.append(style);
  }

  function activate(pageId) {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$("[data-route-link]").forEach((link) => link.classList.toggle("active", link.dataset.routeLink === "gestion" && ["managementPage", "chiefPage", "doctorsPage"].includes(pageId)));
    $("#chiefPage .page-head")?.remove();
    $("#doctorsPage .page-head")?.remove();
  }

  function getCases() { try { if (typeof priorityCases === "function") return priorityCases(); } catch {} return read("crsPriorityCases", []); }
  function contentState() { return read(CONTENT_KEY, { education: [], news: [], paper: null }); }
  const nav = () => `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div>`;

  function currentSessionBadge() {
    const active = session();
    if (!active) return "";
    return `<span class="auth-pill">👤 ${esc(active.name || active.username)} · ${esc(active.role || "usuario")}</span>`;
  }

  function renderGestion() {
    addStyle(); activate("managementPage");
    const title = $("#managementTitle"); if (title) title.textContent = "Gestión";
    const content = $("#managementContent"); if (!content) return;
    const active = session();
    const cases = getCases();
    content.innerHTML = `<div class="stable-shell"><section class="stable-hero"><h2>Gestión de Urgencia</h2><p>Dos módulos: uno operativo para todo el equipo de urgencia y otro restringido para jefatura.</p><div class="auth-tabs">${currentSessionBadge()}<span class="auth-pill">🔐 Usuarios locales V3</span></div><div class="stable-actions"><a class="document-button" href="#/urgencia">Módulo Equipo Urgencia</a><a class="document-button" href="#/jefatura">Módulo Jefatura</a><a class="document-button" href="#/especialidades">Ver flujos</a><a class="document-button" href="#/inicio">Inicio</a>${active ? `<button class="document-button" type="button" data-stable-logout>Cerrar sesión</button>` : ""}</div></section><section class="stable-grid"><article class="stable-card"><strong>Equipo Urgencia</strong><span>Acceso operativo de lectura: flujos, formularios, visita, llamados y directorio.</span></article><article class="stable-card amber"><strong>Jefatura</strong><span>Usuarios, claves, planillas, contenido y casos priorizados.</span></article><article class="stable-card blue"><strong>Casos guardados</strong><span>${cases.length}</span></article></section><div class="stable-warn"><strong>Seguridad:</strong> esta versión mantiene usuarios y claves en este navegador. Para acceso real compartido entre computadores hay que conectar backend institucional, Firebase, Supabase o Apps Script.</div></div>`;
  }

  function publicTeamView() {
    return `${nav()}<section class="stable-hero"><h2>Módulo Equipo Urgencia</h2><p>Área operativa para médicos, enfermería, TENS, kinesiólogos, matronería, administrativos y jefes de turno. No permite modificar planillas maestras.</p><div class="stable-actions"><a class="document-button" href="#/especialidades">Flujos clínicos</a><a class="document-button" href="#/llamados">Especialistas / UHD</a><a class="document-button" href="#/visita">Visita diaria</a><a class="document-button" href="#/formularios">Formularios</a><a class="document-button" href="#/telefonos">Directorio</a></div></section><section class="stable-grid"><article class="stable-card"><strong>Lectura clínica</strong><span>Los usuarios del equipo pueden consultar flujos y documentos.</span></article><article class="stable-card amber"><strong>Planillas Drive</strong><span>La edición real depende de permisos compartidos en Google Drive.</span></article><article class="stable-card blue"><strong>Sin administración</strong><span>No pueden crear usuarios ni modificar enlaces maestros desde este módulo.</span></article></section>`;
  }

  function renderUrgencia() {
    addStyle(); activate("doctorsPage");
    const content = $("#doctorsContent"); if (!content) return;
    content.innerHTML = publicTeamView();
  }

  function authView() {
    const first = users().length === 0;
    return `${nav()}<section class="stable-hero"><h2>Módulo Jefatura</h2><p>Administración de usuarios, claves, planillas, documentos y contenidos visibles en la app.</p><div class="auth-tabs"><span class="auth-pill">👑 Jefatura</span><span class="auth-pill">🔐 Requiere usuario y clave</span></div></section><section class="document-panel"><div class="stable-grid"><article class="stable-card"><strong>Dr Carlos Herrera</strong><span>Desarrollador y administración completa.</span></article><article class="stable-card"><strong>Dr Pablo Gutiérrez</strong><span>Jefatura de urgencia.</span></article><article class="stable-card"><strong>Dra María-José Marín</strong><span>Jefatura de urgencia.</span></article></div><p data-chief-message></p>${first ? `<form class="chief-form" data-stable-bootstrap><label>Usuario autorizado<select name="username"><option value="desarrollador">Dr Carlos Herrera</option><option value="guti">Dr Pablo Gutiérrez</option><option value="cote">Dra María-José Marín</option></select></label><label>Nombre<input name="name" required></label><label>Clave<input name="password" type="password" minlength="6" required></label><button class="document-button" type="submit">Crear primer usuario administrador</button></form>` : `<form class="chief-form" data-stable-login><label>Usuario<input name="username" required autocomplete="username"></label><label>Clave<input name="password" type="password" required autocomplete="current-password"></label><button class="document-button" type="submit">Ingresar</button></form><hr><h3>Crear clave con contraseña temporal</h3><form class="chief-form" data-stable-create-password><label>Usuario autorizado<input name="username" required></label><label>Clave temporal<input name="temporaryPassword" type="password" required></label><label>Nueva clave<input name="password" type="password" minlength="6" required></label><button class="document-button" type="submit">Crear o activar clave</button></form>`}<div class="stable-note">La clave queda protegida con hash SHA-256 local. No se guarda la clave en texto plano.</div></section>`;
  }

  function casesTable() {
    const rows = getCases().map((item) => `<tr><td>${esc(new Date(item.createdAt || Date.now()).toLocaleString("es-CL"))}</td><td>${esc(item.status || "Pendiente")}</td><td>${esc(item.flow || item.protocol || "")}</td><td>${esc(item.patientName || "")}<br>${esc(item.rut || "")}<br>${esc(item.phone || "")}</td><td>${esc(item.summary || "")}</td><td>${esc(item.need || "")}</td></tr>`).join("") || `<tr><td colspan="6">No hay casos guardados.</td></tr>`;
    return `<section class="document-panel"><h2>Casos para gestión</h2><div class="stable-actions"><button class="document-button" data-export-stable="csv">Excel</button><button class="document-button" data-export-stable="word">Word</button></div><div class="stable-table-wrap"><table class="stable-table"><thead><tr><th>Fecha</th><th>Estado</th><th>Flujo</th><th>Paciente</th><th>Resumen</th><th>Necesita</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function userRows() {
    return users().map((user) => `<div class="admin-row ${user.status === "inactive" ? "inactive" : ""}"><div><strong>${esc(user.name || user.username)}</strong><br><span>${esc(user.username)} · ${esc(user.role || "usuario")} · ${esc(user.status || "active")}${user.temporaryHash ? " · clave temporal pendiente" : ""}</span></div><div class="stable-actions"><button class="document-button" data-reset-stable-user="${esc(user.username)}">Reset clave</button><button class="document-button" data-toggle-stable-user="${esc(user.username)}">${user.status === "inactive" ? "Activar" : "Desactivar"}</button>${Object.prototype.hasOwnProperty.call(ADMINS, clean(user.username)) ? "" : `<button class="document-button" data-remove-stable-user="${esc(user.username)}">Eliminar</button>`}</div></div>`).join("");
  }

  function adminCenter() {
    const links = read(LINKS_KEY, {});
    const forms = read(FORMS_KEY, {});
    const phones = read(PHONES_KEY, []);
    return `<section class="document-panel stable-admin"><h2>Centro de administración</h2><p class="stable-note">Usuarios y claves se mantienen en este navegador. Usa exportar respaldo para trasladarlos a otro computador.</p><div class="stable-grid"><article class="stable-card stable-admin-section"><h2>Usuarios</h2><form class="chief-form" data-stable-user><label>Usuario<input name="username" required placeholder="ej: jefe.turno"></label><label>Nombre<input name="name" required></label><label>Rol<select name="role"><option value="medico">Médico urgencia</option><option value="jefe-turno">Jefe de turno</option><option value="subrogante">Subrogante</option><option value="jefe">Jefatura</option><option value="owner">Administrador</option><option value="enfermeria">Enfermería</option><option value="tens">TENS</option><option value="kinesio">Kinesiología</option><option value="matroneria">Matronería</option><option value="administrativo">Administrativo</option></select></label><label>Clave temporal<input name="temporaryPassword" type="password" minlength="6" required></label><button class="document-button">Crear / autorizar usuario</button></form><form class="chief-form" data-stable-import><label>Importar respaldo usuarios<textarea name="json" rows="4" placeholder="Pega aquí el respaldo JSON"></textarea></label><button class="document-button">Importar respaldo</button></form><div class="stable-actions"><button class="document-button" type="button" data-export-users>Exportar respaldo usuarios</button></div><div class="admin-list">${userRows()}</div></article><article class="stable-card stable-admin-section"><h2>Cambiar mi clave</h2><form class="chief-form" data-stable-change-password><label>Clave actual<input name="currentPassword" type="password" required></label><label>Nueva clave<input name="newPassword" type="password" minlength="6" required></label><button class="document-button">Cambiar clave</button></form></article><article class="stable-card stable-admin-section"><h2>Planillas</h2><form class="chief-form" data-stable-links><label>Especialista de llamado<input name="llamados" type="url" value="${esc(links.llamados)}"></label><label>UHD<input name="uhd" type="url" value="${esc(links.uhd)}"></label><label>Visita diaria<input name="visita" type="url" value="${esc(links.visita)}"></label><label>CSV/TSV llamados<input name="onCallCsv" type="file" accept=".csv,.tsv,.txt"></label><button class="document-button">Actualizar</button></form></article><article class="stable-card stable-admin-section"><h2>Arsenal terapéutico</h2><form class="chief-form" data-stable-arsenal><label>CSV/TSV arsenal<input name="arsenalCsv" type="file" accept=".csv,.tsv,.txt"></label><button class="document-button">Actualizar arsenal</button></form></article><article class="stable-card stable-admin-section"><h2>Formularios</h2><form class="chief-form" data-stable-forms><label>Medicamentos uso ocasional<input name="medicamentosUsoOcasionalUrl" type="url" value="${esc(forms.medicamentosUsoOcasionalUrl)}"></label><label>Ley de urgencias<input name="leyUrgenciasUrl" type="url" value="${esc(forms.leyUrgenciasUrl)}"></label><label>Notificación obligatoria<input name="notificacionObligatoriaUrl" type="url" value="${esc(forms.notificacionObligatoriaUrl)}"></label><button class="document-button">Guardar formularios</button></form></article><article class="stable-card stable-admin-section"><h2>Directorio telefónico</h2><form class="chief-form" data-stable-phone><label>Nombre<input name="name" required></label><label>Detalle<input name="detail" required></label><label>Teléfono<input name="phone" required></label><button class="document-button">Agregar teléfono</button></form><div class="admin-list">${phones.map((phone, i) => `<div class="admin-row"><div><strong>${esc(phone.name)}</strong><br><span>${esc(phone.detail)} · ${esc(phone.phone)}</span></div><button class="document-button" data-remove-stable-phone="${i}">Eliminar</button></div>`).join("")}</div></article><article class="stable-card stable-admin-section"><h2>Educación, paper y noticias</h2><form class="chief-form" data-stable-content><label>Tipo<select name="type"><option value="education">Educación médica</option><option value="paper">Paper del mes</option><option value="news">Noticias SUHPH / cursos / actividades</option></select></label><label>Título<input name="title" required></label><label>Descripción<textarea name="description" rows="3"></textarea></label><label>Link<input name="url" type="url"></label><button class="document-button">Publicar</button></form></article></div></section>`;
  }

  function renderJefatura() {
    addStyle(); activate("chiefPage");
    const content = $("#chiefContent"); if (!content) return;
    const active = session();
    content.innerHTML = active ? `${nav()}<section class="stable-hero"><h2>Módulo Jefatura</h2><p>Sesión: ${esc(active.name || active.username)} (${esc(active.role)})</p><div class="stable-actions"><button class="document-button" data-stable-logout>Cerrar sesión</button><a class="document-button" href="#/urgencia">Equipo Urgencia</a><a class="document-button" href="#/inicio">Inicio</a></div></section>${isAdmin(active) ? adminCenter() : `<div class="stable-warn">Tu usuario no tiene rol de jefatura/administrador.</div>`}${casesTable()}` : authView();
  }

  function applyLinks() {
    const links = read(LINKS_KEY, {});
    const forms = read(FORMS_KEY, {});
    try { if (typeof externalDocs !== "undefined") Object.assign(externalDocs, { llamadosUrl: links.llamados || externalDocs.llamadosUrl, uhdDisponibilidadUrl: links.uhd || externalDocs.uhdDisponibilidadUrl, visitaDiariaUrl: links.visita || externalDocs.visitaDiariaUrl }); } catch {}
    try { if (typeof externalForms !== "undefined") Object.assign(externalForms, forms); } catch {}
  }

  function readFile(file) {
    return new Promise((resolve) => { if (!file) return resolve(""); const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = () => resolve(""); reader.readAsText(file); });
  }

  function download(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  async function submitHandler(event) {
    const form = event.target;
    if (!form.closest("[data-stable-bootstrap], [data-stable-login], [data-stable-create-password], [data-stable-user], [data-stable-change-password], [data-stable-import], [data-stable-links], [data-stable-arsenal], [data-stable-forms], [data-stable-phone], [data-stable-content]")) return;
    event.preventDefault();
    const data = new FormData(form);

    if (form.matches("[data-stable-bootstrap]")) {
      const username = clean(data.get("username"));
      const user = { username, name: data.get("name") || ADMINS[username] || username, role: username === "desarrollador" ? "desarrollador" : "owner", status: "active", hash: await hashPassword(username, data.get("password")), createdAt: nowIso(), updatedAt: nowIso() };
      saveUsers([user]); sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); renderJefatura(); return;
    }

    if (form.matches("[data-stable-login]")) {
      const typed = clean(data.get("username"));
      const alias = typed.includes("carlos") ? "desarrollador" : typed.includes("pablo") || typed.includes("gutierrez") ? "guti" : typed.includes("maria") || typed.includes("marin") || typed.includes("cote") ? "cote" : typed;
      const user = users().find((item) => clean(item.username) === alias || clean(item.name) === typed);
      if (user?.status === "inactive") return alert("Usuario desactivado.");
      if (user?.hash && await hashPassword(user.username, data.get("password")) === user.hash) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); renderJefatura(); } else alert("Usuario o clave incorrecta.");
      return;
    }

    if (form.matches("[data-stable-create-password]")) {
      const username = clean(data.get("username"));
      const list = users(); const index = list.findIndex((item) => clean(item.username) === username);
      if (index >= 0 && await hashPassword(username, data.get("temporaryPassword")) === list[index].temporaryHash) {
        list[index].hash = await hashPassword(username, data.get("password")); delete list[index].temporaryHash; list[index].status = "active"; list[index].updatedAt = nowIso(); saveUsers(list); sessionStorage.setItem(SESSION_KEY, JSON.stringify(list[index])); renderJefatura();
      } else alert("Usuario o clave temporal incorrecta.");
      return;
    }

    if (form.matches("[data-stable-user]")) {
      const active = session(); if (!isAdmin(active)) return alert("Sin permiso.");
      const username = clean(data.get("username")); const list = users().filter((item) => clean(item.username) !== username);
      list.push({ username, name: data.get("name"), role: data.get("role"), status: "active", temporaryHash: await hashPassword(username, data.get("temporaryPassword")), createdAt: nowIso(), updatedAt: nowIso() }); saveUsers(list); renderJefatura(); return;
    }

    if (form.matches("[data-stable-change-password]")) {
      const active = session(); if (!active) return;
      const list = users(); const index = list.findIndex((item) => clean(item.username) === clean(active.username));
      if (index >= 0 && list[index].hash && await hashPassword(list[index].username, data.get("currentPassword")) === list[index].hash) {
        list[index].hash = await hashPassword(list[index].username, data.get("newPassword")); list[index].updatedAt = nowIso(); saveUsers(list); sessionStorage.setItem(SESSION_KEY, JSON.stringify(list[index])); alert("Clave actualizada."); renderJefatura();
      } else alert("Clave actual incorrecta.");
      return;
    }

    if (form.matches("[data-stable-import]")) {
      try { const imported = JSON.parse(String(data.get("json") || "")); if (!Array.isArray(imported)) throw new Error(); saveUsers(imported); alert("Usuarios importados."); renderJefatura(); } catch { alert("Respaldo inválido."); }
      return;
    }

    if (form.matches("[data-stable-links]")) { write(LINKS_KEY, { llamados: data.get("llamados"), uhd: data.get("uhd"), visita: data.get("visita") }); const csv = await readFile(form.onCallCsv.files[0]); if (csv) localStorage.setItem(ONCALL_KEY, csv); applyLinks(); renderJefatura(); return; }
    if (form.matches("[data-stable-arsenal]")) { const csv = await readFile(form.arsenalCsv.files[0]); if (csv) localStorage.setItem(ARSENAL_KEY, csv); renderJefatura(); return; }
    if (form.matches("[data-stable-forms]")) { write(FORMS_KEY, Object.fromEntries(data.entries())); applyLinks(); renderJefatura(); return; }
    if (form.matches("[data-stable-phone]")) { const phones = read(PHONES_KEY, []); phones.push({ name: data.get("name"), detail: data.get("detail"), phone: data.get("phone") }); write(PHONES_KEY, phones); renderJefatura(); return; }
    if (form.matches("[data-stable-content]")) { const state = contentState(); const item = { title: data.get("title"), description: data.get("description"), url: data.get("url") }; if (data.get("type") === "paper") state.paper = item; else state[data.get("type")].unshift(item); write(CONTENT_KEY, state); renderJefatura(); }
  }

  document.addEventListener("submit", submitHandler, true);
  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-stable-logout]")) { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(LEGACY_SESSION_KEY); renderGestion(); }
    const exportUsers = event.target.closest("[data-export-users]"); if (exportUsers) download(`usuarios-crs-hph-${new Date().toISOString().slice(0,10)}.json`, "application/json;charset=utf-8", JSON.stringify(users(), null, 2));
    const removeUser = event.target.closest("[data-remove-stable-user]"); if (removeUser) { if (confirm("¿Eliminar usuario?")) { saveUsers(users().filter((u) => clean(u.username) !== clean(removeUser.dataset.removeStableUser))); renderJefatura(); } }
    const toggleUser = event.target.closest("[data-toggle-stable-user]"); if (toggleUser) { const list = users(); const u = list.find((item) => clean(item.username) === clean(toggleUser.dataset.toggleStableUser)); if (u) { u.status = u.status === "inactive" ? "active" : "inactive"; saveUsers(list); renderJefatura(); } }
    const resetUser = event.target.closest("[data-reset-stable-user]"); if (resetUser) { const temp = prompt("Nueva clave temporal para este usuario:"); if (temp && temp.length >= 6) { const list = users(); const u = list.find((item) => clean(item.username) === clean(resetUser.dataset.resetStableUser)); if (u) { u.temporaryHash = await hashPassword(u.username, temp); delete u.hash; u.status = "active"; saveUsers(list); renderJefatura(); alert("Clave temporal actualizada. El usuario debe crear su nueva clave al ingresar."); } } else if (temp) alert("La clave temporal debe tener al menos 6 caracteres."); }
    const removePhone = event.target.closest("[data-remove-stable-phone]"); if (removePhone) { const phones = read(PHONES_KEY, []); phones.splice(Number(removePhone.dataset.removeStablePhone), 1); write(PHONES_KEY, phones); renderJefatura(); }
  }, true);

  function route() {
    applyLinks(); addStyle();
    const hash = location.hash.split("?")[0];
    if (hash === "#/gestion") renderGestion();
    if (["#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(hash)) renderUrgencia();
    if (hash === "#/jefatura") renderJefatura();
  }

  addEventListener("hashchange", route);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(route, 60));
  else setTimeout(route, 60);
})();
