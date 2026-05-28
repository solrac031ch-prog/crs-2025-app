(() => {
  const cfg = window.CRS_SUPABASE_CONFIG || {};

  function adminUsersFunctionName() {
    return String(cfg.adminUsersFunction || "crs-admin-users").trim();
  }

  function client() {
    return window.CRS_SUPABASE?.client?.() || null;
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

  async function invokeAdminUsers(action, payload = {}) {
    const api = client();
    if (!api) throw new Error("Supabase no esta conectado.");
    const { data: sessionData } = await api.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("Vuelve a iniciar sesion Supabase para administrar usuarios.");
    const { data, error } = await api.functions.invoke(adminUsersFunctionName(), {
      body: { action, ...payload },
      headers: { Authorization: `Bearer ${token}` }
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data.error || "No se pudo administrar el usuario.");
    return data || {};
  }

  document.addEventListener("submit", async (ev) => {
    const form = ev.target;
    if (!form?.matches?.("[data-backend-user]")) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const formData = new FormData(form);
    try {
      const result = await invokeAdminUsers("upsertUser", {
        email: String(formData.get("email") || "").trim().toLowerCase(),
        displayName: String(formData.get("nombre") || "").trim(),
        role: String(formData.get("rol") || "jefatura").trim(),
        password: String(formData.get("password") || "").trim()
      });
      form.reset();
      const suffix = result.temporaryPassword ? ` Clave temporal: ${result.temporaryPassword}` : "";
      toast(`Usuario listo en Supabase Authentication y permisos CRS.${suffix}`);
      window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(80);
    } catch (error) {
      console.error(error);
      toast(error?.message || String(error), true);
    }
  }, true);

  document.addEventListener("click", async (ev) => {
    const button = ev.target.closest("[data-sb-delete-user]");
    if (!button) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const email = button.dataset.sbDeleteUser;
    if (!confirm(`Eliminar usuario ${email}?`)) return;
    try {
      await invokeAdminUsers("deleteUser", { email });
      toast("Usuario eliminado de Supabase Authentication y permisos CRS.");
      window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(80);
    } catch (error) {
      console.error(error);
      toast(error?.message || String(error), true);
    }
  }, true);
})();
