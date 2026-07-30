(() => {
  const SPECIALTIES_ROUTE = "#/especialidades";
  let loadingPromise = null;
  let refreshTimer = 0;

  function currentRoute() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function requestRefresh(attempt = 0) {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      if (currentRoute() !== SPECIALTIES_ROUTE) return;
      const page = document.querySelector("#specialtiesPage.active");
      const input = document.querySelector("#searchInput");
      const results = document.querySelector("#specialtyGroups");
      if (page && input && results?.children.length) {
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      if (attempt < 6) requestRefresh(attempt + 1);
    }, attempt === 0 ? 0 : Math.min(60 * attempt, 240));
  }

  function loadStableSpecialties() {
    if (currentRoute() !== SPECIALTIES_ROUTE) return Promise.resolve();
    if (window.__CRS_ESPECIALIDADES_ESTABLE_LOADED__) {
      requestRefresh();
      return Promise.resolve();
    }
    if (loadingPromise) return loadingPromise;

    const existing = document.querySelector("script[data-especialidades-estable]");
    loadingPromise = new Promise((resolve, reject) => {
      const script = existing || document.createElement("script");
      script.src = "./especialidades-estable.js?v=3";
      script.async = true;
      script.dataset.especialidadesEstable = "true";
      script.onload = () => {
        window.__CRS_ESPECIALIDADES_ESTABLE_LOADED__ = true;
        requestRefresh();
        resolve();
      };
      script.onerror = () => {
        loadingPromise = null;
        script.remove();
        reject(new Error("No se pudo cargar la interfaz de especialidades."));
      };
      if (!existing) (document.body || document.documentElement).append(script);
    });

    return loadingPromise;
  }

  function scheduleLoad() {
    if (currentRoute() !== SPECIALTIES_ROUTE) return;
    loadStableSpecialties().catch(console.error);
  }

  window.CRS_SPECIALTIES_UI = Object.freeze({
    load: loadStableSpecialties,
    refresh: requestRefresh
  });

  window.addEventListener("hashchange", scheduleLoad);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleLoad, { once: true });
  } else {
    scheduleLoad();
  }
})();