(() => {
  const ROUTE = "#/jefatura";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let timer = 0;

  function currentRoute() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function normalized(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function cardTitle(card) {
    return normalized(card?.querySelector("h3")?.textContent || "");
  }

  function modeLink(mode, label, secondary = false) {
    return `<a class="jefatura-action${secondary ? " secondary" : ""}" href="#/gestion/pacientes" data-gestion-cases-mode="${mode}">${label}</a>`;
  }

  function createSection(title, description, cards = [], options = {}) {
    if (!cards.length && !options.content) return null;
    const details = document.createElement("details");
    details.className = "jefatura-dropdown";
    details.dataset.jefaturaSection = normalized(title).replace(/[^a-z0-9]+/g, "-");
    if (options.open) details.open = true;

    const summary = document.createElement("summary");
    summary.innerHTML = `<span><strong>${title}</strong><small>${description}</small></span><span class="jefatura-dropdown-count">${options.count ?? cards.length}</span>`;

    const body = document.createElement("div");
    body.className = "jefatura-dropdown-body";
    cards.forEach((card) => body.append(card));
    if (options.content) body.append(options.content);

    details.append(summary, body);
    return details;
  }

  function renamePanel(shell) {
    const pageTitle = document.querySelector("#chiefTitle");
    if (pageTitle) pageTitle.textContent = "Centro de Gestión Jefatura";

    const hero = shell.querySelector(".crs-access-hero");
    if (!hero) return;
    const heading = hero.querySelector("h2");
    const paragraph = hero.querySelector("p");
    if (heading) heading.textContent = "Centro de Gestión Jefatura";
    if (paragraph) paragraph.textContent = "Administración central de contenidos, documentos, flujos, usuarios y seguimiento operativo de MASTER Urgencias HPH.";
  }

  function cleanLogin(shell) {
    const form = shell.querySelector("[data-crs-login]");
    if (!form) return false;
    shell.classList.add("jefatura-login-clean");
    const card = form.closest(".crs-access-card");
    const title = card?.querySelector("h3");
    const button = form.querySelector('button[type="submit"]');
    if (title) title.textContent = "Acceso de Jefatura";
    if (button) button.textContent = "Ingresar";
    return true;
  }

  function takeCards(cards, names) {
    const wanted = new Set(names.map(normalized));
    return cards.filter((card) => wanted.has(cardTitle(card)));
  }

  function buildActivityCard(listNode) {
    if (!listNode) return null;
    const card = document.createElement("article");
    card.className = "crs-access-card full jefatura-list-card";
    card.innerHTML = "<h3>Últimas publicaciones y documentos</h3>";
    card.append(listNode);
    return card;
  }

  function buildUsersListCard(listNode) {
    if (!listNode) return null;
    const card = document.createElement("article");
    card.className = "crs-access-card full jefatura-list-card";
    card.innerHTML = "<h3>Usuarios con acceso</h3>";
    card.append(listNode);
    return card;
  }

  function organizePanel(shell) {
    if (shell.dataset.jefaturaOrganized === "true") return;
    const grid = shell.querySelector(".crs-access-grid");
    if (!grid) return;

    const cards = $$(":scope > .crs-access-card", grid);
    const statusCard = cards.find((card) => card.querySelector("[data-crs-global-list]"));
    if (!statusCard) return;

    const sessionInfo = statusCard.querySelector(".crs-access-ok");
    const sessionActions = statusCard.querySelector(".crs-access-actions");
    const globalList = statusCard.querySelector("[data-crs-global-list]");
    const adminList = statusCard.querySelector("[data-crs-admin-list]");

    const publicationCards = takeCards(cards, ["Paper del mes", "Noticias / Educación", "Procedimiento médico"]);
    const operationCards = takeCards(cards, ["Especialistas de llamado", "UHD", "Nuevo flujo / protocolo"]);
    const documentCards = takeCards(cards, ["Medicamentos de uso ocasional", "Ley de Urgencias", "Notificación obligatoria"]);
    const userCards = takeCards(cards, ["Crear usuarios"]);

    const dashboard = document.createElement("section");
    dashboard.className = "jefatura-dashboard";

    const top = document.createElement("section");
    top.className = "jefatura-session-bar";
    const identity = document.createElement("div");
    identity.className = "jefatura-session-copy";
    identity.innerHTML = "<span>Sesión activa</span>";
    if (sessionInfo) identity.append(sessionInfo);
    top.append(identity);
    if (sessionActions) top.append(sessionActions);

    const quick = document.createElement("section");
    quick.className = "jefatura-quick-actions";
    quick.innerHTML = `
      <div class="jefatura-quick-copy">
        <span>Acciones frecuentes</span>
        <h3>¿Qué necesitas hacer?</h3>
      </div>
      <div class="jefatura-quick-buttons">
        ${modeLink("nuevo", "Registrar caso nuevo")}
        ${modeLink("revision", "Revisar solicitudes", true)}
        <a class="jefatura-action ghost" href="#/inicio">Ver aplicación</a>
      </div>`;

    const sections = document.createElement("section");
    sections.className = "jefatura-sections";

    const activityCard = buildActivityCard(globalList);
    const usersListCard = buildUsersListCard(adminList);
    const usersContent = document.createElement("div");
    usersContent.className = "jefatura-inner-grid";
    userCards.forEach((card) => usersContent.append(card));
    if (usersListCard) usersContent.append(usersListCard);

    [
      createSection("Publicaciones y docencia", "Noticias, educación, paper del mes y procedimientos.", publicationCards),
      createSection("Operación clínica", "Especialistas, UHD y nuevos flujos o protocolos.", operationCards),
      createSection("Documentos institucionales", "Actualización de formularios y documentos de uso frecuente.", documentCards),
      createSection("Usuarios y permisos", "Creación, activación y recuperación de accesos.", [], { content: usersContent, count: userCards.length + (usersListCard ? 1 : 0) }),
      createSection("Actividad reciente", "Revisa u oculta las publicaciones globales más recientes.", activityCard ? [activityCard] : [])
    ].filter(Boolean).forEach((section) => sections.append(section));

    dashboard.append(top, quick, sections);
    grid.replaceWith(dashboard);
    shell.dataset.jefaturaOrganized = "true";
  }

  function enhance() {
    if (currentRoute() !== ROUTE) return;
    const shell = document.querySelector("[data-crs-access-shell]");
    if (!shell) return;
    renamePanel(shell);
    if (cleanLogin(shell)) return;
    organizePanel(shell);
  }

  function schedule(delay = 30) {
    window.clearTimeout(timer);
    timer = window.setTimeout(enhance, delay);
  }

  document.addEventListener("click", (event) => {
    const action = event.target.closest?.("[data-jefatura-open]");
    if (!action) return;
    const target = document.querySelector(`[data-jefatura-section="${action.dataset.jefaturaOpen}"]`);
    if (target) target.open = true;
  }, true);

  const observer = new MutationObserver((mutations) => {
    if (currentRoute() !== ROUTE) return;
    if (!mutations.some((mutation) => mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) return;
    schedule(40);
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    schedule(10);
  }

  window.addEventListener("hashchange", () => schedule(30));
  window.addEventListener("crs:supabase-ready", () => schedule(60));
  window.addEventListener("crs:auth-changed", () => schedule(60));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
