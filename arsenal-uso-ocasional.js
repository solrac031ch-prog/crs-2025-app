(() => {
  const FORM_URL = "./form-docs/medicamentos-uso-ocasional-rellenable.pdf";
  const ROUTE = "#/formularios/arsenal-terapeutico";
  const TARGET_RESTRICTION = "uso ocasional dosis mayor";
  let observer = null;
  let scheduled = false;

  const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  function isArsenalRoute() {
    return location.hash.split("?")[0] === ROUTE;
  }

  function addStyle() {
    if (document.querySelector("#arsenal-uso-ocasional-style")) return;
    const style = document.createElement("style");
    style.id = "arsenal-uso-ocasional-style";
    style.textContent = `
      .arsenal-uso-ocasional-card{border-left:7px solid #f59e0b!important;background:linear-gradient(135deg,#fff,#fffbeb)}
      .arsenal-uso-ocasional-cta{display:grid;gap:8px;margin-top:12px;padding:12px;border:1px solid #facc15;border-radius:12px;background:#fffbeb;color:#713f12}
      .arsenal-uso-ocasional-cta strong{color:#713f12}.arsenal-uso-ocasional-cta span{line-height:1.35}
      .arsenal-uso-ocasional-cta .document-button{width:max-content;max-width:100%}
      @media(max-width:680px){.arsenal-uso-ocasional-cta .document-button{width:100%;justify-content:center}}
    `;
    document.head.append(style);
  }

  function enhanceCard(card) {
    if (!card || card.dataset.usoOcasionalReady === "true") return;
    const text = normalize(card.textContent);
    if (!text.includes(TARGET_RESTRICTION)) return;

    card.dataset.usoOcasionalReady = "true";
    card.classList.add("arsenal-uso-ocasional-card");

    const cta = document.createElement("div");
    cta.className = "arsenal-uso-ocasional-cta";

    const title = document.createElement("strong");
    title.textContent = "Uso ocasional dosis mayor";

    const note = document.createElement("span");
    note.textContent = "Este medicamento requiere completar el formulario institucional antes de gestionar la solicitud.";

    const link = document.createElement("a");
    link.className = "document-button";
    link.href = FORM_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Abrir formulario Medicamentos de uso ocasional";

    cta.append(title, note, link);
    card.append(cta);
  }

  function enhanceResults() {
    scheduled = false;
    if (!isArsenalRoute()) return;
    addStyle();
    document.querySelectorAll("#turnFormsList .law-result").forEach(enhanceCard);
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhanceResults);
  }

  function route() {
    if (observer) observer.disconnect();
    observer = null;
    if (!isArsenalRoute()) return;
    const mount = document.querySelector("#turnFormsList");
    if (mount) {
      observer = new MutationObserver(scheduleEnhance);
      observer.observe(mount, { childList: true, subtree: true });
    }
    scheduleEnhance();
  }

  window.addEventListener("hashchange", route);
  document.addEventListener("input", (event) => {
    if (event.target?.closest("#turnFormsList")) scheduleEnhance();
  }, true);
  document.addEventListener("submit", (event) => {
    if (event.target?.closest("#turnFormsList")) setTimeout(scheduleEnhance, 0);
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route);
  else route();
})();
