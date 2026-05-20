(function () {
  const routePrefix = "#/especialidad/";
  const categoryMeta = {
    Flujo: { icon: "⚡", label: "Flujo", mode: "Ruta de acción", color: "#0f766e", soft: "#dff5ef" },
    CRS: { icon: "🏥", label: "CRS", mode: "Derivación CRS", color: "#2563eb", soft: "#e6efff" },
    "Poli choque": { icon: "🚨", label: "Poli choque", mode: "Acceso choque", color: "#b45309", soft: "#fff2d6" },
    Hospitalizados: { icon: "🛏️", label: "Hospitalizados", mode: "Gestión en piso", color: "#7c3aed", soft: "#f0e8ff" },
    Protocolo: { icon: "📋", label: "Protocolo", mode: "Checklist activo", color: "#be123c", soft: "#ffe4eb" },
    "Regla general": { icon: "🧭", label: "Regla general", mode: "Regla base", color: "#334155", soft: "#e2e8f0" }
  };

  const sectionIcons = [
    ["resumen", "🧭"],
    ["detalle", "📌"],
    ["secuencia", "✅"],
    ["momento", "🧩"],
    ["patolog", "🔎"],
    ["document", "📎"],
    ["formulario", "📝"],
    ["gestion", "📣"],
    ["alerta", "⚠️"]
  ];

  let queued = false;

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function onProtocolRoute() {
    return window.location.hash.startsWith(routePrefix) && document.querySelector("#protocolPage.active");
  }

  function currentSlug() {
    return decodeURIComponent(window.location.hash.slice(routePrefix.length).split("?")[0] || "");
  }

  function currentCategory() {
    const raw = document.querySelector("#protocolCategory")?.textContent || "";
    return raw.split("·")[0].trim() || "Flujo";
  }

  function metaFor(category) {
    return categoryMeta[category] || categoryMeta.Flujo;
  }

  function iconForLabel(label) {
    const clean = normalize(label);
    const found = sectionIcons.find(([needle]) => clean.includes(needle));
    return found ? found[1] : "▪️";
  }

  function labelFor(section) {
    if (!section) return "Sección";
    if (section.classList.contains("protocol-card")) return "Resumen";
    if (section.classList.contains("source-docs-panel")) return "Documentos";
    if (section.classList.contains("external-form-panel")) return "Formulario";
    if (section.classList.contains("priority-panel")) return "Gestión";
    if (section.classList.contains("warning")) return "Alerta";
    return section.querySelector(":scope > .detail-label")?.textContent?.trim()
      || section.querySelector(".route-section-head strong")?.dataset.cleanLabel
      || "Sección";
  }

  function noteFor(label) {
    const clean = normalize(label);
    if (clean.includes("detalle")) return "Lo importante para coordinar y documentar.";
    if (clean.includes("secuencia")) return "Pasos sugeridos, en orden de acción.";
    if (clean.includes("momento")) return "Escenarios prácticos para decidir rápido.";
    if (clean.includes("patolog")) return "Busca criterios sin recorrer la lista completa.";
    if (clean.includes("document")) return "Respaldo institucional completo.";
    if (clean.includes("formulario")) return "Acceso directo al formulario asociado.";
    if (clean.includes("gestion")) return "Registro para seguimiento prioritario.";
    if (clean.includes("alerta")) return "Punto crítico antes de cerrar el caso.";
    return "Vista rápida del flujo.";
  }

  function addStyles() {
    if (document.querySelector("#protocol-detail-polish-style")) return;
    const style = document.createElement("style");
    style.id = "protocol-detail-polish-style";
    style.textContent = `
      #protocolPage.protocol-emoji-ui{--route-color:#0f766e;--route-soft:#dff5ef;--route-line:#d8e1dc;--route-muted:#5d6965}
      #protocolPage.protocol-emoji-ui .page-head{margin-bottom:10px}
      #protocolPage.protocol-emoji-ui .page-head h1{letter-spacing:0}
      .route-quickbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px;padding:10px;background:#fff;border:1px solid var(--route-line);border-left:6px solid var(--route-color);border-radius:10px;box-shadow:0 9px 20px rgba(16,18,20,.07)}
      .route-chip{min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 12px;color:#14312d;background:var(--route-soft);border:1px solid var(--route-line);border-radius:999px;font-weight:900;text-decoration:none;cursor:pointer}.route-chip.primary{color:#fff;background:var(--route-color);border-color:var(--route-color)}.route-chip:hover,.route-chip:focus-visible{transform:translateY(-1px);outline:none;box-shadow:0 8px 16px rgba(16,18,20,.12)}
      #protocolDetail .protocol-card.route-hero{position:relative;overflow:hidden;display:grid;gap:13px;padding:18px;color:#fff;background:linear-gradient(135deg,var(--route-color),#10231f 78%);border:0;border-bottom:6px solid var(--route-color);border-radius:12px;box-shadow:0 16px 34px rgba(16,18,20,.18)}
      #protocolDetail .protocol-card.route-hero::after{content:"";position:absolute;right:-70px;bottom:-92px;width:210px;height:210px;border:24px solid rgba(255,255,255,.08);border-radius:50%;pointer-events:none}
      .route-hero-top,.route-vitals,.route-map,.route-hero-actions{position:relative;z-index:1}.route-hero-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.route-mode,.route-category{display:inline-flex;align-items:center;gap:7px;min-height:30px;padding:0 10px;border-radius:999px;font-size:.76rem;font-weight:950;text-transform:uppercase}.route-mode{color:#073b35;background:#bff2e6}.route-category{color:#fff;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.24)}
      #protocolDetail .route-hero .page-badge{color:#fff;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.24)}#protocolDetail .route-hero .protocol-summary{color:#eefdf9;font-size:1.06rem;line-height:1.48}#protocolDetail .route-hero .tag{color:#073b35;background:#d9fff6;border-radius:999px}
      .route-vitals{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:9px}.route-vital{display:grid;gap:4px;min-height:70px;padding:10px 11px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:10px}.route-vital span{color:#c8fff4;font-size:.72rem;font-weight:950;text-transform:uppercase}.route-vital strong{font-size:1.08rem;line-height:1.08}
      .route-map{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.route-map-node{display:grid;gap:4px;min-height:58px;padding:9px;color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:10px;text-align:center;font-weight:900}.route-map-node span{font-size:1.2rem}.route-map-node small{font-size:.72rem;line-height:1.12;color:#ddfff7}
      .route-hero-actions{display:flex;flex-wrap:wrap;gap:8px}.route-hero-actions .route-chip{background:#fff;color:#0d3c36;border-color:#fff}.route-hero-actions .route-chip.secondary{color:#fff;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.28)}
      .route-jump-nav{position:sticky;top:84px;z-index:4;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);border:1px solid var(--route-line);border-left:6px solid var(--route-color);border-radius:10px;box-shadow:0 10px 24px rgba(16,18,20,.08)}.route-jump-label{color:var(--route-muted);font-size:.76rem;font-weight:950;text-transform:uppercase}.route-jump-nav button{min-height:34px;padding:0 10px;color:#17312d;background:#fff;border:1px solid #ccd9d4;border-radius:999px;font-weight:850;cursor:pointer}.route-jump-nav button:hover,.route-jump-nav button:focus-visible{color:#fff;background:var(--route-color);border-color:var(--route-color);outline:none}
      #protocolDetail .detail-section.route-section,#protocolDetail .source-docs-panel.route-section,#protocolDetail .external-form-panel.route-section,#protocolDetail .priority-panel.route-section{position:relative;overflow:hidden;border-left:7px solid var(--route-color);border-radius:12px;box-shadow:0 12px 26px rgba(16,18,20,.08)}.route-section-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin:-2px 0 12px}.route-section-head strong{display:block;margin:0;color:var(--route-color);font-size:.82rem;font-weight:950;text-transform:uppercase}.route-section-head span{display:block;margin-top:2px;color:var(--route-muted);font-size:.88rem;line-height:1.28}.route-collapse{min-height:32px;padding:0 9px;color:var(--route-color);background:var(--route-soft);border:1px solid var(--route-line);border-radius:999px;font-weight:900;cursor:pointer}.route-section.is-collapsed > :not(.route-section-head){display:none!important}.route-collapse::after{content:" ocultar"}.route-section.is-collapsed .route-collapse::after{content:" abrir"}
      #protocolDetail .grid{grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:11px}.field.emoji-field{grid-template-columns:42px minmax(0,1fr);gap:4px 11px;align-items:start;padding:12px;background:#fff;border:1px solid #dfe8e3;border-top:4px solid var(--route-color);border-radius:10px;box-shadow:0 8px 18px rgba(16,18,20,.055);transition:transform 130ms ease,box-shadow 130ms ease}.field.emoji-field:hover{transform:translateY(-1px);box-shadow:0 12px 22px rgba(16,18,20,.1)}.field-icon{grid-row:1 / span 2;display:grid;place-items:center;width:42px;height:42px;color:#fff;background:var(--route-color);border-radius:10px;font-size:1.15rem}.field.emoji-field strong{grid-column:2;color:#202a28;letter-spacing:0}.field.emoji-field span:not(.field-icon){grid-column:2;color:#4f5e59}
      #protocolDetail .flow{position:relative;gap:0;margin-left:3px}.flow.emoji-flow::before{content:"";position:absolute;left:16px;top:14px;bottom:14px;width:3px;background:linear-gradient(var(--route-color),#cfeee8);border-radius:999px}.flow-step.emoji-step{position:relative;grid-template-columns:36px minmax(0,1fr);gap:12px;padding:8px 0}.flow-step.emoji-step .step-number{width:36px;height:36px;background:var(--route-color);box-shadow:0 0 0 6px #fff}.flow-step.emoji-step p{margin:4px 0 0;padding:10px 12px;background:#fff;border:1px solid #e1e8e4;border-radius:10px;box-shadow:0 6px 14px rgba(16,18,20,.05)}
      #protocolDetail .moment-grid{grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.moment-card.emoji-moment{border-left-color:var(--route-color)!important;border-radius:12px;box-shadow:0 10px 20px rgba(16,18,20,.07);transition:transform 130ms ease}.moment-card.emoji-moment:hover{transform:translateY(-2px)}.moment-card.emoji-moment h3{display:flex;gap:8px;align-items:center;color:#17211e}.moment-card.emoji-moment h3::before{content:attr(data-moment-icon);display:grid;place-items:center;width:34px;height:34px;background:var(--route-soft);border-radius:10px}.moment-card.emoji-moment ul{list-style:none;display:grid;gap:8px;margin:4px 0 0;padding-left:0}.moment-card.emoji-moment li{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;margin:0;line-height:1.36}.moment-card.emoji-moment li::before{content:"✓";display:grid;place-items:center;width:22px;height:22px;color:#fff;background:var(--route-color);border-radius:50%;font-size:.75rem;font-weight:950;line-height:1}
      .pathology-search{display:grid;gap:7px;margin:0 0 12px;padding:11px;background:var(--route-soft);border:1px solid var(--route-line);border-radius:10px}.pathology-search span{color:var(--route-color);font-size:.82rem;font-weight:950;text-transform:uppercase}.pathology-search input{min-height:42px;width:100%;padding:0 12px;background:#fff;border:1px solid #cfd8d4;border-radius:8px;outline:none}.pathology-search input:focus{border-color:var(--route-color);box-shadow:0 0 0 3px rgba(15,118,110,.14)}.pathology-search small{color:#5d6965;font-weight:800}.pathology-group.emoji-pathology{background:#fff;border-color:#dfe8e3;border-radius:10px;box-shadow:0 7px 16px rgba(16,18,20,.05)}.pathology-group.emoji-pathology h3::before{content:"🔎 ";}.pathology-group[hidden],.pathology-group li[hidden]{display:none!important}
      #protocolDetail > .warning.emoji-warning{display:grid;gap:5px;border-left:7px solid #be123c;border-radius:12px;box-shadow:0 10px 20px rgba(190,18,60,.08)}.emoji-warning strong{font-size:.82rem;text-transform:uppercase}
      @media(max-width:760px){.route-quickbar,.route-jump-nav{position:static}.route-vitals,.route-map{grid-template-columns:repeat(2,minmax(0,1fr))}.route-hero{padding:16px!important}.route-hero-actions .route-chip,.route-quickbar .route-chip{width:100%;justify-content:center}.route-section-head{grid-template-columns:1fr}.route-collapse{justify-self:start}#protocolDetail .grid{grid-template-columns:1fr}.field.emoji-field{grid-template-columns:38px minmax(0,1fr)}.field-icon{width:38px;height:38px}}
      @media(max-width:480px){.route-vitals,.route-map{grid-template-columns:1fr}.route-jump-nav{overflow-x:auto;flex-wrap:nowrap}.route-jump-nav button{flex:0 0 auto}.route-hero .protocol-summary{font-size:1rem}}
    `;
    document.head.append(style);
  }

  function scrollToTarget(target) {
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function counts(detail) {
    return {
      fields: detail.querySelectorAll(".field").length,
      steps: detail.querySelectorAll(".flow-step").length,
      moments: detail.querySelectorAll(".moment-card").length,
      docs: detail.querySelectorAll(".source-docs-panel a,.external-form-panel a").length
    };
  }

  function ensureQuickbar(page, detail) {
    let bar = page.querySelector(".route-quickbar");
    if (!bar) {
      bar = document.createElement("nav");
      bar.className = "route-quickbar";
      bar.setAttribute("aria-label", "Acciones rápidas del protocolo");
      page.querySelector(".page-head")?.after(bar);
    }
    const hasPriority = !!detail.querySelector(".priority-panel");
    const html = [
      `<a class="route-chip primary" href="#/especialidades">⬅️ Volver a flujos</a>`,
      `<button class="route-chip" type="button" data-route-scroll="summary">🧭 Resumen</button>`,
      `<button class="route-chip" type="button" data-route-scroll="steps">✅ Pasos</button>`,
      hasPriority ? `<button class="route-chip" type="button" data-route-scroll="priority">📣 Gestión prioritaria</button>` : "",
      `<button class="route-chip" type="button" data-route-top>⬆️ Subir</button>`
    ].join("");
    if (bar.innerHTML !== html) bar.innerHTML = html;
  }

  function decorateHero(detail, meta, slug) {
    const card = detail.querySelector(".protocol-card");
    if (!card) return;
    card.classList.add("route-hero");
    card.style.setProperty("--route-color", meta.color);
    card.style.setProperty("--route-soft", meta.soft);
    if (card.dataset.emojiHero === slug) return;
    card.dataset.emojiHero = slug;

    const top = document.createElement("div");
    top.className = "route-hero-top";
    const badge = card.querySelector(".page-badge");
    top.innerHTML = `<span class="route-mode">${meta.icon} ${meta.mode}</span><span class="route-category">${meta.icon} ${meta.label}</span>`;
    if (badge) top.append(badge);
    card.prepend(top);

    const vitals = document.createElement("div");
    vitals.className = "route-vitals";
    card.querySelector(".tags")?.before(vitals);

    const routeMap = document.createElement("div");
    routeMap.className = "route-map";
    routeMap.innerHTML = [
      ["👀", "Evaluar"],
      ["📞", "Coordinar"],
      ["🚑", "Derivar"],
      ["📝", "Registrar"]
    ].map(([icon, label]) => `<div class="route-map-node"><span>${icon}</span><small>${label}</small></div>`).join("");
    card.querySelector(".tags")?.after(routeMap);

    const actions = document.createElement("div");
    actions.className = "route-hero-actions";
    actions.innerHTML = `<button class="route-chip" type="button" data-route-scroll="details">📌 Ver detalle</button><button class="route-chip secondary" type="button" data-route-scroll="next">🧩 Siguiente bloque</button>`;
    card.append(actions);
    updateVitals(detail);
  }

  function updateVitals(detail) {
    const card = detail.querySelector(".protocol-card.route-hero");
    const vitals = card?.querySelector(".route-vitals");
    if (!vitals) return;
    const data = counts(detail);
    vitals.innerHTML = [
      ["📌 Detalle", data.fields || "Sin"],
      ["✅ Pasos", data.steps || "Sin"],
      ["🧩 Escenarios", data.moments || "Base"],
      ["📎 Docs", data.docs || "App"]
    ].map(([label, value]) => `<div class="route-vital"><span>${label}</span><strong>${value}</strong></div>`).join("");
  }

  function ensureJumpNav(detail, slug) {
    const hero = detail.querySelector(".protocol-card");
    if (!hero) return;
    const sections = Array.from(detail.children).filter((node) => node.matches?.(".protocol-card,.detail-section,.source-docs-panel,.external-form-panel,.warning,.priority-panel"));
    let nav = detail.querySelector(".route-jump-nav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "route-jump-nav";
      nav.setAttribute("aria-label", "Navegación interna del protocolo");
      hero.after(nav);
    }
    const html = `<span class="route-jump-label">Ir a</span>` + sections.map((section, index) => {
      if (!section.id) section.id = `route-section-${slug}-${index}`.replace(/[^a-zA-Z0-9_-]/g, "-");
      const label = labelFor(section);
      return `<button type="button" data-jump-target="${section.id}">${iconForLabel(label)} ${label}</button>`;
    }).join("");
    if (nav.innerHTML !== html) nav.innerHTML = html;
  }

  function decorateSections(detail) {
    detail.querySelectorAll(".detail-section,.source-docs-panel,.external-form-panel,.priority-panel").forEach((section) => {
      section.classList.add("route-section");
      if (section.dataset.emojiSection) return;
      section.dataset.emojiSection = "true";
      const labelNode = section.querySelector(":scope > .detail-label");
      const label = labelFor(section);
      if (labelNode) labelNode.remove();
      const head = document.createElement("div");
      head.className = "route-section-head";
      head.innerHTML = `<div><strong data-clean-label="${label}">${iconForLabel(label)} ${label}</strong><span>${noteFor(label)}</span></div><button class="route-collapse" type="button" aria-expanded="true"></button>`;
      section.prepend(head);
    });
  }

  function fieldIcon(label, value, index) {
    const text = normalize(`${label} ${value}`);
    if (/telefono|anexo|llamar|contacto|coordin/.test(text)) return "📞";
    if (/horario|lunes|martes|miercoles|jueves|viernes|sabado|domingo|habil|inhabil|hora/.test(text)) return "🕒";
    if (/ic|dau|document|formulario|pitagoras|correo/.test(text)) return "📝";
    if (/destino|derivar|crs|aps|hospital|sotero|casr|hedi|hsr/.test(text)) return "🎯";
    if (/alerta|no |evitar|shock|urgente|inestable|contraindic/.test(text)) return "⚠️";
    return String(index + 1);
  }

  function decorateFields(detail) {
    detail.querySelectorAll(".field").forEach((field, index) => {
      if (field.classList.contains("emoji-field")) return;
      const strong = field.querySelector("strong");
      const span = field.querySelector("span:not(.field-icon)");
      const icon = fieldIcon(strong?.textContent || "", span?.textContent || "", index);
      const badge = document.createElement("span");
      badge.className = "field-icon";
      badge.setAttribute("aria-hidden", "true");
      badge.textContent = icon;
      field.prepend(badge);
      field.classList.add("emoji-field");
    });
  }

  function decorateFlow(detail) {
    const flow = detail.querySelector(".flow");
    if (flow) flow.classList.add("emoji-flow");
    detail.querySelectorAll(".flow-step").forEach((step) => step.classList.add("emoji-step"));
  }

  function decorateMoments(detail) {
    detail.querySelectorAll(".moment-card").forEach((card, index) => {
      card.classList.add("emoji-moment");
      card.dataset.momentIcon = ["🧩", "🧠", "🚑", "📞", "✅"][index % 5];
    });
  }

  function ensurePathologySearch(detail) {
    const section = detail.querySelector(".pathologies");
    if (!section) return;
    section.querySelectorAll(".pathology-group").forEach((group) => group.classList.add("emoji-pathology"));
    if (section.querySelector(".pathology-search")) return;
    const box = document.createElement("label");
    box.className = "pathology-search";
    box.innerHTML = `<span>🔎 Buscar dentro de patologías</span><input type="search" autocomplete="off" placeholder="Ej: tumor, absceso, trauma..."><small data-pathology-status></small>`;
    (section.querySelector(".route-section-head") || section.firstElementChild)?.after(box);
    const input = box.querySelector("input");
    const status = box.querySelector("[data-pathology-status]");
    input.addEventListener("input", () => {
      const query = normalize(input.value.trim());
      let visible = 0;
      section.querySelectorAll(".pathology-group").forEach((group) => {
        const groupName = normalize(group.querySelector("h3")?.textContent || "");
        let groupVisible = false;
        group.querySelectorAll("li").forEach((item) => {
          const hit = !query || normalize(item.textContent).includes(query) || groupName.includes(query);
          item.hidden = !hit;
          if (hit) {
            visible += 1;
            groupVisible = true;
          }
        });
        group.hidden = !groupVisible;
      });
      status.textContent = query ? `${visible} coincidencia${visible === 1 ? "" : "s"}` : "Lista completa visible";
    });
    input.dispatchEvent(new Event("input"));
  }

  function decorateWarnings(detail) {
    detail.querySelectorAll(":scope > .warning").forEach((warning) => {
      if (warning.classList.contains("emoji-warning")) return;
      const text = warning.textContent.trim();
      warning.textContent = "";
      const title = document.createElement("strong");
      title.textContent = "⚠️ Alerta del flujo";
      const body = document.createElement("span");
      body.textContent = text;
      warning.append(title, body);
      warning.classList.add("emoji-warning");
    });
  }

  function wireClicks(page, detail) {
    if (page.dataset.emojiUiWire) return;
    page.dataset.emojiUiWire = "true";
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
        if (key === "steps") scrollToTarget(detail.querySelector(".flow")?.closest(".detail-section") || detail.querySelector(".moments-panel") || detail.querySelector(".detail-section"));
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
        const section = collapse.closest(".route-section");
        const expanded = !section.classList.toggle("is-collapsed");
        collapse.setAttribute("aria-expanded", String(expanded));
      }
    });
  }

  function patch() {
    if (!onProtocolRoute()) return;
    const page = document.querySelector("#protocolPage");
    const detail = document.querySelector("#protocolDetail");
    if (!page || !detail || !detail.children.length) return;
    const meta = metaFor(currentCategory());
    page.classList.add("protocol-emoji-ui");
    page.style.setProperty("--route-color", meta.color);
    page.style.setProperty("--route-soft", meta.soft);
    addStyles();
    ensureQuickbar(page, detail);
    decorateHero(detail, meta, currentSlug());
    decorateSections(detail);
    decorateFields(detail);
    decorateFlow(detail);
    decorateMoments(detail);
    ensurePathologySearch(detail);
    decorateWarnings(detail);
    ensureJumpNav(detail, currentSlug());
    updateVitals(detail);
    wireClicks(page, detail);
  }

  function schedulePatch() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      patch();
    });
  }

  window.addEventListener("hashchange", () => {
    schedulePatch();
    setTimeout(schedulePatch, 180);
    setTimeout(schedulePatch, 600);
  });

  const observer = new MutationObserver(schedulePatch);
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedulePatch);
  else schedulePatch();
})();
