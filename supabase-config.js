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

window.addEventListener("load", () => {
  if (document.querySelector("script[data-supabase-jefatura-panel]")) return;
  const script = document.createElement("script");
  script.src = "./supabase-jefatura-panel.js?v=1";
  script.dataset.supabaseJefaturaPanel = "true";
  document.body.append(script);
});
