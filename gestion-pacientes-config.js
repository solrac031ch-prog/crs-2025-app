window.CRS_PATIENT_CASES_CONFIG = Object.freeze({
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbyoWv7y_zH3V29SrOp3UbjHEZnX4Li65CSk0hO_n2Yu5dCyLZ0CAiN-F7UIHwz2aIUJ/exec"
});

(() => {
  const SIMPLE_NOTE = "<strong>Identificación del médico:</strong> ingresa tu nombre y RUT. Si es la primera solicitud, el sistema registrará el RUT automáticamente.";

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

  function start() {
    simplifyDoctorRegistration();
    const observer = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some((mutation) => mutation.addedNodes.length > 0);
      if (hasAddedNodes) simplifyDoctorRegistration();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
