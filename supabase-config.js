window.CRS_SUPABASE_CONFIG = {
  url: "https://mjrcymctfnnyabvmfgda.supabase.co",
  anonKey: "sb_publishable_sjDVmSUC3o1qtc50_xemoQ_ZZObT1y9",
  enabled: true,
  bucket: "crs-public",
  tables: {
    content: "crs_content_items",
    documents: "crs_documents",
    flows: "crs_flows",
    calls: "crs_call_schedules",
    admins: "crs_admins"
  }
};

(() => {
  function isJefaturaRoute() {
    return (location.hash.split("?")[0] || "#/inicio") === "#/jefatura";
  }

  function loadSupabaseJefaturaPanel() {
    if (document.querySelector("script[data-supabase-jefatura-panel]")) return;
    const script = document.createElement("script");
    script.src = "./supabase-jefatura-panel.js?v=3";
    script.dataset.supabaseJefaturaPanel = "true";
    (document.body || document.documentElement).append(script);
  }

  function scheduleCanonicalJefatura(delay = 30) {
    if (!isJefaturaRoute()) return;
    window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(delay);
  }

  function watchLegacyJefaturaPatches() {
    if (window.__CRS_SUPABASE_JEFATURA_WATCHER__) return;
    window.__CRS_SUPABASE_JEFATURA_WATCHER__ = true;
    const observer = new MutationObserver(() => {
      if (!isJefaturaRoute() || !window.CRS_SUPABASE?.enabled?.()) return;
      const content = document.querySelector("#chiefContent");
      if (!content) return;
      const legacyNode = content.querySelector("[data-sb-panel],[data-public-draft-note],[data-public-jefatura-notice],#googleSignInButton");
      const legacyText = content.textContent.includes("Ingresa con Google") || content.textContent.includes("borrador local");
      if (legacyNode || legacyText || !content.querySelector("[data-sb-chief-shell]")) {
        scheduleCanonicalJefatura(40);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("hashchange", () => scheduleCanonicalJefatura(40));
    scheduleCanonicalJefatura(80);
  }

  loadSupabaseJefaturaPanel();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadSupabaseJefaturaPanel();
      watchLegacyJefaturaPatches();
    }, { once: true });
  } else {
    watchLegacyJefaturaPatches();
  }
  window.addEventListener("load", () => {
    loadSupabaseJefaturaPanel();
    watchLegacyJefaturaPatches();
  }, { once: true });
})();
