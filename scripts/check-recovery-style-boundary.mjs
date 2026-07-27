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

const cssRef = './supabase-jefatura-panel.css?v=1';
const jsRef = './supabase-jefatura-panel.js?v=14';
if (!html.includes(cssRef)) fail('index.html no carga supabase-jefatura-panel.css.');
if (!html.includes(jsRef)) fail('index.html no carga la versión esperada de supabase-jefatura-panel.js.');
if (html.indexOf(cssRef) > html.indexOf('</head>')) fail('El CSS de recuperación debe cargarse desde <head>.');

console.log('Frontera de estilos de recuperación válida.');
