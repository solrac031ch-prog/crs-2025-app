import fs from 'node:fs';

function replaceOnce(path, from, to) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`No se encontró bloque esperado en ${path}`);
  fs.writeFileSync(path, source.replace(from, to), 'utf8');
}

replaceOnce(
  'app.js',
  `const pages = {\n  inicio: document.querySelector("#homePage"),\n  especialidades: document.querySelector("#specialtiesPage"),\n  especialidad: document.querySelector("#protocolPage"),\n  llamados: document.querySelector("#callsPage"),\n  visita: document.querySelector("#visitPage"),\n  formularios: document.querySelector("#formsPage"),\n  telefonos: document.querySelector("#phonesPage"),\n  educacion: document.querySelector("#educationPage"),\n  gestion: document.querySelector("#managementPage")\n};`,
  `const pages = {\n  inicio: document.querySelector("#homePage"),\n  especialidades: document.querySelector("#specialtiesPage"),\n  especialidad: document.querySelector("#protocolPage"),\n  llamados: document.querySelector("#callsPage"),\n  visita: document.querySelector("#visitPage"),\n  formularios: document.querySelector("#formsPage"),\n  telefonos: document.querySelector("#phonesPage"),\n  educacion: document.querySelector("#educationPage"),\n  gestion: document.querySelector("#managementPage"),\n  doctors: document.querySelector("#doctorsPage"),\n  jefatura: document.querySelector("#chiefPage")\n};`
);

replaceOnce(
  'app-router.js',
  `(() => {\n  function renderRoute() {\n    const parts = routeParts();\n    const [name, slug] = parts;\n    const pageName = pages[name] ? name : "inicio";\n  \n    showPage(pageName);\n  \n    if (pageName === "inicio") renderHome();\n    if (pageName === "especialidades") renderSpecialties();\n    if (pageName === "especialidad") renderProtocol(slug || "");\n    if (pageName === "llamados" || pageName === "visita") renderDocuments();\n    if (pageName === "formularios") renderFormsRoute(parts.slice(1));\n    if (pageName === "telefonos") renderPhones();\n    if (pageName === "educacion") renderEducation();\n  \n    window.scrollTo(0, 0);\n  }`,
  `(() => {\n  const delegatedRoutes = new Set(["gestion", "noticias", "educacion", "paper", "procedimientos", "urgencia", "medicos", "equipo-urgencia", "jefatura"]);\n  const routeShell = {\n    noticias: "gestion",\n    paper: "gestion",\n    procedimientos: "gestion",\n    urgencia: "doctors",\n    medicos: "doctors",\n    "equipo-urgencia": "doctors",\n    jefatura: "jefatura"\n  };\n\n  function renderRoute() {\n    const parts = routeParts();\n    const [name, slug] = parts;\n    const pageName = routeShell[name] || (pages[name] ? name : "inicio");\n\n    showPage(pageName);\n\n    if (delegatedRoutes.has(name)) {\n      window.scrollTo(0, 0);\n      return;\n    }\n\n    if (pageName === "inicio") renderHome();\n    if (pageName === "especialidades") renderSpecialties();\n    if (pageName === "especialidad") renderProtocol(slug || "");\n    if (pageName === "llamados" || pageName === "visita") renderDocuments();\n    if (pageName === "formularios") renderFormsRoute(parts.slice(1));\n    if (pageName === "telefonos") renderPhones();\n\n    window.scrollTo(0, 0);\n  }`
);

replaceOnce(
  'gestion-pacientes-core.js',
  `  function apiUrl() {\n    return String(window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "").trim();\n  }`,
  `  function apiUrl() {\n    return String(window.CRS_PATIENT_CASES_CONFIG?.appsScriptUrl || window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "").trim();\n  }`
);

replaceOnce(
  'gestion-pacientes-core.js',
  `  async function route() {\n    await refreshAuth();\n    if (location.hash === "#/gestion/pacientes") await renderPage();\n  }`,
  `  async function route() {\n    if (location.hash === "#/gestion/pacientes") await renderPage();\n  }`
);

replaceOnce(
  'index.html',
  `    <script src="./compatibilidad-global.js?v=4"></script>\n    <script src="./ley-urgencias-data.js?v=38"></script>\n    <script src="./gestion-pacientes-core.js?v=4"></script>`,
  `    <script src="./compatibilidad-global.js?v=5"></script>\n    <script src="./ley-urgencias-data.js?v=38"></script>\n    <script src="./gestion-pacientes-config.js?v=1"></script>\n    <script src="./gestion-pacientes-core.js?v=5"></script>`
);

replaceOnce(
  'index.html',
  `    <script src="./app-forms.js?v=1"></script>\n    <script src="./app-router.js?v=3"></script>\n    <script src="./arsenal-terapeutico.js?v=1"></script>\n    <script src="./arsenal-uso-ocasional.js?v=1"></script>\n    <script>try{if(typeof pages!=="undefined"){pages.urgencia=document.querySelector("#doctorsPage");pages.medicos=document.querySelector("#doctorsPage");pages["equipo-urgencia"]=document.querySelector("#doctorsPage");pages.jefatura=document.querySelector("#chiefPage");}}catch(_){}</script>`,
  `    <script src="./app-forms.js?v=1"></script>\n    <script src="./app-router.js?v=4"></script>\n    <script src="./arsenal-terapeutico.js?v=1"></script>\n    <script src="./arsenal-uso-ocasional.js?v=1"></script>`
);

console.log('Estabilización de rutas, Gestión y arranque aplicada.');
