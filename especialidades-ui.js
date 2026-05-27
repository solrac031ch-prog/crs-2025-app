(() => {
  function loadStableSpecialties() {
    if (document.querySelector("script[data-especialidades-estable]") || window.__CRS_ESPECIALIDADES_ESTABLE_REQUESTED__) return;
    window.__CRS_ESPECIALIDADES_ESTABLE_REQUESTED__ = true;
    const script = document.createElement("script");
    script.src = "./especialidades-estable.js?v=1";
    script.dataset.especialidadesEstable = "true";
    (document.body || document.documentElement).append(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadStableSpecialties, { once: true });
  } else {
    loadStableSpecialties();
  }
})();