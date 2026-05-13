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
