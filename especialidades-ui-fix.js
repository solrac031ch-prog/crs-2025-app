(function () {
  function addStyle() {
    if (document.querySelector("#especialidades-ui-fix-style")) return;
    const style = document.createElement("style");
    style.id = "especialidades-ui-fix-style";
    style.textContent = `
      .specialty-card-upgraded{min-height:126px;grid-template-rows:auto auto;align-items:center;gap:4px 12px;padding-bottom:30px}
      .specialty-card-upgraded .specialty-sticker{grid-column:1;grid-row:1 / span 2}
      .specialty-card-upgraded strong{grid-column:2;grid-row:1;min-width:0;overflow-wrap:anywhere}
      .specialty-card-hint{grid-column:2;grid-row:2;margin:0;overflow-wrap:anywhere}
      .specialty-card-route{max-width:calc(100% - 20px);overflow-wrap:anywhere}
      #specialtiesPage.specialty-hub,#specialtiesPage.specialty-hub *{max-width:100%;box-sizing:border-box}
      #specialtiesPage.specialty-hub .control-panel,#specialtiesPage.specialty-hub .shift-box,#specialtiesPage.specialty-hub .segmented,#specialtiesPage.specialty-hub .search,#specialtiesPage.specialty-hub .specialty-lift-hero,#specialtiesPage.specialty-hub .specialty-focus-card,#specialtiesPage.specialty-hub #rulesPreview.quick-rules .quick-protocol,#specialtiesPage.specialty-hub #rulesPreview.quick-rules .quick-decision{min-width:0;max-width:100%}
      #specialtiesPage.specialty-hub .segment{min-width:0;padding-left:8px;padding-right:8px}
      @media(max-width:900px){
        html,body{overflow-x:hidden}
        #specialtiesPage.specialty-hub.active{display:block!important;width:100%;overflow-x:hidden}
        #specialtiesPage.specialty-hub .control-panel{display:grid!important;grid-template-columns:minmax(0,1fr)!important;width:100%;overflow:hidden}
        #specialtiesPage.specialty-hub #rulesPreview.quick-rules .quick-protocol,#specialtiesPage.specialty-hub .specialty-lift-hero,#specialtiesPage.specialty-hub .specialty-focus-card{grid-template-columns:minmax(0,1fr)!important;width:100%;overflow:hidden}
        #specialtiesPage.specialty-hub .quick-actions{max-width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain}
        #specialtiesPage.specialty-hub .search,#specialtiesPage.specialty-hub .shift-box{width:100%}
      }
      @media(max-width:560px){
        .specialty-card-upgraded{min-height:114px}
        .specialty-card-route{position:static;grid-column:2;justify-self:start;margin-top:7px}
        #specialtiesPage.specialty-hub .segmented{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%;overflow:hidden}
        #specialtiesPage.specialty-hub .segment{width:100%;font-size:.88rem;white-space:normal}
        #specialtiesPage.specialty-hub .quick-actions .chip{min-width:150px}
        #specialtiesPage.specialty-hub .hub-stat strong{font-size:1.05rem}
      }
    `;
    document.head.append(style);
  }

  function syncEndoscopyAndCounts() {
    const page = document.querySelector("#specialtiesPage.active");
    if (!page) return;

    page.querySelectorAll("#specialtyGroups .specialty-button").forEach((link) => {
      const title = link.querySelector("strong")?.textContent.trim();
      if (title === "Hemorragia digestiva alta") link.hidden = true;
    });

    const visibleCards = Array.from(page.querySelectorAll("#specialtyGroups .specialty-button"))
      .filter((link) => !link.hidden);
    const count = visibleCards.length;
    const label = `${count} protocolo${count === 1 ? "" : "s"} disponible${count === 1 ? "" : "s"}`;
    const meta = page.querySelector("#resultsMeta");
    if (meta && meta.textContent.trim() !== label) meta.textContent = label;
    page.querySelectorAll("[data-focus-count],[data-hub-count]").forEach((node) => {
      const value = String(count);
      if (node.textContent !== value) node.textContent = value;
    });
  }

  function patchShortcuts() {
    addStyle();
    const neuro = document.querySelector('[data-specialty-query="neurocirugia"]');
    if (neuro) neuro.dataset.specialtyQuery = "HIC";
    const endoscopy = document.querySelector('[data-specialty-query="endoscopia"]');
    if (endoscopy) endoscopy.dataset.specialtyQuery = "EDA";
    syncEndoscopyAndCounts();
  }

  const observer = new MutationObserver(patchShortcuts);
  if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patchShortcuts);
  else patchShortcuts();
})();

(function () {
  const routePrefix = "#/especialidad/";
  const patchDelays = [0, 90, 260, 700, 1200];
  const categoryMeta = {
    Flujo: { label: "Flujo", mode: "Ruta de accion", color: "#0f766e", soft: "#dff5ef", code: "FL", note: "Paso a paso para resolver el flujo sin perder el hilo." },
    CRS: { label: "CRS", mode: "Derivacion CRS", color: "#2563eb", soft: "#e6efff", code: "CR", note: "Criterios y destino de derivacion ambulatoria." },
    "Poli choque": { label: "Poli choque", mode: "Acceso choque", color: "#b45309", soft: "#fff2d6", code: "PC", note: "Decide rapido donde va el paciente y como documentarlo." },
    Hospitalizados: { label: "Hospitalizados", mode: "Gestion en piso", color: "#7c3aed", soft: "#f0e8ff", code: "HZ", note: "Coordinacion para paciente hospitalizado o en espera de cama." },
    Protocolo: { label: "Protocolo", mode: "Protocolo activo", color: "#be123c", soft: "#ffe4eb", code: "PR", note: "Checklist institucional para actuar con orden." },
    "Regla general": { label: "Regla general", mode: "Regla base", color: "#334155", soft: "#e2e8f0", code: "RG", note: "Regla comun antes de derivar." }
  };

  function activeProtocolPage() {
    return window.location.hash.startsWith(routePrefix) && document.querySelector("#protocolPage.active");
  }

  function currentSlug() {
    return decodeURIComponent(window.location.hash.slice(routePrefix.length).split("?")[0] || "");
  }

  function splitCategory() {
    const raw = document.querySelector("#protocolCategory")?.textContent || "";
    return raw.split("·")[0].trim() || "Flujo";
  }

  function metaFor(category) {
    return categoryMeta[category] || categoryMeta.Flujo;
  }

  function addDetailStyles() {
    if (document.querySelector("#protocolos-detalle-ui-style")) return;
    const style = document.createElement("style");
    style.id = "protocolos-detalle-ui-style";
    style.textContent = `
      #protocolPage.protocol-experience{--route-color:#0f766e;--route-soft:#dff5ef;--route-ink:#101214;--route-muted:#5f666f;--route-line:#d9ddd8}
      #protocolPage.protocol-experience .page-head{margin-bottom:10px}
      .protocol-utility-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px;padding:10px;background:#fff;border:1px solid #dbe4df;border-left:6px solid var(--route-color);border-radius:8px;box-shadow:0 10px 22px rgba(16,18,20,.07)}
      .route-tool{min-height:36px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 11px;color:#14312d;background:var(--route-soft);border:1px solid color-mix(in srgb,var(--route-color) 35%,#ffffff);border-radius:999px;font-weight:900;text-decoration:none;cursor:pointer}.route-tool.primary{color:#fff;background:var(--route-color);border-color:var(--route-color)}.route-tool:hover,.route-tool:focus-visible{transform:translateY(-1px);outline:none;box-shadow:0 8px 18px rgba(16,18,20,.12)}
      #protocolPage.protocol-experience .protocol-detail{gap:16px}.protocol-route-hero{position:relative;overflow:hidden;padding:18px!important;color:#fff;background:linear-gradient(135deg,var(--route-color),#10231f 78%);border:0!important;border-bottom:6px solid color-mix(in srgb,var(--route-color) 64%,#ffffff)!important;box-shadow:0 16px 34px rgba(16,18,20,.18)!important}.protocol-route-hero::after{content:"";position:absolute;inset:auto -70px -95px auto;width:210px;height:210px;border:24px solid rgba(255,255,255,.08);border-radius:50%;pointer-events:none}.route-hero-top{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.route-mode,.route-category-pill{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border-radius:999px;font-size:.76rem;font-weight:950;text-transform:uppercase}.route-mode{color:#073b35;background:#bff2e6}.route-category-pill{color:#fff;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.22)}.protocol-route-hero .page-badge{color:#fff;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.24)}.protocol-route-hero .protocol-summary{position:relative;z-index:1;max-width:860px;color:#eefdf9;font-size:1.06rem;line-height:1.48}.protocol-route-hero .tags{position:relative;z-index:1}.protocol-route-hero .tag{color:#073b35;background:#d9fff6}.route-vitals{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:9px}.route-vital{display:grid;gap:3px;min-height:70px;padding:10px 11px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:8px}.route-vital span{color:#c8fff4;font-size:.72rem;font-weight:950;text-transform:uppercase}.route-vital strong{font-size:1.05rem;line-height:1.08}.route-hero-actions{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:8px}.route-hero-actions .route-tool{background:#fff;color:#0d3c36;border-color:#fff}.route-hero-actions .route-tool.secondary{color:#fff;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.28)}
      .route-jump-nav{position:sticky;top:84px;z-index:4;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);border:1px solid #dde5e1;border-left:6px solid var(--route-color);border-radius:8px;box-shadow:0 10px 24px rgba(16,18,20,.08)}.route-jump-label{color:var(--route-muted);font-size:.76rem;font-weight:950;text-transform:uppercase}.route-jump-nav button{min-height:34px;padding:0 10px;color:#17312d;background:#fff;border:1px solid #ccd9d4;border-radius:999px;font-weight:850;cursor:pointer}.route-jump-nav button:hover,.route-jump-nav button:focus-visible{color:#fff;background:var(--route-color);border-color:var(--route-color);outline:none}
      #protocolPage.protocol-experience .route-section-card,#protocolPage.protocol-experience .external-form-panel,#protocolPage.protocol-experience .source-docs-panel,#protocolPage.protocol-experience .priority-panel{position:relative;overflow:hidden;border-left:7px solid var(--route-color)!important;box-shadow:0 12px 26px rgba(16,18,20,.08)!important}.route-section-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin:-2px 0 12px}.route-section-head strong{display:block;margin:0;color:var(--route-color);font-size:.78rem;font-weight:950;text-transform:uppercase}.route-section-head span{display:block;margin-top:2px;color:var(--route-muted);font-size:.88rem;line-height:1.28}.route-collapse{min-height:32px;padding:0 9px;color:var(--route-color);background:var(--route-soft);border:1px solid color-mix(in srgb,var(--route-color) 28%,#ffffff);border-radius:999px;font-weight:900;cursor:pointer}.route-section-card.is-collapsed > :not(.route-section-head){display:none!important}.route-section-card.is-collapsed .route-collapse::after{content:" abrir"}.route-collapse::after{content:" ocultar"}
      #protocolPage.protocol-experience .grid{grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:11px}.field.field-ui{grid-template-columns:42px minmax(0,1fr);gap:4px 11px;align-items:start;padding:12px;background:#fff;border:1px solid #dfe8e3;border-top:4px solid var(--route-color);box-shadow:0 8px 18px rgba(16,18,20,.055);transition:transform 130ms ease,box-shadow 130ms ease}.field.field-ui:hover{transform:translateY(-1px);box-shadow:0 12px 22px rgba(16,18,20,.1)}.field-code{grid-row:1 / span 2;display:grid;place-items:center;width:42px;height:42px;color:#fff;background:var(--route-color);border-radius:8px;font-size:.72rem;font-weight:950}.field.field-ui strong{grid-column:2;color:#202a28;letter-spacing:0}.field.field-ui span:not(.field-code){grid-column:2;color:#4f5e59}
      #protocolPage.protocol-experience .flow{position:relative;gap:0;margin-left:3px}.flow.flow-ui::before{content:"";position:absolute;left:15px;top:14px;bottom:14px;width:3px;background:linear-gradient(var(--route-color),color-mix(in srgb,var(--route-color) 35%,#ffffff));border-radius:999px}.flow-step.flow-step-ui{position:relative;grid-template-columns:34px minmax(0,1fr);gap:12px;padding:8px 0}.flow-step-ui .step-number{width:34px;height:34px;background:var(--route-color);box-shadow:0 0 0 6px #fff}.flow-step-ui p{margin:4px 0 0;padding:9px 11px;background:#fff;border:1px solid #e1e8e4;border-radius:8px;box-shadow:0 6px 14px rgba(16,18,20,.05)}
      #protocolPage.protocol-experience .moment-grid{grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.moment-card.moment-ui{border-left-color:var(--route-color)!important;box-shadow:0 10px 20px rgba(16,18,20,.07);transition:transform 130ms ease}.moment-card.moment-ui:hover{transform:translateY(-2px)}.moment-card.moment-ui h3{color:#17211e}.moment-card.moment-ui::before{content:attr(data-moment-code);width:38px;height:38px;display:grid;place-items:center;color:#fff;background:var(--route-color);border-radius:8px;font-size:.72rem;font-weight:950}.moment-alert{border-left:5px solid var(--route-color)}
      .pathology-search{display:grid;gap:7px;margin:0 0 12px;padding:11px;background:var(--route-soft);border:1px solid color-mix(in srgb,var(--route-color) 26%,#ffffff);border-radius:8px}.pathology-search span{color:var(--route-color);font-size:.78rem;font-weight:950;text-transform:uppercase}.pathology-search input{min-height:42px;width:100%;padding:0 12px;background:#fff;border:1px solid #cfd8d4;border-radius:6px;outline:none}.pathology-search input:focus{border-color:var(--route-color);box-shadow:0 0 0 3px color-mix(in srgb,var(--route-color) 18%,transparent)}.pathology-search small{color:#5d6965;font-weight:800}.pathology-group.pathology-ui{background:#fff;border-color:#dfe8e3;box-shadow:0 7px 16px rgba(16,18,20,.05)}.pathology-group.pathology-ui li{padding:3px 0}.pathology-group[hidden],.pathology-group li[hidden]{display:none!important}.route-warning{display:grid;gap:5px;border-left:7px solid #be123c!important;box-shadow:0 10px 20px rgba(190,18,60,.08)}.route-warning strong{font-size:.78rem;text-transform:uppercase}
      #protocolPage.protocol-experience .source-docs-panel{border-left-color:#b45309!important}#protocolPage.protocol-experience .external-form-panel{border-left-color:#0f766e!important}#protocolPage.protocol-experience .priority-panel{border-left-color:#2563eb!important}.priority-panel .priority-button.primary{background:var(--route-color)}
      @media(max-width:760px){.protocol-utility-bar,.route-jump-nav{position:static}.route-vitals{grid-template-columns:repeat(2,minmax(0,1fr))}.protocol-route-hero{padding:16px!important}.route-hero-actions .route-tool,.protocol-utility-bar .route-tool{width:100%;justify-content:center}.route-section-head{grid-template-columns:1fr}.route-collapse{justify-self:start}#protocolPage.protocol-experience .grid{grid-template-columns:1fr}.field.field-ui{grid-template-columns:38px minmax(0,1fr)}.field-code{width:38px;height:38px}}
      @media(max-width:480px){.route-vitals{grid-template-columns:1fr}.route-jump-nav{overflow-x:auto;flex-wrap:nowrap}.route-jump-nav button{flex:0 0 auto}.protocol-route-hero .protocol-summary{font-size:1rem}}
    `;
    document.head.append(style);
  }

  function sectionLabel(section) {
    if (section.classList.contains("protocol-card")) return "Resumen";
    if (section.classList.contains("source-docs-panel")) return "Documentos";
    if (section.classList.contains("external-form-panel")) return "Formulario";
    if (section.classList.contains("priority-panel")) return "Gestion";
    if (section.classList.contains("warning")) return "Alerta";
    return section.querySelector(".detail-label")?.textContent?.trim() || "Seccion";
  }

  function sectionNote(label) {
    const clean = label.toLowerCase();
    if (clean.includes("detalle")) return "Lo que hay que dejar documentado o coordinar.";
    if (clean.includes("momento")) return "Escenarios practicos para decidir rapido.";
    if (clean.includes("secuencia")) return "Orden recomendado de acciones.";
    if (clean.includes("patolog")) return "Busca y filtra criterios dentro del flujo.";
    if (clean.includes("document")) return "Respaldo institucional completo.";
    if (clean.includes("formulario")) return "Acceso directo al formulario asociado.";
    if (clean.includes("gestion")) return "Registro para seguimiento prioritario.";
    return "Punto clave del protocolo.";
  }

  function scrollToTarget(target) {
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function ensureUtilityBar(page, detail) {
    let bar = page.querySelector(".protocol-utility-bar");
    if (!bar) {
      bar = document.createElement("nav");
      bar.className = "protocol-utility-bar";
      bar.setAttribute("aria-label", "Acciones del protocolo");
      const head = page.querySelector(".page-head");
      if (head) head.after(bar);
    }

    const hasPriority = !!detail.querySelector(".priority-panel");
    const items = [
      `<a class="route-tool primary" href="#/especialidades">Volver a flujos</a>`,
      `<button class="route-tool" type="button" data-route-scroll="summary">Resumen</button>`,
      `<button class="route-tool" type="button" data-route-scroll="sequence">Pasos</button>`,
      hasPriority ? `<button class="route-tool" type="button" data-route-scroll="priority">Gestion prioritaria</button>` : "",
      `<button class="route-tool" type="button" data-route-top>Subir</button>`
    ].join("");
    if (bar.dataset.items !== items) {
      bar.innerHTML = items;
      bar.dataset.items = items;
    }
  }

  function counts(detail) {
    return {
      fields: detail.querySelectorAll(".field").length,
      steps: detail.querySelectorAll(".flow-step").length,
      moments: detail.querySelectorAll(".moment-card").length,
      docs: detail.querySelectorAll(".source-docs-panel a,.external-form-panel a").length
    };
  }

  function ensureHero(detail, meta, slug) {
    const card = detail.querySelector(".protocol-card");
    if (!card) return;
    card.classList.add("protocol-route-hero");
    card.style.setProperty("--route-color", meta.color);
    card.style.setProperty("--route-soft", meta.soft);

    if (card.dataset.detailHero === slug) {
      updateVitals(detail, card);
      return;
    }
    card.dataset.detailHero = slug;

    const top = document.createElement("div");
    top.className = "route-hero-top";
    top.innerHTML = `<span class="route-mode">${meta.mode}</span><span class="route-category-pill">${meta.code} ${meta.label}</span>`;
    const badge = card.querySelector(".page-badge");
    if (badge) top.append(badge);
    card.prepend(top);

    const actions = document.createElement("div");
    actions.className = "route-hero-actions";
    actions.innerHTML = `<button class="route-tool" type="button" data-route-scroll="details">Ver detalle</button><button class="route-tool secondary" type="button" data-route-scroll="next">Siguiente bloque</button>`;
    card.append(actions);
    updateVitals(detail, card);
  }

  function updateVitals(detail, card) {
    const data = counts(detail);
    let vitals = card.querySelector(".route-vitals");
    const html = [
      ["Detalle", data.fields || "Sin"],
      ["Pasos", data.steps || "Libre"],
      ["Escenarios", data.moments || "Base"],
      ["Docs", data.docs || "App"]
    ].map(([label, value]) => `<div class="route-vital"><span>${label}</span><strong>${value}</strong></div>`).join("");
    if (!vitals) {
      vitals = document.createElement("div");
      vitals.className = "route-vitals";
      const tags = card.querySelector(".tags");
      if (tags) tags.before(vitals);
      else card.append(vitals);
    }
    if (vitals.innerHTML !== html) vitals.innerHTML = html;
  }

  function ensureJumpNav(detail, slug) {
    const card = detail.querySelector(".protocol-card");
    if (!card) return;
    let nav = detail.querySelector(".route-jump-nav");
    const sections = Array.from(detail.children).filter((node) => {
      return node.matches?.(".protocol-card,.detail-section,.source-docs-panel,.external-form-panel,.warning,.priority-panel");
    });
    const signature = sections.map((section, index) => {
      if (!section.id) section.id = `route-section-${slug}-${index}`.replace(/[^a-zA-Z0-9_-]/g, "-");
      return `${section.id}:${sectionLabel(section)}`;
    }).join("|");
    if (nav && nav.dataset.signature === signature) return;
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "route-jump-nav";
      nav.setAttribute("aria-label", "Navegar dentro del protocolo");
      card.after(nav);
    }
    nav.dataset.signature = signature;
    nav.innerHTML = `<span class="route-jump-label">Ir a</span>` + sections.map((section) => `<button type="button" data-jump-target="${section.id}">${sectionLabel(section)}</button>`).join("");
  }

  function decorateSections(detail) {
    detail.querySelectorAll(".detail-section,.source-docs-panel,.external-form-panel,.priority-panel").forEach((section) => {
      section.classList.add("route-section-card");
      if (section.dataset.routeDecorated) return;
      section.dataset.routeDecorated = "true";
      const label = section.querySelector(":scope > .detail-label");
      const text = label?.textContent.trim() || sectionLabel(section);
      if (label) label.remove();
      const head = document.createElement("div");
      head.className = "route-section-head";
      head.innerHTML = `<div><strong>${text}</strong><span>${sectionNote(text)}</span></div><button class="route-collapse" type="button" aria-expanded="true"></button>`;
      section.prepend(head);
    });
  }

  function codeFor(label, value, index) {
    const text = `${label} ${value}`.toLowerCase();
    if (/telefono|tel[eé]fono|anexo|llamar|contact/.test(text)) return "TEL";
    if (/horario|lunes|viernes|domingo|habil|inhabil|h[aá]bil|inh[aá]bil/.test(text)) return "HR";
    if (/ic|dau|document|formulario|pit[aá]goras/.test(text)) return "DOC";
    if (/destino|derivar|crs|aps|hospital|s[oó]tero|casr/.test(text)) return "DIR";
    if (/alerta|no |evitar|shock|urgente|contraindic/.test(text)) return "!";
    return String(index + 1).padStart(2, "0");
  }

  function decorateFields(detail) {
    detail.querySelectorAll(".field").forEach((field, index) => {
      if (field.classList.contains("field-ui")) return;
      const strong = field.querySelector("strong");
      const span = field.querySelector("span:not(.field-code)");
      const code = codeFor(strong?.textContent || "", span?.textContent || "", index);
      const badge = document.createElement("span");
      badge.className = "field-code";
      badge.setAttribute("aria-hidden", "true");
      badge.textContent = code;
      field.prepend(badge);
      field.classList.add("field-ui");
    });
  }

  function decorateFlow(detail) {
    const flow = detail.querySelector(".flow");
    if (flow) flow.classList.add("flow-ui");
    detail.querySelectorAll(".flow-step").forEach((step) => step.classList.add("flow-step-ui"));
  }

  function decorateMoments(detail) {
    detail.querySelectorAll(".moment-card").forEach((card, index) => {
      card.classList.add("moment-ui");
      card.dataset.momentCode = `M${index + 1}`;
    });
  }

  function ensurePathologySearch(detail) {
    const section = detail.querySelector(".pathologies");
    if (!section) return;
    section.querySelectorAll(".pathology-group").forEach((group) => group.classList.add("pathology-ui"));
    if (section.querySelector(".pathology-search")) return;
    const box = document.createElement("label");
    box.className = "pathology-search";
    box.innerHTML = `<span>Buscar dentro de patologias</span><input type="search" autocomplete="off" placeholder="Ej: tumor, absceso, trauma..."><small data-pathology-status></small>`;
    const head = section.querySelector(".route-section-head");
    if (head) head.after(box);
    else section.prepend(box);
    const input = box.querySelector("input");
    const status = box.querySelector("[data-pathology-status]");
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      section.querySelectorAll(".pathology-group").forEach((group) => {
        let groupVisible = false;
        group.querySelectorAll("li").forEach((item) => {
          const hit = !query || item.textContent.toLowerCase().includes(query) || group.querySelector("h3")?.textContent.toLowerCase().includes(query);
          item.hidden = !hit;
          if (hit) { visible += 1; groupVisible = true; }
        });
        group.hidden = !groupVisible;
      });
      status.textContent = query ? `${visible} coincidencia${visible === 1 ? "" : "s"}` : "Lista completa visible";
    });
    input.dispatchEvent(new Event("input"));
  }

  function decorateWarning(detail) {
    detail.querySelectorAll(":scope > .warning").forEach((warning) => {
      if (warning.classList.contains("route-warning")) return;
      const text = warning.textContent;
      warning.textContent = "";
      const title = document.createElement("strong");
      title.textContent = "Alerta del flujo";
      const body = document.createElement("span");
      body.textContent = text;
      warning.append(title, body);
      warning.classList.add("route-warning");
    });
  }

  function wire(page, detail) {
    if (page.dataset.protocolExperienceWire) return;
    page.dataset.protocolExperienceWire = "true";
    page.addEventListener("click", (event) => {
      const jump = event.target.closest("[data-jump-target]");
      if (jump) {
        scrollToTarget(document.getElementById(jump.dataset.jumpTarget));
        return;
      }
      const scroll = event.target.closest("[data-route-scroll]");
      if (scroll) {
        const key = scroll.dataset.routeScroll;
        if (key === "summary") scrollToTarget(detail.querySelector(".protocol-card"));
        if (key === "details") scrollToTarget(detail.querySelector(".detail-section"));
        if (key === "sequence") scrollToTarget(detail.querySelector(".flow")?.closest(".detail-section") || detail.querySelector(".moments-panel") || detail.querySelector(".detail-section"));
        if (key === "priority") scrollToTarget(detail.querySelector(".priority-panel"));
        if (key === "next") scrollToTarget(detail.querySelector(".protocol-card")?.nextElementSibling);
        return;
      }
      if (event.target.closest("[data-route-top]")) {
        scrollToTarget(page.querySelector(".page-head"));
        return;
      }
      const collapse = event.target.closest(".route-collapse");
      if (collapse) {
        const section = collapse.closest(".route-section-card");
        const expanded = !section.classList.toggle("is-collapsed");
        collapse.setAttribute("aria-expanded", String(expanded));
      }
    });
  }

  function patchProtocolDetail() {
    if (!activeProtocolPage()) return;
    const page = document.querySelector("#protocolPage");
    const detail = document.querySelector("#protocolDetail");
    if (!page || !detail || !detail.children.length) return;
    const category = splitCategory();
    const meta = metaFor(category);
    const slug = currentSlug();

    addDetailStyles();
    page.classList.add("protocol-experience");
    page.style.setProperty("--route-color", meta.color);
    page.style.setProperty("--route-soft", meta.soft);

    ensureUtilityBar(page, detail);
    ensureHero(detail, meta, slug);
    decorateSections(detail);
    decorateFields(detail);
    decorateFlow(detail);
    decorateMoments(detail);
    ensurePathologySearch(detail);
    decorateWarning(detail);
    ensureJumpNav(detail, slug);
    updateVitals(detail, detail.querySelector(".protocol-card"));
    wire(page, detail);
  }

  function schedulePatch() {
    patchDelays.forEach((delay) => window.setTimeout(patchProtocolDetail, delay));
  }

  window.addEventListener("hashchange", schedulePatch);
  const observer = new MutationObserver(() => window.setTimeout(patchProtocolDetail, 0));
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedulePatch);
  else schedulePatch();
})();
