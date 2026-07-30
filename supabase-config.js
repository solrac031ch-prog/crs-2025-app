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
  const PRIMARY_SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  const FALLBACK_SDK = "https://unpkg.com/@supabase/supabase-js@2";
  const REMOTE_ROUTES = new Set([
    "#/noticias", "#/educacion", "#/paper", "#/procedimientos",
    "#/jefatura", "#/gestion", "#/gestion/pacientes", "#/gestion/uhd-citados",
    "#/formularios", "#/llamados", "#/especialidades"
  ]);

  let sdkLoading = false;
  let readyFired = false;
  let normalizeTimer = 0;

  function route() {
    return location.hash.split("?")[0] || "#/inicio";
  }

  function fireSupabaseReady() {
    if (readyFired || !window.supabase?.createClient) return;
    readyFired = true;
    window.dispatchEvent(new Event("crs:supabase-ready"));
  }

  function appendSdk(src, fallback = false) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.supabaseSdk = fallback ? "fallback" : "primary";
    script.onload = () => {
      sdkLoading = false;
      fireSupabaseReady();
      window.CRS_SUPABASE?.renderPublicRoute?.();
    };
    script.onerror = () => {
      script.remove();
      if (!fallback) {
        appendSdk(FALLBACK_SDK, true);
        return;
      }
      sdkLoading = false;
      console.error("No se pudo cargar Supabase desde los CDN disponibles.");
    };
    document.head.append(script);
  }

  function ensureSupabaseClient() {
    if (window.supabase?.createClient) {
      fireSupabaseReady();
      return;
    }
    if (sdkLoading || document.querySelector("script[data-supabase-sdk]")) return;
    sdkLoading = true;
    appendSdk(PRIMARY_SDK);
  }

  function normalizeCopy() {
    const hash = route();
    const managementEyebrow = document.querySelector("#managementPage .page-head .eyebrow");
    if (managementEyebrow && (hash === "#/gestion" || hash.startsWith("#/gestion/"))) {
      const nextText = hash === "#/gestion/pacientes" ? "Gestión pacientes" : "Seguimiento operativo";
      if (managementEyebrow.textContent !== nextText) managementEyebrow.textContent = nextText;
    }

    if (hash === "#/llamados") {
      const uhdNote = document.querySelector("#uhdDocumentAction p");
      if (uhdNote && /google\s+drive/i.test(uhdNote.textContent || "")) {
        uhdNote.textContent = "Publicar la disponibilidad vigente desde Jefatura para que quede disponible globalmente.";
      }
    }
  }

  function scheduleNormalizeCopy(delay = 0) {
    window.clearTimeout(normalizeTimer);
    normalizeTimer = window.setTimeout(() => requestAnimationFrame(normalizeCopy), delay);
  }

  function scheduleSdkLoad() {
    if (REMOTE_ROUTES.has(route())) {
      ensureSupabaseClient();
      return;
    }
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(ensureSupabaseClient, { timeout: 500 });
    } else {
      window.setTimeout(ensureSupabaseClient, 160);
    }
  }

  function boot() {
    window.CRS_REGISTER_SERVICE_WORKER?.();
    scheduleSdkLoad();
    scheduleNormalizeCopy();
  }

  window.addEventListener("hashchange", () => {
    scheduleSdkLoad();
    scheduleNormalizeCopy();
  });

  window.addEventListener("load", () => {
    scheduleSdkLoad();
    scheduleNormalizeCopy();
  }, { once: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();