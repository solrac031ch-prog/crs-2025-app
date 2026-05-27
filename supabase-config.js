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
  let insertShieldInstalled = false;
  let supabaseFallbackLoading = false;

  function route() {
    return location.hash.split("?")[0] || "#/inicio";
  }

  function isJefaturaRoute() {
    return route() === "#/jefatura";
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
    script.src = "./supabase-jefatura-panel.js?v=3";
    script.dataset.supabaseJefaturaPanel = "true";
    (document.body || document.documentElement).append(script);
  }

  function scheduleCanonicalJefatura(delay = 30) {
    if (!isJefaturaRoute()) return;
    setTimeout(() => window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(0), delay);
  }

  function installLegacyJefaturaShield() {
    if (insertShieldInstalled) return;
    insertShieldInstalled = true;
    const nativeInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function patchedInsertAdjacentHTML(position, html) {
      const isLegacyPanel = typeof html === "string" && html.includes("data-sb-panel");
      const insideChief = this?.id === "chiefContent" || Boolean(this?.closest?.("#chiefContent"));
      if (isJefaturaRoute() && isLegacyPanel && insideChief) {
        scheduleCanonicalJefatura(20);
        return;
      }
      return nativeInsertAdjacentHTML.call(this, position, html);
    };
  }

  function normalizeSupabaseCopy() {
    const hash = route();
    const managementEyebrow = document.querySelector("#managementPage .page-head .eyebrow");
    if (managementEyebrow && (hash === "#/gestion" || hash.startsWith("#/gestion/"))) {
      const nextText = hash === "#/gestion/pacientes" ? "Gestion pacientes" : "Publicacion global";
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
    window.CRS_REGISTER_SERVICE_WORKER?.();
    installLegacyJefaturaShield();
    ensureSupabaseClient();
    loadSupabaseJefaturaPanel();
    scheduleNormalizeCopy(40);
    scheduleNormalizeCopy(260);
    scheduleCanonicalJefatura(80);
  }

  window.addEventListener("crs:supabase-ready", () => {
    window.CRS_SUPABASE?.renderPublicRoute?.();
    scheduleCanonicalJefatura(30);
  });

  window.addEventListener("hashchange", () => {
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
    ensureSupabaseClient();
    loadSupabaseJefaturaPanel();
    scheduleNormalizeCopy(80);
    scheduleCanonicalJefatura(80);
  }, { once: true });
})();
