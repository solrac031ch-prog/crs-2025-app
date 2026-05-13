(function () {
  function addStyle() {
    if (document.querySelector("#especialidades-ui-fix-style")) return;
    const style = document.createElement("style");
    style.id = "especialidades-ui-fix-style";
    style.textContent = `
      .specialty-card-upgraded{min-height:126px;grid-template-rows:auto auto;align-items:center;gap:4px 12px;padding-bottom:30px}
      .specialty-card-upgraded .specialty-sticker{grid-column:1;grid-row:1 / span 2}
      .specialty-card-upgraded strong{grid-column:2;grid-row:1;min-width:0}
      .specialty-card-hint{grid-column:2;grid-row:2;margin:0}
      .specialty-hub .control-panel,.specialty-hub .shift-box,.specialty-hub .segmented{min-width:0;max-width:100%}
      .specialty-hub .segment{min-width:0;padding-left:8px;padding-right:8px}
      @media(max-width:560px){.specialty-card-upgraded{min-height:114px}.specialty-card-route{position:static;grid-column:2;justify-self:start;margin-top:7px}.specialty-hub .segmented{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.specialty-hub .segment{width:100%;font-size:.88rem}}
    `;
    document.head.append(style);
  }

  function patchShortcuts() {
    addStyle();
    const neuro = document.querySelector('[data-specialty-query="neurocirugia"]');
    if (neuro) neuro.dataset.specialtyQuery = "HIC";
    const endoscopy = document.querySelector('[data-specialty-query="endoscopia"]');
    if (endoscopy) endoscopy.dataset.specialtyQuery = "EDA";
  }

  const observer = new MutationObserver(patchShortcuts);
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patchShortcuts);
  else patchShortcuts();
})();
