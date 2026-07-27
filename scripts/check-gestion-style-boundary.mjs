import fs from 'node:fs';

const js = fs.readFileSync('gestion-panel-final.js', 'utf8');
const css = fs.readFileSync('gestion-panel-final.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const errors = [];

if (/function\s+addStyle\s*\(|createElement\(["']style["']\)|style\.textContent/.test(js)) {
  errors.push('gestion-panel-final.js no debe volver a inyectar su hoja visual desde JavaScript.');
}

for (const selector of ['.gf-shell', '.gf-hero', '.gf-grid', '.gf-card', '.gf-paper-layout', '.gf-home-card']) {
  if (!css.includes(selector)) errors.push(`Falta selector esperado en gestion-panel-final.css: ${selector}`);
}

if (!css.includes('@media(max-width:840px)') || !css.includes('@media(max-width:680px)')) {
  errors.push('gestion-panel-final.css debe conservar los breakpoints responsivos existentes.');
}

if (!index.includes('<link rel="stylesheet" href="./gestion-panel-final.css?v=1" />')) {
  errors.push('index.html debe cargar gestion-panel-final.css desde <head>.');
}

const cssIndex = index.indexOf('./gestion-panel-final.css');
const jsIndex = index.indexOf('./gestion-panel-final.js');
if (cssIndex < 0 || jsIndex < 0 || cssIndex >= jsIndex) {
  errors.push('La hoja de Gestión debe cargarse antes que gestion-panel-final.js.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Frontera de estilos de Gestión OK.');
