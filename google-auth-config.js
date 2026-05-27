window.CRS_GOOGLE_AUTH_CONFIG = {
  enabled: false,
  mode: "apps-script",
  appName: "CRS HPH 2025",
  allowedEmails: ["mdcarlosherrera@gmail.com"],
  adminEmails: ["mdcarlosherrera@gmail.com"],
  defaultAdminEmail: "mdcarlosherrera@gmail.com",
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxfahyEJq8CYnyUNG-PKKT8h0XmpTMILeSLziAxweFKmUwd11xNUFx-G_ACPg19b1Ox/exec",
  googleClientId: "193717075613-1ub2o75fs516unh7io1o13c9tohg18a4.apps.googleusercontent.com",
  sessionKey: "crsGoogleSessionV1",
  localSessionBridgeKey: "crsAuthSessionV3",
  notes: "Supabase es el backend activo. Google/Drive queda como respaldo legacy desactivado."
};

(() => {
  if (window.CRS_SUPABASE?.enabled?.()) return;
  const scripts = [];
  scripts.forEach((item) => {
    if (document.getElementById(item.id)) return;
    const script = document.createElement("script");
    script.id = item.id;
    script.src = item.src;
    script.defer = true;
    document.head.append(script);
  });
})();
