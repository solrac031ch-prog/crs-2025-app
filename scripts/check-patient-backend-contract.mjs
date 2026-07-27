import fs from 'node:fs';

const frontend = fs.readFileSync('gestion-pacientes-core.js', 'utf8');
const backend = fs.readFileSync('apps-script/gestion-pacientes.gs', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const errors = [];

for (const action of ['listPatientCases', 'savePatientCase', 'updatePatientCase']) {
  if (!frontend.includes(`"${action}"`)) errors.push(`Frontend no envía ${action}.`);
  if (!backend.includes(`action === '${action}'`)) errors.push(`Apps Script no reconoce ${action}.`);
}

for (const marker of ['accessToken', 'supabaseAnonKey']) {
  if (!frontend.includes(marker)) errors.push(`Frontend no envía ${marker}.`);
  if (!backend.includes(marker)) errors.push(`Apps Script no valida ${marker}.`);
}

if (!backend.includes('/auth/v1/user')) errors.push('Apps Script debe validar el JWT contra Supabase Auth.');
if (!backend.includes('/rest/v1/crs_admins')) errors.push('Apps Script debe comprobar permiso activo en crs_admins.');
if (!backend.includes('CRS_PATIENT_SPREADSHEET_PROPERTY')) errors.push('Apps Script debe conservar de forma estable el ID de la planilla.');
if (!index.includes('./gestion-pacientes-config.js')) errors.push('Falta configuración de Gestión pacientes en index.html.');

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Contrato frontend ↔ Apps Script de Gestión pacientes OK.');
