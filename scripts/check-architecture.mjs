import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const errors = [];
const warnings = [];

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
if (scheduleMatch) {
  const renderTimers = (scheduleMatch[1].match(/setTimeout/g) || []).length;
  if (renderTimers > 1) {
    warnings.push('gestion-panel-final.js aún tiene más de un setTimeout en schedule(); queda como deuda técnica prioritaria.');
  }
}

for (const warning of warnings) console.warn(`AVISO: ${warning}`);
for (const error of errors) console.error(`ERROR: ${error}`);

if (errors.length) process.exit(1);
console.log('Guardas de arquitectura OK.');
