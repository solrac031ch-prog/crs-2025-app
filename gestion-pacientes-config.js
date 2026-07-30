window.CRS_PATIENT_CASES_CONFIG = Object.freeze({
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbw0DVegfMkhL2abjfDn7RJPS2zH_zAmI7DVHPO_tZdF2qMED04lff62hfWl91TV9D0/exec"
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
