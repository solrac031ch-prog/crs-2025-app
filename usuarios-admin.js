(() => {
  const SESSION_KEY = "crsAuthSessionV3";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  function session() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; }
  }

  function hasChiefRole(user = session()) {
    const email = clean(user?.email || user?.username);
    const roles = clean(user?.role).split(/[,;|\s]+/).filter(Boolean);
    return Boolean(user && (email === "mdcarlosherrera@gmail.com" || roles.some((role) => ["admin", "administrador", "owner", "desarrollador", "jefatura", "jefe", "jefe_turno"].includes(role))));
  }

  function apiUrl() {
    return String(window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "").trim();
  }

  async function apiPost(action, payload = {}) {
    const url = apiUrl();
    const user = session();
    if (!url) return { ok: false, error: "Falta configurar appsScriptUrl." };
    const response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, email: user?.email || user?.username || "", ...payload })
    });
    return response.json();
  }

  function addStyle() {
    if ($("#usuarios-admin-style")) return;
    const style = document.createElement("style");
    style.id = "usuarios-admin-style";
    style.textContent = `
      .user-admin-card{border-left-color:#0ea5e9!important}.user-role-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.user-role-option{display:flex!important;align-items:center;gap:8px;padding:10px;border:1px solid #dfe8e4;border-radius:10px;background:#fbfdfc;font-weight:850;color:#24312d}.user-role-option input{width:auto!important;min-height:initial!important}.user-admin-status{display:grid;gap:8px}.user-admin-table-wrap{overflow:auto;border:1px solid #dfe8e4;border-radius:10px}.user-admin-table{width:100%;border-collapse:collapse}.user-admin-table th,.user-admin-table td{padding:8px;border-bottom:1px solid #e5ebe8;text-align:left;vertical-align:top}.user-admin-table th{background:#f6f8f7;color:#44504b;text-transform:uppercase;font-size:.78rem}.role-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef7f5;color:#0b4f49;font-weight:850;font-size:.78rem;margin:2px}.user-admin-help{padding:10px;border-radius:10px;background:#f0f9ff;color:#075985;border:1px solid #bae6fd;font-weight:750;line-height:1.35}
    `;
    document.head.append(style);
  }

  function rolesFromForm(form) {
    const jefe = form.querySelector('[name="rol_jefe"]')?.checked;
    const admin = form.querySelector('[name="rol_admin"]')?.checked;
    if (admin) return "admin";
    if (jefe) return "jefatura";
    return "equipo";
  }

  function roleLabel(role) {
    const value = clean(role);
    if (value === "admin") return "Administrador";
    if (value === "jefatura" || value === "jefe") return "Jefe";
    if (value === "jefe_turno") return "Jefe de turno";
    if (value === "equipo") return "Equipo";
    return role || "Equipo";
  }

  function userAdminCard() {
    return `<article class="admin-card user-admin-card" data-user-admin-card="true"><h3>Administrador de usuarios</h3><p>Agrega correos autorizados para entrar como jefe, administrador o ambos. Si marcas administrador, tendrá acceso completo de administración.</p><div class="user-admin-help">Recomendación: para jefes de urgencia usa <strong>Jefe</strong>. Para ti o quien mantenga la app usa <strong>Administrador</strong>.</div><form data-user-admin-form><label>Correo Gmail / Workspace<input name="email" type="email" required placeholder="correo@hospital.cl"></label><label>Nombre<input name="nombre" required placeholder="Dr./Dra. Nombre Apellido"></label><div class="user-role-grid"><label class="user-role-option"><input name="rol_jefe" type="checkbox" checked> Rol jefe</label><label class="user-role-option"><input name="rol_admin" type="checkbox"> Rol administrador</label><label class="user-role-option"><input name="puede_editar" type="checkbox" checked> Puede editar</label></div><button class="document-button" type="submit">Agregar / actualizar usuario</button></form><div class="gestion-actions"><button class="document-button" type="button" data-user-admin-refresh>Actualizar lista</button></div><div class="user-admin-status" data-user-admin-status></div></article>`;
  }

  function replaceOldUserPanel() {
    addStyle();
    if (location.hash !== "#/jefatura") return;
    if (!hasChiefRole()) return;
    const content = $("#chiefContent");
    if (!content || content.querySelector("[data-user-admin-card]")) return;

    const oldCards = $$(".admin-card", content).filter((card) => clean(card.textContent).includes("usuarios crs hph 2025"));
    if (oldCards.length) {
      oldCards[0].outerHTML = userAdminCard();
    } else {
      const grid = content.querySelector(".gestion-grid") || content;
      grid.insertAdjacentHTML("beforeend", userAdminCard());
    }
  }

  function renderUsers(users = []) {
    const box = $("[data-user-admin-status]");
    if (!box) return;
    if (!users.length) {
      box.innerHTML = `<div class="user-admin-help">No hay usuarios recibidos desde el backend.</div>`;
      return;
    }
    box.innerHTML = `<div class="user-admin-table-wrap"><table class="user-admin-table"><thead><tr><th>Correo</th><th>Nombre</th><th>Rol</th><th>Activo</th><th>Edita</th><th></th></tr></thead><tbody>${users.map((user) => `<tr><td>${esc(user.email)}</td><td>${esc(user.nombre)}</td><td><span class="role-pill">${esc(roleLabel(user.rol))}</span></td><td>${esc(user.activo)}</td><td>${esc(user.puede_editar)}</td><td>${clean(user.activo) === "si" ? `<button class="delete-button" type="button" data-user-admin-disable="${esc(user.email)}">Desactivar</button>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
  }

  async function refreshUsers() {
    const box = $("[data-user-admin-status]");
    if (box) box.innerHTML = `<div class="user-admin-help">Consultando usuarios...</div>`;
    const result = await apiPost("listUsers");
    if (!result.ok) {
      if (box) box.innerHTML = `<div class="note danger">${esc(result.error || "No se pudo listar usuarios")}</div>`;
      return;
    }
    renderUsers(result.users || []);
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-user-admin-form]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const roles = rolesFromForm(form);
    const canEdit = form.querySelector('[name="puede_editar"]')?.checked ? "SI" : "NO";
    const result = await apiPost("createUser", {
      user: {
        email: data.get("email"),
        nombre: data.get("nombre"),
        rol: roles,
        activo: "SI",
        puede_editar: canEdit
      }
    });
    if (!result.ok) {
      alert(result.error || "No se pudo guardar el usuario.");
      return;
    }
    alert("Usuario guardado.");
    form.reset();
    form.querySelector('[name="rol_jefe"]').checked = true;
    form.querySelector('[name="puede_editar"]').checked = true;
    refreshUsers();
  }, true);

  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-user-admin-refresh]")) {
      refreshUsers();
      return;
    }
    const disable = event.target.closest("[data-user-admin-disable]");
    if (disable) {
      if (!confirm("¿Desactivar este usuario?")) return;
      const result = await apiPost("disableUser", { targetEmail: disable.dataset.userAdminDisable });
      if (!result.ok) alert(result.error || "No se pudo desactivar.");
      refreshUsers();
    }
  }, true);

  function route() {
    setTimeout(replaceOldUserPanel, 80);
    setTimeout(replaceOldUserPanel, 350);
  }

  const observer = new MutationObserver(() => {
    if (location.hash === "#/jefatura") route();
  });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", route);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route); else route();
})();
