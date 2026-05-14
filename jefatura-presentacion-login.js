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
      #managementPage .page-head{align-items:end;border-bottom:1px solid rgba(15,23,42,.08);padding-bottom:14px}#managementPage .page-head .eyebrow{color:#0f766e;font-weight:900;letter-spacing:.02em}#managementTitle{font-size:clamp(2rem,5vw,3.4rem);line-height:1;margin:0;color:#10201c}
      .management-v2-home{position:relative;overflow:hidden;border:0;background:linear-gradient(135deg,#0f172a 0%,#14532d 48%,#0f766e 100%);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.24);padding:clamp(20px,4vw,34px)}.management-v2-home:before{content:"";position:absolute;right:-85px;bottom:-115px;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,.12)}.management-v2-home:after{content:"";position:absolute;right:42px;top:28px;width:82px;height:82px;border-radius:22px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);transform:rotate(8deg)}
      .management-v2-home h2{font-size:clamp(2rem,5vw,3.7rem);line-height:.98;margin:0 0 8px;color:#fff;max-width:720px}.management-v2-home p{max-width:720px;color:#def7ef;font-size:1.03rem;line-height:1.5;margin:0 0 18px}.management-v2-home .law-actions{position:relative;z-index:1;gap:10px;margin:10px 0 18px}.management-v2-home .document-button{background:#fff;color:#0f513f;border-color:#fff;box-shadow:0 8px 20px rgba(15,23,42,.14)}.management-v2-home .document-button:first-child{background:#f59e0b;border-color:#f59e0b;color:#1f1300}
      .management-v2-home .rule-fields{position:relative;z-index:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:12px}.management-v2-home .rule-field{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:13px;color:#fff}.management-v2-home .rule-field strong{display:block;color:#fff;font-size:.86rem;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}.management-v2-home .rule-field span{color:#e8fff8;font-weight:800}
      .gestion-overview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px}.gestion-overview-card{display:grid;gap:8px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.08)}.gestion-overview-card strong{font-size:1.08rem;color:#10201c}.gestion-overview-card span{color:#52615c;line-height:1.4}.gestion-overview-card.amber{border-left-color:#f59e0b}.gestion-overview-card.blue{border-left-color:#2563eb}
      @media(max-width:680px){.management-v2-home{padding:20px}.management-v2-home .law-actions{display:grid}.management-v2-home .document-button{width:100%;justify-content:center}}
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

  function decorateManagement() {
    if (!location.hash.startsWith("#/gestion")) return;
    addStyle();
    const content = document.querySelector("#managementContent");
    const hero = content?.querySelector(".management-v2-home");
    if (!content || !hero || content.querySelector(".gestion-overview-grid")) return;
    const grid = document.createElement("section");
    grid.className = "gestion-overview-grid";
    grid.innerHTML = `
      <article class="gestion-overview-card"><strong>Casos priorizados</strong><span>Los casos registrados desde los flujos quedan listos para revisión y exportación por jefatura.</span></article>
      <article class="gestion-overview-card amber"><strong>Planillas operativas</strong><span>Jefatura mantiene los enlaces de especialistas de llamado, UHD y visita diaria.</span></article>
      <article class="gestion-overview-card blue"><strong>Accesos por rol</strong><span>Administradores gestionan permisos; jefes de turno y subrogantes usan la app sin editar el panel restringido.</span></article>
    `;
    hero.insertAdjacentElement("afterend", grid);
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

  function decorate() {
    decoratePanel();
    decorateManagement();
  }

  addEventListener("hashchange", () => {
    setTimeout(decorate, 120);
    setTimeout(decorate, 500);
  });
  setTimeout(decorate, 150);
  setInterval(decorate, 1500);
})();