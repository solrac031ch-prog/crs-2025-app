(() => {
  const DYNAMIC_ROUTES = new Set([
    "#/especialidades",
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

  const ROUTE_PROFILE = Object.freeze({
    "#/especialidades": { minHold: 240, fallback: 6000 },
    "#/gestion": { minHold: 100, fallback: 3000 },
    "#/gestion/pacientes": { minHold: 120, fallback: 10000 },
    "#/gestion/uhd-citados": { minHold: 100, fallback: 3500 },
    "#/jefatura": { minHold: 280, fallback: 7000 },
    "#/noticias": { minHold: 480, fallback: 5000 },
    "#/educacion": { minHold: 520, fallback: 5000 },
    "#/paper": { minHold: 480, fallback: 5000 },
    "#/procedimientos": { minHold: 480, fallback: 5000 },
    "#/urgencia": { minHold: 120, fallback: 3000 },
    "#/medicos": { minHold: 120, fallback: 3000 },
    "#/equipo-urgencia": { minHold: 120, fallback: 3000 }
  });

  const UHD_SCOPE_KEY = "crsPatientUhdScopeV2";
  const QUIET_WINDOW = 72;
  let settleTimer = 0;
  let fallbackTimer = 0;
  let routeToken = 0;
  let stagedAt = 0;
  let lastMutationAt = 0;

  function route() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function profile(current = route()) {
    return ROUTE_PROFILE[current] || { minHold: 100, fallback: 4000 };
  }

  function specialtiesReady() {
    const page = document.querySelector("#specialtiesPage.active.specialty-stable");
    if (!page) return false;
    return Boolean(
      page.querySelector(".specialty-lift-hero") &&
      page.querySelector("#specialtyShortcutPanel") &&
      page.querySelector("#specialtyFocusCard") &&
      page.querySelector("#specialtyGroups .specialty-card-upgraded")
    );
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
    if (current === "#/educacion") return Boolean(content.querySelector(".edu-uniform-shell"));
    return Boolean(content.querySelector(".gf-shell"));
  }

  function isReady(current) {
    if (current === "#/especialidades") return specialtiesReady();
    if (current === "#/gestion") {
      return Boolean(document.querySelector("#managementContent .gestion-profiles-shell"));
    }
    if (current === "#/gestion/pacientes") {
      return Boolean(
        document.querySelector("#managementContent .patient-shell[data-gestion-mode-ready]") ||
        document.querySelector("#managementContent[data-gestion-review-login='true'] .gestion-profiles-shell")
      );
    }
    if (current === "#/gestion/uhd-citados") {
      return Boolean(document.querySelector("#managementContent [data-uhd-citation-form]"));
    }
    if (current === "#/jefatura") return jefaturaReady();
    if (["#/noticias", "#/educacion", "#/paper", "#/procedimientos", "#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(current)) {
      return publicPageReady(current);
    }
    return true;
  }

  function afterLayoutSettles(callback) {
    requestAnimationFrame(() => requestAnimationFrame(callback));
  }

  function reveal(token = routeToken, timedOut = false) {
    if (token !== routeToken) return;
    window.clearTimeout(settleTimer);
    window.clearTimeout(fallbackTimer);
    document.documentElement.dataset.uiStabilizing = "false";
    document.documentElement.dataset.uiReadyRoute = route();
    document.documentElement.dataset.uiTimedOut = timedOut ? "true" : "false";
  }

  function tryReveal(delay = 0) {
    const token = routeToken;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (token !== routeToken) return;
      const current = route();
      if (!DYNAMIC_ROUTES.has(current)) {
        reveal(token);
        return;
      }
      if (!isReady(current)) return;

      const now = performance.now();
      const settings = profile(current);
      const holdRemaining = Math.max(0, settings.minHold - (now - stagedAt));
      const quietRemaining = Math.max(0, QUIET_WINDOW - (now - lastMutationAt));
      const wait = Math.max(holdRemaining, quietRemaining);
      if (wait > 0) {
        tryReveal(wait + 4);
        return;
      }

      afterLayoutSettles(() => {
        if (token !== routeToken || route() !== current || !isReady(current)) return;
        reveal(token);
      });
    }, Math.max(0, delay));
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

    stagedAt = performance.now();
    lastMutationAt = stagedAt;
    document.documentElement.dataset.uiStabilizing = "true";
    document.documentElement.dataset.uiReadyRoute = "";
    document.documentElement.dataset.uiTimedOut = "false";
    tryReveal(8);

    fallbackTimer = window.setTimeout(() => {
      if (token !== routeToken) return;
      afterLayoutSettles(() => reveal(token, true));
    }, profile(current).fallback);
  }

  const observer = new MutationObserver(() => {
    lastMutationAt = performance.now();
    if (document.documentElement.dataset.uiStabilizing === "true") tryReveal(QUIET_WINDOW);
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
  window.addEventListener("crs:ui-section-ready", () => tryReveal(QUIET_WINDOW));
  window.addEventListener("crs:supabase-ready", () => tryReveal(QUIET_WINDOW));
  window.addEventListener("crs:auth-changed", () => {
    if (route() === "#/jefatura" || route().startsWith("#/gestion")) stage();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();