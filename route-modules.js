(() => {
  const scriptPromises = new Map();
  const stylePromises = new Map();
  const routePromises = new Map();

  function route(value = location.hash) {
    return String(value || "#/inicio").split("?")[0] || "#/inicio";
  }

  function versioned(path, version) {
    return `${path}?v=${version}`;
  }

  function loadStyle(key, path, version) {
    if (stylePromises.has(key)) return stylePromises.get(key);

    const existing = document.querySelector(`link[data-crs-route-style="${key}"]`);
    if (existing) return Promise.resolve(existing);

    const promise = new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = versioned(path, version);
      link.dataset.crsRouteStyle = key;
      link.onload = () => resolve(link);
      link.onerror = () => {
        console.warn(`No se pudo cargar el estilo ${path}`);
        resolve(link);
      };
      document.head.append(link);
    });

    stylePromises.set(key, promise);
    return promise;
  }

  function loadScript(key, path, version, attributes = {}) {
    if (scriptPromises.has(key)) return scriptPromises.get(key);

    const existing = document.querySelector(`script[data-crs-route-module="${key}"]`);
    if (existing?.dataset.crsLoaded === "true") return Promise.resolve(existing);

    const promise = new Promise((resolve, reject) => {
      const script = existing || document.createElement("script");
      script.src = versioned(path, version);
      script.async = false;
      script.dataset.crsRouteModule = key;
      Object.entries(attributes).forEach(([name, value]) => {
        if (value === true) script.setAttribute(name, "");
        else if (value !== false && value != null) script.setAttribute(name, String(value));
      });
      script.onload = () => {
        script.dataset.crsLoaded = "true";
        resolve(script);
      };
      script.onerror = () => {
        scriptPromises.delete(key);
        script.remove();
        reject(new Error(`No se pudo cargar ${path}`));
      };
      if (!existing) document.body.append(script);
    });

    scriptPromises.set(key, promise);
    return promise;
  }

  async function ensureSupabase() {
    await loadScript("supabase-config", "./supabase-config.js", 18);
    await loadScript("supabase-backend", "./supabase-backend.js", 8);
  }

  async function ensureClinicalProtocols(current) {
    await Promise.all([
      loadScript("protocolos-2026-ajustes", "./protocolos-2026-ajustes.js", 4),
      loadScript("protocolos-agiles", "./protocolos-agiles.js", 6),
      current === "#/especialidades" ? ensureSupabase() : Promise.resolve()
    ]);
  }

  async function ensureManagement() {
    await Promise.all([
      loadStyle("gestion-perfiles", "./gestion-perfiles.css", 1),
      loadStyle("gestion-uhd", "./gestion-uhd-citados.css", 2),
      ensureSupabase()
    ]);
    await Promise.all([
      loadScript("gestion-perfiles", "./gestion-perfiles.js", 5),
      loadScript("gestion-uhd", "./gestion-uhd-citados.js", 4)
    ]);
  }

  async function ensureJefatura() {
    await Promise.all([
      loadStyle("supabase-admin-users", "./supabase-admin-users.css", 1),
      loadStyle("supabase-jefatura-panel", "./supabase-jefatura-panel.css", 1),
      loadStyle("jefatura-centro", "./jefatura-centro-gestion.css", 2),
      ensureSupabase()
    ]);
    await Promise.all([
      loadScript("supabase-jefatura-panel", "./supabase-jefatura-panel.js", 16, {
        "data-supabase-jefatura-panel": true
      }),
      loadScript("supabase-admin-users", "./supabase-admin-users.js", 6),
      loadScript("jefatura-centro", "./jefatura-centro-gestion.js", 4)
    ]);
  }

  async function ensurePublicContent() {
    await Promise.all([
      loadStyle("gestion-panel-final", "./gestion-panel-final.css", 1),
      loadScript("contenido-web", "./contenido-web.js", 2),
      ensureSupabase()
    ]);
    await loadScript("gestion-panel-final", "./gestion-panel-final.js", 13);
  }

  async function ensureForms(current) {
    await Promise.all([
      loadScript("app-forms", "./app-forms.js", 2),
      ensureSupabase()
    ]);
    await loadScript("arsenal-form-entry", "./arsenal-form-entry.js", 1);

    if (current === "#/formularios/arsenal-terapeutico") {
      await loadScript("arsenal-terapeutico", "./arsenal-terapeutico.js", 2);
      await loadScript("arsenal-uso-ocasional", "./arsenal-uso-ocasional.js", 2);
    }
  }

  async function ensurePhoneDirectory() {
    await loadScript("directorio-telefonico", "./directorio-telefonico.js", 3);
  }

  async function ensureForRoute(value = route()) {
    const current = route(value);
    if (routePromises.has(current)) return routePromises.get(current);

    const promise = (async () => {
      if (current === "#/jefatura") return ensureJefatura();
      if (current === "#/gestion" || current.startsWith("#/gestion/")) return ensureManagement();
      if (current === "#/formularios" || current.startsWith("#/formularios/")) return ensureForms(current);
      if (current === "#/telefonos") return ensurePhoneDirectory();
      if (current === "#/especialidades" || current.startsWith("#/especialidad/")) return ensureClinicalProtocols(current);
      if (["#/noticias", "#/educacion", "#/paper", "#/procedimientos"].includes(current)) return ensurePublicContent();
      if (["#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(current)) {
        await loadStyle("gestion-panel-final", "./gestion-panel-final.css", 1);
        return loadScript("gestion-panel-final", "./gestion-panel-final.js", 13);
      }
      if (current === "#/llamados") return ensureSupabase();
      return undefined;
    })().catch((error) => {
      routePromises.delete(current);
      console.error("No se pudo preparar la sección solicitada", error);
      throw error;
    });

    routePromises.set(current, promise);
    return promise;
  }

  function routeFromLink(link) {
    const href = link?.getAttribute?.("href") || "";
    return href.startsWith("#/") ? href : "";
  }

  function prefetchFromEvent(event) {
    const targetRoute = routeFromLink(event.target.closest?.("a[href^='#/']"));
    if (targetRoute) ensureForRoute(targetRoute).catch(() => {});
  }

  document.addEventListener("pointerover", prefetchFromEvent, { passive: true });
  document.addEventListener("focusin", prefetchFromEvent);
  document.addEventListener("touchstart", prefetchFromEvent, { passive: true });

  window.CRS_ROUTE_MODULES = Object.freeze({
    ensure: ensureForRoute,
    prefetch: ensureForRoute
  });
})();