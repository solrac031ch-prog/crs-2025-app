import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const routeModules = fs.readFileSync('route-modules.js', 'utf8');
const errors = [];

const heavyRuntimeFiles = [
  'gestion-pacientes-runtime.js',
  'protocolos-detalle-polish-runtime.js'
];

for (const file of heavyRuntimeFiles) {
  if (index.includes(`./${file}`)) errors.push(`${file} no debe volver al arranque global de index.html.`);
  if (!routeModules.includes(`./${file}`)) errors.push(`${file} debe permanecer controlado por route-modules.js.`);
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Arranque global sin runtimes pesados.');
