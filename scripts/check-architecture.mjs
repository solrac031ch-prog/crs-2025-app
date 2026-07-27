import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const errors = [];

const index = read('index.html');
const config = read('supabase-config.js');
const chiefHelper = read('supabase-jefatura-panel.js');
const chiefController = read('supabase-admin-users.js');
const backend = read('supabase-backend.js');
const loginCompat = read('supabase-login-compat.js');
const gestion = read('gestion-panel-final.js');

if (!chiefController.includes('window.CRS_SUPABASE_JEFATURA')) {
  errors.push('supabase-admin-users.js debe exponer CRS_SUPABASE_JEFATURA.');
}

const backendIndex = index.indexOf('./supabase-backend.js');
const recoveryIndex = index.indexOf('./supabase-jefatura-panel.js');
const compatIndex = index.indexOf('./supabase-login-compat.js');
const chiefIndex = index.indexOf('./supabase-admin-users.js');
if (
  backendIndex < 0 || recoveryIndex < 0 || compatIndex < 0 || chiefIndex < 0 ||
  !(backendIndex < recoveryIndex && recoveryIndex < compatIndex && compatIndex < chiefIndex)
) {
  errors.push('index.html debe cargar backend, recuperación, compatibilidad de correo y luego Jefatura, en ese orden.');
}

if (!/functionName\s*===\s*["']crs_login_email["']/.test(loginCompat) || !/includes\(["']@["']\)/.test(loginCompat)) {
  errors.push('supabase-login-compat.js debe limitarse a resolver correos para crs_login_email.');
}

if (/signInWithPassword|signInWithOtp|signOut\s*\(/.test(loginCompat)) {
  errors.push('supabase-login-compat.js no debe iniciar ni cerrar sesiones.');
}

if (/addEventListener\(["']hashchange["']/.test(chiefHelper)) {
  errors.push('supabase-jefatura-panel.js no debe controlar hashchange.');
}

if (/crs:supabase-ready/.test(chiefHelper)) {
  errors.push('supabase-jefatura-panel.js no debe controlar el ciclo crs:supabase-ready.');
}

if (!/PASSWORD_RECOVERY/.test(chiefHelper)) {
  errors.push('supabase-jefatura-panel.js debe escuchar PASSWORD_RECOVERY.');
}

if (!/auth\.updateUser\s*\(\s*\{\s*password/.test(chiefHelper)) {
  errors.push('supabase-jefatura-panel.js debe permitir guardar la nueva clave con auth.updateUser().');
}

if (/redirectTo\s*:\s*`?[^\n]*#\/jefatura/i.test(chiefHelper)) {
  errors.push('La recuperación no debe usar #/jefatura dentro de redirectTo porque Supabase usa el fragmento para Auth.');
}

if (!/data-supabase-jefatura-panel/.test(index)) {
  errors.push('index.html debe cargar recuperación de clave de forma temprana para no perder PASSWORD_RECOVERY.');
}

if (/CRS_SUPABASE_JEFATURA\?\.scheduleRender|CRS_SUPABASE_JEFATURA\.scheduleRender/.test(config)) {
  errors.push('supabase-config.js no debe disparar renders directos de Jefatura.');
}

const forbiddenBackendOwnership = [
  [/data-sb-login/, 'supabase-backend.js no debe controlar formularios de login.'],
  [/data-backend-user/, 'supabase-backend.js no debe administrar usuarios de Jefatura.'],
  [/invokeAdminUsers\s*\(/, 'supabase-backend.js no debe invocar administracion de usuarios.'],
  [/auth\.signInWithPassword\s*\(/, 'supabase-backend.js no debe iniciar sesiones.'],
  [/auth\.signInWithOtp\s*\(/, 'supabase-backend.js no debe iniciar sesiones OTP.'],
  [/auth\.signOut\s*\(/, 'supabase-backend.js no debe cerrar sesiones.'],
  [/data-sb-delete-user/, 'supabase-backend.js no debe controlar eliminacion de usuarios.']
];

for (const [pattern, message] of forbiddenBackendOwnership) {
  if (pattern.test(backend)) errors.push(message);
}

if (!/window\.CRS_SUPABASE_JEFATURA\?\.scheduleRender/.test(backend)) {
  errors.push('supabase-backend.js debe delegar la actualizacion de Jefatura al controlador dedicado tras una mutacion.');
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
