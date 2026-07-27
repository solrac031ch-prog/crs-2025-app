import fs from 'node:fs';
import vm from 'node:vm';

const appPath = 'app.js';
const dataPath = 'app-protocol-data.js';
const source = fs.readFileSync(appPath, 'utf8');
const marker = 'const protocols =';
const start = source.indexOf(marker);
if (start < 0) throw new Error(`No se encontró ${marker}`);
if (fs.existsSync(dataPath)) throw new Error(`${dataPath} ya existe; abortando para evitar sobrescritura.`);

const eq = source.indexOf('=', start) + 1;
let quote = '';
let escaped = false;
let round = 0;
let square = 0;
let curly = 0;
let end = -1;

for (let i = eq; i < source.length; i += 1) {
  const ch = source[i];
  if (quote) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === quote) quote = '';
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
  if (ch === '(') round += 1;
  else if (ch === ')') round -= 1;
  else if (ch === '[') square += 1;
  else if (ch === ']') square -= 1;
  else if (ch === '{') curly += 1;
  else if (ch === '}') curly -= 1;
  else if (ch === ';' && round === 0 && square === 0 && curly === 0) { end = i + 1; break; }
}

if (end < 0) throw new Error('No se encontró el final de const protocols.');
const expression = source.slice(eq, end - 1).trim();
const value = vm.runInNewContext(`(${expression})`, Object.create(null), { timeout: 1000 });
if (!Array.isArray(value) || value.length < 10) throw new Error('El dataset de protocolos no parece válido.');

const binding = 'const protocols = window.CRS_PROTOCOLS || [];';
const nextApp = `${source.slice(0, start)}${binding}${source.slice(end)}`;
const dataFile = `(() => {\n  window.CRS_PROTOCOLS = ${expression};\n})();\n`;

fs.writeFileSync(appPath, nextApp, 'utf8');
fs.writeFileSync(dataPath, dataFile, 'utf8');
console.log(`Extraídos ${value.length} protocolos a ${dataPath}.`);
