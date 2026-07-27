import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync('app.js', 'utf8');
const data = fs.readFileSync('app-protocol-data.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const errors = [];

if (!app.includes('const protocols = window.CRS_PROTOCOLS || [];')) {
  errors.push('app.js debe consumir los protocolos desde window.CRS_PROTOCOLS.');
}

if (/const\s+protocols\s*=\s*\[/.test(app)) {
  errors.push('app.js no debe volver a incrustar el dataset clínico de protocolos.');
}

const sandbox = { window: {} };
try {
  vm.runInNewContext(data, sandbox, { timeout: 1000 });
} catch (error) {
  errors.push(`app-protocol-data.js no se puede evaluar: ${error.message}`);
}

const protocols = sandbox.window.CRS_PROTOCOLS;
if (!Array.isArray(protocols) || protocols.length < 20) {
  errors.push('app-protocol-data.js debe exponer un arreglo clínico no vacío y completo.');
} else {
  for (const [indexValue, protocol] of protocols.entries()) {
    if (!protocol || typeof protocol !== 'object' || !String(protocol.title || '').trim() || !String(protocol.category || '').trim()) {
      errors.push(`Protocolo inválido en posición ${indexValue}: debe tener title y category.`);
      break;
    }
  }
  const titles = new Set(protocols.map((item) => String(item.title || '')));
  for (const required of ['Antes de derivar', 'Medicina Interna', 'Sala Pulso', 'TVP - sospecha, ECO y horario inhábil']) {
    if (!titles.has(required)) errors.push(`Falta protocolo estructural esperado: ${required}.`);
  }
}

const dataIndex = index.indexOf('./app-protocol-data.js');
const appIndex = index.indexOf('./app.js');
if (dataIndex < 0 || appIndex < 0 || dataIndex >= appIndex) {
  errors.push('index.html debe cargar app-protocol-data.js antes de app.js.');
}

const appLines = app.split(/\r?\n/).length;
if (appLines >= 1400) {
  errors.push(`app.js volvió a crecer a ${appLines} líneas; el dataset clínico no debe regresar al núcleo.`);
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log(`Frontera clínica OK. ${protocols.length} protocolos; app.js: ${appLines} líneas.`);
