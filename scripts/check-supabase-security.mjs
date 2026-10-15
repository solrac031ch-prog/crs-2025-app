import fs from 'node:fs';

const failures = [];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const setup = read('supabase-setup.sql');
const hardening = read('supabase-security-hardening.sql');
const frontendFiles = fs.readdirSync('.')
  .filter((name) => name.endsWith('.js') || name.endsWith('.html'));

for (const file of frontendFiles) {
  const source = read(file);
  if (/service[_-]?role/i.test(source)) failures.push(`${file}: no debe contener referencias a service_role.`);
  if (/SUPABASE_SERVICE_ROLE_KEY/i.test(source)) failures.push(`${file}: nunca expongas SUPABASE_SERVICE_ROLE_KEY en cliente.`);
}

const protectedTables = ['crs_admins','crs_content_items','crs_documents','crs_flows','crs_call_schedules'];
for (const table of protectedTables) {
  const rls = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i');
  if (!rls.test(setup)) failures.push(`supabase-setup.sql: falta habilitar RLS en ${table}.`);
}

const requiredHardening = [
  /create\s+or\s+replace\s+function\s+crs_private\.is_admin\(\)/i,
  /create\s+or\s+replace\s+function\s+crs_private\.can_manage_users\(\)/i,
  /security\s+definer[\s\S]{0,160}set\s+search_path\s*=\s*''/i,
  /revoke\s+all\s+on\s+function\s+crs_private\.is_admin\(\)\s+from\s+public/i,
  /revoke\s+all\s+on\s+function\s+public\.crs_is_admin\(\)\s+from\s+anon/i,
  /revoke\s+all\s+on\s+function\s+public\.crs_login_email\(text\)\s+from\s+anon/i
];

for (const pattern of requiredHardening) {
  if (!pattern.test(hardening)) failures.push(`supabase-security-hardening.sql: falta una regla obligatoria (${pattern}).`);
}

const guardedLegacyFunctions = [
  'public.crs_allowed_admin_role(text)',
  'public.crs_is_admin()',
  'public.crs_login_email(text)',
  'public.crs_touch_updated_at()'
];

for (const signature of guardedLegacyFunctions) {
  if (!hardening.includes(`to_regprocedure('${signature}')`)) {
    failures.push(`supabase-security-hardening.sql: ${signature} debe comprobar existencia antes de cambiar permisos.`);
  }
}

if (!/bucket_id\s*=\s*'crs-public'\s+and\s+\(select\s+crs_private\.is_admin\(\)\)/i.test(setup)) {
  failures.push('supabase-setup.sql: las escrituras de Storage deben exigir crs_private.is_admin().');
}

if (/grant\s+execute\s+on\s+function\s+public\.crs_(?:is_admin|login_email)/i.test(setup + '\n' + hardening)) {
  failures.push('Los helpers públicos legacy de autorización/login no deben recuperar EXECUTE.');
}

if (/auth\.signUp\s*\(/.test(read('supabase-admin-users.js'))) {
  failures.push('supabase-admin-users.js no debe crear usuarios Auth desde el navegador.');
}

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log('Guardas de seguridad Supabase OK.');
