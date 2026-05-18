(() => {
  const config = window.CRS_GOOGLE_AUTH_CONFIG || {};
  if (!config.enabled) return;

  const GOOGLE_SESSION_KEY = config.sessionKey || "crsGoogleSessionV1";
  const LOCAL_SESSION_KEY = config.localSessionBridgeKey || "crsAuthSessionV3";
  const allowedEmails = new Set((config.allowedEmails || []).map((email) => String(email).trim().toLowerCase()));
  const adminEmails = new Set((config.adminEmails || []).map((email) => String(email).trim().toLowerCase()));

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const read = (key, fallback) => {
    try { return JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || "") || fallback; }
    catch { return fallback; }
  };

  function normalizedRole(profile, email) {
    const backendRole = String(profile.role || profile.rol || "").trim().toLowerCase();
    if (backendRole) return backendRole;
    if (adminEmails.has(email)) return "desarrollador";
    return "equipo";
  }

  function writeSession(profile) {
    const email = String(profile.email || "").trim().toLowerCase();
    const role = normalizedRole(profile, email);
    const localSession = {
      username: email,
      email,
      name: profile.name || profile.nombre || email,
      picture: profile.picture || "",
      role,
      canEdit: profile.canEdit ?? profile.puede_editar ?? false,
      status: "active",
      provider: "google",
      loginAt: new Date().toISOString()
    };
    sessionStorage.setItem(GOOGLE_SESSION_KEY, JSON.stringify(localSession));
    sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
    return localSession;
  }

  function clearSession() {
    sessionStorage.removeItem(GOOGLE_SESSION_KEY);
    sessionStorage.removeItem(LOCAL_SESSION_KEY);
  }

  function hasGoogleSession() {
    return Boolean(read(GOOGLE_SESSION_KEY, null));
  }

  function parseJwt(token) {
    try {
      const payload = token.split(".")[1];
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }

  function addGoogleAccountUrl() {
    return `https://accounts.google.com/AddSession?continue=${encodeURIComponent(location.href)}`;
  }

  function loginHelpHtml() {
    return `<div data-google-login-help class="stable-note" style="margin-top:10px;line-height:1.35"><strong>¿No aparece el correo que quieres usar?</strong><br>Google solo muestra las cuentas abiertas en este navegador. Si quieres entrar con otro jefe, primero agrega o selecciona esa cuenta Google.<br><button class="document-button" type="button" data-google-add-account style="margin-top:8px">Usar otra cuenta Google</button></div>`;
  }

  async function verifyWithAppsScript(email, credentialPayload = {}) {
    const scriptUrl = String(config.appsScriptUrl || "").trim();
    if (!scriptUrl) {
      return {
        ok: allowedEmails.has(email),
        email,
        name: credentialPayload.name || email,
        picture: credentialPayload.picture || "",
        role: adminEmails.has(email) ? "desarrollador" : "equipo",
        source: "local-allowlist"
      };
    }
    const response = await fetch(scriptUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "login", email, profile: credentialPayload, app: "crs-hph-2025" })
    });
    const result = await response.json();
    return result;
  }

  async function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    const status = $("[data-google-auth-status]");
    if (!payload?.email) {
      if (status) status.textContent = "No se pudo leer el correo de Google.";
      return;
    }
    const email = String(payload.email).trim().toLowerCase();
    try {
      const result = await verifyWithAppsScript(email, payload);
      if (!result.ok) {
        clearSession();
        if (status) status.textContent = `Correo no autorizado: ${email}`;
        return;
      }
      const stored = writeSession({ ...payload, ...result, email });
      if (status) status.textContent = `Sesión Google iniciada: ${email} · rol: ${stored.role}`;
      setTimeout(() => { location.hash = "#/jefatura"; location.reload(); }, 350);
    } catch (error) {
      if (status) status.textContent = "Error validando con Google/Apps Script.";
    }
  }

  function initGoogleButton() {
    const target = $("#googleSignInButton");
    if (!target || target.dataset.googleReady === "true") return;
    target.dataset.googleReady = "true";
    if (!config.googleClientId) {
      target.innerHTML = `<div class="stable-note"><strong>Google Auth preparado.</strong><br>Falta pegar el Google Client ID o el Apps Script URL en <code>google-auth-config.js</code>.</div>${loginHelpHtml()}`;
      return;
    }
    if (!window.google?.accounts?.id) {
      target.innerHTML = `<button class="document-button" type="button" data-google-retry>Reintentar carga Google</button>${loginHelpHtml()}`;
      return;
    }
    window.google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: false
    });
    window.google.accounts.id.renderButton(target, { theme: "outline", size: "large", text: "signin_with", shape: "pill" });
    if (!target.querySelector("[data-google-login-help]")) target.insertAdjacentHTML("beforeend", loginHelpHtml());
  }

  function injectAuthBox() {
    if (!location.hash.startsWith("#/jefatura") && !location.hash.startsWith("#/gestion")) return;
    const panel = location.hash.startsWith("#/jefatura") ? $("#chiefContent .document-panel") : $("#managementContent .stable-shell");
    if (!panel || panel.querySelector("[data-google-auth-box]")) return;
    const session = read(GOOGLE_SESSION_KEY, null);
    const box = document.createElement("section");
    box.className = "stable-card blue";
    box.dataset.googleAuthBox = "true";
    box.innerHTML = session ? `<strong>Cuenta Google conectada</strong><span>${esc(session.email)} · ${esc(session.role)}</span><button class="document-button" type="button" data-google-logout>Cerrar sesión Google</button>` : `<strong>Ingreso con Google</strong><span>Autorizado por backend Google. Agregar usuarios en Jefatura no los hace aparecer automáticamente en este navegador; cada jefe debe tener su cuenta Google abierta o agregarla.</span><div id="googleSignInButton"></div><div data-google-auth-status class="stable-note"></div>`;
    panel.prepend(box);
    setTimeout(initGoogleButton, 80);
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-google-logout]")) {
      clearSession();
      if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
      location.hash = "#/gestion";
      location.reload();
    }
    if (event.target.closest("[data-google-retry]")) initGoogleButton();
    if (event.target.closest("[data-google-add-account]")) {
      clearSession();
      if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
      location.href = addGoogleAccountUrl();
    }
  }, true);

  window.CRS_GOOGLE_AUTH = {
    hasGoogleSession,
    writeSession,
    clearSession,
    initGoogleButton,
    injectAuthBox
  };

  const scriptId = "google-identity-services";
  if (config.googleClientId && !document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setTimeout(initGoogleButton, 100);
    document.head.append(script);
  }

  window.addEventListener("hashchange", () => { setTimeout(injectAuthBox, 200); setTimeout(initGoogleButton, 350); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { setTimeout(injectAuthBox, 350); });
  else setTimeout(injectAuthBox, 350);
})();
