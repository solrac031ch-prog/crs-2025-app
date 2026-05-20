window.CRS_GOOGLE_AUTH_CONFIG = {
  enabled: true,
  mode: "apps-script",
  appName: "CRS HPH 2025",
  allowedEmails: ["mdcarlosherrera@gmail.com"],
  adminEmails: ["mdcarlosherrera@gmail.com"],
  defaultAdminEmail: "mdcarlosherrera@gmail.com",
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxfahyEJq8CYnyUNG-PKKT8h0XmpTMILeSLziAxweFKmUwd11xNUFx-G_ACPg19b1Ox/exec",
  googleClientId: "193717075613-1ub2o75fs516unh7io1o13c9tohg18a4.apps.googleusercontent.com",
  sessionKey: "crsGoogleSessionV1",
  localSessionBridgeKey: "crsAuthSessionV3",
  notes: "Pegar appsScriptUrl despues de desplegar el Web App de Google Apps Script. Mientras este vacio, la app queda en modo preparado pero no valida contra Google."
};

(() => {
  const scripts = [
    { id: "crs-contenidos-drive-loader", src: "./contenidos-drive.js?v=1" },
    { id: "crs-arsenal-terapeutico-loader", src: "./arsenal-terapeutico.js?v=1" }
  ];
  scripts.forEach((item) => {
    if (document.getElementById(item.id)) return;
    const script = document.createElement("script");
    script.id = item.id;
    script.src = item.src;
    script.defer = true;
    document.head.append(script);
  });
})();
