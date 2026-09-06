import fs from 'node:fs';

const js = fs.readFileSync('supabase-admin-users.js', 'utf8');
const css = fs.readFileSync('supabase-admin-users.css', 'utf8');
const routeModules = fs.readFileSync('route-modules.js', 'utf8');

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
};

for (const token of ['.crs-access-shell', '.crs-access-card', '.crs-access-error', '@media']) {
  if (!css.includes(token)) fail(`supabase-admin-users.css no contiene ${token}`);
}

for (const token of ['function addStyle', 'crs-global-access-style', 'document.createElement("style")', '.crs-access-shell{']) {
  if (js.includes(token)) fail(`supabase-admin-users.js volvió a inyectar estilos: ${token}`);
}

for (const token of ['signInWithPassword', 'resetPasswordForEmail', 'CRS_SUPABASE_JEFATURA']) {
  if (!js.includes(token)) fail(`supabase-admin-users.js perdió lógica crítica de Jefatura: ${token}`);
}

const jefaturaMatch = routeModules.match(/async function ensureJefatura\(\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*async function ensurePublicContent/);
const jefaturaBody = jefaturaMatch?.[1] || '';
const cssIndex = jefaturaBody.indexOf('loadStyle("supabase-admin-users", "./supabase-admin-users.css"');
const jsIndex = jefaturaBody.indexOf('loadScript("supabase-admin-users", "./supabase-admin-users.js"');
if (cssIndex < 0 || jsIndex < 0 || cssIndex >= jsIndex) {
  fail('Jefatura debe cargar supabase-admin-users.css antes que supabase-admin-users.js mediante route-modules.js.');
}

if (!routeModules.includes('if (current === "#/jefatura") return ensureJefatura();')) {
  fail('route-modules.js debe preparar Jefatura mediante ensureJefatura().');
}

if (!process.exitCode) console.log('Frontera de estilos de Jefatura OK.');