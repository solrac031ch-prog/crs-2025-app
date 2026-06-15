(() => {
  const clean = (value) => String(value || "").trim();
  const norm = (value) => clean(value).toLowerCase();
  let timer = 0;

  function api() {
    return window.CRS_SUPABASE?.client?.() || null;
  }

  function toast(message, isError = false) {
    const old = document.querySelector(".sb-toast");
    if (old) old.remove();
    const box = document.createElement("div");
    box.className = `sb-toast${isError ? " error" : ""}`;
    box.style.cssText = "position:fixed;left:18px;right:18px;bottom:18px;z-index:9999;max-width:520px;margin:auto;padding:12px 14px;border-radius:12px;background:#0f172a;color:#fff;font-weight:800;box-shadow:0 16px 40px rgba(15,23,42,.25);text-align:center";
    if (isError) box.style.background = "#991b1b";
    box.textContent = message;
    document.body.append(box);
    setTimeout(() => box.remove(), 8000);
  }

  async function resolveEmail(value) {
    const client = api();
    const login = clean(value);
    if (!login) throw new Error("Escribe tu correo primero.");
    if (login.includes("@")) return norm(login);
    const { data, error } = await client.rpc("crs_login_email", { login_text: login });
    if (error) throw error;
    if (!data) throw new Error("No encontre ese usuario. Prueba escribiendo el correo completo.");
    return norm(data);
  }

  async function sendReset(login) {
    const client = api();
    if (!client) throw new Error("Supabase aun no esta cargado. Espera unos segundos y prueba otra vez.");
    const email = await resolveEmail(login);
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}${location.pathname}#/jefatura`
    });
    if (error) throw error;
    toast("Listo. Envie el correo para cambiar la clave. Revisa spam o no deseado.");
  }

  function recoveryHtml() {
    return `<article class="crs-reset-card" data-crs-reset-card style="display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0ea5e9;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08);margin-top:12px"><h3 style="margin:0;color:#10201c">Recuperar clave</h3><p style="margin:0;color:#52615c">Escribe tu correo y enviaremos un enlace para crear una clave nueva.</p><label style="display:grid;gap:5px;font-weight:850;color:#24312d">Correo<input name="resetEmail" type="email" autocomplete="email" placeholder="mdcarlosherrera@gmail.com" style="width:100%;min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c"></label><button class="document-button" type="button" data-crs-reset-send>Enviar correo de cambio de clave</button></article>`;
  }

  function ensureBlock() {
    if ((location.hash.split("?")[0] || "#/inicio") !== "#/jefatura") return;
    if (document.querySelector("[data-crs-reset-card]")) return;
    const loginForm = document.querySelector("[data-crs-login],[data-sb-login]");
    if (loginForm) {
      loginForm.insertAdjacentHTML("afterend", recoveryHtml());
      const loginInput = loginForm.querySelector("[name='login'],[name='email']");
      const resetInput = document.querySelector("[data-crs-reset-card] [name='resetEmail']");
      if (loginInput && resetInput && loginInput.value) resetInput.value = loginInput.value;
      return;
    }
    const chief = document.querySelector("#chiefContent");
    if (chief && !chief.querySelector("[data-crs-reset-card]")) chief.insertAdjacentHTML("afterbegin", recoveryHtml());
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest?.("[data-crs-reset-send]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const card = button.closest("[data-crs-reset-card]");
    const cardValue = card?.querySelector("[name='resetEmail']")?.value;
    const loginValue = document.querySelector("[data-crs-login] [name='login'],[data-sb-login] [name='email']")?.value;
    try {
      button.disabled = true;
      button.textContent = "Enviando...";
      await sendReset(cardValue || loginValue || "");
    } catch (error) {
      console.error(error);
      const msg = /crs_login_email|schema cache|function/i.test(String(error?.message || error))
        ? "Prueba escribiendo el correo completo. Si sigue fallando, falta ejecutar el SQL actualizado en Supabase."
        : (error?.message || String(error));
      toast(msg, true);
    } finally {
      button.disabled = false;
      button.textContent = "Enviar correo de cambio de clave";
    }
  }, true);

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(ensureBlock, 250);
    setTimeout(ensureBlock, 900);
    setTimeout(ensureBlock, 1800);
  }

  const observer = new MutationObserver(schedule);
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", schedule);
  window.addEventListener("crs:supabase-ready", schedule);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once: true });
  else schedule();
})();
