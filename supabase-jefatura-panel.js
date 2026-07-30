(() => {
  const clean = (value) => String(value || "").trim();
  const norm = (value) => clean(value).toLowerCase();
  let recoveryActive = false;
  let authSubscription = null;

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
    if (/crs_login_email|function|schema cache/i.test(msg)) return "Si usaste usuario, prueba con tu correo. La resolución por nombre de usuario aún no está desplegada en Supabase.";
    if (/expired|otp.*expired|token.*expired/i.test(msg)) return "El enlace de recuperación venció. Solicita uno nuevo desde Jefatura.";
    if (/same password|different from the old password/i.test(msg)) return "La nueva clave debe ser distinta de la anterior.";
    if (/password/i.test(msg) && /short|weak|least/i.test(msg)) return "La nueva clave debe tener al menos 6 caracteres.";
    return msg;
  }

  async function resolveLoginEmail(loginValue) {
    const api = client();
    const value = clean(loginValue);
    if (!value) throw new Error("Escribe tu correo o usuario primero.");
    if (value.includes("@")) return norm(value);
    const { data, error } = await api.rpc("crs_login_email", { login_text: value });
    if (error) throw error;
    if (!data) throw new Error("No encontré ese usuario activo.");
    return norm(data);
  }

  async function sendForgotPassword(loginValue) {
    const api = client();
    if (!api) throw new Error("Supabase no está conectado.");
    const email = await resolveLoginEmail(loginValue);
    const redirectTo = `${location.origin}${location.pathname}`;
    const { error } = await api.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    toast("Te envié un correo para cambiar la clave. Abre el enlace más reciente y vuelve a CRS.");
  }

  function showRecoveryForm() {
    recoveryActive = true;
    const existing = document.querySelector("[data-crs-password-recovery]");
    if (existing) return;
    const overlay = document.createElement("div");
    overlay.className = "crs-recovery-overlay";
    overlay.dataset.crsPasswordRecovery = "true";
    overlay.innerHTML = `
      <form class="crs-recovery-card" data-crs-recovery-form>
        <h2>Crear nueva clave</h2>
        <p>El enlace de recuperación fue validado. Escribe una nueva contraseña para tu cuenta de Jefatura.</p>
        <label>Nueva clave<input name="password" type="password" minlength="6" required autocomplete="new-password"></label>
        <label>Confirmar nueva clave<input name="confirmPassword" type="password" minlength="6" required autocomplete="new-password"></label>
        <div class="crs-recovery-actions">
          <button class="document-button" type="submit">Guardar nueva clave</button>
          <button class="delete-button" type="button" data-crs-recovery-cancel>Cancelar</button>
        </div>
      </form>`;
    document.body.append(overlay);
    overlay.querySelector("input")?.focus();
  }

  function closeRecoveryForm() {
    document.querySelector("[data-crs-password-recovery]")?.remove();
    recoveryActive = false;
  }

  function goToJefatura() {
    const next = `${location.pathname}#/jefatura`;
    history.replaceState(null, "", next);
    window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(0);
  }

  async function updateRecoveredPassword(form) {
    const api = client();
    if (!api) throw new Error("Supabase no está conectado.");
    const data = new FormData(form);
    const password = String(data.get("password") || "");
    const confirmation = String(data.get("confirmPassword") || "");
    if (password.length < 6) throw new Error("La nueva clave debe tener al menos 6 caracteres.");
    if (password !== confirmation) throw new Error("Las dos claves no coinciden.");
    const { error } = await api.auth.updateUser({ password });
    if (error) throw error;
    closeRecoveryForm();
    toast("Clave actualizada correctamente. Ya puedes usar Jefatura.");
    goToJefatura();
  }

  function enhanceForgotPassword() {
    const form = document.querySelector("[data-crs-login]");
    if (!form || form.dataset.forgotReady === "true") return;
    form.dataset.forgotReady = "true";
    const button = document.createElement("button");
    button.className = "document-button";
    button.type = "button";
    button.dataset.crsForgotPassword = "true";
    button.textContent = "Olvidé mi clave";
    form.append(button);
  }

  function showUrlAuthError() {
    const params = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
    const description = params.get("error_description");
    if (description) toast(friendlyError(description.replaceAll("+", " ")), true);
  }

  function listenForRecovery() {
    const api = client();
    if (!api || authSubscription) return;
    const { data } = api.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setTimeout(showRecoveryForm, 0);
    });
    authSubscription = data?.subscription || true;
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest?.("[data-crs-recovery-form]");
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      await updateRecoveredPassword(form);
    } catch (error) {
      console.error(error);
      toast(friendlyError(error), true);
    }
  }, true);

  document.addEventListener("click", async (event) => {
    const forgot = event.target.closest?.("[data-crs-forgot-password]");
    const cancel = event.target.closest?.("[data-crs-recovery-cancel]");
    if (!forgot && !cancel) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (forgot) {
        const form = forgot.closest("form");
        await sendForgotPassword(form?.querySelector("[name='login']")?.value || "");
      }
      if (cancel) {
        if (recoveryActive) await client()?.auth?.signOut?.();
        closeRecoveryForm();
        goToJefatura();
      }
    } catch (error) {
      console.error(error);
      toast(friendlyError(error), true);
    }
  }, true);

  const observer = new MutationObserver(() => enhanceForgotPassword());

  function boot() {
    const content = document.querySelector("#chiefContent");
    if (content) observer.observe(content, { childList: true, subtree: true });
    listenForRecovery();
    showUrlAuthError();
    enhanceForgotPassword();
  }

  window.addEventListener("hashchange", () => setTimeout(enhanceForgotPassword, 20));
  window.addEventListener("crs:supabase-ready", () => {
    listenForRecovery();
    setTimeout(enhanceForgotPassword, 20);
  });

  window.CRS_SUPABASE_JEFATURA_LEGACY_DISABLED = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();