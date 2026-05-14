(() => {
  const USERS_KEY = "crsChiefUsersV2";
  const SESSION_KEY = "crsChiefSessionV2";
  const LINKS_KEY = "crsOperationalLinksV3";
  const CONTENT_KEY = "crsContentHubV1";
  const DIRECTORY_KEY = "crsExtraPhonesV1";
  const FORMS_KEY = "crsFormsLinksV1";
  const ONCALL_DATA_KEY = "crsOnCallCsvV1";
  const ARSENAL_DATA_KEY = "crsArsenalCsvV1";
  const ADMIN_USERS = ["desarrollador", "guti", "cote"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clean = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const esc = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || "") || fallback; }
    catch (error) { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const session = () => read(SESSION_KEY, null);
  const isAdmin = () => {
    const active = session();
    return Boolean(active && (["owner", "desarrollador"].includes(active.role) || ADMIN_USERS.includes(clean(active.username))));
  };

  async function passwordHash(username, password) {
    const text = `${clean(username)}::${String(password || "")}`;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, "0")).join("");
    }
    return btoa(unescape(encodeURIComponent(text)));
  }

  function addStyle() {
    if ($("#gestion-admin-contenidos-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-admin-contenidos-style";
    style.textContent = `
      .page:not(.active){display:none!important}#chiefPage:not(.active){display:none!important}#chiefPage>.page-head{display:none!important}
      .admin-content-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}.admin-content-panel{display:grid;gap:12px}.admin-content-panel h2{margin:0}.admin-mini-note{color:#52615c;line-height:1.42;margin:0}.admin-list{display:grid;gap:8px}.admin-list-row{display:grid;gap:6px;padding:10px;border:1px solid #dfe8e4;border-radius:10px;background:#fbfdfc}.admin-list-row strong{color:#10201c}.admin-list-row span{color:#52615c}.admin-actions{display:flex;flex-wrap:wrap;gap:8px}.gestion-dynamic-section{display:grid;gap:12px;margin-top:14px}.gestion-dynamic-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.gestion-dynamic-card{display:grid;gap:8px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.08)}.gestion-dynamic-card.paper{border-left-color:#7c3aed}.gestion-dynamic-card.news{border-left-color:#f59e0b}.gestion-dynamic-card a{font-weight:900;color:#0f766e}.gestion-action-extra{background:#e8f7f2!important;border-color:#bde4d8!important;color:#0f513f!important}.phone-card.extra-phone{border-left:5px solid #0f766e}
    `;
    document.head.append(style);
  }

  function parseDelimited(text) {
    const rows = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!rows.length) return [];
    const delimiter = rows[0].includes("\t") ? "\t" : rows[0].includes(";") ? ";" : ",";
    return rows.map((line) => line.split(delimiter).map((cell) => cell.trim()));
  }

  function applyOperationalLinks() {
    const links = read(LINKS_KEY, {});
    try {
      if (typeof externalDocs !== "undefined") {
        if (links.llamados) externalDocs.llamadosUrl = links.llamados;
        if (links.uhd) externalDocs.uhdDisponibilidadUrl = links.uhd;
        if (links.visita) externalDocs.visitaDiariaUrl = links.visita;
      }
    } catch (error) {}
  }

  function applyFormsLinks() {
    const links = read(FORMS_KEY, {});
    try {
      if (typeof externalForms !== "undefined") Object.assign(externalForms, links);
    } catch (error) {}
  }

  function applyOnCallCsv() {
    const csv = localStorage.getItem(ONCALL_DATA_KEY);
    if (!csv) return;
    try {
      if (typeof onCallSchedule === "undefined") return;
      const rows = parseDelimited(csv);
      if (rows.length < 2) return;
      const header = rows[0].map((cell) => cell.toLowerCase());
      const specialtyIndex = Math.max(0, header.findIndex((cell) => cell.includes("especial")));
      const parsed = rows.slice(1).map((row) => {
        const days = {};
        row.forEach((cell, index) => {
          const day = Number((header[index] || "").replace(/[^0-9]/g, ""));
          if (day >= 1 && day <= 31 && cell) days[day] = cell;
        });
        return { specialty: row[specialtyIndex] || row[0], aliases: [], days };
      }).filter((row) => row.specialty);
      if (parsed.length) {
        onCallSchedule.rows = parsed;
        onCallSchedule.label = "Planilla mensual cargada por jefatura";
      }
    } catch (error) {}
  }

  function contentState() {
    return read(CONTENT_KEY, { education: [], paper: null, news: [] });
  }

  function addGestionButtons() {
    if (!location.hash.startsWith("#/gestion")) return;
    const actions = $("#managementContent .management-v2-home .law-actions");
    if (!actions || $("[data-gestion-extra-buttons]", actions)) return;
    const box = document.createElement("span");
    box.dataset.gestionExtraButtons = "true";
    box.style.display = "contents";
    box.innerHTML = `
      <a class="document-button gestion-action-extra" href="#/educacion">Educacion medica</a>
      <button class="document-button gestion-action-extra" type="button" data-scroll-gestion="paper">Paper del mes</button>
      <button class="document-button gestion-action-extra" type="button" data-scroll-gestion="news">Noticias SUHPH</button>
    `;
    actions.append(box);
  }

  function renderGestionDynamic() {
    if (!location.hash.startsWith("#/gestion")) return;
    const content = $("#managementContent");
    if (!content || $("[data-gestion-dynamic]", content)) return;
    const state = contentState();
    const section = document.createElement("section");
    section.className = "gestion-dynamic-section";
    section.dataset.gestionDynamic = "true";
    const paper = state.paper;
    const news = state.news || [];
    section.innerHTML = `
      <div class="gestion-dynamic-grid">
        <article class="gestion-dynamic-card paper" data-gestion-section="paper">
          <strong>Paper del mes</strong>
          <span>${esc(paper?.description || "Pendiente de publicar por jefatura.")}</span>
          ${paper?.url ? `<a href="${esc(paper.url)}" target="_blank" rel="noopener noreferrer">Abrir paper</a>` : ""}
        </article>
        <article class="gestion-dynamic-card news" data-gestion-section="news">
          <strong>Noticias SUHPH</strong>
          <span>${news[0] ? esc(news[0].description || news[0].title) : "Cursos, congresos, actividades y avisos se publicaran aqui."}</span>
          ${news[0]?.url ? `<a href="${esc(news[0].url)}" target="_blank" rel="noopener noreferrer">Abrir noticia</a>` : ""}
        </article>
      </div>
    `;
    content.append(section);
  }

  function fileInput(name, label, accept = ".csv,.tsv,.txt") {
    return `<label>${label}<input name="${name}" type="file" accept="${accept}"></label>`;
  }

  function renderAdminSections() {
    if (!location.hash.startsWith("#/jefatura") || !isAdmin()) return;
    const anchor = $(".chief-export-panel");
    if (!anchor || $("[data-admin-content-center]")) return;
    const links = read(LINKS_KEY, {});
    const forms = read(FORMS_KEY, {});
    const phones = read(DIRECTORY_KEY, []);
    const content = contentState();
    const users = read(USERS_KEY, []);
    const panel = document.createElement("section");
    panel.className = "document-panel admin-content-panel";
    panel.dataset.adminContentCenter = "true";
    panel.innerHTML = `
      <h2>Centro de administracion</h2>
      <p class="admin-mini-note">Los cambios quedan guardados en este navegador. Para compartirlos entre todos los equipos se requiere conectar Google Sheets/Drive publicado o Apps Script.</p>
      <div class="admin-content-grid">
        <section class="admin-list-row">
          <h2>Usuarios Panel restringido</h2>
          <form class="law-search-form chief-form" data-admin-user-form>
            <label>Usuario<input name="username" required></label>
            <label>Nombre<input name="name" required></label>
            <label>Rol<select name="role"><option value="jefe-turno">Jefe de turno</option><option value="subrogante">Subrogante</option><option value="jefe">Jefe</option><option value="owner">Administrador</option></select></label>
            <label>Clave temporal<input name="temporaryPassword" type="password" minlength="4" required></label>
            <button class="document-button" type="submit">Autorizar usuario</button>
          </form>
          <div class="admin-list">${users.map((user) => `<div class="admin-list-row"><strong>${esc(user.name || user.username)}</strong><span>${esc(user.username)} · ${esc(user.role || "jefe")}</span>${ADMIN_USERS.includes(clean(user.username)) ? "" : `<button class="document-button" type="button" data-admin-remove-user="${esc(user.username)}">Eliminar</button>`}</div>`).join("")}</div>
        </section>
        <section class="admin-list-row">
          <h2>Planillas llamados y UHD</h2>
          <form class="law-search-form chief-form" data-admin-links-form>
            <label>Especialista de llamado<input name="llamados" type="url" value="${esc(links.llamados)}" placeholder="Link Drive o CSV publicado"></label>
            <label>UHD<input name="uhd" type="url" value="${esc(links.uhd)}" placeholder="Link Drive o CSV publicado"></label>
            <label>Visita diaria<input name="visita" type="url" value="${esc(links.visita)}" placeholder="Link Drive"></label>
            ${fileInput("onCallCsv", "Archivo CSV/TSV para buscador de llamados")}
            <button class="document-button" type="submit">Actualizar planillas</button>
          </form>
        </section>
        <section class="admin-list-row">
          <h2>Arsenal terapeutico</h2>
          <form class="law-search-form chief-form" data-admin-arsenal-form>
            ${fileInput("arsenalCsv", "Subir CSV/TSV exportado desde Excel")}
            <button class="document-button" type="submit">Actualizar arsenal</button>
          </form>
          <p class="admin-mini-note">Para Excel .xlsx directo se requerira lector adicional o convertir a CSV desde Excel.</p>
        </section>
        <section class="admin-list-row">
          <h2>Formularios de turno</h2>
          <form class="law-search-form chief-form" data-admin-forms-form>
            <label>Medicamentos uso ocasional<input name="medicamentosUsoOcasionalUrl" type="url" value="${esc(forms.medicamentosUsoOcasionalUrl)}"></label>
            <label>Ley de urgencias<input name="leyUrgenciasUrl" type="url" value="${esc(forms.leyUrgenciasUrl)}"></label>
            <label>Notificacion obligatoria<input name="notificacionObligatoriaUrl" type="url" value="${esc(forms.notificacionObligatoriaUrl)}"></label>
            <button class="document-button" type="submit">Actualizar formularios</button>
          </form>
        </section>
        <section class="admin-list-row">
          <h2>Directorio telefonico</h2>
          <form class="law-search-form chief-form" data-admin-phone-form>
            <label>Nombre<input name="name" required></label>
            <label>Detalle<input name="detail" required></label>
            <label>Telefono/anexo<input name="phone" required></label>
            <button class="document-button" type="submit">Agregar numero</button>
          </form>
          <div class="admin-list">${phones.map((phone, index) => `<div class="admin-list-row"><strong>${esc(phone.name)}</strong><span>${esc(phone.detail)} · ${esc(phone.phone)}</span><button class="document-button" type="button" data-admin-remove-phone="${index}">Eliminar</button></div>`).join("")}</div>
        </section>
        <section class="admin-list-row">
          <h2>Educacion, paper y noticias</h2>
          <form class="law-search-form chief-form" data-admin-content-form>
            <label>Tipo<select name="type"><option value="education">Educacion medica</option><option value="paper">Paper del mes</option><option value="news">Noticias SUHPH / cursos / actividades</option></select></label>
            <label>Titulo<input name="title" required></label>
            <label>Descripcion<textarea name="description" rows="3"></textarea></label>
            <label>Link o archivo publicado<input name="url" type="url"></label>
            <button class="document-button" type="submit">Publicar</button>
          </form>
        </section>
      </div>
    `;
    anchor.parentNode.insertBefore(panel, anchor);
  }

  function appendExtraPhones() {
    if (!location.hash.startsWith("#/telefonos")) return;
    const list = $("#phonesContent .phone-directory");
    if (!list || $("[data-extra-phone-group]", list)) return;
    const phones = read(DIRECTORY_KEY, []);
    if (!phones.length) return;
    const group = document.createElement("section");
    group.className = "phone-group";
    group.dataset.extraPhoneGroup = "true";
    group.innerHTML = `<h2>Agregados por jefatura</h2><div class="phone-grid">${phones.map((item) => `<article class="phone-card extra-phone"><span>${esc(item.detail)}</span><strong>${esc(item.name)}</strong><a href="tel:${esc(String(item.phone).replace(/[^+0-9]/g, ""))}">${esc(item.phone)}</a></article>`).join("")}</div>`;
    list.prepend(group);
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.matches("[data-admin-user-form]")) {
      event.preventDefault();
      const data = new FormData(form);
      const username = clean(data.get("username"));
      const list = read(USERS_KEY, []).filter((user) => clean(user.username) !== username);
      list.push({ username, name: String(data.get("name") || username).trim(), role: String(data.get("role") || "jefe-turno"), temporaryHash: await passwordHash(username, data.get("temporaryPassword")), createdAt: new Date().toISOString() });
      write(USERS_KEY, list);
      $("[data-admin-content-center]")?.remove();
      setTimeout(renderAdminSections, 80);
    }
    if (form.matches("[data-admin-links-form]")) {
      event.preventDefault();
      const data = new FormData(form);
      write(LINKS_KEY, { llamados: String(data.get("llamados") || "").trim(), uhd: String(data.get("uhd") || "").trim(), visita: String(data.get("visita") || "").trim(), updatedAt: new Date().toISOString() });
      const csv = await readFile(form.onCallCsv.files[0]);
      if (csv) localStorage.setItem(ONCALL_DATA_KEY, csv);
      applyOperationalLinks();
      applyOnCallCsv();
    }
    if (form.matches("[data-admin-arsenal-form]")) {
      event.preventDefault();
      const csv = await readFile(form.arsenalCsv.files[0]);
      if (csv) localStorage.setItem(ARSENAL_DATA_KEY, csv);
      alert("Arsenal cargado para este navegador. Para convertirlo al buscador global falta publicar el formato definitivo de columnas.");
    }
    if (form.matches("[data-admin-forms-form]")) {
      event.preventDefault();
      const data = new FormData(form);
      write(FORMS_KEY, Object.fromEntries(data.entries()));
      applyFormsLinks();
    }
    if (form.matches("[data-admin-phone-form]")) {
      event.preventDefault();
      const data = new FormData(form);
      const phones = read(DIRECTORY_KEY, []);
      phones.push({ name: data.get("name"), detail: data.get("detail"), phone: data.get("phone"), createdAt: new Date().toISOString() });
      write(DIRECTORY_KEY, phones);
      $("[data-admin-content-center]")?.remove();
      setTimeout(renderAdminSections, 80);
    }
    if (form.matches("[data-admin-content-form]")) {
      event.preventDefault();
      const data = new FormData(form);
      const state = contentState();
      const item = { title: data.get("title"), description: data.get("description"), url: data.get("url"), createdAt: new Date().toISOString() };
      if (data.get("type") === "paper") state.paper = item;
      else state[data.get("type")].unshift(item);
      write(CONTENT_KEY, state);
      document.querySelector("[data-gestion-dynamic]")?.remove();
    }
  }, true);

  document.addEventListener("click", (event) => {
    const scroll = event.target.closest("[data-scroll-gestion]");
    if (scroll) document.querySelector(`[data-gestion-section="${scroll.dataset.scrollGestion}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const removeUser = event.target.closest("[data-admin-remove-user]");
    if (removeUser) {
      write(USERS_KEY, read(USERS_KEY, []).filter((user) => clean(user.username) !== clean(removeUser.dataset.adminRemoveUser)));
      $("[data-admin-content-center]")?.remove();
      setTimeout(renderAdminSections, 80);
    }
    const removePhone = event.target.closest("[data-admin-remove-phone]");
    if (removePhone) {
      const phones = read(DIRECTORY_KEY, []);
      phones.splice(Number(removePhone.dataset.adminRemovePhone), 1);
      write(DIRECTORY_KEY, phones);
      $("[data-admin-content-center]")?.remove();
      setTimeout(renderAdminSections, 80);
    }
  }, true);

  function apply() {
    addStyle();
    applyOperationalLinks();
    applyFormsLinks();
    applyOnCallCsv();
    addGestionButtons();
    renderGestionDynamic();
    renderAdminSections();
    appendExtraPhones();
  }

  addEventListener("hashchange", () => {
    setTimeout(apply, 120);
    setTimeout(apply, 600);
  });
  setTimeout(apply, 150);
  setInterval(apply, 1800);
})();