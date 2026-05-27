(() => {
  const pageSelector = "#specialtiesPage";
  const specialtiesHash = "#/especialidades";
  const protocolPrefix = "#/especialidad/";

  const categoryOrder = ["Flujo", "CRS", "Poli choque", "Hospitalizados", "Protocolo"];
  const categoryMeta = {
    Flujo: { label: "Flujos", icon: "⚡", count: "12", color: "#0f766e", soft: "#dff5ef", text: "Algoritmos y rutas de accion rapida." },
    CRS: { label: "CRS", icon: "🏥", count: "4", color: "#2563eb", soft: "#e6efff", text: "Derivaciones ambulatorias al CRS." },
    "Poli choque": { label: "Poli choque", icon: "🚨", count: "4", color: "#b45309", soft: "#fff2d6", text: "Accesos de choque por especialidad." },
    Hospitalizados: { label: "Hospitalizados", icon: "🛏️", count: "1", color: "#7c3aed", soft: "#f0e8ff", text: "Coordinacion de pacientes hospitalizados." },
    Protocolo: { label: "Protocolos", icon: "📋", count: "4", color: "#be123c", soft: "#ffe4eb", text: "Protocolos institucionales de respaldo." }
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

  const cardHints = new Map([
    ["Sala Pulso", "🩸 Transfusion y tratamientos ambulatorios"],
    ["Endoscopia de urgencias", "🔎 EDA, HDA y criterios Blatchford"],
    ["TVP - sospecha, ECO y horario inhabil", "🦵 Sospecha, ECO y ruta inhabil"],
    ["Neurologia", "🧠 ACV, neurointervencion y donante"],
    ["Hemodinamia", "❤️ Activacion y documento 2025"],
    ["Neurocirugia", "🧠 HIC y manejo inicial"],
    ["Cirugia de columna", "🦴 Patologia aguda de columna"],
    ["Urgencias urologicas", "🚻 Flujo urologico urgente"],
    ["Radiologia intervencional", "🖼️ Documento de radiologia intervencional"]
  ]);

  const shortcuts = [
    ["🦵 TVP", "TVP"],
    ["🔎 Endoscopia", "endoscopia"],
    ["🧠 Neurocirugia", "neurocirugia"],
    ["❤️ Hemodinamia", "hemodinamia"],
    ["🚻 Urologia", "urologia"]
  ];

  let queued = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const isSpecialties = () => location.hash.split("?")[0] === specialtiesHash;
  const isProtocol = () => location.hash.startsWith(protocolPrefix);
  const metaFor = (category) => categoryMeta[category] || categoryMeta.Flujo;

  function addStyle() {
    if ($("#especialidades-estable-style")) return;
    const style = document.createElement("style");
    style.id = "especialidades-estable-style";
    style.textContent = `
      #specialtiesPage.specialty-stable.active{display:grid;grid-template-columns:minmax(190px,230px) minmax(0,1fr);gap:16px;align-items:start;--hub-muted:#5f666f;--hub-line:#d9ddd8}
      #specialtiesPage.specialty-stable .page-head{grid-column:1/-1;margin-bottom:0;padding:12px 0 2px}.specialty-lift-hero{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;padding:18px clamp(16px,3vw,24px);color:#fff;background:linear-gradient(135deg,#10231f,#0f3b35);border-bottom:6px solid #2dd4bf;border-radius:12px;box-shadow:0 14px 34px rgba(16,18,20,.16)}.specialty-lift-hero h2{margin:4px 0 6px;font-size:clamp(1.55rem,3vw,2.35rem);line-height:1.04}.specialty-lift-hero p{margin:0;color:#d8e9e4}.hub-kicker{color:#9ee7da;font-size:.78rem;font-weight:900;text-transform:uppercase}.hub-stats{display:grid;grid-template-columns:repeat(2,minmax(98px,1fr));gap:9px}.hub-stat{display:grid;gap:4px;min-height:72px;padding:10px 12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:10px}.hub-stat span{color:#bdeee5;font-size:.72rem;font-weight:900;text-transform:uppercase}.hub-stat strong{font-size:1.25rem}.hub-stat b{font-size:1.55rem}
      #specialtiesPage.specialty-stable #rulesPreview.quick-rules{grid-column:1/-1;margin:0}.specialty-stable #rulesPreview .quick-protocol{display:grid;grid-template-columns:minmax(230px,.95fr) minmax(260px,1.05fr);gap:10px}.specialty-stable #rulesPreview .quick-hero{min-height:118px;padding:15px;background:#fff;color:#10231f;border:1px solid var(--hub-line);border-left:6px solid #0f766e}.specialty-stable #rulesPreview .quick-card-grid,.specialty-stable #rulesPreview .tags{display:none}.specialty-stable #rulesPreview .quick-warning{grid-column:1/-1;margin-top:-2px}
      #specialtiesPage.specialty-stable .control-panel{grid-column:2;margin:0;display:grid;grid-template-columns:minmax(260px,1fr) minmax(220px,.42fr);gap:12px}.specialty-stable .control-panel .search,.specialty-stable .control-panel .shift-box{border:1px solid #cfd8d4;background:#fff;box-shadow:0 10px 24px rgba(16,18,20,.07)}.specialty-stable .search input{min-height:50px;border-width:2px;background:#fbfffd}.specialty-shortcuts{grid-column:2;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 0 2px}.shortcut-label{color:var(--hub-muted);font-size:.78rem;font-weight:900;text-transform:uppercase}.shortcut-chip{min-height:36px;padding:0 11px;color:#0b3b36;background:#e2f7f2;border:1px solid #ace4da;border-radius:999px;font-weight:850;cursor:pointer}
      .specialty-focus-card{grid-column:2;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 16px;background:#fff;border:1px solid #d8dfdb;border-left:7px solid var(--focus-color,#0f766e);border-radius:10px;box-shadow:0 10px 24px rgba(16,18,20,.07)}.specialty-focus-card span{color:var(--focus-color,#0f766e);font-size:.78rem;font-weight:900;text-transform:uppercase}.specialty-focus-card h3{margin:2px 0 4px;font-size:1.16rem}.specialty-focus-card p{margin:0;color:var(--hub-muted)}.focus-count{min-width:66px;display:grid;place-items:center;padding:10px;color:#fff;background:var(--focus-color,#0f766e);border-radius:10px;font-size:1.55rem;font-weight:950}
      #specialtiesPage.specialty-stable .quick-actions{grid-column:1;grid-row:4 / span 5;display:grid;gap:10px;margin:0;position:sticky;top:92px;align-content:start}.specialty-stable .quick-actions [data-category="Todos"]{display:none!important}.specialty-stable .quick-actions .chip{width:100%;min-height:62px;display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center;justify-content:start;padding:9px 10px;text-align:left;white-space:normal;background:#fff;border:1px solid #d7dfda;border-left:6px solid var(--cat-color,#0f766e);border-radius:10px;box-shadow:0 8px 18px rgba(16,18,20,.06)}.specialty-stable .quick-actions .chip.active{background:var(--cat-soft,#dff5ef);border-color:var(--cat-color,#0f766e)}.cat-code{width:38px;height:38px;display:grid;place-items:center;color:#fff;background:var(--cat-color,#0f766e);border-radius:10px;font-weight:950;font-size:1.15rem}.cat-copy{display:grid;gap:2px;min-width:0}.cat-copy strong{font-size:.98rem;line-height:1.12}.cat-copy small{color:var(--hub-muted);font-size:.75rem;font-weight:850;line-height:1.15}
      #specialtiesPage.specialty-stable #resultsMeta{grid-column:2;margin:0;color:#475569;font-weight:850}.specialty-stable #specialtyGroups{grid-column:2;min-height:260px}.specialty-stable .specialty-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.specialty-card-upgraded{position:relative;min-height:116px;display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:12px;padding:14px;background:#fff;border:1px solid #d8dfdb;border-top:5px solid var(--card-accent,#0f766e);border-radius:10px;box-shadow:0 10px 22px rgba(16,18,20,.08);text-decoration:none}.specialty-card-upgraded .specialty-sticker{width:52px;height:52px;border-radius:12px;background:var(--card-accent,#0f766e);font-size:1.35rem}.specialty-card-upgraded strong{font-size:1.03rem;line-height:1.16}.specialty-card-hint{display:block;margin-top:5px;color:#64706b;font-size:.84rem;font-weight:700;line-height:1.28}.specialty-card-route{position:absolute;right:10px;bottom:9px;padding:4px 7px;color:var(--card-accent,#0f766e);background:var(--card-soft,#dff5ef);border-radius:999px;font-size:.7rem;font-weight:900;text-transform:uppercase}.specialty-card-upgraded[hidden]{display:none!important}
      @media(max-width:900px){#specialtiesPage.specialty-stable.active{display:block}.specialty-lift-hero,.specialty-stable #rulesPreview .quick-protocol,.specialty-stable .control-panel,.specialty-focus-card{grid-template-columns:1fr}.specialty-stable .quick-actions{position:static!important;display:flex!important;overflow-x:auto;margin:0 0 12px}.specialty-stable .quick-actions .chip{min-width:178px}.hub-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
    document.head.append(style);
  }

  function quickRulesMarkup() {
    return `<section class="quick-protocol"><div class="quick-hero"><div><p class="detail-label">Chequeo en 20 segundos</p><h2>Antes de derivar</h2><p>CRS por Pitagoras o APS.</p></div><span class="quick-page">p. 2</span></div><div class="quick-decision"><div class="decision-question"><span>1</span><div><strong>¿El paciente entra en un flujo CRS?</strong><small>Sigue por IC en Pitagoras.</small></div></div><div class="decision-options"><button class="decision-option is-yes" data-focus-specialty-search type="button"><strong>Si</strong><span>Buscar flujo</span></button><button class="decision-option is-no" type="button"><strong>No</strong><span>Derivar a APS</span></button></div></div><div class="quick-warning"><span>Alerta</span><strong>IC directa no Pitagoras: se devuelve.</strong></div></section>`;
  }

  function ensureHero(container) {
    if ($(".specialty-lift-hero", container)) return;
    const hero = document.createElement("section");
    hero.className = "specialty-lift-hero";
    hero.innerHTML = `<div><span class="hub-kicker">🩺 Turno adulto HPH</span><h2>Rutas clinicas en accion ⚡</h2><p>Flujos, CRS, poli choque, hospitalizados y protocolos institucionales en una sola vista.</p></div><div class="hub-stats"><div class="hub-stat"><span>Vista activa</span><strong data-hub-active>Flujos</strong></div><div class="hub-stat"><span>Disponibles</span><b data-hub-count>0</b></div></div>`;
    $(".page-head", container)?.after(hero);
  }

  function ensureQuickRules(container) {
    const rules = $("#rulesPreview", container);
    if (!rules) return;
    rules.classList.add("quick-rules");
    if (!$('.quick-protocol', rules)) rules.innerHTML = quickRulesMarkup();
  }

  function ensureShortcuts(container) {
    if ($("#specialtyShortcutPanel", container)) return;
    const control = $(".control-panel", container);
    if (!control) return;
    const panel = document.createElement("div");
    panel.id = "specialtyShortcutPanel";
    panel.className = "specialty-shortcuts";
    panel.innerHTML = `<span class="shortcut-label">Atajos frecuentes</span>` + shortcuts.map(([label, query]) => `<button class="shortcut-chip" type="button" data-specialty-query="${query}">${label}</button>`).join("");
    control.after(panel);
  }

  function ensureFocus(container) {
    if ($("#specialtyFocusCard", container)) return;
    const anchor = $("#specialtyShortcutPanel", container) || $(".control-panel", container);
    if (!anchor) return;
    const panel = document.createElement("section");
    panel.id = "specialtyFocusCard";
    panel.className = "specialty-focus-card";
    panel.innerHTML = `<div><span data-focus-label>⚡ Flujos</span><h3 data-focus-title>Flujos disponibles</h3><p data-focus-text>Algoritmos y rutas de accion rapida.</p></div><div class="focus-count" data-focus-count>0</div>`;
    anchor.after(panel);
  }

  function ensureCategoryButtons(container) {
    const quick = $(".quick-actions", container);
    if (!quick) return;
    const todos = quick.querySelector('[data-category="Todos"]');
    if (todos) {
      todos.hidden = true;
      todos.classList.remove("active");
    }
    categoryOrder.forEach((category) => {
      let button = quick.querySelector(`[data-category="${category}"]`);
      if (!button) {
        button = document.createElement("button");
        button.className = "chip";
        button.type = "button";
        button.dataset.category = category;
        quick.append(button);
      }
      const meta = metaFor(category);
      button.style.setProperty("--cat-color", meta.color);
      button.style.setProperty("--cat-soft", meta.soft);
      const html = `<span class="cat-code">${meta.icon}</span><span class="cat-copy"><strong>${meta.label}</strong><small>${meta.count} rutas</small></span>`;
      if (button.innerHTML !== html) button.innerHTML = html;
    });

    if (!quick.dataset.stableDefaulted) {
      quick.dataset.stableDefaulted = "true";
      const flow = quick.querySelector('[data-category="Flujo"]');
      const active = quick.querySelector(".chip.active");
      if (flow && (!active || active.dataset.category === "Todos")) {
        const y = window.scrollY;
        flow.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "instant" }));
      }
    }
  }

  function currentCategory(container) {
    const active = $(".quick-actions [data-category].active", container);
    return active?.dataset.category || "Flujo";
  }

  function visibleCount() {
    const text = $("#resultsMeta")?.textContent || "";
    const match = text.match(/\d+/);
    return match ? match[0] : "0";
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
      const category = sectionLabel === "Flujos" ? "Flujo" : sectionLabel === "Protocolos" ? "Protocolo" : sectionLabel || currentCategory(container);
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
    const count = visibleCount();
    container.style.setProperty("--focus-color", meta.color);
    const setText = (selector, text) => {
      const node = $(selector, container);
      if (node && node.textContent !== text) node.textContent = text;
    };
    setText("[data-hub-active]", `${meta.icon} ${meta.label}`);
    setText("[data-hub-count]", count);
    setText("[data-focus-label]", `${meta.icon} ${meta.label}`);
    setText("[data-focus-title]", `${meta.label} disponibles`);
    setText("[data-focus-text]", meta.text);
    setText("[data-focus-count]", count);
  }

  function patchSpecialties() {
    if (!isSpecialties()) return;
    const container = $(pageSelector);
    if (!container || !container.classList.contains("active")) return;
    addStyle();
    container.classList.add("specialty-stable");
    ensureHero(container);
    ensureQuickRules(container);
    ensureShortcuts(container);
    ensureFocus(container);
    ensureCategoryButtons(container);
    decorateCards(container);
    updateFocus(container);
  }

  function patchProtocolTitle() {
    if (!isProtocol()) return;
    const title = $("#protocolTitle");
    if (!title) return;
    const current = title.textContent.trim();
    const renamed = renameMap.get(current);
    if (renamed && current !== renamed) title.textContent = renamed;
    if (renamed === "Endoscopia de urgencias") {
      const summary = $("#protocolDetail .protocol-summary");
      if (summary) summary.textContent = "Concentra EDA, hemorragia digestiva alta y criterios de endoscopia urgente.";
    }
  }

  function patch() {
    patchSpecialties();
    patchProtocolTitle();
  }

  function schedulePatch(delay = 0) {
    if (queued && delay === 0) return;
    if (delay > 0) {
      setTimeout(schedulePatch, delay);
      return;
    }
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      patch();
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(`${pageSelector} [data-category]`) || event.target.closest(`${pageSelector} [data-shift]`)) {
      schedulePatch(0);
      schedulePatch(80);
    }
    const shortcut = event.target.closest("[data-specialty-query]");
    const focusSearch = event.target.closest("[data-focus-specialty-search]");
    if (shortcut || focusSearch) {
      const input = $("#searchInput");
      if (!input) return;
      if (shortcut) input.value = shortcut.dataset.specialtyQuery || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus({ preventScroll: true });
      schedulePatch(60);
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.closest(`${pageSelector} #searchInput`)) schedulePatch(60);
  });

  window.addEventListener("hashchange", () => {
    schedulePatch(0);
    schedulePatch(120);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => schedulePatch(0));
  else schedulePatch(0);
})();