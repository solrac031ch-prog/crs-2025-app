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

  function route() {
    return location.hash.split("?")[0] || "#/inicio";
  }

  function isJefaturaRoute() {
    return route() === "#/jefatura";
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
    installLegacyJefaturaShield();
    loadSupabaseJefaturaPanel();
    scheduleNormalizeCopy(40);
    scheduleNormalizeCopy(260);
    scheduleCanonicalJefatura(80);
  }

  window.addEventListener("hashchange", () => {
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
    loadSupabaseJefaturaPanel();
    scheduleNormalizeCopy(80);
    scheduleCanonicalJefatura(80);
  }, { once: true });
})();