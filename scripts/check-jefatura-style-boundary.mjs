import fs from 'node:fs';

const js = fs.readFileSync('supabase-admin-users.js', 'utf8');
const css = fs.readFileSync('supabase-admin-users.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

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

if (!html.includes('href="./supabase-admin-users.css?v=1"')) {
  fail('index.html no carga supabase-admin-users.css desde <head>.');
}

if (!process.exitCode) console.log('Frontera de estilos de Jefatura OK.');
