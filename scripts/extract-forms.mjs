import fs from 'node:fs';

const appPath = 'app.js';
const formsPath = 'app-forms.js';
const source = fs.readFileSync(appPath, 'utf8');
const marker = 'function emergencyLawHaystack(item) {';
const start = source.indexOf(marker);

if (start < 0) throw new Error(`No se encontró ${marker}`);
if (fs.existsSync(formsPath)) throw new Error(`${formsPath} ya existe; abortando para evitar sobrescritura.`);

const forms = source.slice(start).trim();
if (!forms.includes('function renderFormsRoute(parts = []) {')) {
  throw new Error('El bloque a extraer no contiene renderFormsRoute().');
}
if (!forms.includes('function renderTurnForms() {')) {
  throw new Error('El bloque a extraer no contiene renderTurnForms().');
}

const nextApp = `${source.slice(0, start).trimEnd()}\n`;
const nextForms = `${forms}\n`;

fs.writeFileSync(appPath, nextApp, 'utf8');
fs.writeFileSync(formsPath, nextForms, 'utf8');
console.log(`Extraído bloque de formularios desde app.js a ${formsPath}.`);
