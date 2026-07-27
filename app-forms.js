function emergencyLawHaystack(item) {
  return normalize([
    item.title,
    item.category,
    item.criteria,
    ...(item.aliases || [])
  ].join(" "));
}

function emergencyLawTokens(query = "") {
  const cleanQuery = normalize(query.trim());
  const baseWords = cleanQuery
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  return [...new Set(baseWords.flatMap((word) => [word, ...(emergencyLawSearchExpansions[word] || [])]))];
}

function emergencyLawGroupById(groupId = "") {
  return emergencyLawGroups.find((group) => group.id === groupId) || null;
}

function isEmergencyLawGroupMatch(item, group) {
  if (!group) return true;
  return group.categories.some((category) => item.category === category);
}

function emergencyLawMatchScore(item, words) {
  if (!words.length) return 1;

  const fields = [
    { text: normalize(item.title), weight: 8 },
    { text: normalize((item.aliases || []).join(" ")), weight: 6 },
    { text: normalize(item.category), weight: 4 },
    { text: normalize(item.criteria), weight: 2 }
  ];

  return words.reduce((score, word) => {
    const hitScore = fields.reduce((total, field) => total + (field.text.includes(word) ? field.weight : 0), 0);
    return score + hitScore;
  }, 0);
}

function emergencyLawMatchLabel(item) {
  if (item.matchMode === "group") return "Categoría";
  if (item.matchScore >= 14) return "Alta";
  if (item.matchScore >= 8) return "Probable";
  return "Posible";
}

function getEmergencyLawMatches(query = "", groupId = "") {
  const words = emergencyLawTokens(query);
  const group = emergencyLawGroupById(groupId);
  if (!words.length && !group) return [];

  return emergencyLawConditions
    .map((item) => {
      if (!isEmergencyLawGroupMatch(item, group)) return null;
      const score = emergencyLawMatchScore(item, words);
      if (words.length && score <= 0) return null;
      return {
        ...item,
        matchMode: words.length ? "search" : "group",
        matchScore: score
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.title.localeCompare(b.title, "es");
    });
}

function createEmergencyLawResultCard(item) {
  const card = document.createElement("article");
  card.className = "law-result";

  const head = document.createElement("div");
  head.className = "law-result-head";

  const category = document.createElement("span");
  category.className = "law-result-category";
  category.textContent = item.category;

  const match = document.createElement("span");
  match.className = "law-match-badge";
  match.textContent = emergencyLawMatchLabel(item);

  head.append(category, match);

  const title = document.createElement("h3");
  title.textContent = item.title;

  const criteria = document.createElement("p");
  criteria.textContent = item.criteria;

  card.append(head, title, criteria);

  if (item.aliases?.length) {
    const aliases = document.createElement("div");
    aliases.className = "law-aliases";
    item.aliases.slice(0, 5).forEach((alias) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = alias;
      aliases.append(tag);
    });
    card.append(aliases);
  }

  return card;
}

function emergencyLawSearchUrl(query) {
  return `#/formularios/ley-urgencias/resultados?q=${encodeURIComponent(query.trim())}`;
}

function emergencyLawSearchEditUrl(query) {
  const cleanQuery = query.trim();
  return cleanQuery
    ? `#/formularios/ley-urgencias/buscar?q=${encodeURIComponent(cleanQuery)}`
    : "#/formularios/ley-urgencias/buscar";
}

function searchPreviewWords(query = "", sourceItems = []) {
  const baseWords = normalize(query.trim())
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);
  const related = new Set(baseWords);

  baseWords.forEach((word) => {
    (emergencyLawSearchExpansions[word] || []).forEach((item) => related.add(item));
  });

  sourceItems.forEach((item) => {
    const aliases = Array.isArray(item.aliases) ? item.aliases : String(item.aliases || "").split(",");
    const haystack = normalize([item.title, item.name, item.criteria, item.trigger, ...aliases].join(" "));
    if (baseWords.some((word) => haystack.includes(word))) {
      aliases.map((alias) => alias.trim()).filter(Boolean).slice(0, 4).forEach((alias) => related.add(alias));
    }
  });

  return [...related].slice(0, 8);
}

function renderSearchPreview(container, query = "", sourceItems = [], options = {}) {
  container.innerHTML = "";
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    const idle = document.createElement("div");
    idle.className = "law-live-empty";
    idle.textContent = "Escribe una palabra, sigla o sinónimo.";
    container.append(idle);
    return;
  }

  const preview = document.createElement("div");
  preview.className = "search-preview";

  const label = document.createElement("span");
  label.className = "search-preview-label";
  label.textContent = "Buscando";
  preview.append(label);

  searchPreviewWords(cleanQuery, sourceItems).forEach((word) => {
    const chip = options.linkUrl ? document.createElement("a") : document.createElement("span");
    chip.className = options.linkUrl ? "tag search-preview-link" : "tag";
    chip.textContent = word;
    if (options.linkUrl) {
      chip.href = options.linkUrl;
      chip.target = "_blank";
      chip.rel = "noopener noreferrer";
      chip.setAttribute("aria-label", `Abrir EPIVIGILA por ${word}`);
    }
    preview.append(chip);
  });

  container.append(preview);
}

function renderEmergencyLawLiveResults(container, query = "") {
  renderSearchPreview(container, query, emergencyLawConditions);
}

function renderEmergencyLawForm(form) {
  const panel = document.createElement("section");
  panel.className = "document-panel law-card";

  const title = document.createElement("h2");
  title.textContent = form.title;

  const description = document.createElement("p");
  description.textContent = form.description;

  const actions = document.createElement("div");
  actions.className = "law-card-actions";

  const openLink = document.createElement("a");
  openLink.className = "document-button";
  openLink.href = "#/formularios/ley-urgencias";
  openLink.textContent = "Abrir Ley de Urgencias";

  actions.append(openLink);
  panel.append(title, description, actions);
  return panel;
}

function renderMandatoryNotificationForm(form) {
  const panel = document.createElement("section");
  panel.className = "document-panel law-card notification-card";

  const title = document.createElement("h2");
  title.textContent = form.title;

  const description = document.createElement("p");
  description.textContent = form.description;

  const actions = document.createElement("div");
  actions.className = "law-card-actions";

  const openLink = document.createElement("a");
  openLink.className = "document-button";
  openLink.href = "#/formularios/notificacion-obligatoria";
  openLink.textContent = "Consultar patologías";

  const epivigila = document.createElement("a");
  epivigila.className = "document-button secondary-link";
  epivigila.href = form.url;
  epivigila.target = "_blank";
  epivigila.rel = "noopener noreferrer";
  epivigila.textContent = "Abrir EPIVIGILA";

  actions.append(openLink, epivigila);
  panel.append(title, description, actions);
  return panel;
}

function mandatoryNotificationMatches(query = "", type = "Todos") {
  const q = normalize(query.trim());
  return mandatoryNotificationDiseases
    .filter((item) => type === "Todos" || item.type === type)
    .filter((item) => {
      if (!q) return true;
      const haystack = normalize([item.name, item.aliases, item.type, item.trigger].join(" "));
      return haystack.includes(q);
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type, "es");
      return a.name.localeCompare(b.name, "es");
    });
}

function createMandatoryNotificationCard(item) {
  const card = document.createElement("article");
  card.className = "law-result notification-result";

  const head = document.createElement("div");
  head.className = "law-result-head";

  const category = document.createElement("span");
  category.className = item.type === "Inmediata" ? "notification-badge immediate" : "notification-badge daily";
  category.textContent = item.type;

  const trigger = document.createElement("span");
  trigger.className = "law-match-badge";
  trigger.textContent = item.type === "Inmediata" ? "SOSPECHA" : "CONFIRMACIÓN";

  head.append(category, trigger);

  const title = document.createElement("h3");
  title.textContent = item.name;

  const text = document.createElement("p");
  text.textContent = item.trigger;

  card.append(head, title, text);

  if (item.aliases) {
    const aliases = document.createElement("div");
    aliases.className = "law-aliases";
    item.aliases.split(",").map((alias) => alias.trim()).filter(Boolean).forEach((alias) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = alias;
      aliases.append(tag);
    });
    card.append(aliases);
  }

  return card;
}

function renderMandatoryNotificationResults(container, query = "", type = "Todos") {
  const matches = mandatoryNotificationMatches(query, type);
  container.innerHTML = "";

  const meta = document.createElement("div");
  meta.className = "results-meta";
  meta.textContent = `${matches.length} patología${matches.length === 1 ? "" : "s"} encontrada${matches.length === 1 ? "" : "s"}`;
  container.append(meta);

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No encontré coincidencias. Prueba con otro nombre, sigla o sinónimo.";
    container.append(empty);
    return;
  }

  const groups = ["Inmediata", "Diaria"];
  groups.forEach((groupName) => {
    const items = matches.filter((item) => item.type === groupName);
    if (!items.length) return;

    const section = document.createElement("section");
    section.className = "notification-section";
    const title = document.createElement("h2");
    title.textContent = groupName === "Inmediata" ? "Notificación inmediata" : "Notificación diaria";
    const grid = document.createElement("div");
    grid.className = "law-results";
    items.forEach((item) => grid.append(createMandatoryNotificationCard(item)));
    section.append(title, grid);
    container.append(section);
  });

  const actions = document.createElement("div");
  actions.className = "route-actions";

  const epivigila = document.createElement("a");
  epivigila.className = "back-link";
  epivigila.href = externalForms.notificacionObligatoriaUrl;
  epivigila.target = "_blank";
  epivigila.rel = "noopener noreferrer";
  epivigila.textContent = "Abrir EPIVIGILA";

  const back = document.createElement("a");
  back.className = "back-link";
  back.href = "#/formularios";
  back.textContent = "Volver a formularios";

  actions.append(epivigila, back);
  container.append(actions);
}

function renderMandatoryNotificationHome() {
  formsTitle.textContent = "Notificación obligatoria";
  turnFormsList.innerHTML = "";

  const panel = document.createElement("section");
  panel.className = "law-search-page notification-page";

  const nav = document.createElement("div");
  nav.className = "route-actions";

  const back = document.createElement("a");
  back.className = "back-link";
  back.href = "#/formularios";
  back.textContent = "Volver a formularios";

  const home = document.createElement("a");
  home.className = "back-link";
  home.href = "#/inicio";
  home.textContent = "Inicio";

  nav.append(back, home);

  const stage = document.createElement("section");
  stage.className = "law-search-stage";

  const title = document.createElement("h2");
  title.textContent = "Patologías de notificación obligatoria";

  const text = document.createElement("p");
  text.textContent = "Consulta si una patología requiere notificación inmediata por sospecha o diaria por confirmación. Para notificar, ingresa a EPIVIGILA.";

  const actions = document.createElement("div");
  actions.className = "law-actions";

  const epivigila = document.createElement("a");
  epivigila.className = "law-action-button active";
  epivigila.href = externalForms.notificacionObligatoriaUrl;
  epivigila.target = "_blank";
  epivigila.rel = "noopener noreferrer";
  epivigila.textContent = "Abrir EPIVIGILA";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "law-action-button";
  allButton.dataset.notificationType = "Todos";
  allButton.textContent = "Todas";

  const immediateButton = document.createElement("button");
  immediateButton.type = "button";
  immediateButton.className = "law-action-button";
  immediateButton.dataset.notificationType = "Inmediata";
  immediateButton.textContent = "Inmediatas";

  const dailyButton = document.createElement("button");
  dailyButton.type = "button";
  dailyButton.className = "law-action-button";
  dailyButton.dataset.notificationType = "Diaria";
  dailyButton.textContent = "Diarias";

  actions.append(epivigila, allButton, immediateButton, dailyButton);

  const form = document.createElement("form");
  form.className = "law-search-form";
  form.innerHTML = `
    <input name="q" type="search" placeholder="Ej: hantavirus, sarampión, VIH, tuberculosis..." autocomplete="off">
    <button class="law-action-button active" type="submit">Buscar</button>
  `;

  const results = document.createElement("div");
  results.className = "notification-results";
  results.hidden = true;

  const preview = document.createElement("div");
  preview.className = "law-live-results";

  let selectedType = "Todos";
  const input = form.querySelector("input");
  const renderResults = () => {
    results.hidden = false;
    renderMandatoryNotificationResults(results, input.value, selectedType);
  };
  const renderPreview = () => {
    results.hidden = true;
    results.innerHTML = "";
    renderSearchPreview(preview, input.value, mandatoryNotificationDiseases, {
      linkUrl: externalForms.notificacionObligatoriaUrl
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResults();
  });
  input.addEventListener("input", renderPreview);
  actions.querySelectorAll("[data-notification-type]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedType = button.dataset.notificationType;
      actions.querySelectorAll("[data-notification-type]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      renderResults();
    });
  });
  allButton.classList.add("active");

  stage.append(title, text, actions, form, preview);
  panel.append(nav, stage, results);
  turnFormsList.append(panel);
  renderPreview();
}

function renderEmergencyLawHome() {
  formsTitle.textContent = "Ley de Urgencias";
  turnFormsList.innerHTML = "";

  const form = turnForms.find((item) => item.type === "emergencyLaw");
  const panel = document.createElement("section");
  panel.className = "law-hero-panel";

  const alert = document.createElement("div");
  alert.className = "law-alert";
  alert.textContent = "Al activar Ley de Urgencias, avisar a jefe de turno y Gestión de Camas.";

  const title = document.createElement("h2");
  title.textContent = "Tres pasos, sin vueltas";

  const text = document.createElement("p");
  text.textContent = "Busca la condición, confirma en el Decreto 34 y deja los formularios listos cuando tengamos los enlaces institucionales.";

  const actions = document.createElement("div");
  actions.className = "law-menu";

  const search = document.createElement("a");
  search.className = "law-menu-card primary";
  search.href = "#/formularios/ley-urgencias/buscar";
  search.innerHTML = "<span class=\"law-step\">1</span><strong>Buscar patología</strong><span>Siglas, sinónimos y diagnósticos relacionados</span>";

  const decree = document.createElement("a");
  decree.className = "law-menu-card";
  decree.href = form.decreeUrl;
  decree.target = "_blank";
  decree.rel = "noopener noreferrer";
  decree.innerHTML = "<span class=\"law-step\">2</span><strong>Decreto 34</strong><span>PDF completo incluido en la app</span>";

  const forms = document.createElement("a");
  forms.className = "law-menu-card";
  forms.href = "#/formularios/ley-urgencias/formularios";
  forms.innerHTML = "<span class=\"law-step\">3</span><strong>Formularios</strong><span>Activación y consentimiento pendientes</span>";

  actions.append(search, decree, forms);
  panel.append(alert, title, text, actions);
  turnFormsList.append(panel);
}

function renderEmergencyLawSearch() {
  formsTitle.textContent = "Buscar Ley de Urgencias";
  turnFormsList.innerHTML = "";
  const query = hashParams().get("q") || "";

  const panel = document.createElement("section");
  panel.className = "law-search-page";

  const back = document.createElement("a");
  back.className = "back-link";
  back.href = "#/formularios/ley-urgencias";
  back.textContent = "Ley de Urgencias";

  const searchStage = document.createElement("div");
  searchStage.className = "law-search-stage";

  const title = document.createElement("h2");
  title.textContent = "Buscar y ajustar sin partir de cero";

  const note = document.createElement("p");
  note.textContent = "Escribe una palabra o sigla: la app busca coincidencias y sinónimos mientras escribes.";

  const form = document.createElement("form");
  form.className = "law-search-form";
  form.dataset.lawSearchForm = "true";

  const input = document.createElement("input");
  input.type = "search";
  input.name = "q";
  input.placeholder = "Diagnóstico, sigla o problema clínico";
  input.autocomplete = "off";
  input.value = query;

  const button = document.createElement("button");
  button.type = "submit";
  button.className = "document-button";
  button.textContent = "Buscar";

  form.append(input, button);

  const helper = document.createElement("p");
  helper.className = "law-note";
  helper.textContent = "Puedes volver desde resultados y modificar la misma búsqueda. Confirmar siempre con Decreto 34 y criterio clínico.";

  const liveResults = document.createElement("div");
  liveResults.className = "law-live-results";
  liveResults.dataset.lawLiveResults = "true";

  searchStage.append(title, note, form, helper, liveResults);
  renderEmergencyLawLiveResults(liveResults, query);

  const shortcuts = document.createElement("div");
  shortcuts.className = "law-shortcuts";

  const shortcutsHead = document.createElement("div");
  shortcutsHead.className = "law-shortcuts-head";

  const shortcutsTitle = document.createElement("h3");
  shortcutsTitle.textContent = "También puedes entrar por sistema";

  const shortcutsText = document.createElement("p");
  shortcutsText.textContent = "Sirve cuando no recuerdas el nombre exacto o quieres revisar un grupo clínico.";

  shortcutsHead.append(shortcutsTitle, shortcutsText);

  const shortcutsGrid = document.createElement("div");
  shortcutsGrid.className = "law-shortcut-grid";

  emergencyLawGroups.forEach((group) => {
    const link = document.createElement("a");
    link.className = "law-shortcut-card";
    link.href = `#/formularios/ley-urgencias/resultados?grupo=${encodeURIComponent(group.id)}`;

    const linkTitle = document.createElement("strong");
    linkTitle.textContent = group.title;

    const description = document.createElement("span");
    description.textContent = group.description;

    link.append(linkTitle, description);
    shortcutsGrid.append(link);
  });

  shortcuts.append(shortcutsHead, shortcutsGrid);
  panel.append(back, searchStage, shortcuts);
  turnFormsList.append(panel);
  input.focus();
}

function renderEmergencyLawResultsScreen() {
  formsTitle.textContent = "Resultados";
  turnFormsList.innerHTML = "";

  const params = hashParams();
  const query = params.get("q") || "";
  const groupId = params.get("grupo") || "";
  const group = emergencyLawGroupById(groupId);
  const matches = getEmergencyLawMatches(query, groupId);

  const panel = document.createElement("section");
  panel.className = "law-hero-panel compact";

  const back = document.createElement("a");
  back.className = "back-link";
  back.href = emergencyLawSearchEditUrl(query);
  back.textContent = query ? "Modificar búsqueda" : "Nueva búsqueda";

  const title = document.createElement("h2");
  if (query) title.textContent = `Resultados para "${query}"`;
  else if (group) title.textContent = group.title;
  else title.textContent = "Sin búsqueda";

  const meta = document.createElement("p");
  const matchWord = matches.length === 1 ? "coincidencia" : "coincidencias";
  const foundWord = matches.length === 1 ? "encontrada" : "encontradas";
  const orderedWord = matches.length === 1 ? "ordenada" : "ordenadas";
  const criteriaWord = matches.length === 1 ? "criterio" : "criterios";
  if (query && group) {
    meta.textContent = `${matches.length} ${matchWord} ${foundWord} dentro de ${group.title}.`;
  } else if (query) {
    meta.textContent = `${matches.length} ${matchWord} ${orderedWord} por probabilidad.`;
  } else if (group) {
    meta.textContent = `${matches.length} ${criteriaWord} asociados a este sistema.`;
  } else {
    meta.textContent = "Vuelve al buscador e ingresa una patología, sigla o diagnóstico.";
  }

  const revise = document.createElement("form");
  revise.className = "law-inline-search";
  revise.dataset.lawSearchForm = "true";

  const reviseInput = document.createElement("input");
  reviseInput.type = "search";
  reviseInput.name = "q";
  reviseInput.value = query;
  reviseInput.placeholder = "Ajustar búsqueda";
  reviseInput.autocomplete = "off";

  const reviseButton = document.createElement("button");
  reviseButton.type = "submit";
  reviseButton.className = "law-action-button";
  reviseButton.textContent = "Actualizar";

  revise.append(reviseInput, reviseButton);

  const actions = document.createElement("div");
  actions.className = "law-actions";

  const decree = document.createElement("a");
  decree.className = "document-button";
  decree.href = emergencyLawDecreeUrl;
  decree.target = "_blank";
  decree.rel = "noopener noreferrer";
  decree.textContent = "Abrir Decreto 34";

  actions.append(decree);
  panel.append(back, title, meta);
  if (query) panel.append(revise);
  turnFormsList.append(panel);

  if ((!query && !group) || !matches.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No encontré coincidencias. Prueba otra palabra, sigla o abre el Decreto 34 completo.";
    turnFormsList.append(empty, actions);
    return;
  }

  const results = document.createElement("div");
  results.className = "law-results";
  matches.slice(0, 18).forEach((item) => results.append(createEmergencyLawResultCard(item)));
  turnFormsList.append(results, actions);
}

function renderEmergencyLawForms() {
  formsTitle.textContent = "Formularios Ley de Urgencias";
  turnFormsList.innerHTML = "";

  const form = turnForms.find((item) => item.type === "emergencyLaw");
  const panel = document.createElement("section");
  panel.className = "law-hero-panel compact";

  const back = document.createElement("a");
  back.className = "back-link";
  back.href = "#/formularios/ley-urgencias";
  back.textContent = "Ley de Urgencias";

  const title = document.createElement("h2");
  title.textContent = "Formularios rellenables";

  const text = document.createElement("p");
  text.textContent = "Activacion de Ley de Urgencias y consentimiento de traslado listos para completar, guardar o imprimir.";

  const grid = document.createElement("div");
  grid.className = "law-form-grid";

  if (form.activationUrl) {
    const activation = document.createElement("a");
    activation.className = "document-button";
    activation.href = form.activationUrl;
    activation.target = "_blank";
    activation.rel = "noopener noreferrer";
    activation.textContent = "Abrir activación";
    grid.append(activation);
  } else {
    grid.append(createPendingAction("Activación pendiente", "Aquí se agregará el formulario de activación de Ley de Urgencias."));
  }

  if (form.consentUrl) {
    const consent = document.createElement("a");
    consent.className = "document-button";
    consent.href = form.consentUrl;
    consent.target = "_blank";
    consent.rel = "noopener noreferrer";
    consent.textContent = "Abrir consentimiento";
    grid.append(consent);
  } else {
    grid.append(createPendingAction("Consentimiento pendiente", "Aquí se agregará el consentimiento cuando esté disponible."));
  }

  panel.append(back, title, text, grid);
  turnFormsList.append(panel);
}

function renderFormsRoute(parts = []) {
  if (!parts.length) {
    renderTurnForms();
    return;
  }

  if (parts[0] === "notificacion-obligatoria") {
    renderMandatoryNotificationHome();
    return;
  }

  if (parts[0] !== "ley-urgencias") {
    renderTurnForms();
    return;
  }

  if (parts[1] === "buscar") renderEmergencyLawSearch();
  else if (parts[1] === "resultados") renderEmergencyLawResultsScreen();
  else if (parts[1] === "formularios") renderEmergencyLawForms();
  else renderEmergencyLawHome();
}

function resetFormsHeading() {
  formsTitle.textContent = "Formularios de turno";
}

function renderTurnForms() {
  resetFormsHeading();
  turnFormsList.innerHTML = "";

  turnForms.forEach((form) => {
    if (form.type === "emergencyLaw") {
      turnFormsList.append(renderEmergencyLawForm(form));
      return;
    }
    if (form.type === "mandatoryNotification") {
      turnFormsList.append(renderMandatoryNotificationForm(form));
      return;
    }

    const panel = document.createElement("section");
    panel.className = "document-panel";

    const title = document.createElement("h2");
    title.textContent = form.title;

    const description = document.createElement("p");
    description.textContent = form.description;

    const action = document.createElement("div");
    action.className = "document-action";

    if (form.url) {
      const link = document.createElement("a");
      link.className = "document-button";
      link.href = form.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = form.actionLabel;
      action.append(link);
    } else {
      const pending = document.createElement("span");
      pending.className = "document-button-disabled";
      pending.textContent = "Pendiente de configurar";

      const note = document.createElement("p");
      note.textContent = "Cuando tengas el enlace, se agrega una sola vez en la configuración de formularios.";

      action.append(pending, note);
    }

    panel.append(title, description, action);
    turnFormsList.append(panel);
  });
}
