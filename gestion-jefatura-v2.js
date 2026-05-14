(() => {
  const USERS_KEY = "crsChiefUsersV2";
  const SESSION_KEY = "crsChiefSessionV2";
  const DRIVE_KEY = "crsChiefDriveSheetUrlV2";
  const AUTHORIZED_OWNERS = ["guti", "cote", "desarrollador"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const normalizeUser = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getUsers = () => readJson(USERS_KEY, []);
  const saveUsers = (users) => writeJson(USERS_KEY, users);
  const currentSession = () => readJson(SESSION_KEY, null);
  const setSession = (user) => sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, role: user.role, name: user.name }));
  const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

  async function passwordHash(username, password) {
    const value = `${normalizeUser(username)}::${String(password || "")}`;
    if (window.crypto?.subtle && window.TextEncoder) {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
      return Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, "0")).join("");
    }
    return btoa(unescape(encodeURIComponent(value)));
  }

  function activatePage(pageId) {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$("[data-route-link]").forEach((link) => {
      const route = pageId === "managementPage" ? "gestion" : pageId === "chiefPage" ? "jefatura" : "";
      link.classList.toggle("active", link.dataset.routeLink === route);
    });
  }

  function removeRestrictedLabels() {
    const normalize = (value) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const chiefHead = $("#chiefPage .page-head");
    if (chiefHead) chiefHead.style.display = "none";

    const managementTitle = $("#managementTitle");
    if (managementTitle) managementTitle.textContent = "Gestion";

    [".document-panel", ".form-card", ".tool-card", ".management-card"].forEach((selector) => {
      $$(selector).forEach((card) => {
        const text = normalize(card.textContent);
        if (text.includes("espacio jefatura") || text.includes("panel restringido")) {
          card.remove();
        }
      });
    });
  }

  function routeActions() {
    return `
      <div class="route-actions">
        <a class="back-link" href="#/gestion">Volver</a>
        <a class="back-link" href="#/inicio">Inicio</a>
      </div>
    `;
  }

  function renderManagementV2() {
    const page = $("#managementPage");
    const content = $("#managementContent");
    if (!page || !content) return;
    activatePage("managementPage");
    const title = $("#managementTitle");
    if (title) title.textContent = "Gestion";

    const totalCases = getPriorityCases().length;
    content.innerHTML = `
      <section class="law-hero-panel compact management-v2-home">
        <h2>Gestion</h2>
        <p>Registro local de casos que requieren seguimiento de jefatura.</p>
        <div class="law-actions">
          <a class="document-button" href="#/jefatura">Entrar a jefatura</a>
          <a class="document-button" href="#/especialidades">Ver flujos</a>
          <a class="document-button" href="#/inicio">Inicio</a>
        </div>
        <div class="rule-fields">
          <div class="rule-field"><strong>Casos guardados</strong><span>${totalCases}</span></div>
          <div class="rule-field"><strong>Almacenamiento</strong><span>Este dispositivo. Exportable a Excel, Word y PDF.</span></div>
        </div>
      </section>
    `;
    removeRestrictedLabels();
    window.scrollTo(0, 0);
  }

  function setMessage(text, kind = "ok") {
    const node = $("[data-chief-message]");
    if (!node) return;
    node.textContent = text;
    node.className = kind === "error" ? "rule-warning" : "priority-status";
  }

  function authPanel() {
    const hasUsers = getUsers().length > 0;
    const ownerOptions = AUTHORIZED_OWNERS.map((user) => `<option value="${user}">${user}</option>`).join("");
    return `
      <section class="law-hero-panel compact chief-auth-panel">
        <h2>Jefatura</h2>
        <p>Ingreso con usuario autorizado. Guti, Cote y el desarrollador pueden crear o habilitar claves.</p>
        <p data-chief-message aria-live="polite"></p>
        ${!hasUsers ? `
          <form class="law-search-form chief-form" data-chief-bootstrap>
            <label>Usuario autorizado
              <select name="username" required>${ownerOptions}</select>
            </label>
            <label>Nombre
              <input name="name" type="text" placeholder="Nombre visible" required>
            </label>
            <label>Crear clave
              <input name="password" type="password" minlength="4" required>
            </label>
            <button class="document-button" type="submit">Crear primer acceso</button>
          </form>
        ` : `
          <form class="law-search-form chief-form" data-chief-login>
            <label>Usuario
              <input name="username" type="text" autocomplete="username" required>
            </label>
            <label>Clave
              <input name="password" type="password" autocomplete="current-password" required>
            </label>
            <button class="document-button" type="submit">Ingresar</button>
          </form>
          <form class="law-search-form chief-form" data-chief-create-password>
            <label>Usuario autorizado
              <input name="username" type="text" required>
            </label>
            <label>Clave temporal entregada por jefatura
              <input name="temporaryPassword" type="password" required>
            </label>
            <label>Nueva clave
              <input name="password" type="password" minlength="4" required>
            </label>
            <button class="document-button" type="submit">Crear clave</button>
          </form>
        `}
      </section>
    `;
  }

  function dashboardPanel(session) {
    const cases = filterCases(getPeriodConfig());
    const users = getUsers();
    const canGrant = ["owner", "desarrollador"].includes(session.role);
    const driveUrl = localStorage.getItem(DRIVE_KEY) || "";
    const rows = cases.map((item) => `
      <tr>
        <td>${escapeHtml(formatDate(item.createdAt))}</td>
        <td>${escapeHtml(item.status || "Pendiente")}</td>
        <td>${escapeHtml(item.flow || item.protocol || "")}</td>
        <td>${escapeHtml(item.patientName || "")}<br>${escapeHtml(item.rut || "")}<br>${escapeHtml(item.phone || "")}</td>
        <td>${escapeHtml(item.summary || "")}</td>
        <td>${escapeHtml(item.need || "")}</td>
      </tr>
    `).join("") || `<tr><td colspan="6">No hay casos en el periodo seleccionado.</td></tr>`;

    return `
      ${routeActions()}
      <section class="law-hero-panel compact chief-dashboard">
        <h2>Jefatura</h2>
        <p>Sesion: ${escapeHtml(session.name || session.username)} (${escapeHtml(session.role)})</p>
        <div class="law-actions">
          <button class="document-button" type="button" data-chief-logout>Cerrar sesion</button>
          <a class="document-button" href="#/inicio">Inicio</a>
        </div>
      </section>

      ${canGrant ? `
        <section class="document-panel chief-admin-panel">
          <h2>Usuarios autorizados</h2>
          <p>Los administradores crean usuarios y entregan una clave temporal para que cada jefe defina su clave final.</p>
          <form class="law-search-form chief-form" data-chief-grant>
            <label>Usuario
              <input name="username" type="text" placeholder="ej: jefe.turno" required>
            </label>
            <label>Nombre
              <input name="name" type="text" placeholder="Nombre visible" required>
            </label>
            <label>Rol
              <select name="role">
                <option value="jefe">Jefe</option>
                <option value="owner">Administrador</option>
                <option value="desarrollador">Desarrollador</option>
              </select>
            </label>
            <label>Clave temporal
              <input name="temporaryPassword" type="password" minlength="4" required>
            </label>
            <button class="document-button" type="submit">Otorgar permiso</button>
          </form>
          <div class="rule-fields">
            ${users.map((user) => `<div class="rule-field"><strong>${escapeHtml(user.name || user.username)}</strong><span>${escapeHtml(user.username)} · ${escapeHtml(user.role)} · ${user.hash ? "clave creada" : "pendiente crear clave"}</span></div>`).join("")}
          </div>
        </section>
      ` : ""}

      <section class="document-panel chief-export-panel">
        <h2>Casos para gestion</h2>
        <form class="law-search-form chief-form" data-chief-filter>
          <label>Periodo
            <select name="period">
              <option value="day">Diario</option>
              <option value="week">Semanal</option>
              <option value="month">Mensual</option>
              <option value="custom">Desde - hasta</option>
            </select>
          </label>
          <label>Desde
            <input name="from" type="date">
          </label>
          <label>Hasta
            <input name="to" type="date">
          </label>
          <button class="document-button" type="submit">Aplicar</button>
        </form>
        <div class="law-actions">
          <button class="document-button" type="button" data-chief-export="csv">Excel</button>
          <button class="document-button" type="button" data-chief-export="drive">Excel Drive</button>
          <button class="document-button" type="button" data-chief-export="pdf">PDF</button>
          <button class="document-button" type="button" data-chief-export="word">Word</button>
        </div>
        <form class="law-search-form chief-form" data-chief-drive>
          <label>Enlace Excel/Drive
            <input name="driveUrl" type="url" value="${escapeHtml(driveUrl)}" placeholder="https://docs.google.com/spreadsheets/...">
          </label>
          <button class="document-button" type="submit">Guardar enlace</button>
        </form>
        <p class="law-note">La app puede exportar y abrir la planilla Drive configurada. Para guardar automaticamente dentro de Google Drive se requiere conectar un Apps Script o backend institucional.</p>
        <div class="chief-table-wrap">
          <table class="chief-table">
            <thead><tr><th>Fecha</th><th>Estado</th><th>Flujo</th><th>Paciente</th><th>Resumen</th><th>Necesita</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function getPeriodConfig() {
    return readJson("crsChiefPeriodV2", { period: "day", from: todayIso(), to: todayIso() });
  }

  function savePeriodConfig(config) {
    writeJson("crsChiefPeriodV2", config);
  }

  function getPriorityCases() {
    try {
      if (typeof priorityCases === "function") return priorityCases();
    } catch (error) {
      // Se usa respaldo local si la funcion original no esta disponible.
    }
    return readJson("crsPriorityCases", []);
  }

  function caseDate(item) {
    const date = new Date(item.createdAt || item.date || item.fecha || Date.now());
    if (Number.isNaN(date.getTime())) return new Date();
    return date;
  }

  function formatDate(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("es-CL");
  }

  function periodRange(config) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (config.period === "week") {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }
    if (config.period === "month") {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    if (config.period === "custom") {
      const from = config.from ? new Date(`${config.from}T00:00:00`) : start;
      const to = config.to ? new Date(`${config.to}T23:59:59`) : end;
      return { start: from, end: to };
    }
    return { start, end };
  }

  function filterCases(config) {
    const { start, end } = periodRange(config);
    return getPriorityCases().filter((item) => {
      const date = caseDate(item);
      return date >= start && date <= end;
    });
  }

  function csvCell(value) {
    return `"${String(value || "").replaceAll('"', '""')}"`;
  }

  function reportRows(cases) {
    return cases.map((item) => [
      formatDate(item.createdAt),
      item.status || "Pendiente",
      item.flow || item.protocol || "",
      item.patientName || "",
      item.rut || "",
      item.phone || "",
      item.summary || "",
      item.need || "",
      item.route || ""
    ]);
  }

  function downloadTextFile(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCases(format) {
    const config = getPeriodConfig();
    const cases = filterCases(config);
    const headers = ["Fecha", "Estado", "Flujo", "Paciente", "RUN", "Telefono", "Resumen", "Necesita", "Enlace"];
    const rows = reportRows(cases);
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === "drive") {
      const driveUrl = localStorage.getItem(DRIVE_KEY);
      if (driveUrl) window.open(driveUrl, "_blank", "noopener,noreferrer");
      else setMessage("Primero guarda el enlace de la planilla Excel/Drive.", "error");
      return;
    }

    if (format === "csv") {
      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
      downloadTextFile(`casos-gestion-${stamp}.csv`, `\ufeff${csv}`, "text/csv;charset=utf-8");
      return;
    }

    const htmlRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="9">Sin casos para el periodo.</td></tr>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Casos gestion</title><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:8px;vertical-align:top}th{background:#eef4f3}</style></head><body><h1>Casos gestion</h1><table><thead><tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table></body></html>`;

    if (format === "word") {
      downloadTextFile(`casos-gestion-${stamp}.doc`, html, "application/msword;charset=utf-8");
      return;
    }

    if (format === "pdf") {
      const printWindow = window.open("", "_blank", "noopener,noreferrer");
      if (!printWindow) return;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  function renderChiefV2() {
    const content = $("#chiefContent");
    if (!content) return;
    activatePage("chiefPage");
    const session = currentSession();
    content.innerHTML = session ? dashboardPanel(session) : `${routeActions()}${authPanel()}`;

    const config = getPeriodConfig();
    const filter = $("[data-chief-filter]");
    if (filter) {
      filter.period.value = config.period || "day";
      filter.from.value = config.from || todayIso();
      filter.to.value = config.to || todayIso();
    }

    removeRestrictedLabels();
    window.scrollTo(0, 0);
  }

  document.addEventListener("submit", async (event) => {
    const bootstrap = event.target.closest("[data-chief-bootstrap]");
    const login = event.target.closest("[data-chief-login]");
    const createPassword = event.target.closest("[data-chief-create-password]");
    const grant = event.target.closest("[data-chief-grant]");
    const filter = event.target.closest("[data-chief-filter]");
    const drive = event.target.closest("[data-chief-drive]");

    if (!bootstrap && !login && !createPassword && !grant && !filter && !drive) return;
    event.preventDefault();

    if (bootstrap) {
      const data = new FormData(bootstrap);
      const username = normalizeUser(data.get("username"));
      if (!AUTHORIZED_OWNERS.includes(username)) return setMessage("Solo guti, cote o desarrollador pueden crear el primer acceso.", "error");
      const user = {
        username,
        name: String(data.get("name") || username).trim(),
        role: username === "desarrollador" ? "desarrollador" : "owner",
        hash: await passwordHash(username, data.get("password")),
        createdAt: new Date().toISOString()
      };
      saveUsers([user]);
      setSession(user);
      renderChiefV2();
      return;
    }

    if (login) {
      const data = new FormData(login);
      const username = normalizeUser(data.get("username"));
      const user = getUsers().find((item) => item.username === username);
      if (!user?.hash) return setMessage("Usuario sin clave creada o no autorizado.", "error");
      const hash = await passwordHash(username, data.get("password"));
      if (hash !== user.hash) return setMessage("Usuario o clave incorrectos.", "error");
      setSession(user);
      renderChiefV2();
      return;
    }

    if (createPassword) {
      const data = new FormData(createPassword);
      const username = normalizeUser(data.get("username"));
      const users = getUsers();
      const index = users.findIndex((item) => item.username === username);
      if (index < 0) return setMessage("Ese usuario todavia no fue autorizado.", "error");
      const temporaryHash = await passwordHash(username, data.get("temporaryPassword"));
      if (users[index].temporaryHash !== temporaryHash) return setMessage("La clave temporal no coincide.", "error");
      users[index].hash = await passwordHash(username, data.get("password"));
      delete users[index].temporaryHash;
      saveUsers(users);
      setSession(users[index]);
      renderChiefV2();
      return;
    }

    if (grant) {
      const session = currentSession();
      if (!["owner", "desarrollador"].includes(session?.role)) return;
      const data = new FormData(grant);
      const username = normalizeUser(data.get("username"));
      const users = getUsers().filter((item) => item.username !== username);
      users.push({
        username,
        name: String(data.get("name") || username).trim(),
        role: String(data.get("role") || "jefe"),
        temporaryHash: await passwordHash(username, data.get("temporaryPassword")),
        invitedBy: session.username,
        createdAt: new Date().toISOString()
      });
      saveUsers(users);
      renderChiefV2();
      return;
    }

    if (filter) {
      const data = new FormData(filter);
      savePeriodConfig({ period: data.get("period"), from: data.get("from") || todayIso(), to: data.get("to") || todayIso() });
      renderChiefV2();
      return;
    }

    if (drive) {
      const data = new FormData(drive);
      localStorage.setItem(DRIVE_KEY, String(data.get("driveUrl") || "").trim());
      setMessage("Enlace Drive guardado.");
    }
  }, true);

  document.addEventListener("click", (event) => {
    const logout = event.target.closest("[data-chief-logout]");
    if (logout) {
      clearSession();
      renderChiefV2();
      return;
    }
    const exportButton = event.target.closest("[data-chief-export]");
    if (exportButton) exportCases(exportButton.dataset.chiefExport);
  }, true);

  function renderForRoute() {
    const route = (window.location.hash || "#/inicio").split("?")[0];
    if (route === "#/gestion") renderManagementV2();
    if (route === "#/jefatura") renderChiefV2();
    removeRestrictedLabels();
  }

  window.addEventListener("hashchange", () => {
    window.setTimeout(renderForRoute, 20);
    window.setTimeout(renderForRoute, 180);
  });

  const observer = new MutationObserver(() => removeRestrictedLabels());
  observer.observe(document.body, { childList: true, subtree: true });

  window.setTimeout(renderForRoute, 80);
  window.setTimeout(renderForRoute, 300);
})();