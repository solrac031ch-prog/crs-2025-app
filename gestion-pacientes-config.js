window.CRS_PATIENT_CASES_CONFIG = Object.freeze({
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbx8aOAwVisgpiQnfK8vew6O6Vv8rv9oq31CwtUw_jFSD-8r12M6vv94p-gXXN4SXFOt/exec"
});

(() => {
  const SIMPLE_NOTE = "<strong>Identificación del médico:</strong> ingresa tu nombre y RUT. Si es la primera solicitud, el sistema registrará el RUT automáticamente.";
  const FINAL_STATES = new Set(["Gestionada", "Cerrada"]);
  let hydrateTimer = 0;
  let hydrationToken = 0;

  function simplifyDoctorRegistration(root = document) {
    root.querySelectorAll('input[name="serviceCode"]').forEach((input) => {
      const label = input.closest("label");
      if (label) label.remove();
    });

    root.querySelectorAll(".patient-note").forEach((note) => {
      if (note.dataset.registrationSimplified === "true") return;
      const text = String(note.textContent || "").toLowerCase();
      if (text.includes("código interno") || text.includes("primera solicitud")) {
        note.dataset.registrationSimplified = "true";
        note.innerHTML = SIMPLE_NOTE;
      }
    });
  }

  function addFollowUpGuide(root = document) {
    const table = root.querySelector("#patientCasesTable");
    if (!table || document.querySelector("[data-followup-state-guide]")) return false;

    const guide = document.createElement("div");
    guide.className = "patient-note";
    guide.dataset.followupStateGuide = "true";
    guide.innerHTML = [
      "<strong>Uso de estados:</strong>",
      "<strong>Gestionada</strong> significa que la coordinación fue realizada (por ejemplo, hora asignada, examen coordinado o derivación ingresada), aunque la atención todavía pueda estar pendiente.",
      "<strong>Cerrada</strong> significa que no quedan acciones administrativas pendientes y el resultado final quedó documentado."
    ].join("<br>");
    table.before(guide);
    return true;
  }

  function buildTextAreaLabel(title, name, placeholder) {
    const label = document.createElement("label");
    label.textContent = title;
    const textarea = document.createElement("textarea");
    textarea.name = name;
    textarea.placeholder = placeholder;
    label.append(textarea);
    return label;
  }

  function syncFollowUpRequirements(form, autoFillDate = false) {
    const state = String(form.querySelector('[name="estado"]')?.value || "");
    const result = form.querySelector('[name="resuelto"]');
    const observations = form.querySelector('[name="observaciones"]');
    const resolutionDate = form.querySelector('[name="fecha_resolucion"]');
    const nextStep = form.querySelector('[name="proximo_paso"]');
    const isFinal = FINAL_STATES.has(state);

    if (result) {
      result.required = isFinal;
      const value = String(result.value || "").trim();
      result.setCustomValidity(
        isFinal && (!value || value.toLowerCase() === "pendiente")
          ? "Registra el resultado de la gestión antes de marcarla como gestionada o cerrada."
          : ""
      );
    }

    if (resolutionDate) {
      resolutionDate.required = isFinal;
      if (isFinal && autoFillDate && !resolutionDate.value) {
        resolutionDate.value = new Date().toISOString().slice(0, 10);
      }
    }

    if (state === "Cerrada" && nextStep) {
      const current = String(nextStep.value || "").trim().toLowerCase();
      if (!current || current === "pendiente de revisión por jefatura") {
        nextStep.value = "Sin acciones pendientes";
      }
    }

    if (observations) {
      observations.placeholder = state === "Cancelada"
        ? "Explica brevemente por qué se cancela la solicitud"
        : "Información adicional, dificultades o acuerdos relevantes";
    }
  }

  function enhanceFollowUpForm(form) {
    if (form.dataset.followupV2 === "true") return false;
    form.dataset.followupV2 = "true";

    const stateSelect = form.querySelector('[name="estado"]');
    const stateLabel = stateSelect?.closest("label");
    const saveButton = form.querySelector('button[type="submit"]');
    if (!stateLabel || !saveButton) return false;

    const resultLabel = buildTextAreaLabel(
      "Resultado de la gestión",
      "resuelto",
      "Ej: hora asignada para el 05/08, examen coordinado o gestión no concretada"
    );
    resultLabel.dataset.followupResult = "true";
    stateLabel.after(resultLabel);

    const observationsLabel = buildTextAreaLabel(
      "Observaciones",
      "observaciones",
      "Información adicional, dificultades o acuerdos relevantes"
    );
    observationsLabel.dataset.followupObservations = "true";
    saveButton.before(observationsLabel);

    syncFollowUpRequirements(form, false);
    return true;
  }

  async function hydrateFollowUpForms() {
    const api = window.CRS_PATIENT_CASES;
    const forms = Array.from(document.querySelectorAll('[data-patient-case-update][data-followup-v2="true"]'));
    if (!forms.length || !api?.listCases) return;

    const token = ++hydrationToken;
    let result;
    try {
      result = await api.listCases();
    } catch (error) {
      console.warn("No se pudieron cargar los detalles del seguimiento", error);
      return;
    }
    if (token !== hydrationToken || result?.source !== "drive") return;

    const rows = new Map((result.rows || []).map((row) => [String(row.id || ""), row]));
    document.querySelectorAll('[data-patient-case-update][data-followup-v2="true"]').forEach((form) => {
      const row = rows.get(String(form.dataset.patientCaseUpdate || ""));
      if (!row) return;

      const resultField = form.querySelector('[name="resuelto"]');
      const observationsField = form.querySelector('[name="observaciones"]');
      if (resultField) {
        resultField.value = String(row.resuelto || "").trim().toLowerCase() === "pendiente"
          ? ""
          : String(row.resuelto || "");
      }
      if (observationsField) observationsField.value = String(row.observaciones || "");
      syncFollowUpRequirements(form, false);
    });
  }

  function scheduleHydration() {
    window.clearTimeout(hydrateTimer);
    hydrateTimer = window.setTimeout(hydrateFollowUpForms, 120);
  }

  function enhanceFollowUp(root = document) {
    let changed = addFollowUpGuide(root);
    root.querySelectorAll("[data-patient-case-update]").forEach((form) => {
      if (enhanceFollowUpForm(form)) changed = true;
    });
    if (changed) scheduleHydration();
  }

  function enhanceAll(root = document) {
    simplifyDoctorRegistration(root);
    enhanceFollowUp(root);
  }

  function start() {
    enhanceAll();

    document.addEventListener("change", (event) => {
      const form = event.target.closest?.("[data-patient-case-update]");
      if (!form) return;
      syncFollowUpRequirements(form, event.target.matches('[name="estado"]'));
    }, true);

    document.addEventListener("input", (event) => {
      const form = event.target.closest?.("[data-patient-case-update]");
      if (!form) return;
      if (event.target.matches('[name="resuelto"]')) syncFollowUpRequirements(form, false);
    }, true);

    document.addEventListener("submit", (event) => {
      const form = event.target.closest?.("[data-patient-case-update]");
      if (!form) return;
      syncFollowUpRequirements(form, true);
      if (form.checkValidity()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      form.reportValidity();
    }, true);

    const observer = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.addedNodes.length > 0)) return;
      enhanceAll();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();