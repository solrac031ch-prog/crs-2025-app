(() => {
  const cfg = window.CRS_SUPABASE_CONFIG || {};
  const tables = {
    admins: "crs_admins",
    ...(cfg.tables || {})
  };
  let observerStarted = false;
  let renderTimer = 0;
  let authProvisionClient = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const route = () => location.hash.split("?")[0] || "#/inicio";
  const normEmail = (value) => String(value || "").trim().toLowerCase();

  function client() {
    return window.CRS_SUPABASE?.client?.() || null;
  }

  async function currentUser() {
    const api = client();
    if (!api) return null;
    const { data } = await api.auth.getUser();
    return data?.user || null;
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

  function addStyle() {
    if ($("#jefatura-usuarios-style")) return;
    const style = document.createElement("style");
    style.id = "jefatura-usuarios-style";
    style.textContent = `
      .chief-user-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .chief-user-form-note{font-size:.9rem;color:#52615c;margin:0}
      .chief-user-chip{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:.82rem;font-weight:900;background:#e2f2ef;color:#0b4f49;border:1px solid #b7ddd6}
      @media(max-width:680px){.chief-user-actions{display:grid;justify-content:stretch}.chief-user-actions .document-button,.chief-user-actions .delete-button{width:100%;justify-content:center}}
    `;
    document.head.append(style);
  }

  function toast(message, isError = false) {
    const old = $(".sb-toast");
    if (old) old.remove();
    const box = document.createElement("div");
    box.className = `sb-toast${isError ? " error" : ""}`;
    box.textContent = message;
    document.body.append(box);
    setTimeout(() => box.remove(), 6200);
  }

  function friendlyError(error) {
    const msg = String(error?.message || error || "Error desconocido");
    if (/signup|signups/i.test(msg) && /disabled|not allowed/i.test(msg)) {
      return "Supabase tiene desactivada la creacion de usuarios. Hay que activar Auth > Providers > Email > Allow new users una sola vez.";
    }
    if (/password/i.test(msg) && /short|weak|least/i.test(msg)) {
      return "La clave temporal debe tener al menos 6 caracteres.";
    }
    if (/permission denied|row-level security/i.test(msg)) {
      return "Tu usuario no tiene permiso activo de Jefatura para administrar usuarios.";
    }
    return msg;
  }

  function alreadyRegistered(error) {
    return /already|registered|exists|duplicate/i.test(String(error?.message || error || ""));
  }

  async function requireAdminSession() {
    const user = await currentUser();
    if (!user) throw new Error("Primero inicia sesion en Jefatura.");
    return user;
  }

  async function createAuthUser({ email, password, name, role }) {
    if (!password || password.length < 6) throw new Error("La clave temporal debe tener al menos 6 caracteres.");
    const auth = provisionClient();
    if (!auth) throw new Error("No se pudo cargar Supabase Auth para crear el usuario.");
    const { error } = await auth.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, role },
        emailRedirectTo: `${location.origin}${location.pathname}#/jefatura`
      }
    });
    if (error) {
      if (alreadyRegistered(error)) return { alreadyExists: true };
      throw error;
    }
    return { created: true };
  }

  async function upsertPermission({ email, name, role }) {
    const api = client();
    if (!api) throw new Error("Supabase no esta conectado.");
    const { error } = await api.from(tables.admins).upsert({
      email,
      display_name: name,
      role,
      active: true
    }, { onConflict: "email" });
    if (error) throw error;
  }

  async function createUserFromPanel(form) {
    await requireAdminSession();
    const data = new FormData(form);
    const email = normEmail(data.get("email"));
    const name = String(data.get("nombre") || "").trim();
    const role = String(data.get("rol") || "jefatura").trim() || "jefatura";
    const password = String(data.get("password") || "");
    if (!email) throw new Error("Falta el correo del usuario.");
    if (!name) throw new Error("Falta el nombre del usuario.");

    const created = await createAuthUser({ email, password, name, role });
    await upsertPermission({ email, name, role });
    form.reset();
    await renderAdminActions(true);
    toast(created.alreadyExists
      ? "El usuario ya existia en Auth. Permiso de Jefatura actualizado y activo."
      : "Usuario creado con clave temporal y permiso de Jefatura activo."
    );
  }

  async function setAdminActive(email, active) {
    const sessionUser = await requireAdminSession();
    const currentEmail = normEmail(sessionUser.email);
    if (!active && currentEmail === normEmail(email)) {
      throw new Error("No puedes desactivarte a ti mismo desde la web.");
    }
    const api = client();
    const { error } = await api.from(tables.admins).update({ active }).eq("email", normEmail(email));
    if (error) throw error;
    await renderAdminActions(true);
    toast(active ? "Usuario reactivado para Jefatura." : "Usuario desactivado: ya no puede publicar ni administrar.");
  }

  async function sendPasswordReset(email) {
    await requireAdminSession();
    const api = client();
    const { error } = await api.auth.resetPasswordForEmail(normEmail(email), {
      redirectTo: `${location.origin}${location.pathname}#/jefatura`
    });
    if (error) throw error;
    toast("Se envio un enlace para cambiar clave al correo del usuario.");
  }

  function userFormHtml() {
    return `<h3>Administrador de usuarios</h3>
      <p>Crea usuarios de Jefatura sin entrar a Supabase. El correo queda con permiso activo para publicar en la web.</p>
      <form data-chief-create-user>
        <label>Correo<input name="email" type="email" required autocomplete="off"></label>
        <label>Nombre<input name="nombre" required autocomplete="off"></label>
        <label>Rol<select name="rol"><option value="jefatura">Jefatura</option><option value="admin">Admin</option><option value="equipo">Equipo</option></select></label>
        <label>Clave temporal<input name="password" type="password" minlength="6" required autocomplete="new-password" placeholder="Minimo 6 caracteres"></label>
        <button class="document-button" type="submit">Crear usuario con clave</button>
      </form>
      <p class="chief-user-form-note">Para cambiar clave de un usuario existente, usa el boton "Enviar cambio clave" en la lista de permisos.</p>`;
  }

  function enhanceUserCard() {
    const shell = $("[data-sb-chief-shell]");
    if (!shell) return;
    const card = $$(".sb-chief-card", shell).find((item) => /Administrador de usuarios/i.test($("h3", item)?.textContent || ""));
    if (!card || card.dataset.chiefCreateUserReady === "true") return;
    card.dataset.chiefCreateUserReady = "true";
    card.innerHTML = userFormHtml();
  }

  async function fetchAdmins() {
    const api = client();
    if (!api) return [];
    const { data, error } = await api.from(tables.admins).select("email,display_name,role,active").order("email");
    if (error) throw error;
    return data || [];
  }

  async function renderAdminActions(force = false) {
    if (route() !== "#/jefatura") return;
    const box = $("[data-sb-chief-admin-list]");
    if (!box) return;
    if (!force && box.querySelector("[data-chief-admin-active],[data-chief-reset-password]")) return;
    const sessionUser = await currentUser();
    if (!sessionUser) return;
    const currentEmail = normEmail(sessionUser.email);
    const admins = await fetchAdmins();
    box.innerHTML = admins.length
      ? `<div class="sb-list">${admins.map((admin) => {
          const email = normEmail(admin.email);
          const isSelf = email === currentEmail;
          const active = admin.active !== false;
          const action = isSelf
            ? `<span class="chief-user-chip">Tu usuario</span>`
            : `<button class="${active ? "delete-button" : "document-button"}" type="button" data-chief-admin-active="${active ? "false" : "true"}" data-chief-admin-email="${esc(email)}">${active ? "Desactivar" : "Reactivar"}</button>`;
          return `<div class="sb-row"><span><strong>${esc(admin.display_name || email)}</strong><br><span class="sb-mini">${esc(email)} · ${esc(admin.role || "jefatura")} · ${active ? "activo" : "inactivo"}</span></span><span class="chief-user-actions"><button class="document-button" type="button" data-chief-reset-password="${esc(email)}">Enviar cambio clave</button>${action}</span></div>`;
        }).join("")}</div>`
      : `<div class="sb-warn">No hay usuarios registrados en crs_admins.</div>`;
  }

  function scheduleEnhance(delay = 80) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(async () => {
      if (route() !== "#/jefatura") return;
      try {
        addStyle();
        enhanceUserCard();
        await renderAdminActions();
      } catch (error) {
        console.error(error);
      }
    }, delay);
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-chief-create-user]");
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      await createUserFromPanel(form);
    } catch (error) {
      console.error(error);
      toast(friendlyError(error), true);
    }
  }, true);

  document.addEventListener("click", async (event) => {
    const toggle = event.target.closest("[data-chief-admin-active]");
    const reset = event.target.closest("[data-chief-reset-password]");
    if (!toggle && !reset) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (toggle) await setAdminActive(toggle.dataset.chiefAdminEmail, toggle.dataset.chiefAdminActive === "true");
      if (reset) await sendPasswordReset(reset.dataset.chiefResetPassword);
    } catch (error) {
      console.error(error);
      toast(friendlyError(error), true);
    }
  }, true);

  function startObserver() {
    if (observerStarted || !document.body) return;
    observerStarted = true;
    const observer = new MutationObserver(() => scheduleEnhance(80));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener("hashchange", () => scheduleEnhance(120));
  window.addEventListener("crs:supabase-ready", () => scheduleEnhance(120));
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { startObserver(); scheduleEnhance(120); }, { once: true });
  } else {
    startObserver();
    scheduleEnhance(120);
  }
})();
