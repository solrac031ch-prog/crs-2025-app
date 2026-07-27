import fs from 'node:fs';

const source = fs.readFileSync('gestion-pacientes-core.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const errors = [];

if (/localStorage\.setItem\s*\(/.test(source)) {
  errors.push('Gestión pacientes no puede persistir datos clínicos identificables en localStorage.');
}

for (const key of ['crsPatientCasesBackupV1', 'crsPriorityCases']) {
  if (!source.includes(key) || !/localStorage\.removeItem\(key\)/.test(source)) {
    errors.push(`Debe purgarse el respaldo local legado ${key}.`);
  }
}

if (!/event\.target\.closest\(["']\[data-priority-form\]["']\)/.test(source) || !/event\.stopImmediatePropagation\(\)/.test(source)) {
  errors.push('El módulo seguro debe interceptar el submit prioritario antes del guardado local legado de app.js.');
}

if (!/source:\s*["']unavailable["'][\s\S]*rows:\s*\[\]/.test(source)) {
  errors.push('Si Drive no está disponible, la vista debe fallar cerrada y no usar un respaldo clínico local.');
}

if (!/window\.CRS_SUPABASE\?\.client\?\.\(\)/.test(source) || !/api\.auth\.getUser\(\)/.test(source)) {
  errors.push('Gestión pacientes debe alinearse con la sesión Supabase actual.');
}

if (!/CHIEF_ROLES[\s\S]*["']creador["']/.test(source)) {
  errors.push('El rol creador debe ser reconocido por Gestión pacientes.');
}

if (/guardado localmente|Modo respaldo local/i.test(source)) {
  errors.push('La interfaz no debe ofrecer un modo de respaldo local para datos de pacientes.');
}

const appIndex = index.indexOf('./app.js');
const patientIndex = index.indexOf('./gestion-pacientes-core.js');
if (appIndex < 0 || patientIndex < 0 || patientIndex >= appIndex) {
  errors.push('gestion-pacientes-core.js debe cargar antes de app.js para registrar primero la protección del submit prioritario.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Privacidad de Gestión pacientes OK.');
