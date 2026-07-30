(() => {
  const SPECIALTIES_ROUTE = "#/especialidades";
  const PROTOCOL_PREFIX = "#/especialidad/";
  let loadingPromise = null;

  function currentRoute() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function isSupportedRoute() {
    const route = currentRoute();
    return route === SPECIALTIES_ROUTE || route.startsWith(PROTOCOL_PREFIX);
  }

  function refresh() {
    if (!isSupportedRoute()) return;
    window.CRS_ESPECIALIDADES_ESTABLE?.refresh?.();
  }

  function loadStableSpecialties() {
    if (!isSupportedRoute()) return Promise.resolve();
    if (window.CRS_ESPECIALIDADES_ESTABLE) {
      refresh();
      return Promise.resolve();
    }
    if (loadingPromise) return loadingPromise;

    const existing = document.querySelector("script[data-especialidades-estable]");
    loadingPromise = new Promise((resolve, reject) => {
      const script = existing || document.createElement("script");
      script.src = "./especialidades-estable.js?v=4";
      script.async = true;
      script.dataset.especialidadesEstable = "true";
      script.onload = () => {
        refresh();
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

  window.CRS_SPECIALTIES_UI = Object.freeze({
    load: loadStableSpecialties,
    refresh
  });
})();
