(() => {
  const delegatedRoutes = new Set(["gestion", "noticias", "educacion", "paper", "procedimientos", "urgencia", "medicos", "equipo-urgencia", "jefatura"]);
  const routeShell = {
    noticias: "gestion",
    paper: "gestion",
    procedimientos: "gestion",
    urgencia: "doctors",
    medicos: "doctors",
    "equipo-urgencia": "doctors",
    jefatura: "jefatura"
  };

  let routeTimer = 0;
  let routeVersion = 0;

  async function renderRoute() {
    const version = ++routeVersion;
    const parts = routeParts();
    const [name, slug] = parts;
    const currentHash = window.location.hash || "#/inicio";

    try {
      await window.CRS_ROUTE_MODULES?.ensure?.(currentHash);
    } catch (error) {
      console.error(error);
    }

    if (version !== routeVersion) return;

    const pageName = routeShell[name] || (pages[name] ? name : "inicio");
    showPage(pageName);

    if (delegatedRoutes.has(name)) {
      window.CRS_GESTION_FINAL?.schedule?.(0);
      window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(0);
      window.CRS_SUPABASE?.renderPublicRoute?.();
      window.scrollTo(0, 0);
      return;
    }

    if (pageName === "inicio") renderHome();
    if (pageName === "especialidades") renderSpecialties();
    if (pageName === "especialidad") renderProtocol(slug || "");
    if (pageName === "llamados" || pageName === "visita") renderDocuments();
    if (pageName === "formularios") {
      if (typeof renderFormsRoute === "function") renderFormsRoute(parts.slice(1));
      else turnFormsList.innerHTML = '<div class="empty">No se pudo cargar el módulo de formularios.</div>';
    }
    if (pageName === "telefonos") renderPhones();

    window.scrollTo(0, 0);
  }

  function scheduleRoute(delay = 0) {
    window.clearTimeout(routeTimer);
    routeTimer = window.setTimeout(() => {
      routeTimer = 0;
      renderRoute().catch(console.error);
    }, delay);
  }

  function setCategory(category) {
    state.category = category;
    document.querySelectorAll("[data-category]").forEach((button) => {
      button.classList.toggle("active", button.dataset.category === category);
    });
    if (activeRouteName() === "especialidades") renderSpecialties();
  }

  function setShift(shift, activeButton) {
    state.shift = shift;
    document.querySelectorAll("[data-shift]").forEach((button) => {
      button.classList.toggle("active", button === activeButton);
    });
    if (activeRouteName() === "especialidades") renderSpecialties();
  }

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    if (activeRouteName() === "especialidades") renderSpecialties();
  });

  document.addEventListener("click", (event) => {
    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) setCategory(categoryButton.dataset.category);

    const shiftButton = event.target.closest("[data-shift]");
    if (shiftButton) setShift(shiftButton.dataset.shift, shiftButton);

    const priorityNo = event.target.closest("[data-priority-no]");
    if (priorityNo) {
      const panel = priorityNo.closest(".priority-panel");
      const status = panel?.querySelector(".priority-status");
      if (status) status.textContent = "Gestión prioritaria no requerida.";
    }

    const priorityOpen = event.target.closest("[data-priority-open]");
    if (priorityOpen) {
      const panel = priorityOpen.closest(".priority-panel");
      const form = panel?.querySelector("[data-priority-form]");
      if (form) form.hidden = false;
      form?.querySelector("input")?.focus();
    }
  });

  document.addEventListener("input", (event) => {
    const input = event.target.closest("[data-law-search-form] input[name='q']");
    if (!input || typeof renderEmergencyLawLiveResults !== "function") return;

    const preview = input.closest(".law-search-stage")?.querySelector("[data-law-live-results]");
    if (preview) {
      renderEmergencyLawLiveResults(preview, input.value);
      const editUrl = emergencyLawSearchEditUrl(input.value);
      window.history.replaceState(null, "", editUrl);
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-law-search-form]");
    if (!form || typeof emergencyLawSearchUrl !== "function") return;
    event.preventDefault();
    const input = form.querySelector("input[name='q']");
    const query = input?.value.trim() || "";
    if (query) window.location.hash = emergencyLawSearchUrl(query);
  });

  window.addEventListener("hashchange", () => scheduleRoute());

  if (!window.location.hash) {
    window.location.hash = "#/inicio";
  } else {
    scheduleRoute();
  }
})();