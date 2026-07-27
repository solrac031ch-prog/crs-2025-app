import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const errors = [];

const config = read('supabase-config.js');
const chiefHelper = read('supabase-jefatura-panel.js');
const chiefController = read('supabase-admin-users.js');
const gestion = read('gestion-panel-final.js');

if (!chiefController.includes('window.CRS_SUPABASE_JEFATURA')) {
  errors.push('supabase-admin-users.js debe exponer CRS_SUPABASE_JEFATURA.');
}

if (/addEventListener\(["']hashchange["']/.test(chiefHelper)) {
  errors.push('supabase-jefatura-panel.js no debe controlar hashchange.');
}

if (/crs:supabase-ready/.test(chiefHelper)) {
  errors.push('supabase-jefatura-panel.js no debe controlar el ciclo crs:supabase-ready.');
}

if (/CRS_SUPABASE_JEFATURA\?\.scheduleRender|CRS_SUPABASE_JEFATURA\.scheduleRender/.test(config)) {
  errors.push('supabase-config.js no debe disparar renders directos de Jefatura.');
}

const scheduleMatch = gestion.match(/function\s+schedule\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);
if (!scheduleMatch) {
  errors.push('gestion-panel-final.js debe mantener un scheduler explicito.');
} else {
  const renderTimers = (scheduleMatch[1].match(/setTimeout/g) || []).length;
  if (renderTimers > 1) {
    errors.push('gestion-panel-final.js no puede programar mas de un setTimeout por schedule().');
  }
}

if (!/let\s+renderTimer\s*=\s*null/.test(gestion) || !/clearTimeout\(renderTimer\)/.test(gestion)) {
  errors.push('gestion-panel-final.js debe usar un timer cancelable para agrupar renders consecutivos.');
}

if (!/function\s+card\s*\(/.test(gestion)) {
  errors.push('gestion-panel-final.js debe definir card() localmente para renderizar listados sin depender de globals.');
}

for (const error of errors) console.error(`ERROR: ${error}`);

if (errors.length) process.exit(1);
console.log('Guardas de arquitectura OK.');