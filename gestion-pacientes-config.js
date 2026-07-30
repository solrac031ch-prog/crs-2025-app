window.CRS_PATIENT_CASES_CONFIG = Object.freeze({
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbx8aOAwVisgpiQnfK8vew6O6Vv8rv9oq31CwtUw_jFSD-8r12M6vv94p-gXXN4SXFOt/exec"
});

(() => {
  function simplifyDoctorRegistration(root = document) {
    root.querySelectorAll('input[name="serviceCode"]').forEach((input) => input.closest("label")?.remove());
    root.querySelectorAll(".patient-note").forEach((note) => {
      const text = String(note.textContent || "").toLowerCase();
      if (!text.includes("código interno") && !text.includes("primera solicitud")) return;
      note.innerHTML = "<strong>Identificación del médico:</strong> ingresa tu nombre y RUT. La primera solicitud registra automáticamente al médico.";
    });
  }

  function scheduleSimplify() {
    requestAnimationFrame(() => simplifyDoctorRegistration());
    window.setTimeout(() => simplifyDoctorRegistration(), 80);
  }

  window.addEventListener("hashchange", scheduleSimplify);
  window.addEventListener("crs:ui-section-ready", scheduleSimplify);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleSimplify, { once: true });
  else scheduleSimplify();
})();