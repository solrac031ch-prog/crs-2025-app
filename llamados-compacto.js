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

  function compactSearch() {
    const panel = document.querySelector("#callsSearchPanel");
    if (!panel) return;

    panel.querySelectorAll(".on-call-meta, .on-call-date").forEach((item) => item.remove());
    panel.querySelectorAll('.route-actions a[href="#/inicio"]').forEach((item) => item.remove());

    panel.querySelectorAll(".law-live-empty").forEach((item) => {
      if (/Escribe una especialidad/i.test(item.textContent || "")) item.remove();
    });

    const actions = panel.querySelector(".route-actions");
    if (actions) {
      actions.classList.add("calls-route-actions");
      const clear = actions.querySelector(".on-call-clear");
      if (clear) clear.textContent = "Limpiar búsqueda";
    }
  }

  function compactPage() {
    if (currentRoute() !== ROUTE) return;
    const page = document.querySelector("#callsPage");
    if (!page) return;

    page.classList.add("calls-compact");
    const title = page.querySelector("#callsTitle");
    if (title) title.textContent = "Llamados y UHD";

    compactSearch();
    compactDocumentAction("#callsDocumentAction", "especialistas", "Documento de respaldo");
    compactDocumentAction("#uhdDocumentAction", "uhd", "Abrir disponibilidad UHD");
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
