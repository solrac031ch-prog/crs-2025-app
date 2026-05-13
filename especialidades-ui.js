(function () {
  const pageSelector = "#specialtiesPage";
  const specialtiesHash = "#/especialidades";
  const categoryMeta = {
    Flujo: {
      label: "Flujos",
      code: "⚡",
      count: "12",
      color: "#0f766e",
      soft: "#dff5ef",
      text: "Algoritmos y rutas de accion rapida."
    },
    CRS: {
      label: "CRS",
      code: "🏥",
      count: "4",
      color: "#2563eb",
      soft: "#e6efff",
      text: "Derivaciones ambulatorias al CRS."
    },
    "Poli choque": {
      label: "Poli choque",
      code: "🚨",
      count: "4",
      color: "#b45309",
      soft: "#fff2d6",
      text: "Accesos de choque por especialidad."
    },
    Hospitalizados: {
      label: "Hospitalizados",
      code: "🛏️",
      count: "1",
      color: "#7c3aed",
      soft: "#f0e8ff",
      text: "Coordinacion de pacientes hospitalizados."
    },
    Protocolo: {
      label: "Protocolos",
      code: "📋",
      count: "4",
      color: "#be123c",
      soft: "#ffe4eb",
      text: "Protocolos institucionales de respaldo."
    }
  };

  const quickSearches = [
    ["🦵 TVP", "TVP"],
    ["🔎 Endoscopia", "endoscopia"],
    ["🧠 Neurocirugia", "neurocirugia"],
    ["❤️ Hemodinamia", "hemodinamia"],
    ["🚻 Urologia", "urologia"]
  ];

  const cardHints = new Map([
    ["Sala Pulso", "🩸 Transfusion y tratamientos ambulatorios"],
    ["Endoscopia de urgencias", "🔎 EDA, HDA y criterios Blatchford"],
    ["TVP - sospecha, ECO y horario inhabil", "🦵 Sospecha, ECO y ruta inhabil"],
    ["Neurologia", "🧠 ACV, neurointervencion y donante"],
    ["Hemodinamia", "❤️ Activacion y documento 2025"],
    ["Neurocirugia", "🧠 HIC y manejo inicial"],
    ["Cirugia de columna", "🦴 Patologia aguda de columna"],
    ["Urgencias urologicas", "🚻 Flujo urologico urgente"],
    ["Radiologia intervencional", "🖼️ Documento de radiologia intervencional"],
    ["Medicina Interna", "🩺 Poli Alta Urgencia"],
    ["Poli TACO", "💊 Control TACO"],
    ["Urologia", "🚻 CRS urologia"],
    ["Cirugia", "🔪 Diagnosticos quirurgicos CRS"]
  ]);

  let patchQueued = false;

  function isSpecialtiesRoute() {
    return window.location.hash.startsWith(specialtiesHash);
  }

  function page() {
    return document.querySelector(pageSelector);
  }

  function activeCategory() {
    const active = document.querySelector(`${pageSelector} .quick-actions [data-category].active`);
    const category = active?.dataset.category || "Flujo";
    return category === "Todos" ? "Flujo" : category;
  }

  function metaFor(category) {
    return categoryMeta[category] || categoryMeta.Flujo;
  }

  function visibleCount() {
    const text = document.querySelector("#resultsMeta")?.textContent || "";
    const match = text.match(/\d+/);
    return match ? match[0] : "0";
  }

  function normalizedCategory(label) {
    if (!label) return activeCategory();
    if (label === "Flujos") return "Flujo";
    if (label === "Protocolos") return "Protocolo";
    return label;
  }

  function addStyles() {
    if (document.querySelector("#especialidades-ui-style")) return;
    const style = document.createElement("style");
    style.id = "especialidades-ui-style";
    style.textContent = `
      #specialtiesPage.specialty-hub.active{display:grid;grid-template-columns:minmax(190px,230px) minmax(0,1fr);gap:16px;align-items:start;--hub-ink:#101214;--hub-muted:#5f666f;--hub-line:#d9ddd8;--hub-panel:#fff}
      #specialtiesPage.specialty-hub .page-head{grid-column:1 / -1;margin-bottom:0;padding:12px 0 2px}
      .specialty-lift-hero{grid-column:1 / -1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;padding:18px clamp(16px,3vw,24px);color:#fff;background:linear-gradient(135deg,#10231f,#0f3b35);border:1px solid rgba(255,255,255,.08);border-bottom:6px solid #2dd4bf;border-radius:12px;box-shadow:0 14px 34px rgba(16,18,20,.16)}
      .specialty-lift-hero h2{margin:4px 0 6px;font-size:clamp(1.55rem,3vw,2.35rem);line-height:1.04}.specialty-lift-hero p{margin:0;color:#d8e9e4;line-height:1.42}.hub-kicker{color:#9ee7da;font-size:.78rem;font-weight:900;text-transform:uppercase}.hub-stats{display:grid;grid-template-columns:repeat(2,minmax(98px,1fr));gap:9px}.hub-stat{display:grid;gap:4px;min-height:72px;padding:10px 12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:10px}.hub-stat span{color:#bdeee5;font-size:.72rem;font-weight:900;text-transform:uppercase}.hub-stat strong{font-size:1.25rem;line-height:1.05}.hub-stat b{font-size:1.55rem;line-height:1}
      #specialtiesPage.specialty-hub #rulesPreview.quick-rules{grid-column:1 / -1;margin:0}.specialty-hub #rulesPreview.quick-rules .quick-protocol{display:grid;grid-template-columns:minmax(230px,.95fr) minmax(260px,1.05fr);gap:10px}.specialty-hub #rulesPreview.quick-rules .quick-hero{min-height:118px;padding:15px;background:#fff;color:#10231f;border:1px solid var(--hub-line);border-left:6px solid #0f766e;border-bottom:1px solid var(--hub-line)}.specialty-hub #rulesPreview.quick-rules .quick-hero .detail-label{color:#0f766e}.specialty-hub #rulesPreview.quick-rules .quick-hero p:last-child{color:var(--hub-muted)}.specialty-hub #rulesPreview.quick-rules .quick-page{color:#fff;background:#0f766e}.specialty-hub #rulesPreview.quick-rules .quick-card-grid,.specialty-hub #rulesPreview.quick-rules .tags{display:none}.specialty-hub #rulesPreview.quick-rules .quick-decision{box-shadow:none}.specialty-hub #rulesPreview.quick-rules .quick-warning{grid-column:1 / -1;margin-top:-2px}
      #specialtiesPage.specialty-hub .control-panel{grid-column:2;grid-row:auto;margin:0;display:grid;grid-template-columns:minmax(260px,1fr) minmax(220px,.42fr);gap:12px}.specialty-hub .control-panel .search,.specialty-hub .control-panel .shift-box{border:1px solid #cfd8d4;background:#ffffff;box-shadow:0 10px 24px rgba(16,18,20,.07)}.specialty-hub .search input{min-height:50px;border-width:2px;background:#fbfffd}.specialty-hub .search input:focus{box-shadow:0 0 0 4px rgba(15,118,110,.14)}
      .specialty-shortcuts{grid-column:2;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 0 2px}.shortcut-label{color:var(--hub-muted);font-size:.78rem;font-weight:900;text-transform:uppercase}.shortcut-chip{min-height:36px;padding:0 11px;color:#0b3b36;background:#e2f7f2;border:1px solid #ace4da;border-radius:999px;font-weight:850;cursor:pointer}.shortcut-chip:hover,.shortcut-chip:focus-visible{color:#fff;background:#0f766e;outline:none}
      .specialty-focus-card{grid-column:2;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 16px;background:#fff;border:1px solid #d8dfdb;border-left:7px solid var(--focus-color,#0f766e);border-radius:10px;box-shadow:0 10px 24px rgba(16,18,20,.07)}.specialty-focus-card span{color:var(--focus-color,#0f766e);font-size:.78rem;font-weight:900;text-transform:uppercase}.specialty-focus-card h3{margin:2px 0 4px;font-size:1.16rem;line-height:1.12}.specialty-focus-card p{margin:0;color:var(--hub-muted);line-height:1.38}.focus-count{min-width:66px;display:grid;place-items:center;padding:10px;color:#fff;background:var(--focus-color,#0f766e);border-radius:10px;font-size:1.55rem;font-weight:950}
      #specialtiesPage.specialty-hub .quick-actions{grid-column:1;grid-row:4 / span 5;display:grid;gap:10px;margin:0;position:sticky;top:92px;align-content:start}.specialty-hub .quick-actions .chip{position:relative;width:100%;min-height:62px;display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center;justify-content:start;padding:9px 10px;text-align:left;white-space:normal;background:#fff;border:1px solid #d7dfda;border-left:6px solid var(--cat-color,#0f766e);border-radius:10px;box-shadow:0 8px 18px rgba(16,18,20,.06);transition:transform 140ms ease,box-shadow 140ms ease,background 140ms ease}.specialty-hub .quick-actions .chip:hover{transform:translateY(-1px);box-shadow:0 12px 22px rgba(16,18,20,.11)}.specialty-hub .quick-actions .chip.active{color:#101214;background:var(--cat-soft,#dff5ef);border-color:var(--cat-color,#0f766e);box-shadow:0 14px 26px rgba(16,18,20,.14)}.cat-code{width:38px;height:38px;display:grid;place-items:center;color:#fff;background:var(--cat-color,#0f766e);border-radius:10px;font-weight:950;font-size:1.15rem}.cat-copy{display:grid;gap:2px;min-width:0}.cat-copy strong{font-size:.98rem;line-height:1.12}.cat-copy small{color:var(--hub-muted);font-size:.75rem;font-weight:850;line-height:1.15}.specialty-hub .quick-actions [data-category="Todos"]{display:none!important}
      #specialtiesPage.specialty-hub #resultsMeta{grid-column:2;margin:0;color:#475569;font-weight:850}.specialty-hub #specialtyGroups{grid-column:2;min-height:260px}.specialty-hub .category-section{gap:10px}.specialty-hub .category-title{display:flex;align-items:center;gap:8px;color:#263238}.specialty-hub .category-title::before{content:"";width:12px;height:12px;border-radius:50%;background:var(--focus-color,#0f766e)}.specialty-hub .specialty-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.specialty-card-upgraded{position:relative;min-height:116px;display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:12px;padding:14px 14px 14px 12px;background:#fff;border:1px solid #d8dfdb;border-top:5px solid var(--card-accent,#0f766e);border-radius:10px;box-shadow:0 10px 22px rgba(16,18,20,.08);transition:transform 150ms ease,box-shadow 150ms ease,border-color 150ms ease}.specialty-card-upgraded:hover,.specialty-card-upgraded:focus-visible{transform:translateY(-2px);border-color:var(--card-accent,#0f766e);box-shadow:0 16px 30px rgba(16,18,20,.13);outline:none}.specialty-card-upgraded .specialty-sticker{width:52px;height:52px;border-radius:12px;background:var(--card-accent,#0f766e);box-shadow:inset 0 -8px 18px rgba(0,0,0,.12);font-size:1.35rem}.specialty-card-upgraded strong{font-size:1.03rem;line-height:1.16}.specialty-card-hint{display:block;margin-top:5px;color:#64706b;font-size:.84rem;font-weight:700;line-height:1.28}.specialty-card-route{position:absolute;right:10px;bottom:9px;padding:4px 7px;color:var(--card-accent,#0f766e);background:var(--card-soft,#dff5ef);border-radius:999px;font-size:.7rem;font-weight:900;text-transform:uppercase}.specialty-card-upgraded[hidden]{display:none!important}
      @media(max-width:900px){#specialtiesPage.specialty-hub.active{display:block}.specialty-lift-hero,.specialty-hub #rulesPreview.quick-rules .quick-protocol,.specialty-hub .control-panel,.specialty-focus-card{grid-template-columns:1fr}.specialty-hub .quick-actions{position:static!important;display:flex!important;overflow-x:auto;margin:0 0 12px}.specialty-hub .quick-actions .chip{min-width:178px}.specialty-shortcuts{padding:10px 0}.hub-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.specialty-lift-hero{padding:16px}.hub-stats{grid-template-columns:1fr}.specialty-card-upgraded{grid-template-columns:46px minmax(0,1fr);min-height:104px}.specialty-card-upgraded .specialty-sticker{width:46px;height:46px}.specialty-card-route{position:static;justify-self:start;margin-top:7px}.specialty-shortcuts{display:grid;grid-template-columns:1fr 1fr}.shortcut-label{grid-column:1 / -1}.shortcut-chip{width:100%}}
    `;
    document.head.append(style);
  }

  function ensureHero(container) {
    if (container.querySelector(".specialty-lift-hero")) return;
    const hero = document.createElement("section");
    hero.className = "specialty-lift-hero";
    hero.innerHTML = `
      <div>
        <span class="hub-kicker">🩺 Turno adulto HPH</span>
        <h2>Rutas clinicas en accion ⚡</h2>
        <p>Flujos, CRS, poli choque, hospitalizados y protocolos institucionales en una sola vista.</p>
      </div>
      <div class="hub-stats" aria-label="Resumen de especialidades">
        <div class="hub-stat"><span>Vista activa</span><strong data-hub-active>Flujos</strong></div>
        <div class="hub-stat"><span>Disponibles</span><b data-hub-count>0</b></div>
      </div>
    `;
    const head = container.querySelector(".page-head");
    if (head) head.after(hero);
  }

  function ensureShortcuts(container) {
    if (container.querySelector("#specialtyShortcutPanel")) return;
    const control = container.querySelector(".control-panel");
    if (!control) return;
    const panel = document.createElement("div");
    panel.id = "specialtyShortcutPanel";
    panel.className = "specialty-shortcuts";
    panel.innerHTML = `<span class="shortcut-label">Atajos frecuentes</span>` + quickSearches.map(([label, query]) => (
      `<button class="shortcut-chip" type="button" data-specialty-query="${query}">${label}</button>`
    )).join("");
    control.after(panel);
  }

  function ensureFocus(container) {
    if (container.querySelector("#specialtyFocusCard")) return;
    const anchor = container.querySelector("#specialtyShortcutPanel") || container.querySelector(".control-panel");
    if (!anchor) return;
    const panel = document.createElement("section");
    panel.id = "specialtyFocusCard";
    panel.className = "specialty-focus-card";
    panel.innerHTML = `
      <div>
        <span data-focus-label>Flujos</span>
        <h3 data-focus-title>Flujos disponibles</h3>
        <p data-focus-text>Algoritmos y rutas de accion rapida.</p>
      </div>
      <div class="focus-count" data-focus-count>0</div>
    `;
    anchor.after(panel);
  }

  function decorateCategoryButtons(container) {
    const buttons = container.querySelectorAll(".quick-actions [data-category]");
    buttons.forEach((button) => {
      const category = button.dataset.category === "Todos" ? "Flujo" : button.dataset.category;
      const meta = metaFor(category);
      button.style.setProperty("--cat-color", meta.color);
      button.style.setProperty("--cat-soft", meta.soft);
      const desired = `<span class="cat-code">${meta.code}</span><span class="cat-copy"><strong>${meta.label}</strong><small>${meta.count} rutas</small></span>`;
      if (button.dataset.uiLabel !== meta.label) {
        button.innerHTML = desired;
        button.dataset.uiLabel = meta.label;
      }
    });
  }

  function decorateCards(container) {
    container.querySelectorAll("#specialtyGroups .specialty-button").forEach((link) => {
      const title = link.querySelector("strong")?.textContent.trim();
      if (!title) return;
      const sectionLabel = link.closest(".category-section")?.querySelector(".category-title")?.textContent.trim();
      const category = normalizedCategory(sectionLabel);
      const meta = metaFor(category);
      link.classList.add("specialty-card-upgraded");
      link.style.setProperty("--card-accent", meta.color);
      link.style.setProperty("--card-soft", meta.soft);
      const sticker = link.querySelector(".specialty-sticker");
      if (sticker && sticker.textContent.trim() !== meta.code) sticker.textContent = meta.code;
      let hint = link.querySelector(".specialty-card-hint");
      if (!hint) {
        hint = document.createElement("span");
        hint.className = "specialty-card-hint";
        link.append(hint);
      }
      const hintText = cardHints.get(title) || `${meta.code} ${meta.text}`;
      if (hint.textContent !== hintText) hint.textContent = hintText;
      let route = link.querySelector(".specialty-card-route");
      if (!route) {
        route = document.createElement("span");
        route.className = "specialty-card-route";
        link.append(route);
      }
      if (route.textContent !== meta.label) route.textContent = meta.label;
    });
  }

  function updateFocus(container) {
    const category = activeCategory();
    const meta = metaFor(category);
    const count = visibleCount();
    container.style.setProperty("--focus-color", meta.color);
    const setText = (selector, text) => {
      const node = container.querySelector(selector);
      if (node && node.textContent !== text) node.textContent = text;
    };
    setText("[data-hub-active]", `${meta.code} ${meta.label}`);
    setText("[data-hub-count]", count);
    setText("[data-focus-label]", `${meta.code} ${meta.label}`);
    setText("[data-focus-title]", `${meta.label} disponibles`);
    setText("[data-focus-text]", meta.text);
    setText("[data-focus-count]", count);
  }

  function wireShortcuts(container) {
    if (container.dataset.specialtyShortcutWire) return;
    container.dataset.specialtyShortcutWire = "true";
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-specialty-query]");
      if (!button) return;
      const input = container.querySelector("#searchInput");
      if (!input) return;
      input.value = button.dataset.specialtyQuery;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus({ preventScroll: true });
      schedulePatch();
    });
  }

  function patch() {
    if (!isSpecialtiesRoute()) return;
    const container = page();
    if (!container || !container.classList.contains("active")) return;
    addStyles();
    container.classList.add("specialty-hub");
    ensureHero(container);
    ensureShortcuts(container);
    ensureFocus(container);
    decorateCategoryButtons(container);
    decorateCards(container);
    updateFocus(container);
    wireShortcuts(container);
  }

  function schedulePatch() {
    if (patchQueued) return;
    patchQueued = true;
    requestAnimationFrame(() => {
      patchQueued = false;
      patch();
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(`${pageSelector} [data-category]`) || event.target.closest(`${pageSelector} [data-shift]`)) {
      schedulePatch();
      setTimeout(schedulePatch, 80);
      setTimeout(schedulePatch, 180);
    }
  });
  document.addEventListener("input", (event) => {
    if (event.target.closest(`${pageSelector} #searchInput`)) {
      schedulePatch();
      setTimeout(schedulePatch, 120);
    }
  });
  window.addEventListener("hashchange", () => {
    schedulePatch();
    setTimeout(schedulePatch, 140);
  });

  const observer = new MutationObserver(schedulePatch);
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedulePatch);
  else schedulePatch();
})();
