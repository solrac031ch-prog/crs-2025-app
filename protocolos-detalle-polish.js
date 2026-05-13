(function () {
  function labelFor(section) {
    if (!section) return "Seccion";
    if (section.classList.contains("protocol-card")) return "Resumen";
    if (section.classList.contains("source-docs-panel")) return "Documentos";
    if (section.classList.contains("external-form-panel")) return "Formulario";
    if (section.classList.contains("priority-panel")) return "Gestion";
    if (section.classList.contains("warning")) return "Alerta";
    return section.querySelector(".route-section-head strong")?.textContent?.trim()
      || section.querySelector(".detail-label")?.textContent?.trim()
      || "Seccion";
  }

  function polishProtocolDetail() {
    if (!window.location.hash.startsWith("#/especialidad/")) return;
    const nav = document.querySelector("#protocolDetail .route-jump-nav");
    if (!nav) return;
    nav.querySelectorAll("[data-jump-target]").forEach((button) => {
      const section = document.getElementById(button.dataset.jumpTarget);
      const label = labelFor(section);
      if (button.textContent !== label) button.textContent = label;
    });
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
