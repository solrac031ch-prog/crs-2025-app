(() => {
  const norm = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  function ensureStyle() {
    if (document.querySelector("#operational-cleanup-style")) return;
    const style = document.createElement("style");
    style.id = "operational-cleanup-style";
    style.textContent = ".page:not(.active){display:none!important}#chiefPage:not(.active){display:none!important}#chiefPage>.page-head{display:none!important}";
    document.head.append(style);
  }

  function loadAdminCenter() {
    if (document.querySelector('script[src*="gestion-admin-contenidos.js"]')) return;
    const script = document.createElement("script");
    script.src = "./gestion-admin-contenidos.js?v=1";
    script.defer = true;
    document.body.append(script);
  }

  function removeRestrictedText() {
    ensureStyle();
    const chiefHead = document.querySelector("#chiefPage .page-head");
    if (chiefHead) chiefHead.remove();

    document.querySelectorAll("#callsPage .document-panel, #visitPage .document-panel, #formsPage .document-panel, #callsPage section").forEach((node) => {
      const text = norm(node.textContent);
      if (text.includes("espacio jefatura") || text.includes("panel restringido")) node.remove();
    });
  }

  function cleanCallsPage() {
    if (!location.hash.startsWith("#/llamados")) return;
    document.querySelectorAll('[data-consultoria-flujos-calls="true"]').forEach((node) => node.remove());
    document.querySelectorAll("#callsPage .consultoria-hub").forEach((node) => {
      const text = norm(node.textContent);
      if (text.includes("consultoria de llamada") || text.includes("manual 2026")) node.remove();
    });
  }

  function cleanVisitPage() {
    if (!location.hash.startsWith("#/visita")) return;
    const panel = document.querySelector("#visitPage .document-panel");
    const action = document.querySelector("#visitDocumentAction");
    if (!panel || !action) return;
    Array.from(panel.children).forEach((child) => {
      if (child.id !== "visitDocumentAction") child.remove();
    });
  }

  function apply() {
    loadAdminCenter();
    removeRestrictedText();
    cleanCallsPage();
    cleanVisitPage();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      apply();
    }, 80);
  }

  addEventListener("hashchange", () => {
    setTimeout(apply, 120);
    setTimeout(apply, 450);
  });
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  setTimeout(apply, 120);
  setTimeout(apply, 600);
})();