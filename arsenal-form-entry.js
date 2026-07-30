(() => {
  if (window.__CRS_ARSENAL_FORM_ENTRY__) return;
  window.__CRS_ARSENAL_FORM_ENTRY__ = true;

  const arsenalForm = {
    title: "Arsenal terapeutico HPH 2026",
    description: "Buscador de medicamentos disponibles en el hospital, con unidad y restriccion del arsenal farmacoterapeutico 2026.",
    actionLabel: "Buscar medicamentos",
    type: "arsenalTerapeutico"
  };

  if (typeof turnForms !== "undefined" && Array.isArray(turnForms) && !turnForms.some((item) => item.type === arsenalForm.type)) {
    turnForms.splice(1, 0, arsenalForm);
  }

  if (typeof window.renderTurnForms !== "function") return;
  const previousRenderTurnForms = window.renderTurnForms;

  window.renderTurnForms = function renderTurnFormsWithArsenalEntry() {
    previousRenderTurnForms();
    const title = Array.from(document.querySelectorAll(".document-panel h2"))
      .find((item) => item.textContent === arsenalForm.title);
    const action = title?.closest(".document-panel")?.querySelector(".document-action");
    if (!action) return;
    action.innerHTML = "";
    const link = document.createElement("a");
    link.className = "document-button";
    link.href = "#/formularios/arsenal-terapeutico";
    link.textContent = "Buscar medicamentos";
    action.append(link);
  };
})();