(() => {
  const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const getUsoOcasionalUrl = () => {
    try {
      if (typeof externalForms !== "undefined" && externalForms.medicamentosUsoOcasionalUrl) {
        return externalForms.medicamentosUsoOcasionalUrl;
      }
    } catch (error) {
      // El formulario puede no estar disponible si se carga este ajuste antes que app.js.
    }
    return "./form-docs/medicamentos-uso-ocasional-rellenable.pdf";
  };

  const enhanceUsoOcasionalCards = () => {
    document.querySelectorAll(".law-result").forEach((card) => {
      if (card.dataset.usoOcasionalEnhanced === "true") return;
      if (!normalize(card.textContent).includes("uso ocasional")) return;

      const actions = document.createElement("div");
      actions.className = "law-actions arsenal-uso-ocasional-actions";

      const link = document.createElement("a");
      link.className = "document-button";
      link.href = getUsoOcasionalUrl();
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Abrir formulario Medicamentos de uso ocasional";

      actions.append(link);
      card.append(actions);
      card.dataset.usoOcasionalEnhanced = "true";
    });
  };

  const observer = new MutationObserver(() => enhanceUsoOcasionalCards());
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("hashchange", () => window.setTimeout(enhanceUsoOcasionalCards, 80));
  document.addEventListener("input", () => window.setTimeout(enhanceUsoOcasionalCards, 80), true);
  document.addEventListener("click", () => window.setTimeout(enhanceUsoOcasionalCards, 80), true);

  enhanceUsoOcasionalCards();
})();