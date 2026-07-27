import fs from 'node:fs';

const app = fs.readFileSync('app.js', 'utf8');
const data = fs.readFileSync('app-operational-data.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const errors = [];
const bindings = {
  externalDocs: 'const externalDocs = operationalData.externalDocs || {};',
  externalForms: 'const externalForms = operationalData.externalForms || {};',
  onCallSchedule: 'const onCallSchedule = operationalData.onCallSchedule || { year: 0, month: 0, label: "", rows: [] };',
  phoneDirectory: 'const phoneDirectory = operationalData.phoneDirectory || [];',
  educationLinks: 'const educationLinks = operationalData.educationLinks || [];'
};

if (!app.includes('const operationalData = window.CRS_APP_OPERATIONAL || {};')) {
  errors.push('app.js debe consumir datos operativos desde window.CRS_APP_OPERATIONAL.');
}

for (const [name, binding] of Object.entries(bindings)) {
  if (!app.includes(binding)) {
    errors.push(`app.js debe enlazar ${name} desde operationalData.`);
  }
  if (new RegExp(`const\\s+${name}\\s*=\\s*[\\[{]`).test(app)) {
    errors.push(`app.js no debe volver a contener el literal de ${name}; pertenece a app-operational-data.js.`);
  }
  if (!new RegExp(`\\b${name}\\s*:`).test(data)) {
    errors.push(`app-operational-data.js debe exponer ${name}.`);
  }
}

if (!/window\.CRS_APP_OPERATIONAL\s*=\s*\{/.test(data)) {
  errors.push('app-operational-data.js debe publicar window.CRS_APP_OPERATIONAL.');
}

const dataIndex = index.indexOf('./app-operational-data.js');
const appIndex = index.indexOf('./app.js');
if (dataIndex < 0 || appIndex < 0 || dataIndex >= appIndex) {
  errors.push('index.html debe cargar app-operational-data.js antes de app.js.');
}

const appLines = app.split(/\r?\n/).length;
if (appLines >= 3000) {
  errors.push(`app.js volvió a crecer a ${appLines} líneas; los datos operativos extraídos no deben regresar al archivo principal.`);
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log(`Frontera operativa OK. app.js: ${appLines} líneas.`);
