(() => {
  const ROUTE = "#/llamados";
  let observer = null;
  let frame = 0;

  function currentRoute() {
    return String(location.hash || "#/inicio").split("?")[0] || "#/inicio";
  }

  function rememberGlobalDocument(panel, type) {
    if (!panel) return null;
    const globalPanel = panel.querySelector(`[data-sb-call-panel="${type}"]`);
    const globalLink = globalPanel?.querySelector("a[href]");
    if (globalLink?.href) {
      panel.dataset.callsGlobalHref = globalLink.href;
      globalPanel.remove();
    }
    return panel.dataset.callsGlobalHref || "";
  }

  function compactDocumentAction(containerSelector, type, fallbackLabel) {
    const container = document.querySelector(containerSelector);
    const panel = container?.closest(".document-panel");
    if (!container || !panel) return;

    const globalHref = rememberGlobalDocument(panel, type);
    const currentLink = container.querySelector("a[href]");
    const href = globalHref || currentLink?.href || "";
    if (!href) return;

    const isGlobal = Boolean(globalHref);
    const signature = `${isGlobal ? "global" : "fallback"}|${href}`;
    if (container.dataset.callsCompactSignature === signature && container.querySelector(".calls-doc-link")) return;

    container.dataset.callsCompactSignature = signature;
    const wrapper = document.createElement("div");
    wrapper.className = "calls-document-action";

    const link = document.createElement("a");
    link.className = "calls-doc-link";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = isGlobal ? "Documento global" : fallbackLabel;

    wrapper.append(link);
    container.replaceChildren(wrapper);
  }

  function normalizeSearchContract() {
    const panel = document.querySelector("#callsSearchPanel");
    if (!panel) return;

    const structured = panel.querySelector("[data-calls-structured-search]");
    const live = structured || panel.querySelector("[data-call-live-search]");
    if (!live) return;

    // Ambos motores (base estructurada y PDF de respaldo) exponen el mismo
    // contrato DOM. Así una sustitución asíncrona no rompe accesibilidad,
    // automatización ni acciones del usuario que ya estaban en curso.
    live.dataset.callLiveSearch = "true";

    const dateInput = live.querySelector("[data-call-live-date], input[type='date']");
    const queryInput = live.querySelector("[data-call-live-query], input[type='search']");
    const status = live.querySelector("[data-call-live-status], .on-call-live-status");
    const results = live.querySelector("[data-call-live-results], .on-call-results");

    if (dateInput) dateInput.dataset.callLiveDate = "true";
    if (queryInput) queryInput.dataset.callLiveQuery = "true";
    if (status) status.dataset.callLiveStatus = "true";
    if (results) results.dataset.callLiveResults = "true";

    if (!structured || !queryInput) return;

    if (!live.dataset.callsDefaultDate && dateInput?.value) {
      live.dataset.callsDefaultDate = dateInput.value;
    }

    let clear = live.querySelector("[data-call-live-clear]");
    if (!clear) {
      let actions = live.querySelector(".route-actions");
      if (!actions) {
        actions = document.createElement("div");
        actions.className = "route-actions calls-route-actions";
        live.append(actions);
      }

      clear = document.createElement("button");
      clear.type = "button";
      clear.className = "back-link on-call-clear";
      clear.dataset.callLiveClear = "true";
      clear.textContent = "Limpiar";
      clear.hidden = !queryInput.value.trim();
      actions.append(clear);
    }

    if (queryInput.dataset.callsCompactClearBound !== "true") {
      queryInput.dataset.callsCompactClearBound = "true";
      const syncClear = () => {
        clear.hidden = !queryInput.value.trim();
      };
      queryInput.addEventListener("input", syncClear);
      syncClear();
    }

    if (clear.dataset.callsCompactBound !== "true") {
      clear.dataset.callsCompactBound = "true";
      clear.addEventListener("click", () => {
        queryInput.value = "";
        if (dateInput && live.dataset.callsDefaultDate) {
          dateInput.value = live.dataset.callsDefaultDate;
          dateInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        queryInput.dispatchEvent(new Event("input", { bubbles: true }));
        queryInput.focus({ preventScroll: true });
      });
    }

    // Playwright y algunos navegadores emiten input al modificar date sin
    // esperar un blur. El motor estructurado escucha change: se puentean ambos
    // eventos para que cambiar la fecha con una búsqueda activa sea inmediato.
    if (dateInput && dateInput.dataset.callsCompactDateBound !== "true") {
      dateInput.dataset.callsCompactDateBound = "true";
      dateInput.addEventListener("input", () => {
        dateInput.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
  }

  function compactPage() {
    if (currentRoute() !== ROUTE) return;
    const page = document.querySelector("#callsPage");
    if (!page) return;

    page.classList.add("calls-compact");
    const title = page.querySelector("#callsTitle");
    if (title && title.textContent !== "Llamados y UHD") title.textContent = "Llamados y UHD";

    compactDocumentAction("#callsDocumentAction", "especialistas", "Documento de respaldo");
    compactDocumentAction("#uhdDocumentAction", "uhd", "Abrir disponibilidad UHD");
    normalizeSearchContract();
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(compactPage);
  }

  function observePage() {
    observer?.disconnect();
    const page = document.querySelector("#callsPage");
    if (!page) return;
    observer = new MutationObserver(schedule);
    observer.observe(page, { childList: true, subtree: true });
  }

  function routeChanged() {
    if (currentRoute() !== ROUTE) return;
    observePage();
    schedule();
    window.setTimeout(schedule, 120);
    window.setTimeout(schedule, 600);
  }

  function supabaseReady() {
    if (currentRoute() !== ROUTE) return;
    window.dispatchEvent(new CustomEvent("crs:ui-section-ready", {
      detail: { route: ROUTE, section: "llamados-supabase-ready" }
    }));
  }

  window.addEventListener("hashchange", routeChanged);
  window.addEventListener("crs:ui-section-ready", routeChanged);
  window.addEventListener("crs:supabase-ready", supabaseReady);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", routeChanged, { once: true });
  } else {
    routeChanged();
  }
})();