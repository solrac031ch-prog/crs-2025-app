import fs from 'node:fs';

const js = fs.readFileSync('supabase-jefatura-panel.js', 'utf8');
const css = fs.readFileSync('supabase-jefatura-panel.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exit(1);
};

for (const selector of ['.crs-recovery-overlay', '.crs-recovery-card', '.crs-recovery-actions']) {
  if (!css.includes(selector)) fail(`Falta ${selector} en supabase-jefatura-panel.css.`);
}

for (const forbidden of ['addRecoveryStyle', 'crs-password-recovery-style', 'style.textContent']) {
  if (js.includes(forbidden)) fail(`supabase-jefatura-panel.js volvió a inyectar estilos: ${forbidden}`);
}

if (/createElement\(["']style["']\)/.test(js)) fail('supabase-jefatura-panel.js no debe crear hojas <style> dinámicas.');

for (const marker of ['PASSWORD_RECOVERY', 'resetPasswordForEmail', 'updateUser', 'data-crs-recovery-form']) {
  if (!js.includes(marker)) fail(`Se perdió una pieza del flujo de recuperación: ${marker}`);
}

const cssMatch = html.match(/<link[^>]+href=["']\.\/supabase-jefatura-panel\.css\?v=\d+["'][^>]*>/);
const jsMatch = html.match(/<script[^>]+src=["']\.\/supabase-jefatura-panel\.js\?v=\d+["'][^>]*>/);
if (!cssMatch) fail('index.html debe cargar temprano supabase-jefatura-panel.css.');
if (!jsMatch) fail('index.html debe cargar temprano supabase-jefatura-panel.js.');
if (!cssMatch[0].includes('data-crs-route-style="supabase-jefatura-panel"')) {
  fail('El CSS temprano de recuperación debe marcarse como route-style para evitar duplicados al entrar a Jefatura.');
}
if (html.indexOf(cssMatch[0]) > html.indexOf('</head>')) fail('El CSS de recuperación debe cargarse desde <head>.');
if (html.indexOf(cssMatch[0]) >= html.indexOf(jsMatch[0])) fail('El CSS de recuperación debe estar disponible antes que su helper JavaScript.');

console.log('Frontera de estilos de recuperación válida.');