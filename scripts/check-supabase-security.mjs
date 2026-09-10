import fs from 'node:fs';

const failures = [];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const setup = read('supabase-setup.sql');
const hardening = read('supabase-security-hardening.sql');
const masterAi = read('supabase/functions/master-ai/index.ts');
const frontendFiles = fs.readdirSync('.')
  .filter((name) => name.endsWith('.js') || name.endsWith('.html'));

for (const file of frontendFiles) {
  const source = read(file);
  if (/service[_-]?role/i.test(source)) {
    failures.push(`${file}: no debe contener referencias a service_role.`);
  }
  if (/SUPABASE_SERVICE_ROLE_KEY/i.test(source)) {
    failures.push(`${file}: nunca expongas SUPABASE_SERVICE_ROLE_KEY en cliente.`);
  }
}

const protectedTables = [
  'crs_admins',
  'crs_content_items',
  'crs_documents',
  'crs_flows',
  'crs_call_schedules'
];

for (const table of protectedTables) {
  const rls = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i');
  if (!rls.test(setup)) failures.push(`supabase-setup.sql: falta habilitar RLS en ${table}.`);
}

const requiredHardening = [
  /revoke\s+all\s+on\s+function\s+public\.crs_is_admin\(\)\s+from\s+public/i,
  /revoke\s+all\s+on\s+function\s+public\.crs_login_email\(text\)\s+from\s+public/i,
  /revoke\s+all\s+on\s+function\s+public\.crs_touch_updated_at\(\)\s+from\s+public/i,
  /grant\s+execute\s+on\s+function\s+public\.crs_is_admin\(\)\s+to\s+anon,\s*authenticated/i,
  /grant\s+execute\s+on\s+function\s+public\.crs_login_email\(text\)\s+to\s+anon,\s*authenticated/i
];

for (const pattern of requiredHardening) {
  if (!pattern.test(hardening)) failures.push(`supabase-security-hardening.sql: falta una regla obligatoria (${pattern}).`);
}

const guardedFunctions = [
  'public.crs_allowed_admin_role(text)',
  'public.crs_is_admin()',
  'public.crs_login_email(text)',
  'public.crs_touch_updated_at()'
];

for (const signature of guardedFunctions) {
  const escaped = signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const guard = new RegExp(`to_regprocedure\\(['\"]${escaped}['\"]\\)`, 'i');
  if (!guard.test(hardening)) {
    failures.push(`supabase-security-hardening.sql: ${signature} debe comprobar existencia antes de cambiar permisos.`);
  }
}

if (!/bucket_id\s*=\s*'crs-public'\s+and\s+public\.crs_is_admin\(\)/i.test(setup)) {
  failures.push('supabase-setup.sql: las escrituras de Storage deben exigir crs_is_admin().');
}

const masterAiRequirements = [
  [/npm:json5@2\.2\.3/, 'MASTER IA debe fijar la versión del parser del catálogo canónico.'],
  [/CANONICAL_PROTOCOLS_URL/, 'MASTER IA debe declarar una fuente canónica server-side para protocolos.'],
  [/async function canonicalCatalog\(/, 'MASTER IA debe cargar el catálogo canónico en servidor.'],
  [/async function validatedSources\(/, 'MASTER IA debe validar los identificadores de fuente contra el catálogo canónico.'],
  [/sources\s*=\s*await\s+validatedSources\(incoming\)/, 'MASTER IA no debe usar directamente las fuentes recibidas del navegador.'],
  [/MAX_REQUEST_BYTES/, 'MASTER IA debe limitar el tamaño total de la solicitud antes de procesarla.'],
  [/await\s+req\.text\(\)/, 'MASTER IA debe medir el body antes de parsear JSON.'],
  [/La consulta no se envió a ningún proveedor externo porque el catálogo canónico no pudo verificarse/, 'MASTER IA debe fallar cerrado si no puede validar el catálogo canónico.']
];

for (const [pattern, message] of masterAiRequirements) {
  if (!pattern.test(masterAi)) failures.push(message);
}

if (/incoming\.map\([\s\S]{0,900}source\?\.text/.test(masterAi)) {
  failures.push('MASTER IA volvió a confiar en source.text controlado por el cliente.');
}

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log('Guardas de seguridad Supabase OK.');
