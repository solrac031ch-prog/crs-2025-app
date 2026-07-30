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

  function jefaturaReady() {
    const shell = document.querySelector("#chiefContent [data-crs-access-shell]");
    if (!shell) return false;
    if (shell.classList.contains("jefatura-login-clean")) return true;
    if (shell.querySelector(".crs-access-error,.crs-access-warn")) return true;
    if (shell.dataset.jefaturaOrganized !== "true") return false;

    const loading = Array.from(shell.querySelectorAll("[data-crs-global-list] .crs-access-mini,[data-crs-admin-list] .crs-access-mini"))
      .some((node) => /cargando/i.test(String(node.textContent || "")));
    return !loading;
  }

  function publicPageReady(current) {
    const active = document.querySelector(".page.active");
    const content = active?.querySelector("#managementContent,#educationContent,#doctorsContent");
    return Boolean(content?.dataset.gfReadyRoute === current && content.querySelector(".gf-shell"));
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
    fallbackTimer = window.setTimeout(() => reveal(token), 1800);
  }

  const observer = new MutationObserver(() => {
    if (document.documentElement.dataset.uiStabilizing === "true") tryReveal(80);
  });

  function start() {
    const main = document.querySelector("main");
    if (main) observer.observe(main, { childList: true, subtree: true });
    stage();
  }

  window.addEventListener("hashchange", stage, true);
  window.addEventListener("crs:ui-section-ready", () => tryReveal(30));
  window.addEventListener("crs:supabase-ready", () => tryReveal(50));
  window.addEventListener("crs:auth-changed", () => {
    if (route() === "#/jefatura" || route().startsWith("#/gestion")) stage();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();