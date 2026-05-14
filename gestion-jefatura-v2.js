(() => {
  const USERS_KEY = "crsChiefUsersV2";
  const SESSION_KEY = "crsChiefSessionV2";
  const DRIVE_KEY = "crsChiefDriveSheetUrlV2";
  const PERIOD_KEY = "crsChiefPeriodV2";
  const OWNERS = ["guti", "cote", "desarrollador"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const cleanUser = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const readStore = (store, key, fallback) => {
    try {
      return JSON.parse(store.getItem(key) || "") || fallback;
    } catch (error) {
      return fallback;
    }
  };
  const writeLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const users = () => readStore(localStorage, USERS_KEY, []);
  const saveUsers = (value) => writeLocal(USERS_KEY, value);
  const session = () => readStore(sessionStorage, SESSION_KEY, null);
  const setSession = (user) => sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, name: user.name, role: user.role }));
  const clearSession = () => sessionStorage.removeItem(SESSION_KEY);
  const period = () => readStore(localStorage, PERIOD_KEY, { period: "day", from: todayIso(), to: todayIso() });
  const savePeriod = (value) => writeLocal(PERIOD_KEY, value);

  async function passwordHash(username, password) {
    const text = `${cleanUser(username)}::${String(password || "")}`;
    if (crypto?.subtle && window.TextEncoder) {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, "0")).join("");
    }
    return btoa(unescape(encodeURIComponent(text)));
  }

  function activate(pageId) {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    const route = pageId === "managementPage" ? "gestion" : pageId === "chiefPage" ? "jefatura" : "";
    $$("[data-route-link]").forEach((link) => link.classList.toggle("active", link.dataset.routeLink === route));
  }

  function removeRestrictedCopies() {
    const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const chiefHead = $("#chiefPage .page-head");
    if (chiefHead) chiefHead.style.display = "none";
    const managementTitle = $("#managementTitle");
    if (managementTitle) managementTitle.textContent = "Gestion";
    $$(".document-panel, .form-card, .tool-card, .management-card").forEach((card) => {
      const text = normalize(card.textContent);
      if (text.includes("espacio jefatura") || text.includes("panel restringido")) card.remove();
    });
  }

  function getCases() {
    try {
      if (typeof priorityCases === "function") return priorityCases();
    } catch (error) {}
    return readStore(localStorage, "crsPriorityCases", []);
  }

  function caseDate(item) {
    const date = new Date(item.createdAt || item.date || item.fecha || Date.now());
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  function periodRange(config) {
    const start = new Date();
    const end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (config.period === "week") {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }
    if (config.period === "month") {
      start.setDate(1);
      end.setTime(start.getTime());
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    if (config.period === "custom") {
      return {
        start: config.from ? new Date(`${config.from}T00:00:00`) : start,
        end: config.to ? new Date(`${config.to}T23:59:59`) : end
      };
    }
    return { start, end };
  }

  function filteredCases() {
    const range = periodRange(period());
    return getCases().filter((item) => {
      const date = caseDate(item);
      return date >= range.start && date <= range.end;
    });
  }

  function nav() {
    return `<div class="route-actions"><a class="back-link" href="#/gestion">Volver</a><a class="back-link" href="#/inicio">Inicio</a></div>`;
  }

  function renderManagement() {
    const content = $("#managementContent");
    if (!content) return;
    activate("managementPage");
    const title = $("#managementTitle");
    if (title) title.textContent = "Gestion";
    content.innerHTML = `
      <section class="law-hero-panel compact management-v2-home">
        <h2>Gestion</h2>
        <p>Registro local de casos que requieren seguimiento.</p>
        <div class="law-actions">
          <a class="document-button" href="#/jefatura">Entrar a jefatura</a>
          <a class="document-button" href="#/especialidades">Ver flujos</a>
          <a class="document-button" href="#/inicio">Inicio</a>
        </div>
        <div class="rule-fields">
          <div class="rule-field"><strong>Casos guardados</strong><span>${getCases().length}</span></div>
          <div class="rule-field"><strong>Exportacion</strong><span>Excel, Excel/Drive, PDF y Word</span></div>
        </div>
      </section>`;
    removeRestrictedCopies();
    scrollTo(0, 0);
  }

  function authView() {
    const hasUsers = users().length > 0;
    const ownerOptions = OWNERS.map((item) => `<option value="${item}">${item}</option>`).join("");
    return `
      ${nav()}
      <section class="law-hero-panel compact chief-auth-panel">
        <h2>Jefatura</h2>
        <p>Guti, Cote y el desarrollador pueden iniciar el registro y otorgar accesos.</p>
        <p data-chief-message aria-live="polite"></p>
        ${!hasUsers ? `
          <form class="law-search-form chief-form" data-chief-bootstrap>
            <label>Usuario autorizado<select name="username" required>${ownerOptions}</select></label>
            <label>Nombre<input name="name" type="text" required></label>
            <label>Crear clave<input name="password" type="password" minlength="4" required></label>
            <button class="document-button" type="submit">Crear primer acceso</button>
          </form>` : `
          <form class="law-search-form chief-form" data-chief-login>
            <label>Usuario<input name="username" type="text" autocomplete="username" required></label>
            <label>Clave<input name="password" type="password" autocomplete="current-password" required></label>
            <button class="document-button" type="submit">Ingresar</button>
          </form>
          <form class="law-search-form chief-form" data-chief-create-password>
            <label>Usuario autorizado<input name="username" type="text" required></label>
            <label>Clave temporal<input name="temporaryPassword" type="password" required></label>
            <label>Nueva clave<input name="password" type="password" minlength="4" required></label>
            <button class="document-button" type="submit">Crear clave</button>
          </form>`}
      </section>`;
  }

  function setMessage(text, kind = "ok") {
    const node = $("[data-chief-message]");
    if (!node) return;
    node.textContent = text;
    node.className = kind === "error" ? "rule-warning" : "priority-status";
  }

  function dashboardView(activeUser) {
    const canGrant = ["owner", "desarrollador"].includes(activeUser.role);
    const config = period();
    const driveUrl = localStorage.getItem(DRIVE_KEY) || "";
    const rows = filteredCases().map((item) => `
      <tr>
        <td>${escapeHtml(new Date(item.createdAt || Date.now()).toLocaleString("es-CL"))}</td>
        <td>${escapeHtml(item.status || "Pendiente")}</td>
        <td>${escapeHtml(item.flow || item.protocol || "")}</td>
        <td>${escapeHtml(item.patientName || "")}<br>${escapeHtml(item.rut || "")}<br>${escapeHtml(item.phone || "")}</td>
        <td>${escapeHtml(item.summary || "")}</td>
        <td>${escapeHtml(item.need || "")}</td>
      </tr>`).join("") || `<tr><td colspan="6">No hay casos en el periodo seleccionado.</td></tr>`;

    return `
      ${nav()}
      <section class="law-hero-panel compact chief-dashboard">
        <h2>Jefatura</h2>
        <p>Sesion: ${escapeHtml(activeUser.name || activeUser.username)} (${escapeHtml(activeUser.role)})</p>
        <p data-chief-message aria-live="polite"></p>
        <div class="law-actions"><button class="document-button" type="button" data-chief-logout>Cerrar sesion</button><a class="document-button" href="#/inicio">Inicio</a></div>
      </section>
      ${canGrant ? `
        <section class="document-panel chief-admin-panel">
          <h2>Usuarios autorizados</h2>
          <p>Entrega una clave temporal para que cada jefe cree su clave final.</p>
          <form class="law-search-form chief-form" data-chief-grant>
            <label>Usuario<input name="username" type="text" required></label>
            <label>Nombre<input name="name" type="text" required></label>
            <label>Rol<select name="role"><option value="jefe">Jefe</option><option value="owner">Administrador</option><option value="desarrollador">Desarrollador</option></select></label>
            <label>Clave temporal<input name="temporaryPassword" type="password" minlength="4" required></label>
            <button class="document-button" type="submit">Otorgar permiso</button>
          </form>
          <div class="rule-fields">${users().map((user) => `<div class="rule-field"><strong>${escapeHtml(user.name || user.username)}</strong><span>${escapeHtml(user.username)} · ${escapeHtml(user.role)} · ${user.hash ? "clave creada" : "pendiente crear clave"}</span></div>`).join("")}</div>
        </section>` : ""}
      <section class="document-panel chief-export-panel">
        <h2>Casos para gestion</h2>
        <form class="law-search-form chief-form" data-chief-filter>
          <label>Periodo<select name="period"><option value="day">Diario</option><option value="week">Semanal</option><option value="month">Mensual</option><option value="custom">Desde - hasta</option></select></label>
          <label>Desde<input name="from" type="date" value="${escapeHtml(config.from || todayIso())}"></label>
          <label>Hasta<input name="to" type="date" value="${escapeHtml(config.to || todayIso())}"></label>
          <button class="document-button" type="submit">Aplicar</button>
        </form>
        <div class="law-actions">
          <button class="document-button" type="button" data-chief-export="csv">Excel</button>
          <button class="document-button" type="button" data-chief-export="drive">Excel Drive</button>
          <button class="document-button" type="button" data-chief-export="pdf">PDF</button>
          <button class="document-button" type="button" data-chief-export="word">Word</button>
        </div>
        <form class="law-search-form chief-form" data-chief-drive>
          <label>Enlace Excel/Drive<input name="driveUrl" type="url" value="${escapeHtml(driveUrl)}" placeholder="https://docs.google.com/spreadsheets/..."></label>
          <button class="document-button" type="submit">Guardar enlace</button>
        </form>
        <p class="law-note">La app abre la planilla Drive configurada y exporta los datos. Para escritura automatica en Google Drive se requiere Apps Script o backend institucional.</p>
        <div class="chief-table-wrap"><table class="chief-table"><thead><tr><th>Fecha</th><th>Estado</th><th>Flujo</th><th>Paciente</th><th>Resumen</th><th>Necesita</th></tr></thead><tbody>${rows}</tbody></table></div>
      </section>`;
  }

  function renderChief() {
    const content = $("#chiefContent");
    if (!content) return;
    activate("chiefPage");
    content.innerHTML = session() ? dashboardView(session()) : authView();
    const filter = $("[data-chief-filter]");
    if (filter) filter.period.value = period().period || "day";
    removeRestrictedCopies();
    scrollTo(0, 0);
  }

  function csvCell(value) {
    return `"${String(value || "").replaceAll('"', '""')}"`;
  }

  function download(filename, text, type) {
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

  function reportHtml(headers, rows) {
    const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="9">Sin casos para el periodo.</td></tr>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>Casos gestion</title><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:8px;vertical-align:top}th{background:#eef4f3}</style></head><body><h1>Casos gestion</h1><table><thead><tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  }

  function exportCases(format) {
    const driveUrl = localStorage.getItem(DRIVE_KEY);
    if (format === "drive") {
      if (driveUrl) window.open(driveUrl, "_blank", "noopener,noreferrer");
      else setMessage("Primero guarda el enlace de la planilla Excel/Drive.", "error");
      return;
    }

    const headers = ["Fecha", "Estado", "Flujo", "Paciente", "RUN", "Telefono", "Resumen", "Necesita", "Enlace"];
    const rows = filteredCases().map((item) => [
      new Date(item.createdAt || Date.now()).toLocaleString("es-CL"),
      item.status || "Pendiente",
      item.flow || item.protocol || "",
      item.patientName || "",
      item.rut || "",
      item.phone || "",
      item.summary || "",
      item.need || "",
      item.route || ""
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
      download(`casos-gestion-${stamp}.csv`, `\ufeff${csv}`, "text/csv;charset=utf-8");
      return;
    }
    const html = reportHtml(headers, rows);
    if (format === "word") download(`casos-gestion-${stamp}.doc`, html, "application/msword;charset=utf-8");
    if (format === "pdf") {
      const printWindow = window.open("", "_blank", "noopener,noreferrer");
      if (!printWindow) return;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!form.closest("[data-chief-bootstrap], [data-chief-login], [data-chief-create-password], [data-chief-grant], [data-chief-filter], [data-chief-drive]")) return;
    event.preventDefault();
    const data = new FormData(form);

    if (form.matches("[data-chief-bootstrap]")) {
      const username = cleanUser(data.get("username"));
      if (!OWNERS.includes(username)) return setMessage("Solo guti, cote o desarrollador pueden crear el primer acceso.", "error");
      const user = { username, name: String(data.get("name") || username).trim(), role: username === "desarrollador" ? "desarrollador" : "owner", hash: await passwordHash(username, data.get("password")), createdAt: new Date().toISOString() };
      saveUsers([user]);
      setSession(user);
      renderChief();
      return;
    }

    if (form.matches("[data-chief-login]")) {
      const username = cleanUser(data.get("username"));
      const user = users().find((item) => item.username === username);
      if (!user?.hash) return setMessage("Usuario sin clave creada o no autorizado.", "error");
      if (await passwordHash(username, data.get("password")) !== user.hash) return setMessage("Usuario o clave incorrectos.", "error");
      setSession(user);
      renderChief();
      return;
    }

    if (form.matches("[data-chief-create-password]")) {
      const username = cleanUser(data.get("username"));
      const list = users();
      const index = list.findIndex((item) => item.username === username);
      if (index < 0) return setMessage("Ese usuario todavia no fue autorizado.", "error");
      if (await passwordHash(username, data.get("temporaryPassword")) !== list[index].temporaryHash) return setMessage("La clave temporal no coincide.", "error");
      list[index].hash = await passwordHash(username, data.get("password"));
      delete list[index].temporaryHash;
      saveUsers(list);
      setSession(list[index]);
      renderChief();
      return;
    }

    if (form.matches("[data-chief-grant]")) {
      const active = session();
      if (!["owner", "desarrollador"].includes(active?.role)) return;
      const username = cleanUser(data.get("username"));
      const list = users().filter((item) => item.username !== username);
      list.push({ username, name: String(data.get("name") || username).trim(), role: String(data.get("role") || "jefe"), temporaryHash: await passwordHash(username, data.get("temporaryPassword")), invitedBy: active.username, createdAt: new Date().toISOString() });
      saveUsers(list);
      renderChief();
      return;
    }

    if (form.matches("[data-chief-filter]")) {
      savePeriod({ period: data.get("period"), from: data.get("from") || todayIso(), to: data.get("to") || todayIso() });
      renderChief();
      return;
    }

    if (form.matches("[data-chief-drive]")) {
      localStorage.setItem(DRIVE_KEY, String(data.get("driveUrl") || "").trim());
      setMessage("Enlace Drive guardado.");
    }
  }, true);

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-chief-logout]")) {
      clearSession();
      renderChief();
      return;
    }
    const exportButton = event.target.closest("[data-chief-export]");
    if (exportButton) exportCases(exportButton.dataset.chiefExport);
  }, true);

  function renderRoute() {
    const route = (location.hash || "#/inicio").split("?")[0];
    if (route === "#/gestion") renderManagement();
    if (route === "#/jefatura") renderChief();
    removeRestrictedCopies();
  }

  addEventListener("hashchange", () => {
    setTimeout(renderRoute, 20);
    setTimeout(renderRoute, 180);
  });
  new MutationObserver(removeRestrictedCopies).observe(document.body, { childList: true, subtree: true });
  setTimeout(renderRoute, 80);
  setTimeout(renderRoute, 300);
})();