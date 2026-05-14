(() => {
  const USERS_KEY = "crsChiefUsersV2";
  const SESSION_KEY = "crsChiefSessionV2";
  const ADMIN_ALIASES = {
    desarrollador: ["desarrollador", "carlos", "carlosherrera", "drcarlosherrera", "carlosh", "drherrera"],
    guti: ["guti", "pablo", "pablogutierrez", "drpablogutierrez", "gutierrez"],
    cote: ["cote", "mariajose", "mariajosemarin", "dramariajosemarin", "marin", "maria-jose", "maria-josemarin"]
  };
  const ADMIN_NAMES = {
    desarrollador: "Dr Carlos Herrera",
    guti: "Dr Pablo Gutierrez",
    cote: "Dra Maria-Jose Marin"
  };

  const clean = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const readUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") || [];
    } catch (error) {
      return [];
    }
  };

  async function passwordHash(username, password) {
    const text = `${String(username || "").trim().toLowerCase().replace(/\s+/g, "")}::${String(password || "")}`;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      const bytes = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, "0")).join("");
    }
    return btoa(unescape(encodeURIComponent(text)));
  }

  function adminKeyFromInput(value) {
    const normalized = clean(value);
    return Object.keys(ADMIN_ALIASES).find((key) => ADMIN_ALIASES[key].some((alias) => clean(alias) === normalized)) || normalized;
  }

  function findUserByAlias(value) {
    const users = readUsers();
    const key = adminKeyFromInput(value);
    return users.find((user) => clean(user.username) === clean(key))
      || users.find((user) => clean(user.name) === clean(value))
      || users.find((user) => Object.entries(ADMIN_ALIASES).some(([adminKey, aliases]) => clean(user.username) === clean(adminKey) && aliases.some((alias) => clean(alias) === clean(value))));
  }

  function saveSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      username: user.username,
      name: user.name || ADMIN_NAMES[user.username] || user.username,
      role: user.role || (user.username === "desarrollador" ? "desarrollador" : "owner")
    }));
  }

  function addStyle() {
    if (document.querySelector("#jefatura-presentacion-login-style")) return;
    const style = document.createElement("style");
    style.id = "jefatura-presentacion-login-style";
    style.textContent = `
      #chiefContent{display:grid;gap:16px}.chief-auth-panel,.chief-dashboard{position:relative;overflow:hidden;border:0;background:linear-gradient(135deg,#0f172a,#0f766e 58%,#155e75);color:#fff;box-shadow:0 18px 46px rgba(15,23,42,.22)}
      .chief-auth-panel:before,.chief-dashboard:before{content:"";position:absolute;inset:auto -70px -110px auto;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.12)}
      .chief-auth-panel h2,.chief-dashboard h2{font-size:clamp(1.8rem,4vw,3rem);line-height:1.02;margin:0 0 8px}.chief-auth-panel p,.chief-dashboard p{color:#dff7f2}.chief-auth-panel form,.chief-dashboard .law-actions{position:relative;z-index:1}
      .chief-form{background:rgba(255,255,255,.94);border:1px solid rgba(255,255,255,.28);border-radius:12px;padding:14px;box-shadow:0 10px 28px rgba(15,23,42,.16)}
      .chief-form label{color:#24312d}.chief-form input,.chief-form select{background:#fff}.chief-auth-intro{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:0 0 6px}.chief-auth-intro div{padding:12px;border-radius:12px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.chief-auth-intro strong{display:block;color:#fff}.chief-auth-intro span{display:block;color:#dff7f2;font-size:.92rem;line-height:1.35}.document-panel[data-operational-admin-panel]{border-top:5px solid #0f766e;box-shadow:0 14px 34px rgba(15,23,42,.1)}
    `;
    document.head.append(style);
  }

  function decoratePanel() {
    if (!location.hash.startsWith("#/jefatura")) return;
    addStyle();
    const auth = document.querySelector(".chief-auth-panel");
    if (auth && !auth.querySelector(".chief-auth-intro")) {
      const intro = document.createElement("div");
      intro.className = "chief-auth-intro";
      intro.innerHTML = `
        <div><strong>Dr Carlos Herrera</strong><span>Desarrollador y administracion completa.</span></div>
        <div><strong>Dr Pablo Gutierrez</strong><span>Jefe de urgencia, permisos y planillas.</span></div>
        <div><strong>Dra Maria-Jose Marin</strong><span>Jefa de urgencia, permisos y planillas.</span></div>
      `;
      const message = auth.querySelector("[data-chief-message]");
      auth.insertBefore(intro, message || auth.firstChild.nextSibling);
    }
    const title = document.querySelector("#chiefTitle");
    if (title) title.textContent = "Panel restringido Jefatura";
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-chief-login]");
    if (!form) return;
    const data = new FormData(form);
    const typedUser = data.get("username");
    const typedPassword = data.get("password");
    const user = findUserByAlias(typedUser);
    if (!user || !user.hash) return;
    const hash = await passwordHash(user.username, typedPassword);
    if (hash !== user.hash) return;
    event.preventDefault();
    saveSession(user);
    location.hash = "#/jefatura";
    setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 30);
  }, true);

  addEventListener("hashchange", () => {
    setTimeout(decoratePanel, 120);
    setTimeout(decoratePanel, 500);
  });
  setTimeout(decoratePanel, 150);
  setInterval(decoratePanel, 1500);
})();