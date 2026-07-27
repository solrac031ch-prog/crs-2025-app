import fs from 'node:fs';

const source = fs.readFileSync('gestion-pacientes-core.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const router = fs.readFileSync('app-router.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const errors = [];

if (/localStorage\.setItem\s*\(/.test(source)) {
  errors.push('Gestión pacientes no puede persistir datos clínicos identificables en localStorage.');
}

for (const key of ['crsPatientCasesBackupV1', 'crsPriorityCases']) {
  if (!source.includes(key) || !/localStorage\.removeItem\(key\)/.test(source)) {
    errors.push(`Debe purgarse el respaldo local legado ${key}.`);
  }
  if (app.includes(key) || router.includes(key)) {
    errors.push(`app.js y app-router.js no deben conocer la clave clínica legada ${key}.`);
  }
}

const forbiddenLegacyMarkers = [
  'priorityCasesStorageKey',
  'function priorityCases()',
  'function savePriorityCases(',
  'function savePriorityCase(',
  'exportPriorityCasesCsv',
  'exportPriorityCasesWord',
  'function renderManagement()',
  'data-export-cases',
  'data-case-done'
];
for (const marker of forbiddenLegacyMarkers) {
  if (app.includes(marker) || router.includes(marker)) {
    errors.push(`La gestión clínica local heredada debe permanecer eliminada: ${marker}.`);
  }
}

if (fs.existsSync('patient-storage-guard.js') || index.includes('./patient-storage-guard.js')) {
  errors.push('No debe existir un monkey-patch global de localStorage; la ruta insegura debe estar eliminada de origen.');
}

if (!source.includes('[data-priority-form]') || !source.includes('event.stopImmediatePropagation()')) {
  errors.push('gestion-pacientes-core.js debe ser el único dueño del submit prioritario y detener handlers posteriores.');
}

if (!/source:\s*["']unavailable["'][\s\S]*rows:\s*\[\]/.test(source)) {
  errors.push('Si Drive no está disponible, la vista debe fallar cerrada y no usar un respaldo clínico local.');
}

if (!source.includes('window.CRS_SUPABASE?.client?.()') || !source.includes('api.auth.getUser()')) {
  errors.push('Gestión pacientes debe alinearse con la sesión Supabase actual.');
}

if (!/CHIEF_ROLES[\s\S]*["']creador["']/.test(source)) {
  errors.push('El rol creador debe ser reconocido por Gestión pacientes.');
}

if (/guardado localmente|Modo respaldo local/i.test(source) || !app.includes('no quedará almacenado en este dispositivo')) {
  errors.push('La interfaz debe informar que el caso no queda almacenado en el dispositivo.');
}

const patientIndex = index.indexOf('./gestion-pacientes-core.js');
const appIndex = index.indexOf('./app.js');
if (patientIndex < 0 || appIndex < 0 || patientIndex >= appIndex) {
  errors.push('gestion-pacientes-core.js debe cargar antes de app.js para ser dueño del submit prioritario.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Privacidad de Gestión pacientes OK: sin persistencia clínica local heredada.');
