(() => {
  const cfg = window.CRS_SUPABASE_CONFIG || {};
  const tables = {
    content: "crs_content_items",
    documents: "crs_documents",
    flows: "crs_flows",
    admins: "crs_admins",
    ...(cfg.tables || {})
  };

  const allowedRoles = new Set(["creador", "jefe", "jefatura", "disenador", "diseñador", "admin"]);
  const userAdminRoles = new Set(["creador", "disenador", "diseñador", "admin"]);
  let renderTimer = 0;
  let rendering = false;
  let authProvisionClient = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const route = () => location.hash.split("?")[0] || "#/inicio";
  const clean = (value) => String(value || "").trim();
  const norm = (value) => clean(value).toLowerCase();
  const roleKey = (value) => norm(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function client() {
    return window.CRS_SUPABASE?.client?.() || null;
  }

  function enabled() {
    return Boolean(window.CRS_SUPABASE?.enabled?.());
  }

  function provisionClient() {
    if (authProvisionClient) return authProvisionClient;
    if (!window.supabase?.createClient || !cfg.url || !cfg.anonKey) return null;
    authProvisionClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: `crs-provision-${Date.now()}`
      }
    });
    return authProvisionClient;
  }

  async function currentUser() {
    const api = client();
    if (!api) return null;
    const { data } = await api.auth.getUser();
    return data?.user || null;
  }

  function addStyle() {
    if ($("#crs-global-access-style")) return;
    const style = document.createElement("style");
    style.id = "crs-global-access-style";
    style.textContent = `
      .crs-access-shell{display:grid;gap:14px}.crs-access-hero{display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:16px;background:linear-gradient(135deg,#082f49,#0f766e 56%,#16a34a);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.22)}.crs-access-hero h2{margin:0;color:#fff;font-size:clamp(2rem,5vw,3.35rem);line-height:1}.crs-access-hero p{margin:0;color:#e0f7f2;max-width:900px}.crs-access-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:12px}.crs-access-card{display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0ea5e9;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08);min-width:0}.crs-access-card h3{margin:0;color:#10201c}.crs-access-card p{margin:0;color:#52615c}.crs-access-card label{display:grid;gap:5px;font-weight:850;color:#24312d}.crs-access-card input,.crs-access-card select,.crs-access-card textarea{width:100%;min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c}.crs-access-card textarea{min-height:86px}.crs-access-card.full{grid-column:1/-1}.crs-access-card.amber{border-left-color:#f59e0b}.crs-access-card.purple{border-left-color:#7c3aed}.crs-access-card.red{border-left-color:#dc2626}.crs-access-card.green{border-left-color:#16a34a}.crs-access-card.teal{border-left-color:#0f766e}.crs-access-actions{display:flex;gap:10px;flex-wrap:wrap}.crs-access-list{display:grid;gap:8px}.crs-access-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;border:1px solid #e5ebe8;border-radius:10px;background:#fff}.crs-access-mini{font-size:.88rem;color:#64748b}.crs-access-ok{border:1px solid #bbf7d0;background:#f0fdf4;color:#14532d;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}.crs-access-warn{border:1px solid #fde68a;background:#fffbeb;color:#713f12;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}.crs-access-error{border:1px solid #fecaca;background:#fff1f2;color:#7f1d1d;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}@media(max-width:680px){.crs-access-actions{display:grid}.crs-access-actions .document-button,.crs-access-actions .delete-button{width:100%;justify-content:center}.crs-access-row{grid-template-columns:1fr}.crs-access-hero h2{font-size:clamp(1.45rem,6.8vw,1.85rem)!important;line-height:1.08!important}}
    `;
    document.head.append(style);
  }

  function toast(message, isError = false) {
    const old = document.querySelector(".sb-toast");
    if (old) old.remove();
    const box = document.createElement("div");
    box.className = `sb-toast${isError ? " error" : ""}`;
    box.textContent = message;
    document.body.append(box);
    setTimeout(() => box.remove(), 7200);
  }

  function friendlyError(error) {
    const msg = String(error?.message || error || "Error desconocido");
    if (/crs_login_email|function|schema cache/i.test(msg)) return "Falta ejecutar el SQL actualizado en Supabase para activar ingreso con usuario.";
    if (/Invalid login credentials/i.test(msg)) return "Usuario/correo o clave incorrectos.";
    if (/row-level security|permission denied/i.test(msg)) return "Tu usuario no tiene permiso activo para este modulo.";
    if (/password/i.test(msg) && /short|weak|least/i.test(msg)) return "La clave debe tener al menos 6 caracteres.";
    return msg;
  }

  function heroHtml() {
    return `<section class="crs-access-hero"><h2>Modulo Jefatura global</h2><p>Ingreso restringido para creador, disenador y jefes. Desde aqui se pueden publicar y modificar contenidos globales de la app.</p></section>`;
  }

  function loginHtml() {
    return `<div class="crs-access-shell" data-crs-access-shell>${heroHtml()}<section class="crs-access-grid"><article class="crs-access-card full"><h3>Iniciar sesion</h3><div class="crs-access-ok">Puedes entrar con tu correo o con tu nombre de usuario.</div><form data-crs-login><label>Correo o usuario<input name="login" type="text" required autocomplete="username" placeholder="correo@hospital.cl o usuario"></label><label>Clave<input name="password" type="password" required autocomplete="current-password"></label><button class="document-button" type="submit">Entrar a Jefatura global</button></form></article></section></div>`;
  }

  function deniedHtml(user, reason) {
    return `<div class="crs-access-shell" data-crs-access-shell>${heroHtml()}<section class="crs-access-grid"><article class="crs-access-card full red"><h3>Acceso no autorizado</h3><div class="crs-access-error">${esc(reason || "Este usuario no tiene rol activo para Jefatura global.")}</div><p class="crs-access-mini">Sesion actual: ${esc(user?.email || "sin correo")}</p><button class="delete-button" type="button" data-crs-signout>Cerrar sesion</button></article></section></div>`;
  }

  function statusCard(user, profile) {
    return `<article class="crs-access-card full"><h3>Sesion activa</h3><div class="crs-access-ok">${esc(profile.display_name || user.email)} · rol ${esc(profile.role)} · usuario ${esc(profile.username || "sin usuario")}</div><div class="crs-access-actions"><button class="document-button" type="button" data-crs-refresh>Actualizar</button><button class="delete-button" type="button" data-crs-signout>Cerrar sesion</button></div><h3>Publicaciones globales recientes</h3><div data-crs-global-list><div class="crs-access-mini">Cargando...</div></div><h3>Usuarios con permiso</h3><div data-crs-admin-list><div class="crs-access-mini">Cargando...</div></div></article>`;
  }

  function paperCard() {
    return `<article class="crs-access-card amber"><h3>Paper del mes</h3><form data-content="paper"><label>Mes<input name="month" type="month" required></label><label>Titulo opcional<input name="title" placeholder="Se puede extraer del PDF"></label><label>Abstract opcional<textarea name="description"></textarea></label><label>PDF / archivo<input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"></label><label>Link<input name="url" type="url"></label><button class="document-button" type="submit">Publicar paper</button></form></article>`;
  }

  function newsCard() {
    return `<article class="crs-access-card purple"><h3>Noticias / Educacion</h3><form data-content="mixed"><label>Tipo<select name="kind"><option value="news">Noticia</option><option value="education">Educacion</option></select></label><label>Titulo<input name="title" required></label><label>Texto<textarea name="description"></textarea></label><label>Enlace<input name="eventUrl" type="url"></label><label>Imagen, poster o archivo<input name="file" type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"></label><label>Link material<input name="url" type="url"></label><button class="document-button" type="submit">Publicar</button></form></article>`;
  }

  function procedureCard() {
    return `<article class="crs-access-card red"><h3>Procedimiento medico</h3><form data-content="procedure"><label>Titulo<input name="title" required></label><label>Descripcion<textarea name="description"></textarea></label><label>Video / archivo<input name="file" type="file" accept="video/*,.pdf,.ppt,.pptx"></label><label>Link de video opcional<input name="url" type="url"></label><button class="document-button" type="submit">Subir procedimiento</button></form></article>`;
  }

  function callCard(type, title, description) {
    return `<article class="crs-access-card teal"><h3>${esc(title)}</h3><p>${esc(description)}</p><form data-upload-call data-call-type="${esc(type)}"><label>Titulo<input name="title" required></label><label>Archivo<input name="file" type="file"></label><label>Link opcional<input name="url" type="url"></label><button class="document-button" type="submit">Publicar globalmente</button></form></article>`;
  }

  function baseDocumentCard(key, title) {
    return `<article class="crs-access-card green"><h3>${esc(title)}</h3><form data-form-base data-form-key="${esc(key)}"><label>Archivo PDF / documento<input name="file" type="file"></label><label>Link opcional<input name="url" type="url"></label><button class="document-button" type="submit">Actualizar formulario</button></form></article>`;
  }

  function newFlowCard() {
    return `<article class="crs-access-card red"><h3>Nuevo flujo / protocolo</h3><form data-new-flow><label>Tipo<select name="category"><option>Flujo</option><option>CRS</option><option>Poli choque</option><option>Hospitalizados</option><option>Protocolo</option></select></label><label>Titulo<input name="title" required></label><label>Resumen<textarea name="summary"></textarea></label><label>Archivo<input name="file" type="file"></label><label>Link<input name="url" type="url"></label><button class="document-button" type="submit">Guardar flujo</button></form></article>`;
  }

  function usersCard(profile) {
    if (!userAdminRoles.has(roleKey(profile.role))) return "";
    return `<article class="crs-access-card full"><h3>Crear usuarios</h3><p>Crea usuarios para jefes y disenadores. Luego pueden entrar con usuario o correo y clave.</p><form data-chief-create-user><label>Correo<input name="email" type="email" required autocomplete="off"></label><label>Usuario<input name="username" required autocomplete="off" placeholder="ej: jefe_turno"></label><label>Nombre<input name="nombre" required autocomplete="off"></label><label>Rol<select name="rol"><option value="jefe">Jefe</option><option value="disenador">Disenador</option><option value="creador">Creador</option></select></label><label>Clave temporal<input name="password" type="password" minlength="6" required autocomplete="new-password"></label><button class="document-button" type="submit">Crear / actualizar usuario</button></form></article>`;
  }

  function panelHtml(user, profile) {
    return `<div class="crs-access-shell" data-crs-access-shell>${heroHtml()}<section class="crs-access-grid">${statusCard(user, profile)}${paperCard()}${newsCard()}${procedureCard()}${callCard("especialistas", "Especialistas de llamado", "Documento o planilla vigente de especialistas.")}${callCard("uhd", "UHD", "Disponibilidad o documento vigente de UHD.")}${baseDocumentCard("medicamentosUsoOcasional", "Medicamentos de uso ocasional")}${baseDocumentCard("leyUrgencias", "Ley de Urgencias")}${baseDocumentCard("notificacionObligatoria", "Notificacion obligatoria")}${newFlowCard()}${usersCard(profile)}</section></div>`;
  }

  async function resolveLoginEmail(loginValue) {
    const api = client();
    const value = clean(loginValue);
    if (!value) throw new Error("Escribe tu correo o usuario.");
    const { data, error } = await api.rpc("crs_login_email", { login_text: value });
    if (error) throw error;
    if (!data) throw new Error("Usuario no autorizado o inactivo.");
    return String(data).trim().toLowerCase();
  }

  async function signIn(form) {
    const api = client();
    if (!api) throw new Error("Supabase no esta conectado.");
    const data = new FormData(form);
    const email = await resolveLoginEmail(data.get("login"));
    const password = String(data.get("password") || "");
    if (!password) throw new Error("Escribe tu clave.");
    const { error } = await api.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast("Sesion iniciada.");
    scheduleRender(30);
  }

  async function getProfile(user) {
    const api = client();
    const { data, error } = await api.from(tables.admins).select("email,username,display_name,role,active").eq("email", norm(user.email)).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return data;
  }

  async function renderGlobalList() {
    const api = client();
    const box = $("[data-crs-global-list]");
    if (!api || !box) return;
    const [content, docs, flows] = await Promise.all([
      api.from(tables.content).select("id,kind,title,status,updated_at,created_at").neq("status", "archived").order("created_at", { ascending: false }).limit(8),
      api.from(tables.documents).select("id,group_name,title,status,updated_at,created_at").neq("status", "archived").order("updated_at", { ascending: false }).limit(8),
      api.from(tables.flows).select("id,category,title,status,updated_at,created_at").neq("status", "archived").order("updated_at", { ascending: false }).limit(8)
    ]);
    const error = content.error || docs.error || flows.error;
    if (error) {
      box.innerHTML = `<div class="crs-access-error">${esc(error.message || error)}</div>`;
      return;
    }
    const rows = [
      ...(content.data || []).map((item) => ({ type: "content", label: item.kind, ...item })),
      ...(docs.data || []).map((item) => ({ type: "document", label: item.group_name, ...item })),
      ...(flows.data || []).map((item) => ({ type: "flow", label: item.category, ...item }))
    ].sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at))).slice(0, 12);
    box.innerHTML = rows.length
      ? `<div class="crs-access-list">${rows.map((item) => `<div class="crs-access-row"><span><strong>${esc(item.title)}</strong><br><span class="crs-access-mini">${esc(item.label)} · ${esc(item.status)}</span></span><button class="delete-button" type="button" data-sb-archive="${esc(item.type)}" data-sb-id="${esc(item.id)}">Ocultar</button></div>`).join("")}</div>`
      : `<div class="crs-access-warn">Aun no hay publicaciones globales.</div>`;
  }

  async function fetchAdmins() {
    const api = client();
    const { data, error } = await api.from(tables.admins).select("email,username,display_name,role,active").order("email");
    if (error) throw error;
    return data || [];
  }

  async function renderAdminList(profile, user) {
    const box = $("[data-crs-admin-list]");
    if (!box) return;
    try {
      const admins = await fetchAdmins();
      const currentEmail = norm(user.email);
      box.innerHTML = admins.length
        ? `<div class="crs-access-list">${admins.map((admin) => {
            const email = norm(admin.email);
            const active = admin.active !== false;
            const self = email === currentEmail;
            const manage = userAdminRoles.has(roleKey(profile.role));
            const action = self ? `<span class="crs-access-mini">Tu usuario</span>` : manage ? `<button class="${active ? "delete-button" : "document-button"}" type="button" data-chief-admin-active="${active ? "false" : "true"}" data-chief-admin-email="${esc(email)}">${active ? "Desactivar" : "Reactivar"}</button>` : "";
            const reset = manage ? `<button class="document-button" type="button" data-chief-reset-password="${esc(email)}">Enviar cambio clave</button>` : "";
            return `<div class="crs-access-row"><span><strong>${esc(admin.display_name || email)}</strong><br><span class="crs-access-mini">${esc(email)} · usuario ${esc(admin.username || "sin usuario")} · ${esc(admin.role || "jefe")} · ${active ? "activo" : "inactivo"}</span></span><span class="crs-access-actions">${reset}${action}</span></div>`;
          }).join("")}</div>`
        : `<div class="crs-access-warn">No hay usuarios registrados.</div>`;
    } catch (error) {
      box.innerHTML = `<div class="crs-access-error">${esc(friendlyError(error))}</div>`;
    }
  }

  async function createAuthUser({ email, password, name, role, username }) {
    const auth = provisionClient();
    if (!auth) throw new Error("No se pudo cargar Supabase Auth.");
    const { error } = await auth.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, role, username },
        emailRedirectTo: `${location.origin}${location.pathname}#/jefatura`
      }
    });
    if (error && !/already|registered|exists|duplicate/i.test(String(error.message || error))) throw error;
  }

  async function createUser(form) {
    const api = client();
    const data = new FormData(form);
    const email = norm(data.get("email"));
    const username = norm(data.get("username")).replace(/\s+/g, "_");
    const name = clean(data.get("nombre"));
    const role = roleKey(data.get("rol") || "jefe");
    const password = String(data.get("password") || "");
    if (!email || !username || !name || !password) throw new Error("Completa correo, usuario, nombre, rol y clave.");
    if (password.length < 6) throw new Error("La clave debe tener al menos 6 caracteres.");
    if (!allowedRoles.has(role)) throw new Error("Rol no permitido para Jefatura global.");
    await createAuthUser({ email, password, name, role, username });
    const { error } = await api.from(tables.admins).upsert({
      email,
      username,
      display_name: name,
      role,
      active: true
    }, { onConflict: "email" });
    if (error) throw error;
    form.reset();
    toast("Usuario listo. Puede entrar con correo o usuario y clave.");
    scheduleRender(80);
  }

  async function setAdminActive(email, active) {
    const user = await currentUser();
    if (!active && norm(user?.email) === norm(email)) throw new Error("No puedes desactivarte a ti mismo.");
    const api = client();
    const { error } = await api.from(tables.admins).update({ active }).eq("email", norm(email));
    if (error) throw error;
    toast(active ? "Usuario reactivado." : "Usuario desactivado.");
    scheduleRender(80);
  }

  async function sendPasswordReset(email) {
    const api = client();
    const { error } = await api.auth.resetPasswordForEmail(norm(email), { redirectTo: `${location.origin}${location.pathname}#/jefatura` });
    if (error) throw error;
    toast("Se envio un enlace para cambiar clave.");
  }

  async function signOut() {
    const api = client();
    await api?.auth?.signOut?.();
    toast("Sesion cerrada.");
    scheduleRender(30);
  }

  async function render() {
    if (rendering || route() !== "#/jefatura" || !enabled()) return;
    const content = $("#chiefContent");
    if (!content) return;
    rendering = true;
    addStyle();
    content.dataset.crsAccessReady = "true";
    try {
      const user = await currentUser();
      if (!user) {
        content.innerHTML = loginHtml();
      } else {
        const profile = await getProfile(user);
        const role = roleKey(profile?.role);
        if (!profile || profile.active === false || !allowedRoles.has(role)) content.innerHTML = deniedHtml(user);
        else {
          content.innerHTML = panelHtml(user, profile);
          await Promise.all([renderGlobalList(), renderAdminList(profile, user)]);
        }
      }
    } catch (error) {
      const user = await currentUser();
      content.innerHTML = user ? deniedHtml(user, friendlyError(error)) : loginHtml();
    } finally {
      rendering = false;
    }
  }

  function scheduleRender(delay = 40) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, delay);
  }

  document.addEventListener("submit", async (ev) => {
    const login = ev.target.closest?.("[data-crs-login]");
    const create = ev.target.closest?.("[data-chief-create-user]");
    if (!login && !create) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    try {
      if (login) await signIn(login);
      if (create) await createUser(create);
    } catch (error) {
      console.error(error);
      toast(friendlyError(error), true);
    }
  }, true);

  document.addEventListener("click", async (ev) => {
    const signout = ev.target.closest?.("[data-crs-signout]");
    const refresh = ev.target.closest?.("[data-crs-refresh]");
    const toggle = ev.target.closest?.("[data-chief-admin-active]");
    const reset = ev.target.closest?.("[data-chief-reset-password]");
    if (!signout && !refresh && !toggle && !reset) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    try {
      if (signout) await signOut();
      if (refresh) scheduleRender(10);
      if (toggle) await setAdminActive(toggle.dataset.chiefAdminEmail, toggle.dataset.chiefAdminActive === "true");
      if (reset) await sendPasswordReset(reset.dataset.chiefResetPassword);
    } catch (error) {
      console.error(error);
      toast(friendlyError(error), true);
    }
  }, true);

  const observer = new MutationObserver(() => {
    if (route() !== "#/jefatura" || rendering || !enabled()) return;
    const content = $("#chiefContent");
    if (!content) return;
    if (!content.querySelector("[data-crs-access-shell]") || content.querySelector("[data-sb-login],[data-backend-user]")) scheduleRender(60);
  });

  window.CRS_SUPABASE_JEFATURA = { render, scheduleRender };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { observer.observe(document.body, { childList: true, subtree: true }); scheduleRender(80); }, { once: true });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleRender(80);
  }
  window.addEventListener("hashchange", () => scheduleRender(60));
  window.addEventListener("crs:supabase-ready", () => scheduleRender(80));
})();
