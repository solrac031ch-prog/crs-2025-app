import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const index = read('index.html');
const app = read('app.js');
const router = read('app-router.js');
const gestion = read('gestion-panel-final.js');
const patients = read('gestion-pacientes-core.js');

const errors = [];

const publicRoutes = [
  '#/inicio',
  '#/especialidades',
  '#/llamados',
  '#/formularios',
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
  formularios: 'renderFormsRoute(parts.slice(1))',
  telefonos: 'renderPhones()'
};

for (const [route, renderCall] of Object.entries(appOwned)) {
  if (!new RegExp(`\\b${route}\\s*:`).test(app) && route !== 'especialidad') {
    errors.push(`app.js no declara la página base ${route}.`);
  }
  if (!router.includes(renderCall)) errors.push(`app-router.js no mantiene el render esperado para ${route}.`);
}

const gestionOwned = [
  ['#/gestion', 'renderGestion()'],
  ['#/jefatura', 'renderJefaturaShell()'],
  ['#/noticias', 'renderList("news"'],
  ['#/educacion', 'renderList("education"'],
  ['#/paper', 'renderPaper()'],
  ['#/procedimientos', 'renderList("procedure"']
];

for (const [route, marker] of gestionOwned) {
  if (!gestion.includes(`current === "${route}"`) || !gestion.includes(marker)) {
    errors.push(`gestion-panel-final.js no conserva el dueño de ruta ${route}.`);
  }
}

if (!patients.includes('location.hash === "#/gestion/pacientes"') || !patients.includes('renderPage()')) {
  errors.push('gestion-pacientes-core.js debe conservar la ruta #/gestion/pacientes.');
}

const formRouteMarkers = [
  'parts[0] === "notificacion-obligatoria"',
  'parts[0] !== "ley-urgencias"',
  'parts[1] === "buscar"',
  'parts[1] === "resultados"',
  'parts[1] === "formularios"'
];
for (const marker of formRouteMarkers) {
  if (!app.includes(marker)) errors.push(`Falta contrato de navegación de formularios: ${marker}.`);
}

if (!router.includes('window.addEventListener("hashchange", renderRoute)')) {
  errors.push('app-router.js debe ser dueño del evento hashchange.');
}
if (!router.includes('window.location.hash = "#/inicio"')) {
  errors.push('app-router.js debe conservar el arranque por defecto en #/inicio.');
}
if (/function\s+renderRoute\s*\(|addEventListener\(["']hashchange["']/.test(app)) {
  errors.push('app.js no debe recuperar responsabilidades de enrutamiento.');
}
if (/serviceWorker\.register\s*\(/.test(app) || /serviceWorker\.register\s*\(/.test(router)) {
  errors.push('CRS mantiene el Service Worker desactivado; app.js y app-router.js no deben registrarlo.');
}

const appIndex = index.indexOf('./app.js');
const routerIndex = index.indexOf('./app-router.js');
if (appIndex < 0 || routerIndex < 0 || routerIndex <= appIndex) {
  errors.push('index.html debe cargar app-router.js después de app.js.');
}

if (!index.includes('pages.jefatura=document.querySelector("#chiefPage")')) {
  errors.push('index.html debe registrar #chiefPage en el mapa de páginas de app.js.');
}
if (!index.includes('pages["equipo-urgencia"]=document.querySelector("#doctorsPage")')) {
  errors.push('index.html debe registrar la vista de equipo de Urgencia.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Contrato de navegación CRS OK. Router separado y Service Worker desactivado.');
