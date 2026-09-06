import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const index = read('index.html');
const app = read('app.js');
const forms = read('app-forms.js');
const router = read('app-router.js');
const routeModules = read('route-modules.js');
const gestion = read('gestion-panel-final.js');
const patients = read('gestion-pacientes-runtime.js');
const compat = read('compatibilidad-global.js');

const errors = [];

const publicRoutes = [
  '#/inicio',
  '#/especialidades',
  '#/llamados',
  '#/visita',
  '#/formularios',
  '#/telefonos',
  '#/noticias',
  '#/educacion',
  '#/paper',
  '#/gestion',
  '#/jefatura'
];

for (const route of publicRoutes) {
  if (!index.includes(`href="${route}"`)) errors.push(`Falta acceso principal a ${route} en index.html.`);
}

const appOwned = {
  inicio: 'renderHome()',
  especialidades: 'renderSpecialties()',
  especialidad: 'renderProtocol(slug || "")',
  llamados: 'renderDocuments()',
  visita: 'renderDocuments()',
  formularios: 'renderFormsRoute(parts.slice(1))',
  telefonos: 'renderPhones()'
};

for (const [route, renderCall] of Object.entries(appOwned)) {
  if (!new RegExp(`\\b${route}\\s*:`).test(app) && route !== 'especialidad') {
    errors.push(`app.js no declara la página base ${route}.`);
  }
  if (!router.includes(renderCall)) errors.push(`app-router.js no mantiene el render esperado para ${route}.`);
}

for (const [name, selector] of [['gestion', '#managementPage'], ['doctors', '#doctorsPage'], ['jefatura', '#chiefPage']]) {
  if (!new RegExp(`\\b${name}\\s*:\\s*document\\.querySelector\\(["']${selector}["']\\)`).test(app)) {
    errors.push(`app.js debe registrar ${selector} de forma estable en pages.${name}.`);
  }
}

const gestionOwned = [
  ['#/gestion', 'renderGestion()'],
  ['#/jefatura', 'renderJefaturaShell()'],
  ['#/noticias', 'renderList("news"'],
  ['#/educacion', 'renderEducation()'],
  ['#/paper', 'renderPaper()'],
  ['#/procedimientos', 'renderProcedures()']
];

for (const [route, marker] of gestionOwned) {
  if (!gestion.includes(`current === "${route}"`) || !gestion.includes(marker)) {
    errors.push(`gestion-panel-final.js no conserva el dueño de ruta ${route}.`);
  }
}

const patientRouteOwned = (
  patients.includes('currentRoute() === "#/gestion/pacientes"') ||
  patients.includes('location.hash === "#/gestion/pacientes"')
);
if (!patientRouteOwned || !patients.includes('renderPage()')) {
  errors.push('gestion-pacientes-runtime.js debe conservar la ruta #/gestion/pacientes.');
}
if (!patients.includes('window.CRS_PATIENT_CASES_CONFIG?.appsScriptUrl')) {
  errors.push('Gestión pacientes debe consumir su configuración explícita de Apps Script.');
}
if (!index.includes('./gestion-pacientes-config.js')) {
  errors.push('index.html debe cargar gestion-pacientes-config.js antes del bootstrap de Gestión pacientes.');
}
if (index.indexOf('./gestion-pacientes-config.js') > index.indexOf('./gestion-pacientes-core.js')) {
  errors.push('La configuración de Gestión pacientes debe cargarse antes del bootstrap de privacidad.');
}
if (!/loadScript\(["']gestion-pacientes-runtime["']\s*,\s*["']\.\/gestion-pacientes-runtime\.js["']/.test(routeModules)) {
  errors.push('route-modules.js debe cargar Gestión pacientes bajo demanda en sus rutas activas.');
}

const formRouteMarkers = [
  'parts[0] === "notificacion-obligatoria"',
  'parts[0] !== "ley-urgencias"',
  'parts[1] === "buscar"',
  'parts[1] === "resultados"',
  'parts[1] === "formularios"'
];
for (const marker of formRouteMarkers) {
  if (!forms.includes(marker)) errors.push(`Falta contrato de navegación de formularios: ${marker}.`);
}

const routerOwnsHashchange = (
  router.includes('window.addEventListener("hashchange", renderRoute)') ||
  /window\.addEventListener\(["']hashchange["']\s*,\s*\(\)\s*=>\s*scheduleRoute\(\)\s*\)/.test(router)
);
if (!routerOwnsHashchange) {
  errors.push('app-router.js debe ser dueño del evento hashchange base.');
}
if (!router.includes('window.location.hash = "#/inicio"')) {
  errors.push('app-router.js debe conservar el arranque por defecto en #/inicio.');
}
if (!router.includes('const delegatedRoutes') || !router.includes('jefatura: "jefatura"') || !router.includes('"equipo-urgencia": "doctors"')) {
  errors.push('app-router.js debe activar el shell correcto de rutas delegadas sin pasar por Inicio.');
}
if (/function\s+renderRoute\s*\(|addEventListener\(["']hashchange["']/.test(app)) {
  errors.push('app.js no debe recuperar responsabilidades de enrutamiento.');
}
if (/serviceWorker\.register\s*\(/.test(app) || /serviceWorker\.register\s*\(/.test(forms) || /serviceWorker\.register\s*\(/.test(router) || /serviceWorker\.register\s*\(/.test(compat)) {
  errors.push('CRS mantiene el Service Worker desactivado; ningún módulo de arranque debe registrarlo.');
}
if (/jefatura-usuarios\.js|data-jefatura-usuarios|crs-global-responsive-guard/.test(compat)) {
  errors.push('compatibilidad-global.js no debe volver a cargar parches tardíos de Jefatura ni CSS dinámico.');
}
if (fs.existsSync('jefatura-usuarios.js')) {
  errors.push('El controlador heredado jefatura-usuarios.js debe permanecer eliminado.');
}

const appIndex = index.indexOf('./app.js');
const formsIndex = index.indexOf('./app-forms.js');
const routeModulesIndex = index.indexOf('./route-modules.js');
const routerIndex = index.indexOf('./app-router.js');
const staticFormsOrdered = appIndex >= 0 && formsIndex > appIndex && routerIndex > formsIndex;
const lazyFormsOrdered = (
  appIndex >= 0 && routeModulesIndex > appIndex && routerIndex > routeModulesIndex &&
  /loadScript\(["']app-forms["']\s*,\s*["']\.\/app-forms\.js["']/.test(routeModules) &&
  /if\s*\(current\s*===\s*["']#\/formularios["']\s*\|\|\s*current\.startsWith\(["']#\/formularios\/["']\)\)\s*return\s+ensureForms\(current\)/.test(routeModules)
);
if (!staticFormsOrdered && !lazyFormsOrdered) {
  errors.push('Formularios debe cargarse antes de que app-router.js intente renderizar su ruta, de forma estática o mediante route-modules.js.');
}
if (/pages\.jefatura\s*=|pages\["equipo-urgencia"\]\s*=/.test(index)) {
  errors.push('index.html no debe volver a parchear el mapa pages después de cargar app-router.js.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Contrato de navegación CRS OK. Rutas delegadas sin parches tardíos; Gestión configurada; Service Worker desactivado.');
