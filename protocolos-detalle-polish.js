(function () {
  const labelIcons = new Map([
    ["Resumen", "🧭"],
    ["Indicaciones", "📌"],
    ["Campos", "📌"],
    ["Pasos", "✅"],
    ["Flujo", "➡️"],
    ["Momentos", "🧩"],
    ["Patologias", "🔎"],
    ["Patologías", "🔎"],
    ["Documentos", "📎"],
    ["Formulario", "📝"],
    ["Gestion", "📣"],
    ["Gestión", "📣"],
    ["Alerta", "⚠️"],
    ["Seccion", "▪️"],
    ["Sección", "▪️"]
  ]);

  function stripIcon(text) {
    return String(text || "")
      .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "")
      .trim();
  }

  function displayLabel(label) {
    const clean = stripIcon(label || "Seccion");
    const icon = labelIcons.get(clean) || "▪️";
    return `${icon} ${clean}`;
  }

  function labelFor(section) {
    if (!section) return "Seccion";
    if (section.classList.contains("protocol-card")) return "Resumen";
    if (section.classList.contains("source-docs-panel")) return "Documentos";
    if (section.classList.contains("external-form-panel")) return "Formulario";
    if (section.classList.contains("priority-panel")) return "Gestion";
    if (section.classList.contains("warning")) return "Alerta";
    return stripIcon(section.querySelector(".route-section-head strong")?.textContent?.trim()
      || section.querySelector(".detail-label")?.textContent?.trim()
      || "Seccion");
  }

  function addDetailStyles() {
    if (document.querySelector("#protocol-detail-polish-style")) return;
    const style = document.createElement("style");
    style.id = "protocol-detail-polish-style";
    style.textContent = `
      #protocolPage .page-head h1{letter-spacing:-.02em}
      #protocolDetail .route-jump-nav{display:flex;flex-wrap:wrap;gap:8px;padding:10px;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 8px 18px rgba(16,18,20,.06)}
      #protocolDetail .route-jump-nav button{min-height:36px;padding:0 11px;border:1px solid #cfd8d4;border-radius:999px;background:#fbfffd;color:#153b37;font-weight:850;cursor:pointer}
      #protocolDetail .route-jump-nav button:hover,#protocolDetail .route-jump-nav button:focus-visible{background:var(--accent-soft);border-color:var(--accent);outline:none}
      #protocolDetail .detail-section,#protocolDetail .protocol-card,#protocolDetail .source-docs-panel,#protocolDetail .external-form-panel,#protocolDetail .priority-panel{border-radius:12px}
      #protocolDetail .route-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      #protocolDetail .route-section-head strong,#protocolDetail .detail-label{letter-spacing:.01em}
      #protocolDetail .flow{display:grid;gap:10px}
      #protocolDetail .flow-step{display:grid;grid-template-columns:38px minmax(0,1fr);gap:11px;align-items:center;padding:11px 12px;background:#fbfffd;border:1px solid #e1e9e5;border-left:5px solid var(--blue);border-radius:12px;box-shadow:0 6px 14px rgba(16,18,20,.045)}
      #protocolDetail .flow-step .step-number{width:38px;height:38px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--blue),#0f766e);border-radius:50%;font-size:.9rem;font-weight:950;box-shadow:0 6px 12px rgba(29,78,216,.18)}
      #protocolDetail .flow-step p{margin:0;line-height:1.42;overflow-wrap:anywhere}
      #protocolDetail .moment-grid{gap:12px}
      #protocolDetail .moment-card{border-radius:12px;box-shadow:0 7px 16px rgba(16,18,20,.055)}
      #protocolDetail .moment-card h3{display:flex;align-items:center;gap:7px}
      #protocolDetail .moment-card h3::before{content:"🧩";font-size:1rem}
      #protocolDetail .moment-card ul{list-style:none;display:grid;gap:8px;margin:4px 0 0;padding-left:0}
      #protocolDetail .moment-card li{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;align-items:start;margin:0;line-height:1.36;overflow-wrap:anywhere}
      #protocolDetail .moment-card li::before{content:"✓";display:grid;place-items:center;width:22px;height:22px;color:#fff;background:var(--accent);border-radius:50%;font-size:.75rem;font-weight:950;line-height:1;margin-top:-1px}
      #protocolDetail .moment-alert,.warning{border-radius:10px}
      #protocolDetail .warning::before{content:"⚠️ ";}
      @media(max-width:560px){#protocolDetail .flow-step{grid-template-columns:34px minmax(0,1fr);padding:10px}#protocolDetail .flow-step .step-number{width:34px;height:34px}#protocolDetail .route-jump-nav{position:relative;overflow-x:auto;flex-wrap:nowrap}#protocolDetail .route-jump-nav button{white-space:nowrap}}
    `;
    document.head.append(style);
  }

  function polishNavLabels() {
    const nav = document.querySelector("#protocolDetail .route-jump-nav");
    if (!nav) return;
    nav.querySelectorAll("[data-jump-target]").forEach((button) => {
      const section = document.getElementById(button.dataset.jumpTarget);
      const label = displayLabel(labelFor(section));
      if (button.textContent !== label) button.textContent = label;
    });
  }

  function polishSectionLabels() {
    document.querySelectorAll("#protocolDetail .route-section-head strong").forEach((node) => {
      const clean = stripIcon(node.textContent);
      const label = displayLabel(clean);
      if (node.textContent !== label) node.textContent = label;
    });
  }

  function polishProtocolDetail() {
    if (!window.location.hash.startsWith("#/especialidad/")) return;
    addDetailStyles();
    polishNavLabels();
    polishSectionLabels();
    document.querySelectorAll(".route-vital strong").forEach((node) => {
      if (node.textContent.trim() === "Libre") node.textContent = "Sin";
    });
  }

  const observer = new MutationObserver(() => window.setTimeout(polishProtocolDetail, 0));
  if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener("hashchange", () => window.setTimeout(polishProtocolDetail, 180));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", polishProtocolDetail);
  else polishProtocolDetail();
})();
