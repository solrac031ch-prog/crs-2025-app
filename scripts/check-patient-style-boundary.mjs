import fs from 'node:fs';

const js = fs.readFileSync('gestion-pacientes-core.js', 'utf8');
const css = fs.readFileSync('gestion-pacientes-core.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const errors = [];

if (/function\s+addStyle\s*\(|createElement\(["']style["']\)|style\.textContent/.test(js)) {
  errors.push('gestion-pacientes-core.js no debe volver a inyectar su hoja visual desde JavaScript.');
}

for (const selector of ['.patient-shell', '.patient-hero', '.patient-card', '.patient-filter', '.patient-table', '.patient-status']) {
  if (!css.includes(selector)) errors.push(`Falta selector esperado en gestion-pacientes-core.css: ${selector}`);
}

if (!css.includes('@media(max-width:700px)')) {
  errors.push('gestion-pacientes-core.css debe conservar el breakpoint móvil existente.');
}

if (!index.includes('<link rel="stylesheet" href="./gestion-pacientes-core.css?v=1" />')) {
  errors.push('index.html debe cargar gestion-pacientes-core.css desde <head>.');
}

const cssIndex = index.indexOf('./gestion-pacientes-core.css');
const jsIndex = index.indexOf('./gestion-pacientes-core.js');
if (cssIndex < 0 || jsIndex < 0 || cssIndex >= jsIndex) {
  errors.push('La hoja de Gestión pacientes debe cargarse antes que gestion-pacientes-core.js.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Frontera de estilos de Gestión pacientes OK.');
