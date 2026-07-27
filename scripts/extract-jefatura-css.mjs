import fs from 'node:fs';

const jsPath = 'supabase-admin-users.js';
const cssPath = 'supabase-admin-users.css';
let source = fs.readFileSync(jsPath, 'utf8');

if (fs.existsSync(cssPath)) throw new Error(`${cssPath} ya existe; abortando para evitar sobrescritura.`);

const fnStart = source.indexOf('  function addStyle() {');
const nextFn = source.indexOf('\n  function toast(', fnStart);
if (fnStart < 0 || nextFn < 0) throw new Error('No se pudo delimitar addStyle() de Jefatura.');

const block = source.slice(fnStart, nextFn);
const cssMatch = block.match(/style\.textContent\s*=\s*`([\s\S]*?)`;\s*\n/);
if (!cssMatch) throw new Error('No se encontró el CSS inyectado de Jefatura.');

const css = cssMatch[1]
  .split('\n')
  .map((line) => line.replace(/^\s{6}/, ''))
  .join('\n')
  .trim();

if (!css.includes('.crs-access-shell') || !css.includes('.crs-access-card') || !css.includes('@media')) {
  throw new Error('El CSS extraído no contiene los selectores esperados.');
}

source = `${source.slice(0, fnStart)}${source.slice(nextFn + 1)}`;
source = source.replace(/^\s*addStyle\(\);\s*\n/gm, '');

if (/function\s+addStyle\s*\(|addStyle\(\)|crs-global-access-style/.test(source)) {
  throw new Error('Quedaron referencias a la inyección de estilos de Jefatura.');
}

fs.writeFileSync(jsPath, source, 'utf8');
fs.writeFileSync(cssPath, `${css}\n`, 'utf8');
console.log('CSS de Jefatura extraído sin modificar sus reglas.');
