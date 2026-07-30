(() => {
  const MODE_KEY = "crsGestionCasesModeV1";
  const FILTER_KEY = "crsGestionCasesFilterV1";
  const CASES_ROUTE = "#/gestion/pacientes";
  const UHD_ROUTE = "#/gestion/uhd-citados";
  const LANDING_ROUTE = "#/gestion";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let timer = 0;
  let renderToken = 0;
  let cachedChief = null;
  let chiefPromise = null;

  function route() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function activateManagementPage() {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === "managementPage"));
    $$('[data-route-link]').forEach((link) => {
      link.classList.toggle("active", link.dataset.routeLink === "gestion");
    });
  }

  function notifyReady(detail) {
    window.dispatchEvent(new CustomEvent("crs:ui-section-ready", { detail }));
  }

  function invalidateChief() {
    cachedChief = null;
    chiefPromise = null;
  }

  async function chiefState() {
    if (cachedChief !== null) return cachedChief;
    if (chiefPromise) return chiefPromise;
    chiefPromise = (async () => {
      const api = window.CRS_PATIENT_CASES;
      try {
        await api?.refreshAuth?.();
      } catch (_) {}
      cachedChief = Boolean(api?.isChief?.());
      chiefPromise = null;
      return cachedChief;
    })();
    return chiefPromise;
  }

  function modeButton(mode, label, secondary = false) {
    return `<a class="gestion-profile-button${secondary ? " secondary" : ""}" href="${CASES_ROUTE}" data-gestion-cases-mode="${mode}">${label}</a>`;
  }

  function uhdEntry(isChief) {
    return `
      <section class="gestion-uhd-entry" aria-label="Citaciones para UHD">
        <div class="gestion-uhd-entry-copy">
          <span>UHD · citación para el día siguiente</span>
          <strong>Registrar pacientes que volverán en la mañana</strong>
          <p>Solo para residentes de San Ramón, La Pintana o La Granja.</p>
        </div>
        <div class="gestion-uhd-entry-actions">
          <a class="gestion-profile-button" href="${UHD_ROUTE}">Registrar citado UHD</a>
          ${isChief ? `<a class="gestion-profile-button secondary" href="${CASES_ROUTE}" data-gestion-cases-mode="revision" data-gestion-uhd-review="today">Revisar citados de hoy</a>` : ""}
        </div>
      </section>`;
  }

  async function renderLanding() {
    if (route() !== LANDING_ROUTE) return;
    const token = ++renderToken;
    const isChief = await chiefState();
    if (token !== renderToken || route() !== LANDING_ROUTE) return;

    activateManagementPage();
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (!content) return;

    const stateKey = isChief ? "chief" : "doctor";
    if (content.dataset.gestionProfiles === stateKey && content.querySelector(".gestion-profiles-shell")) {
      notifyReady({ route: LANDING_ROUTE });
      return;
    }
    if (title) title.textContent = "Gestión de casos";

    const chiefActions = isChief
      ? `<div class="gestion-profile-actions">${modeButton("nuevo", "Registrar caso nuevo")}${modeButton("revision", "Revisar casos", true)}</div><span class="gestion-profile-session">Sesión de Jefatura activa</span>`
      : `<div class="gestion-profile-actions"><a class="gestion-profile-button secondary" href="#/jefatura">Ingresar a Jefatura</a></div><span class="gestion-profile-help">Después del ingreso podrás registrar y revisar solicitudes.</span>`;

    content.innerHTML = `
      <div class="gestion-profiles-shell">
        <section class="gestion-profiles-head">
          <span>Gestión ambulatoria prioritaria</span>
          <h2>¿Qué necesitas hacer?</h2>
          <p>Accesos directos para registrar o revisar solicitudes sin recargar la pantalla con opciones innecesarias.</p>
        </section>
        <section class="gestion-profiles-grid" aria-label="Perfiles de gestión">
          <article class="gestion-profile-card doctor">
            <div class="gestion-profile-copy">
              <span class="gestion-profile-label">Médicos de Urgencias</span>
              <h3>Registro rápido</h3>
              <p>Crear una nueva solicitud de gestión ambulatoria para un paciente que puede egresar de Urgencia.</p>
            </div>
            <div class="gestion-profile-actions">${modeButton("nuevo", "Registrar caso nuevo")}</div>
          </article>
          <article class="gestion-profile-card chief">
            <div class="gestion-profile-copy">
              <span class="gestion-profile-label">Jefatura</span>
              <h3>Gestión y seguimiento</h3>
              <p>Registrar solicitudes nuevas o revisar los casos pendientes, gestionados y cerrados.</p>
            </div>
            ${chiefActions}
          </article>
        </section>
        ${uhdEntry(isChief)}
      </div>`;
    content.dataset.gestionProfiles = stateKey;
    notifyReady({ route: LANDING_ROUTE });
  }

  function resetCaseLayout(shell) {
    Array.from(shell.children).forEach((child) => child.classList.remove("gestion-mode-hidden"));
    shell.querySelectorAll(".gestion-case-modebar").forEach((node) => node.remove());
  }

  function addModeBar(shell, mode) {
    if (shell.querySelector(".gestion-case-modebar")) return;
    const bar = document.createElement("div");
    bar.className = "gestion-case-modebar";
    bar.innerHTML = `<a href="#/gestion" class="back-link">Gestión de casos</a><strong>${mode === "revision" ? "Revisión de solicitudes" : "Nuevo registro"}</strong>`;
    shell.prepend(bar);
  }

  function showReviewLogin(content) {
    if (content.dataset.gestionReviewLogin === "true") return;
    content.dataset.gestionReviewLogin = "true";
    content.innerHTML = `
      <div class="gestion-profiles-shell compact">
        <section class="gestion-profile-card chief single">
          <div class="gestion-profile-copy">
            <span class="gestion-profile-label">Acceso restringido</span>
            <h2>Revisión de casos</h2>
            <p>Para revisar y actualizar solicitudes debes ingresar con una cuenta autorizada de Jefatura.</p>
          </div>
          <div class="gestion-profile-actions">
            <a class="gestion-profile-button" href="#/jefatura">Ingresar a Jefatura</a>
            <a class="gestion-profile-button secondary" href="#/gestion">Volver</a>
          </div>
        </section>
      </div>`;
    notifyReady({ route: CASES_ROUTE, mode: "login" });
  }

  async function applyCaseMode() {
    if (route() !== CASES_ROUTE) return;
    const token = ++renderToken;
    const isChief = await chiefState();
    if (token !== renderToken || route() !== CASES_ROUTE) return;

    const content = $("#managementContent");
    const shell = $("#managementContent .patient-shell");
    if (!content || !shell) return;

    const requested = sessionStorage.getItem(MODE_KEY);
    const mode = requested === "nuevo" || requested === "revision"
      ? requested
      : (isChief ? "revision" : "nuevo");
    const signature = `${mode}:${isChief ? "chief" : "doctor"}`;

    if (shell.dataset.gestionModeReady === signature) {
      notifyReady({ route: CASES_ROUTE, mode });
      return;
    }

    content.dataset.gestionReviewLogin = "false";
    resetCaseLayout(shell);
    addModeBar(shell, mode);

    const hero = shell.querySelector(".patient-hero");
    const publicCard = shell.querySelector("[data-public-patient-case]")?.closest(".patient-card");

    if (mode === "revision") {
      if (!isChief) {
        showReviewLogin(content);
        return;
      }
      if (publicCard) publicCard.classList.add("gestion-mode-hidden");
      if (hero) {
        const heading = hero.querySelector("h2");
        const text = hero.querySelector("p");
        if (heading) heading.textContent = "Revisión de solicitudes";
        if (text) text.textContent = "Seguimiento operativo de casos, responsables, resultados y cierre administrativo.";
      }
    } else {
      Array.from(shell.children).forEach((child) => {
        const keep = child.classList.contains("gestion-case-modebar") ||
          child.classList.contains("route-actions") ||
          child.classList.contains("patient-hero") ||
          child === publicCard;
        if (!keep) child.classList.add("gestion-mode-hidden");
      });
      if (hero) {
        const heading = hero.querySelector("h2");
        const text = hero.querySelector("p");
        if (heading) heading.textContent = "Registrar caso nuevo";
        if (text) text.textContent = "Formulario rápido para crear una solicitud de gestión ambulatoria prioritaria.";
      }
    }

    shell.dataset.gestionModeReady = signature;
    notifyReady({ route: CASES_ROUTE, mode });
  }

  function renderCurrentRoute() {
    if (route() === LANDING_ROUTE) {
      renderLanding().catch(console.error);
      return;
    }
    if (route() === CASES_ROUTE) applyCaseMode().catch(console.error);
  }

  function schedule(delay = 30) {
    window.clearTimeout(timer);
    timer = window.setTimeout(renderCurrentRoute, delay);
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("[data-gestion-cases-mode]");
    if (!link) return;
    sessionStorage.setItem(MODE_KEY, link.dataset.gestionCasesMode || "nuevo");
    if (!link.hasAttribute("data-gestion-uhd-review")) sessionStorage.removeItem(FILTER_KEY);
  }, true);

  function relevantMutation() {
    const current = route();
    const content = $("#managementContent");
    if (!content) return false;
    if (current === LANDING_ROUTE) return !content.querySelector(".gestion-profiles-shell");
    if (current === CASES_ROUTE) {
      const shell = content.querySelector(".patient-shell");
      return Boolean(shell && !shell.dataset.gestionModeReady);
    }
    return false;
  }

  const observer = new MutationObserver(() => {
    if (relevantMutation()) schedule(20);
  });

  function start() {
    const content = $("#managementContent");
    if (content) observer.observe(content, { childList: true, subtree: true });
    schedule(10);
  }

  window.addEventListener("hashchange", () => schedule(10));
  window.addEventListener("crs:supabase-ready", () => {
    invalidateChief();
    schedule(20);
  });
  window.addEventListener("crs:auth-changed", () => {
    invalidateChief();
    schedule(20);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();