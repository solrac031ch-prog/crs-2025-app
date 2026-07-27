import fs from 'node:fs';
import path from 'node:path';

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
  /grant\s+execute\s+on\s+function\s+public\.crs_is_admin\(\)\s+to\s+anon,\s*authenticated/i,
  /grant\s+execute\s+on\s+function\s+public\.crs_login_email\(text\)\s+to\s+anon,\s*authenticated/i
];

for (const pattern of requiredHardening) {
  if (!pattern.test(hardening)) failures.push(`supabase-security-hardening.sql: falta una regla obligatoria (${pattern}).`);
}

if (!/bucket_id\s*=\s*'crs-public'\s+and\s+public\.crs_is_admin\(\)/i.test(setup)) {
  failures.push('supabase-setup.sql: las escrituras de Storage deben exigir crs_is_admin().');
}

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log('Guardas de seguridad Supabase OK.');
