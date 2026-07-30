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

  const UHD_SCOPE_KEY = "crsPatientUhdScopeV2";
  let settleTimer = 0;
  let fallbackTimer = 0;
  let routeToken = 0;

  function route() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function jefaturaReady() {
    const shell = document.querySelector("#chiefContent [data-crs-access-shell]");
    if (!shell) return false;
    return Boolean(
      shell.dataset.jefaturaOrganized === "true" ||
      shell.classList.contains("jefatura-login-clean") ||
      shell.querySelector(".crs-access-error,.crs-access-warn")
    );
  }

  function publicPageReady(current) {
    const active = document.querySelector(".page.active");
    const content = active?.querySelector("#managementContent,#educationContent,#doctorsContent");
    if (!content || content.dataset.gfReadyRoute !== current) return false;
    const selector = current === "#/educacion"
      ? ".edu-uniform-shell,.gf-shell"
      : ".gf-shell";
    return Boolean(content.querySelector(selector));
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
    if (current === "#/jefatura") return jefaturaReady();
    if (["#/noticias", "#/educacion", "#/paper", "#/procedimientos", "#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(current)) {
      return publicPageReady(current);
    }
    return true;
  }

  function reveal(token = routeToken) {
    if (token !== routeToken) return;
    document.documentElement.dataset.uiStabilizing = "false";
    document.documentElement.dataset.uiReadyRoute = route();
    window.clearTimeout(fallbackTimer);
  }

  function tryReveal(delay = 10) {
    const token = routeToken;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (token !== routeToken) return;
      const current = route();
      if (!DYNAMIC_ROUTES.has(current) || isReady(current)) {
        requestAnimationFrame(() => reveal(token));
      }
    }, delay);
  }

  function stage() {
    routeToken += 1;
    const token = routeToken;
    const current = route();
    const previousReadyRoute = document.documentElement.dataset.uiReadyRoute || "";
    window.clearTimeout(settleTimer);
    window.clearTimeout(fallbackTimer);

    if (!DYNAMIC_ROUTES.has(current)) {
      reveal(token);
      return;
    }

    if (previousReadyRoute === current && isReady(current)) {
      reveal(token);
      return;
    }

    document.documentElement.dataset.uiStabilizing = "true";
    document.documentElement.dataset.uiReadyRoute = "";
    tryReveal(6);
    fallbackTimer = window.setTimeout(() => reveal(token), 320);
  }

  const observer = new MutationObserver(() => {
    if (document.documentElement.dataset.uiStabilizing === "true") tryReveal(12);
  });

  function start() {
    const main = document.querySelector("main");
    if (main) observer.observe(main, { childList: true, subtree: true });
    stage();
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest?.('[data-patient-type="uhd"]')) {
      sessionStorage.setItem(UHD_SCOPE_KEY, "all");
    }
  }, true);

  window.addEventListener("hashchange", stage, true);
  window.addEventListener("crs:ui-section-ready", () => tryReveal(2));
  window.addEventListener("crs:supabase-ready", () => tryReveal(5));
  window.addEventListener("crs:auth-changed", () => {
    if (route() === "#/jefatura" || route().startsWith("#/gestion")) stage();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();