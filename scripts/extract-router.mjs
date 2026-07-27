import fs from 'node:fs';

const appPath = 'app.js';
const routerPath = 'app-router.js';
const source = fs.readFileSync(appPath, 'utf8');
const marker = 'function renderRoute() {';
const start = source.indexOf(marker);

if (start < 0) throw new Error(`No se encontró ${marker}`);
if (fs.existsSync(routerPath)) throw new Error(`${routerPath} ya existe; abortando para evitar sobrescritura.`);

let router = source.slice(start).trim();
router = router.replace(/\nif \("serviceWorker" in navigator\) \{\n\s*navigator\.serviceWorker\.register\("\.\/sw\.js"\)\.catch\(\(\) => \{\}\);\n\}\s*$/, '');

const nextApp = `${source.slice(0, start).trimEnd()}\n`;
const nextRouter = `(() => {\n${router.split('\n').map((line) => `  ${line}`).join('\n')}\n})();\n`;

fs.writeFileSync(appPath, nextApp, 'utf8');
fs.writeFileSync(routerPath, nextRouter, 'utf8');
console.log(`Extraído router desde app.js a ${routerPath}.`);
