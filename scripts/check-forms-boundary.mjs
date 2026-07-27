import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('app.js');
const forms = read('app-forms.js');
const router = read('app-router.js');
const index = read('index.html');
const errors = [];

const requiredFunctions = [
  'emergencyLawHaystack',
  'getEmergencyLawMatches',
  'renderEmergencyLawLiveResults',
  'renderMandatoryNotificationHome',
  'renderEmergencyLawHome',
  'renderEmergencyLawSearch',
  'renderEmergencyLawResultsScreen',
  'renderEmergencyLawForms',
  'renderFormsRoute',
  'renderTurnForms'
];

for (const name of requiredFunctions) {
  if (!new RegExp(`function\\s+${name}\\s*\\(`).test(forms)) {
    errors.push(`app-forms.js debe conservar ${name}().`);
  }
  if (new RegExp(`function\\s+${name}\\s*\\(`).test(app)) {
    errors.push(`app.js no debe volver a declarar ${name}(); pertenece a app-forms.js.`);
  }
}

if (/\bconst\s+protocols\s*=|function\s+renderProtocol\s*\(/.test(forms)) {
  errors.push('app-forms.js no debe absorber datos ni render del protocolo CRS.');
}

if (!router.includes('renderFormsRoute(parts.slice(1))')) {
  errors.push('app-router.js debe delegar las rutas de formularios a renderFormsRoute().');
}

const appIndex = index.indexOf('./app.js');
const formsIndex = index.indexOf('./app-forms.js');
const routerIndex = index.indexOf('./app-router.js');
if (appIndex < 0 || formsIndex < 0 || routerIndex < 0 || !(appIndex < formsIndex && formsIndex < routerIndex)) {
  errors.push('El orden requerido es app.js → app-forms.js → app-router.js.');
}

const appLines = app.split(/\r?\n/).length;
if (appLines >= 2100) {
  errors.push(`app.js volvió a crecer a ${appLines} líneas; el bloque de formularios no debe regresar.`);
}

const formsLines = forms.split(/\r?\n/).length;
if (formsLines < 500) {
  errors.push(`app-forms.js parece incompleto (${formsLines} líneas).`);
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log(`Frontera de formularios OK. app.js: ${appLines} líneas; app-forms.js: ${formsLines} líneas.`);
