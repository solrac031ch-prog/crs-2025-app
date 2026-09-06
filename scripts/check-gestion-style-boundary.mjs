import fs from 'node:fs';

const js = fs.readFileSync('gestion-panel-final.js', 'utf8');
const css = fs.readFileSync('gestion-panel-final.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const routeModules = fs.readFileSync('route-modules.js', 'utf8');
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

const staticCssIndex = index.indexOf('./gestion-panel-final.css');
const staticJsIndex = index.indexOf('./gestion-panel-final.js');
const staticOrdered = staticCssIndex >= 0 && staticJsIndex > staticCssIndex;

const managementMatch = routeModules.match(/async function ensureManagement\(\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*async function ensureJefatura/);
const managementBody = managementMatch?.[1] || '';
const lazyCssIndex = managementBody.indexOf('loadStyle("gestion-panel-final", "./gestion-panel-final.css"');
const lazyJsIndex = managementBody.indexOf('loadScript("gestion-panel-final", "./gestion-panel-final.js"');
const lazyOrdered = lazyCssIndex >= 0 && lazyJsIndex > lazyCssIndex;

if (!staticOrdered && !lazyOrdered) {
  errors.push('Gestión debe cargar gestion-panel-final.css antes que gestion-panel-final.js, de forma estática o mediante route-modules.js.');
}

if (!routeModules.includes('if (current === "#/gestion" || current.startsWith("#/gestion/")) return ensureManagement();')) {
  errors.push('route-modules.js debe preparar Gestión mediante ensureManagement().');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Frontera de estilos de Gestión OK.');