window.CRS_SUPABASE_CONFIG = {
  // Completar despues de crear el proyecto en Supabase.
  // Project Settings > API > Project URL
  url: "",

  // Project Settings > API > anon public key
  anonKey: "",

  // Cambiar a true cuando url y anonKey esten completos.
  enabled: false,

  bucket: "crs-public",

  tables: {
    content: "crs_content_items",
    documents: "crs_documents",
    flows: "crs_flows",
    calls: "crs_call_schedules",
    admins: "crs_admins"
  }
};
