import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const size = (path) => fs.statSync(path).size;
const errors = [];

const index = read('index.html');
const patientBootstrap = read('gestion-pacientes-core.js');
const protocolBootstrap = read('protocolos-detalle-polish.js');
const routes = read('route-modules.js');
const supabase = read('supabase-config.js');

if (size('gestion-pacientes-core.js') > 2048) {
  errors.push('El bootstrap de Gestión pacientes volvió a crecer sobre 2 KB; la lógica pesada debe quedar en gestion-pacientes-runtime.js.');
}
if (size('protocolos-detalle-polish.js') > 2048) {
  errors.push('El bootstrap de detalle de protocolos volvió a crecer sobre 2 KB; la lógica pesada debe quedar en protocolos-detalle-polish-runtime.js.');
}
if (!fs.existsSync('gestion-pacientes-runtime.js') || !fs.existsSync('protocolos-detalle-polish-runtime.js')) {
  errors.push('Faltan runtimes diferidos necesarios para las rutas clínicas.');
}
for (const file of ['gestion-pacientes-runtime.js', 'protocolos-detalle-polish-runtime.js']) {
  if (index.includes(`./${file}`)) errors.push(`${file} no debe volver al arranque global de index.html.`);
  if (!routes.includes(`./${file}`)) errors.push(`${file} debe permanecer controlado por route-modules.js.`);
}
if (!patientBootstrap.includes('localStorage.removeItem(key)')) {
  errors.push('La optimización no puede retrasar la purga de respaldos clínicos heredados.');
}
if (!protocolBootstrap.includes('CRS_PROTOCOL_POLISH_BOOTSTRAP')) {
  errors.push('El bootstrap liviano de protocolos debe permanecer identificable.');
}

const callsRouteOnly = ['llamados-estructurados.js', 'llamados-backfill.js', 'llamados-vigente.js'];
for (const file of callsRouteOnly) {
  if (protocolBootstrap.includes(file)) {
    errors.push(`${file} es específico de Llamados/Jefatura y no debe cargarse desde protocolos-detalle-polish.js.`);
  }
  if (!routes.includes(`./${file}`)) {
    errors.push(`${file} debe permanecer bajo propiedad explícita de route-modules.js.`);
  }
}
if (!routes.includes('CRS_STRUCTURED_CALLS') || !routes.includes('isComplete')) {
  errors.push('La ruta de Llamados debe validar completitud de la base estructurada antes de omitir el respaldo PDF.');
}

if (/requestIdleCallback\s*\(\s*ensureSupabaseClient|setTimeout\s*\(\s*ensureSupabaseClient/.test(supabase)) {
  errors.push('Supabase no debe descargarse por inactividad en Inicio; sólo por ruta remota o callback de Auth.');
}
if (!supabase.includes('function isRemoteRoute') || !supabase.includes('function hasAuthCallback')) {
  errors.push('supabase-config.js debe conservar carga condicionada por ruta y callbacks de autenticación.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Frontera de rendimiento OK: Inicio liviano y módulos pesados bajo demanda.');
