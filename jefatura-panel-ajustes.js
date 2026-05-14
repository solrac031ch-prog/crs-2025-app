(() => {
  const USERS_KEY = "crsChiefUsersV2";
  const LINKS_KEY = "crsOperationalLinksV2";
  const ADMIN_USERS = {
    desarrollador: "Dr Carlos Herrera - desarrollador",
    guti: "Dr Pablo Gutierrez - jefe de urgencia",
    cote: "Dra Maria-Jose Marin - jefa de urgencia"
  };

  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch (error) {
      return fallback;
    }
  };
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const cleanUser = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function activeSession() {
    return readJson("crsChiefSessionV2", null);
  }

  function isAdmin(session = activeSession()) {
    if (!session) return false;
    return ["owner", "desarrollador"].includes(session.role) || hasOwn(ADMIN_USERS, cleanUser(session.username));
  }

  function operationalLinks() {
    return readJson(LINKS_KEY, { llamadosUhd: "", visitaDiaria: "" });
  }

  function applyOperationalLinks() {
    const links = operationalLinks();
    try {
      if (typeof externalDocs !== "undefined") {
        if (links.llamadosUhd) {
          externalDocs.llamadosUrl = links.llamadosUhd;
          externalDocs.uhdDisponibilidadUrl = links.llamadosUhd;
        }
        if (links.visitaDiaria) externalDocs.visitaDiariaUrl = links.visitaDiaria;
      }
    } catch (error) {}
  }

  function patchBootstrapLabels() {
    const select = document.querySelector('[data-chief-bootstrap] select[name="username"]');
    if (!select) return;
    Array.from(select.options).forEach((option) => {
      const label = ADMIN_USERS[cleanUser(option.value)];
      if (label) option.textContent = label;
    });
  }

  function insertAdminPanel() {
    if (!location.hash.startsWith("#/jefatura")) return;
    const session = activeSession();
    if (!isAdmin(session)) return;
    const dashboard = document.querySelector(".chief-export-panel");
    if (!dashboard || document.querySelector("[data-operational-admin-panel]")) return;

    const links = operationalLinks();
    const users = readJson(USERS_KEY, []);
    const panel = document.createElement("section");
    panel.className = "document-panel";
    panel.dataset.operationalAdminPanel = "true";
    panel.innerHTML = `
      <h2>Panel restringido</h2>
      <p>Administracion completa para jefatura de urgencia y desarrollador. Los jefes de turno/subrogantes pueden usar la app, pero no administrar este panel.</p>
      <form class="law-search-form chief-form" data-operational-links-form>
        <label>Especialistas de llamado y UHD
          <input name="llamadosUhd" type="url" value="${escapeHtml(links.llamadosUhd)}" placeholder="https://docs.google.com/spreadsheets/...">
        </label>
        <label>Visita diaria
          <input name="visitaDiaria" type="url" value="${escapeHtml(links.visitaDiaria)}" placeholder="https://docs.google.com/spreadsheets/...">
        </label>
        <button class="document-button" type="submit">Guardar planillas</button>
      </form>
      <div class="rule-fields">
        <div class="rule-field"><strong>Administrador</strong><span>Dr Carlos Herrera - desarrollador</span></div>
        <div class="rule-field"><strong>Jefatura</strong><span>Dr Pablo Gutierrez y Dra Maria-Jose Marin</span></div>
        <div class="rule-field"><strong>Jefes de turno/subrogantes</strong><span>Acceso operativo sin administracion del panel restringido.</span></div>
      </div>
      <h2>Eliminar usuarios</h2>
      <div class="rule-fields">
        ${users.map((user) => {
          const username = cleanUser(user.username);
          const locked = hasOwn(ADMIN_USERS, username);
          return `<div class="rule-field"><strong>${escapeHtml(user.name || ADMIN_USERS[username] || user.username)}</strong><span>${escapeHtml(user.username)} · ${escapeHtml(user.role || "jefe")}</span>${locked ? "" : `<button class="document-button" type="button" data-chief-remove-user="${escapeHtml(user.username)}">Eliminar</button>`}</div>`;
        }).join("") || `<div class="rule-field"><strong>Sin usuarios</strong><span>Aun no hay usuarios registrados.</span></div>`}
      </div>
    `;
    dashboard.parentNode.insertBefore(panel, dashboard);
  }

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-operational-links-form]");
    if (!form) return;
    event.preventDefault();
    if (!isAdmin()) return;
    const data = new FormData(form);
    writeJson(LINKS_KEY, {
      llamadosUhd: String(data.get("llamadosUhd") || "").trim(),
      visitaDiaria: String(data.get("visitaDiaria") || "").trim(),
      updatedAt: new Date().toISOString()
    });
    applyOperationalLinks();
    const note = document.createElement("p");
    note.className = "priority-status";
    note.textContent = "Planillas guardadas para este navegador.";
    form.append(note);
  }, true);

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chief-remove-user]");
    if (!button || !isAdmin()) return;
    const username = cleanUser(button.dataset.chiefRemoveUser);
    if (hasOwn(ADMIN_USERS, username)) return;
    const next = readJson(USERS_KEY, []).filter((user) => cleanUser(user.username) !== username);
    writeJson(USERS_KEY, next);
    const panel = document.querySelector("[data-operational-admin-panel]");
    if (panel) panel.remove();
    setTimeout(insertAdminPanel, 80);
  }, true);

  function apply() {
    applyOperationalLinks();
    patchBootstrapLabels();
    insertAdminPanel();
  }

  addEventListener("hashchange", () => {
    setTimeout(apply, 120);
    setTimeout(apply, 500);
  });
  setTimeout(apply, 120);
  setInterval(apply, 1500);
})();