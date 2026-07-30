(() => {
  const DYNAMIC_ROUTES = new Set([
    "#/gestion",
    "#/gestion/pacientes",
    "#/gestion/uhd-citados",
    "#/jefatura",
    "#/noticias",
    "#/educacion",
    "#/paper",
    "#/procedimientos",
    "#/urgencia",
    "#/medicos",
    "#/equipo-urgencia"
  ]);

  let settleTimer = 0;
  let fallbackTimer = 0;
  let routeToken = 0;

  function route() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function isReady(current) {
    if (current === "#/gestion") return Boolean(document.querySelector("#managementContent .gestion-profiles-shell"));
    if (current === "#/gestion/pacientes") {
      return Boolean(
        document.querySelector("#managementContent .patient-shell[data-gestion-mode-ready]") ||
        document.querySelector("#managementContent[data-gestion-review-login='true'] .gestion-profiles-shell")
      );
    }
    if (current === "#/gestion/uhd-citados") return Boolean(document.querySelector("#managementContent [data-uhd-citation-form]"));
    if (current === "#/jefatura") {
      const shell = document.querySelector("#chiefContent [data-crs-access-shell]");
      if (!shell) return false;
      return Boolean(
        shell.dataset.jefaturaOrganized === "true" ||
        shell.classList.contains("jefatura-login-clean") ||
        shell.querySelector(".crs-access-error,.crs-access-warn")
      );
    }
    if (["#/noticias", "#/educacion", "#/paper", "#/procedimientos", "#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(current)) {
      return Boolean(document.querySelector(".page.active .gf-shell"));
    }
    return true;
  }

  function reveal(token = routeToken) {
    if (token !== routeToken) return;
    document.documentElement.dataset.uiStabilizing = "false";
    document.documentElement.dataset.uiReadyRoute = route();
    window.clearTimeout(fallbackTimer);
  }

  function tryReveal(delay = 60) {
    const token = routeToken;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (token !== routeToken) return;
      const current = route();
      if (!DYNAMIC_ROUTES.has(current) || isReady(current)) {
        requestAnimationFrame(() => requestAnimationFrame(() => reveal(token)));
      }
    }, delay);
  }

  function stage() {
    routeToken += 1;
    const token = routeToken;
    const current = route();
    window.clearTimeout(settleTimer);
    window.clearTimeout(fallbackTimer);

    if (!DYNAMIC_ROUTES.has(current)) {
      reveal(token);
      return;
    }

    document.documentElement.dataset.uiStabilizing = "true";
    document.documentElement.dataset.uiReadyRoute = "";
    tryReveal(40);
    fallbackTimer = window.setTimeout(() => reveal(token), 1600);
  }

  const observer = new MutationObserver(() => {
    if (document.documentElement.dataset.uiStabilizing === "true") tryReveal(70);
  });

  function start() {
    const main = document.querySelector("main");
    if (main) observer.observe(main, { childList: true, subtree: true });
    stage();
  }

  window.addEventListener("hashchange", stage, true);
  window.addEventListener("crs:ui-section-ready", () => tryReveal(20));
  window.addEventListener("crs:supabase-ready", () => tryReveal(40));
  window.addEventListener("crs:auth-changed", () => {
    if (route() === "#/jefatura" || route().startsWith("#/gestion")) stage();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();