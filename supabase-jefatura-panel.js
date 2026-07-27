(() => {
  const clean = (value) => String(value || "").trim();
  const norm = (value) => clean(value).toLowerCase();

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

  function friendlyError(error) {
    const msg = String(error?.message || error || "Error desconocido");
    if (/crs_login_email|function|schema cache/i.test(msg)) return "Si usaste usuario, prueba con tu correo. Falta ejecutar el SQL actualizado para resolver usuarios.";
    return msg;
  }

  async function resolveLoginEmail(loginValue) {
    const api = client();
    const value = clean(loginValue);
    if (!value) throw new Error("Escribe tu correo o usuario primero.");
    if (value.includes("@")) return norm(value);
    const { data, error } = await api.rpc("crs_login_email", { login_text: value });
    if (error) throw error;
    if (!data) throw new Error("No encontre ese usuario activo.");
    return norm(data);
  }

  async function sendForgotPassword(loginValue) {
    const api = client();
    if (!api) throw new Error("Supabase no esta conectado.");
    const email = await resolveLoginEmail(loginValue);
    const { error } = await api.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}${location.pathname}#/jefatura`
    });
    if (error) throw error;
    toast("Te envie un correo para cambiar la clave. Revisa tambien spam o correo no deseado.");
  }

  function enhanceForgotPassword() {
    const form = document.querySelector("[data-crs-login]");
    if (!form || form.dataset.forgotReady === "true") return;
    form.dataset.forgotReady = "true";
    const button = document.createElement("button");
    button.className = "document-button";
    button.type = "button";
    button.dataset.crsForgotPassword = "true";
    button.textContent = "Olvide mi clave";
    form.append(button);
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest?.("[data-crs-forgot-password]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = button.closest("form");
    try {
      await sendForgotPassword(form?.querySelector("[name='login']")?.value || "");
    } catch (error) {
      console.error(error);
      toast(friendlyError(error), true);
    }
  }, true);

  const observer = new MutationObserver(enhanceForgotPassword);

  function boot() {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    enhanceForgotPassword();
  }

  window.CRS_SUPABASE_JEFATURA_LEGACY_DISABLED = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();