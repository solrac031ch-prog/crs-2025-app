(function () {
  const targetHash = "#/especialidad/antes-de-derivar";
  const specialtiesHash = "#/especialidades";
  const renderDelays = [0, 80, 260, 700];

  function isTargetRoute() {
    return window.location.hash.startsWith(targetHash);
  }

  function isSpecialtiesRoute() {
    return window.location.hash.startsWith(specialtiesHash);
  }

  function quickProtocolMarkup() {
    return `
      <section class="quick-protocol">
        <div class="quick-hero">
          <div>
            <p class="detail-label">Chequeo en 20 segundos</p>
            <h2>Antes de derivar</h2>
            <p>CRS por Pitagoras o APS.</p>
          </div>
          <span class="quick-page">p. 2</span>
        </div>

        <div class="quick-decision">
          <div class="decision-question">
            <span>1</span>
            <div>
              <strong>&iquest;El paciente entra en un flujo CRS?</strong>
              <small>Sigue por IC en Pitagoras.</small>
            </div>
          </div>
          <div class="decision-options">
            <button class="decision-option is-yes" data-focus-protocol-search type="button">
              <strong>Si</strong>
              <span>Buscar flujo</span>
            </button>
            <button class="decision-option is-no" type="button">
              <strong>No</strong>
              <span>Derivar a APS</span>
            </button>
          </div>
        </div>

        <div class="quick-card-grid">
          <article class="quick-card quick-card-good">
            <span class="quick-number">1</span>
            <small>Paso seguro</small>
            <strong>Sistema valido</strong>
            <p>Toda derivacion se realiza por Pitagoras.</p>
          </article>
          <article class="quick-card quick-card-alert">
            <span class="quick-number">2</span>
            <small>Evitar</small>
            <strong>No validado</strong>
            <p>Otros sistemas no estan validados administrativamente.</p>
          </article>
          <article class="quick-card quick-card-route">
            <span class="quick-number">3</span>
            <small>Salida rapida</small>
            <strong>Fuera de flujo</strong>
            <p>Si no entra en los flujos descritos, derivar a APS.</p>
          </article>
        </div>

        <div class="quick-warning">
          <span>Alerta</span>
          <strong>IC directa no Pitagoras: se devuelve.</strong>
        </div>

        <div class="tags">
          <span class="tag">Reglas</span>
          <span class="tag">Pitagoras</span>
          <span class="tag">APS</span>
          <span class="tag">IC</span>
        </div>
      </section>
    `;
  }

  function renderQuickProtocol() {
    if (!isTargetRoute()) return;

    const detail = document.querySelector("#protocolDetail");
    if (!detail) return;

    const title = document.querySelector("#protocolTitle");
    const category = document.querySelector("#protocolCategory");
    if (title) title.textContent = "Antes de derivar";
    if (category) category.textContent = "Regla general · p. 2";

    if (detail.querySelector(".quick-protocol")) return;

    detail.innerHTML = quickProtocolMarkup();
  }

  function renderSpecialtiesQuickRules() {
    if (!isSpecialtiesRoute()) return;

    const rules = document.querySelector("#rulesPreview");
    if (!rules) return;

    rules.classList.add("quick-rules");
    if (rules.querySelector(".quick-protocol")) return;

    rules.innerHTML = quickProtocolMarkup();
  }

  function scheduleRender() {
    renderDelays.forEach((delay) => {
      window.setTimeout(renderQuickProtocol, delay);
      window.setTimeout(renderSpecialtiesQuickRules, delay);
    });
  }

  function watchProtocolDetail() {
    const detail = document.querySelector("#protocolDetail");
    if (!detail || detail.dataset.quickProtocolWatch) return;
    detail.dataset.quickProtocolWatch = "true";

    const observer = new MutationObserver(() => {
      if (isTargetRoute() && !detail.querySelector(".quick-protocol")) {
        window.setTimeout(renderQuickProtocol, 0);
      }
    });
    observer.observe(detail, { childList: true, subtree: false });
  }

  function watchRulesPreview() {
    const rules = document.querySelector("#rulesPreview");
    if (!rules || rules.dataset.quickRulesWatch) return;
    rules.dataset.quickRulesWatch = "true";

    const observer = new MutationObserver(() => {
      if (isSpecialtiesRoute() && !rules.querySelector(".quick-protocol")) {
        window.setTimeout(renderSpecialtiesQuickRules, 0);
      }
    });
    observer.observe(rules, { childList: true, subtree: false });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-focus-protocol-search]");
    if (!button) return;

    if (!isSpecialtiesRoute()) {
      window.location.hash = specialtiesHash;
      window.setTimeout(() => document.querySelector("#searchInput")?.focus(), 120);
      return;
    }

    document.querySelector("#searchInput")?.focus();
  });

  window.addEventListener("hashchange", scheduleRender);
  window.addEventListener("DOMContentLoaded", () => {
    watchProtocolDetail();
    watchRulesPreview();
    scheduleRender();
  });

  watchProtocolDetail();
  watchRulesPreview();
  scheduleRender();
})();

(function () {
  const specialtiesHash = "#/especialidades";
  const protocolPrefix = "#/especialidad/";
  const categoryOrder = ["Flujo", "CRS", "Poli choque", "Hospitalizados", "Protocolo"];
  const categoryLabels = {
    Flujo: "Flujos",
    CRS: "CRS",
    "Poli choque": "Poli choque",
    Hospitalizados: "Hospitalizados",
    Protocolo: "Protocolos"
  };
  const renameMap = new Map([
    ["Hemorragia intracerebral", "Neurocirugia"],
    ["Patologia aguda de columna", "Cirugia de columna"],
    ["Patología aguda de columna", "Cirugia de columna"],
    ["Radiologia Intervencional 2025", "Radiologia intervencional"],
    ["Radiología Intervencional 2025", "Radiologia intervencional"],
    ["Patologia urologia de urgencia 2025", "Urgencias urologicas"],
    ["Patología urología de urgencia 2025", "Urgencias urologicas"],
    ["Hemodinamia 2025", "Hemodinamia"],
    ["EDA", "Endoscopia de urgencias"],
    ["Hemorragia digestiva alta", "Endoscopia de urgencias"]
  ]);
  const routeAliases = new Map([
    ["endoscopia-de-urgencias", "eda"],
    ["hemodinamia", "hemodinamia-2025"],
    ["neurocirugia", "hemorragia-intracerebral"],
    ["cirugia-de-columna", "patologia-aguda-de-columna"],
    ["urgencias-urologicas", "patologia-urologia-de-urgencia-2025"],
    ["radiologia-intervencional", "radiologia-intervencional-2025"]
  ]);
  const hdaTitles = new Set(["EDA", "Hemorragia digestiva alta", "Endoscopia de urgencias"]);
  const renderDelays = [0, 40, 120, 320, 800];

  function isSpecialtiesRoute() {
    return window.location.hash.startsWith(specialtiesHash);
  }

  function normalizeHashAlias() {
    if (!window.location.hash.startsWith(protocolPrefix)) return false;
    const slug = window.location.hash.slice(protocolPrefix.length).split("?")[0];
    const target = routeAliases.get(decodeURIComponent(slug));
    if (!target) return false;
    window.location.replace(protocolPrefix + target);
    return true;
  }

  function addStyles() {
    if (document.querySelector("#specialties-side-layout-style")) return;
    const style = document.createElement("style");
    style.id = "specialties-side-layout-style";
    style.textContent = `
      #specialtiesPage.active{display:grid;grid-template-columns:minmax(170px,220px) minmax(0,1fr);gap:14px;align-items:start}
      #specialtiesPage .page-head,#specialtiesPage #rulesPreview{grid-column:1 / -1}
      #specialtiesPage .control-panel{grid-column:2;grid-row:3;margin-bottom:0}
      #specialtiesPage .quick-actions{grid-column:1;grid-row:3 / span 3;display:grid;align-content:start;gap:8px;margin:0;position:sticky;top:96px}
      #specialtiesPage .quick-actions .chip{width:100%;min-height:44px;justify-content:flex-start;text-align:left;font-weight:800;white-space:normal}
      #specialtiesPage .quick-actions [data-category="Todos"]{display:none!important}
      #specialtiesPage #resultsMeta,#specialtiesPage #specialtyGroups{grid-column:2}
      #specialtiesPage .specialty-groups{min-height:220px}
      #specialtiesPage .specialty-button[hidden]{display:none!important}
      @media(max-width:780px){#specialtiesPage.active{display:block}#specialtiesPage .quick-actions{position:static;display:flex;overflow-x:auto;margin-bottom:12px}#specialtiesPage .quick-actions .chip{width:auto;min-width:max-content;white-space:nowrap}}
    `;
    document.head.append(style);
  }

  function ensureButton(quick, category) {
    let button = quick.querySelector(`[data-category="${category}"]`);
    if (!button) {
      button = document.createElement("button");
      button.className = "chip";
      button.type = "button";
      button.dataset.category = category;
      quick.appendChild(button);
    }
    const label = categoryLabels[category];
    if (button.textContent.trim() !== label) button.textContent = label;
    return button;
  }

  function patchCategoryButtons() {
    const quick = document.querySelector("#specialtiesPage .quick-actions");
    if (!quick) return;

    const todos = quick.querySelector('[data-category="Todos"]');
    if (todos) {
      if (!todos.hidden) todos.hidden = true;
      todos.classList.remove("active");
    }

    const desired = categoryOrder.map((category) => ensureButton(quick, category));
    const current = Array.from(quick.children).filter((child) => desired.includes(child));
    const alreadyOrdered = desired.every((button, index) => current[index] === button);
    if (!alreadyOrdered) {
      desired.forEach((button) => quick.appendChild(button));
    }

    if (!quick.dataset.defaultedToFlows && isSpecialtiesRoute()) {
      quick.dataset.defaultedToFlows = "true";
      const active = quick.querySelector(".chip.active");
      const flow = quick.querySelector('[data-category="Flujo"]');
      if (flow && (!active || active.dataset.category === "Todos")) flow.click();
    }
  }

  function patchSpecialtyCards() {
    document.querySelectorAll("#specialtyGroups .specialty-button").forEach((link) => {
      const strong = link.querySelector("strong");
      if (!strong) return;
      const current = strong.textContent.trim();
      if (current === "Hemorragia digestiva alta") {
        if (!link.hidden) link.hidden = true;
        return;
      }
      const replacement = renameMap.get(current);
      if (replacement && current !== replacement) strong.textContent = replacement;
    });
  }

  function makeField(title, text) {
    const field = document.createElement("div");
    field.className = "field";
    field.dataset.hdaUpgrade = "true";
    const strong = document.createElement("strong");
    strong.textContent = title;
    const span = document.createElement("span");
    span.textContent = text;
    field.append(strong, span);
    return field;
  }

  function patchEndoscopyDetail() {
    const title = document.querySelector("#protocolTitle");
    const detail = document.querySelector("#protocolDetail");
    if (!title || !detail) return;

    const originalTitle = title.textContent.trim();
    const replacement = renameMap.get(originalTitle);
    if (replacement && originalTitle !== replacement) title.textContent = replacement;

    if (!hdaTitles.has(originalTitle) && title.textContent.trim() !== "Endoscopia de urgencias") return;

    const summary = detail.querySelector(".protocol-summary");
    const summaryText = "Concentra EDA, hemorragia digestiva alta y criterios de endoscopia urgente.";
    if (summary && summary.textContent !== summaryText) summary.textContent = summaryText;

    const grid = detail.querySelector(".detail-section .grid");
    if (!grid || grid.querySelector('[data-hda-upgrade="true"]')) return;

    const fields = [
      ["Sospecha HDA", "Melena con o sin hematemesis."],
      ["EDA urgente", "Indicar EDA urgente si hay sospecha clinica de varices o shock hemorragico."],
      ["Blatchford 0-1", "Riesgo muy bajo: alta y control por Poli EDA segun juicio clinico."],
      ["Blatchford 2", "Riesgo bajo: controlar hemoglobina/BUN en 4 a 6 horas; si estable, alta y Poli EDA."],
      ["Blatchford >=3", "EDA antes de 24 horas."],
      ["Tratamiento base", "Si DHC: ceftriaxona 2 g. Si varices: terlipresina 1-2 mg EV. Transfusion restrictiva con meta Hb >7. Omeprazol 80 mg EV bolo."]
    ];
    fields.reverse().forEach(([fieldTitle, text]) => {
      grid.prepend(makeField(fieldTitle, text));
    });
  }

  function patchProtocolTitle() {
    const title = document.querySelector("#protocolTitle");
    if (!title) return;
    const current = title.textContent.trim();
    const replacement = renameMap.get(current);
    if (replacement && current !== replacement) title.textContent = replacement;
  }

  function patchSearchPlaceholder() {
    const input = document.querySelector("#searchInput");
    const text = "Ej: neurocirugia, hemodinamia, endoscopia, urologia...";
    if (input && input.placeholder !== text) input.placeholder = text;
  }

  function patchAll() {
    addStyles();
    patchCategoryButtons();
    patchSpecialtyCards();
    patchProtocolTitle();
    patchEndoscopyDetail();
    patchSearchPlaceholder();
  }

  function schedulePatch() {
    if (normalizeHashAlias()) return;
    renderDelays.forEach((delay) => window.setTimeout(patchAll, delay));
  }

  function watch() {
    if (document.body.dataset.specialtiesSideLayoutWatch) return;
    document.body.dataset.specialtiesSideLayoutWatch = "true";
    const observer = new MutationObserver(() => window.setTimeout(patchAll, 0));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("#specialtiesPage [data-category]")) {
      window.setTimeout(patchAll, 0);
      window.setTimeout(patchAll, 40);
      window.setTimeout(patchAll, 120);
    }
  });

  window.addEventListener("hashchange", schedulePatch);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      watch();
      schedulePatch();
    });
  } else {
    watch();
    schedulePatch();
  }
})();
