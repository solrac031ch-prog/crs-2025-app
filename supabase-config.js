window.CRS_SUPABASE_CONFIG = {
  url: "https://mjrcymctfnnyabvmfgda.supabase.co",
  anonKey: "sb_publishable_sjDVmSUC3o1qtc50_xemoQ_ZZObT1y9",
  enabled: true,
  bucket: "crs-public",
  adminUsersFunction: "crs-admin-users",
  tables: {
    content: "crs_content_items",
    documents: "crs_documents",
    flows: "crs_flows",
    calls: "crs_call_schedules",
    admins: "crs_admins"
  }
};

(() => {
  let supabaseFallbackLoading = false;

  const dynamicRoutePages = {
    noticias: "#managementPage",
    paper: "#managementPage",
    procedimientos: "#managementPage",
    jefatura: "#chiefPage",
    urgencia: "#doctorsPage",
    medicos: "#doctorsPage",
    "equipo-urgencia": "#doctorsPage"
  };

  function route() {
    return location.hash.split("?")[0] || "#/inicio";
  }

  function routeName() {
    return route().replace(/^#\/?/, "").split("/").filter(Boolean)[0] || "inicio";
  }

  function isJefaturaRoute() {
    return route() === "#/jefatura";
  }

  function patchDynamicRoutePages() {
    try {
      if (typeof pages === "undefined") return false;
      Object.entries(dynamicRoutePages).forEach(([name, selector]) => {
        const page = document.querySelector(selector);
        if (page) pages[name] = page;
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  function scheduleDynamicRouteRender(delay = 80) {
    const current = routeName();
    if (!dynamicRoutePages[current]) return;
    setTimeout(() => {
      patchDynamicRoutePages();
      window.CRS_GESTION_FINAL?.schedule?.();
      window.CRS_SUPABASE?.renderPublicRoute?.();
      window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(0);
    }, delay);
  }

  function scheduleCurrentRouteRepair(delay = 120) {
    setTimeout(() => {
      patchDynamicRoutePages();
      try {
        if (typeof renderRoute === "function") renderRoute();
      } catch (_) {}
      window.CRS_GESTION_FINAL?.schedule?.();
      window.CRS_SUPABASE?.renderPublicRoute?.();
      window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(0);
      scheduleNormalizeCopy(20);
      scheduleCanonicalJefatura(20);
    }, delay);
  }

  function fireSupabaseReady() {
    try {
      window.dispatchEvent(new Event("crs:supabase-ready"));
    } catch (_) {
      const event = document.createEvent("Event");
      event.initEvent("crs:supabase-ready", true, true);
      window.dispatchEvent(event);
    }
  }

  function loadSupabaseFallback() {
    if (window.supabase?.createClient || supabaseFallbackLoading) return;
    supabaseFallbackLoading = true;
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@supabase/supabase-js@2";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      supabaseFallbackLoading = false;
      fireSupabaseReady();
      setTimeout(() => {
        window.CRS_SUPABASE?.renderPublicRoute?.();
        window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(0);
        scheduleDynamicRouteRender(20);
        scheduleCurrentRouteRepair(160);
      }, 80);
    };
    script.onerror = () => {
      supabaseFallbackLoading = false;
    };
    document.head.append(script);
  }

  function ensureSupabaseClient() {
    if (!window.supabase?.createClient) setTimeout(loadSupabaseFallback, 80);
  }

  function loadSupabaseJefaturaPanel() {
    if (document.querySelector("script[data-supabase-jefatura-panel]")) return;
    const script = document.createElement("script");
    script.src = "./supabase-jefatura-panel.js?v=9";
    script.dataset.supabaseJefaturaPanel = "true";
    (document.body || document.documentElement).append(script);
  }

  function scheduleCanonicalJefatura(delay = 30) {
    if (!isJefaturaRoute()) return;
    setTimeout(() => window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(0), delay);
  }

  function normalizeSupabaseCopy() {
    const hash = route();
    const managementEyebrow = document.querySelector("#managementPage .page-head .eyebrow");
    if (managementEyebrow && (hash === "#/gestion" || hash.startsWith("#/gestion/"))) {
      const nextText = hash === "#/gestion/pacientes" ? "Gestion pacientes" : "Seguimiento operativo";
      if (managementEyebrow.textContent !== nextText) managementEyebrow.textContent = nextText;
    }

    if (hash === "#/llamados") {
      const uhdNote = document.querySelector("#uhdDocumentAction p");
      if (uhdNote && /google\s+drive/i.test(uhdNote.textContent || "")) {
        uhdNote.textContent = "Publicar la disponibilidad vigente desde Jefatura para que quede disponible globalmente.";
      }
    }
  }

  function scheduleNormalizeCopy(delay = 40) {
    setTimeout(normalizeSupabaseCopy, delay);
  }

  function boot() {
    patchDynamicRoutePages();
    scheduleDynamicRouteRender(80);
    scheduleDynamicRouteRender(300);
    scheduleCurrentRouteRepair(180);
    scheduleCurrentRouteRepair(900);
    window.CRS_REGISTER_SERVICE_WORKER?.();
    ensureSupabaseClient();
    loadSupabaseJefaturaPanel();
    scheduleNormalizeCopy(40);
    scheduleNormalizeCopy(260);
    scheduleCanonicalJefatura(80);
  }

  window.addEventListener("crs:supabase-ready", () => {
    patchDynamicRoutePages();
    window.CRS_SUPABASE?.renderPublicRoute?.();
    scheduleDynamicRouteRender(30);
    scheduleCurrentRouteRepair(160);
    scheduleCurrentRouteRepair(1000);
    scheduleCanonicalJefatura(30);
  });

  window.addEventListener("hashchange", () => {
    patchDynamicRoutePages();
    scheduleDynamicRouteRender(10);
    scheduleDynamicRouteRender(180);
    scheduleCurrentRouteRepair(120);
    scheduleCurrentRouteRepair(700);
    scheduleCurrentRouteRepair(1800);
    scheduleCurrentRouteRepair(3400);
    ensureSupabaseClient();
    loadSupabaseJefaturaPanel();
    scheduleNormalizeCopy(20);
    scheduleNormalizeCopy(220);
    scheduleCanonicalJefatura(40);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener("load", () => {
    patchDynamicRoutePages();
    scheduleDynamicRouteRender(40);
    scheduleCurrentRouteRepair(160);
    scheduleCurrentRouteRepair(1200);
    ensureSupabaseClient();
    loadSupabaseJefaturaPanel();
    scheduleNormalizeCopy(80);
    scheduleCanonicalJefatura(80);
  }, { once: true });
})();
