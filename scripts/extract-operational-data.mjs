import fs from 'node:fs';
import vm from 'node:vm';

const appPath = 'app.js';
const dataPath = 'app-operational-data.js';
const names = ['externalDocs', 'externalForms', 'onCallSchedule', 'phoneDirectory', 'educationLinks'];
const source = fs.readFileSync(appPath, 'utf8');

if (source.includes('const operationalData = window.CRS_APP_OPERATIONAL')) {
  console.log('app.js ya usa CRS_APP_OPERATIONAL; no hay cambios que aplicar.');
  process.exit(0);
}

function declaration(name) {
  const marker = `const ${name} =`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`No se encontró ${marker}`);
  const eq = source.indexOf('=', start) + 1;
  let quote = '';
  let escaped = false;
  let round = 0;
  let square = 0;
  let curly = 0;

  for (let i = eq; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '(') round += 1;
    else if (ch === ')') round -= 1;
    else if (ch === '[') square += 1;
    else if (ch === ']') square -= 1;
    else if (ch === '{') curly += 1;
    else if (ch === '}') curly -= 1;
    else if (ch === ';' && round === 0 && square === 0 && curly === 0) {
      const expression = source.slice(eq, i).trim();
      try {
        vm.runInNewContext(`(${expression})`, Object.create(null), { timeout: 500 });
      } catch (error) {
        throw new Error(`${name} no es un literal autocontenido y no se extraerá: ${error.message}`);
      }
      let end = i + 1;
      while (source[end] === '\r' || source[end] === '\n') end += 1;
      return { name, start, end, expression };
    }
  }
  throw new Error(`No se encontró el final de la declaración ${name}`);
}

const blocks = names.map(declaration).sort((a, b) => a.start - b.start);
const first = blocks[0];
const binding = `const operationalData = window.CRS_APP_OPERATIONAL || {};\nconst externalDocs = operationalData.externalDocs || {};\nconst externalForms = operationalData.externalForms || {};\nconst onCallSchedule = operationalData.onCallSchedule || { year: 0, month: 0, label: "", rows: [] };\nconst phoneDirectory = operationalData.phoneDirectory || [];\nconst educationLinks = operationalData.educationLinks || [];\n\n`;

let next = source;
for (const block of [...blocks].sort((a, b) => b.start - a.start)) {
  next = next.slice(0, block.start) + (block.start === first.start ? binding : '') + next.slice(block.end);
}

const dataFile = `(() => {\n  window.CRS_APP_OPERATIONAL = {\n${blocks.map((block) => `    ${block.name}: ${block.expression}`).join(',\n')}\n  };\n})();\n`;

fs.writeFileSync(appPath, next, 'utf8');
fs.writeFileSync(dataPath, dataFile, 'utf8');
console.log(`Extraídos ${names.join(', ')} a ${dataPath}.`);
