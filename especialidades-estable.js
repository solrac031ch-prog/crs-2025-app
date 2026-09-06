(() => {
  const pageSelector = "#specialtiesPage";
  const specialtiesHash = "#/especialidades";
  const protocolPrefix = "#/especialidad/";

  const categoryOrder = ["Flujo", "CRS", "Poli choque", "Hospitalizados", "Protocolo"];
  const categoryMeta = {
    Flujo: { label: "Flujos", icon: "⚡", color: "#0f766e", soft: "#dff5ef", text: "Algoritmos y rutas de acción rápida." },
    CRS: { label: "CRS", icon: "🏥", color: "#2563eb", soft: "#e6efff", text: "Derivaciones ambulatorias al CRS." },
    "Poli choque": { label: "Poli choque", icon: "🚨", color: "#b45309", soft: "#fff2d6", text: "Accesos de choque por especialidad." },
    Hospitalizados: { label: "Hospitalizados", icon: "🛏️", color: "#7c3aed", soft: "#f0e8ff", text: "Coordinación de pacientes hospitalizados." },
    Protocolo: { label: "Protocolos", icon: "📋", color: "#be123c", soft: "#ffe4eb", text: "Protocolos institucionales de respaldo." }
  };

  const renameMap = new Map([
    ["Hemorragia intracerebral", "Neurocirugía"],
    ["Patologia aguda de columna", "Cirugía de columna"],
    ["Patología aguda de columna", "Cirugía de columna"],
    ["Radiologia Intervencional 2025", "Radiología intervencional"],
    ["Radiología Intervencional 2025", "Radiología intervencional"],
    ["Patologia urologia de urgencia 2025", "Urgencias urológicas"],
    ["Patología urología de urgencia 2025", "Urgencias urológicas"],
    ["Hemodinamia 2025", "Hemodinamia"],
    ["EDA", "Endoscopia de urgencias"],
    ["Hemorragia digestiva alta", "Endoscopia de urgencias"]
  ]);

  const cardHints = new Map([
    ["Sala Pulso", "🩸 Transfusión y tratamientos ambulatorios"],
    ["Endoscopia de urgencias", "🔎 EDA, HDA y criterios Blatchford"],
    ["TVP - sospecha, ECO y horario inhabil", "🦵 Sospecha, ECO y ruta inhábil"],
    ["Neurologia", "🧠 ACV, neurointervención y donante"],
    ["Neurología", "🧠 ACV, neurointervención y donante"],
    ["Hemodinamia", "❤️ Activación y documento 2025"],
    ["Neurocirugía", "🧠 HIC y manejo inicial"],
    ["Cirugía de columna", "🦴 Patología aguda de columna"],
    ["Urgencias urológicas", "🚻 Flujo urológico urgente"],
    ["Radiología intervencional", "🖼️ Documento de radiología intervencional"]
  ]);

  const shortcuts = [
    ["🦵 TVP", "TVP"],
    ["🔎 Endoscopia", "endoscopia"],
    ["🧠 Neurocirugía", "neurocirugia"],
    ["❤️ Hemodinamia", "hemodinamia"],
    ["🚻 Urología", "urologia"]
  ];

  let queued = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const isSpecialties = () => location.hash.split("?")[0] === specialtiesHash;
  const isProtocol = () => location.hash.startsWith(protocolPrefix);
  const metaFor = (category) => categoryMeta[category] || categoryMeta.Flujo;

  function categoryCount(category) {
    if (!Array.isArray(protocols)) return 0;
    return protocols.filter((protocol) => {
      if (protocol.category !== category) return false;
      return protocol.title !== "Hemorragia digestiva alta";
    }).length;
  }

  function quickRulesMarkup() {
    return `<section class="quick-protocol"><div class="quick-hero"><div><p class="detail-label">Chequeo en 20 segundos</p><h2>Antes de derivar</h2><p>CRS por Pitágoras o APS.</p></div><span class="quick-page">p. 2</span></div><div class="quick-decision"><div class="decision-question"><span>1</span><div><strong>¿El paciente entra en un flujo CRS?</strong><small>Sigue por IC en Pitágoras.</small></div></div><div class="decision-options"><button class="decision-option is-yes" data-focus-specialty-search type="button"><strong>Sí</strong><span>Buscar flujo</span></button><button class="decision-option is-no" type="button"><strong>No</strong><span>Derivar a APS</span></button></div></div><div class="quick-warning"><span>Alerta</span><strong>IC directa no Pitágoras: se devuelve.</strong></div></section>`;
  }

  function ensureQuickRules(container) {
    const rules = $("#rulesPreview", container);
    if (!rules) return;
    rules.classList.add("quick-rules");
    if (!$(".quick-protocol", rules)) rules.innerHTML = quickRulesMarkup();
  }

  function ensureShortcuts(container) {
    if ($("#specialtyShortcutPanel", container)) return;
    const control = $(".control-panel", container);
    if (!control) return;
    const panel = document.createElement("div");
    panel.id = "specialtyShortcutPanel";
    panel.className = "specialty-shortcuts";
    panel.innerHTML = `<span class="shortcut-label">Atajos frecuentes</span>` + shortcuts
      .map(([label, query]) => `<button class="shortcut-chip" type="button" data-specialty-query="${query}">${label}</button>`)
      .join("");
    control.after(panel);
  }

  function ensureFocus(container) {
    if ($("#specialtyFocusCard", container)) return;
    const anchor = $("#specialtyShortcutPanel", container) || $(".control-panel", container);
    if (!anchor) return;
    const panel = document.createElement("section");
    panel.id = "specialtyFocusCard";
    panel.className = "specialty-focus-card";
    panel.innerHTML = `<div><span data-focus-label>⚡ Flujos</span><h3 data-focus-title>Flujos disponibles</h3><p data-focus-text>Algoritmos y rutas de acción rápida.</p></div><div class="focus-count" data-focus-count>0</div>`;
    anchor.after(panel);
  }

  function ensureCategoryButtons(container) {
    const quick = $(".quick-actions", container);
    if (!quick) return;
    const todos = quick.querySelector('[data-category="Todos"]');
    if (todos) {
      todos.hidden = true;
      todos.classList.remove("active");
      todos.setAttribute("aria-pressed", "false");
    }

    categoryOrder.forEach((category) => {
      let button = quick.querySelector(`[data-category="${category}"]`);
      if (!button) {
        button = document.createElement("button");
        button.className = "chip";
        button.type = "button";
        button.dataset.category = category;
        button.setAttribute("aria-pressed", "false");
        quick.append(button);
      }
      const meta = metaFor(category);
      const count = categoryCount(category);
      button.style.setProperty("--cat-color", meta.color);
      button.style.setProperty("--cat-soft", meta.soft);
      const html = `<span class="cat-code">${meta.icon}</span><span class="cat-copy"><strong>${meta.label}</strong><small>${count} ${count === 1 ? "ruta" : "rutas"}</small></span>`;
      if (button.innerHTML !== html) button.innerHTML = html;
    });

    if (!quick.dataset.stableDefaulted) {
      quick.dataset.stableDefaulted = "true";
      const flow = quick.querySelector('[data-category="Flujo"]');
      const active = quick.querySelector(".chip.active");
      if (flow && (!active || active.dataset.category === "Todos")) {
        const y = window.scrollY;
        flow.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "auto" }));
      }
    }
  }

  function currentCategory(container) {
    const active = $(".quick-actions [data-category].active", container);
    return active?.dataset.category || "Flujo";
  }

  function visibleCount(container) {
    return $$("#specialtyGroups .specialty-button:not([hidden])", container).length;
  }

  function decorateCards(container) {
    $$("#specialtyGroups .specialty-button", container).forEach((link) => {
      const strong = $("strong", link);
      if (!strong) return;
      const original = strong.textContent.trim();
      if (original === "Hemorragia digestiva alta") {
        link.hidden = true;
        return;
      }
      const renamed = renameMap.get(original) || original;
      if (strong.textContent !== renamed) strong.textContent = renamed;
      const sectionLabel = link.closest(".category-section")?.querySelector(".category-title")?.textContent.trim();
      const category = sectionLabel === "Flujos"
        ? "Flujo"
        : sectionLabel === "Protocolos"
          ? "Protocolo"
          : sectionLabel || currentCategory(container);
      const meta = metaFor(category);
      link.classList.add("specialty-card-upgraded");
      link.style.setProperty("--card-accent", meta.color);
      link.style.setProperty("--card-soft", meta.soft);
      const sticker = $(".specialty-sticker", link);
      if (sticker && sticker.textContent.trim() !== meta.icon) sticker.textContent = meta.icon;
      let hint = $(".specialty-card-hint", link);
      if (!hint) {
        hint = document.createElement("span");
        hint.className = "specialty-card-hint";
        link.append(hint);
      }
      const hintText = cardHints.get(renamed) || `${meta.icon} ${meta.text}`;
      if (hint.textContent !== hintText) hint.textContent = hintText;
      let route = $(".specialty-card-route", link);
      if (!route) {
        route = document.createElement("span");
        route.className = "specialty-card-route";
        link.append(route);
      }
      if (route.textContent !== meta.label) route.textContent = meta.label;
    });
  }

  function updateFocus(container) {
    const category = currentCategory(container);
    const meta = metaFor(category);
    const count = visibleCount(container);
    container.style.setProperty("--focus-color", meta.color);
    const setText = (selector, text) => {
      const node = $(selector, container);
      if (node && node.textContent !== text) node.textContent = text;
    };
    setText("[data-focus-label]", `${meta.icon} ${meta.label}`);
    setText("[data-focus-title]", `${meta.label} disponibles`);
    setText("[data-focus-text]", meta.text);
    setText("[data-focus-count]", String(count));
  }

  function signalReady(section) {
    window.dispatchEvent(new CustomEvent("crs:ui-section-ready", {
      detail: { route: location.hash.split("?")[0], section }
    }));
  }

  function patchSpecialties() {
    if (!isSpecialties()) return false;
    const container = $(pageSelector);
    if (!container || !container.classList.contains("active")) return false;
    container.classList.add("specialty-stable");
    ensureQuickRules(container);
    ensureShortcuts(container);
    ensureFocus(container);
    ensureCategoryButtons(container);
    decorateCards(container);
    updateFocus(container);
    signalReady("especialidades");
    return true;
  }

  function patchProtocolTitle() {
    if (!isProtocol()) return false;
    const title = $("#protocolTitle");
    if (!title) return false;
    const current = title.textContent.trim();
    const renamed = renameMap.get(current);
    if (renamed && current !== renamed) title.textContent = renamed;
    if (renamed === "Endoscopia de urgencias") {
      const summary = $("#protocolDetail .protocol-summary");
      if (summary) summary.textContent = "Concentra EDA, hemorragia digestiva alta y criterios de endoscopia urgente.";
    }
    signalReady("protocolo");
    return true;
  }

  function patch() {
    return patchSpecialties() || patchProtocolTitle();
  }

  function schedulePatch() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      patch();
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(`${pageSelector} [data-category]`) || event.target.closest(`${pageSelector} [data-shift]`)) {
      schedulePatch();
    }

    const shortcut = event.target.closest("[data-specialty-query]");
    const focusSearch = event.target.closest("[data-focus-specialty-search]");
    if (shortcut || focusSearch) {
      const input = $("#searchInput");
      if (!input) return;
      if (shortcut) input.value = shortcut.dataset.specialtyQuery || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus({ preventScroll: true });
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.closest(`${pageSelector} #searchInput`)) schedulePatch();
  });

  window.CRS_ESPECIALIDADES_ESTABLE = Object.freeze({
    refresh: schedulePatch
  });
})();