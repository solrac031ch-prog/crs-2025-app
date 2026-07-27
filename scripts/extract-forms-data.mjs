import fs from 'node:fs';

const appPath = 'app.js';
const dataPath = 'app-forms-data.js';
const source = fs.readFileSync(appPath, 'utf8');

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

  if (end < 0) throw new Error(`No se encontró el final de ${name}`);
  return { start, end, expression: source.slice(eq, end - 1).trim() };
}

if (fs.existsSync(dataPath)) throw new Error(`${dataPath} ya existe; abortando para evitar sobrescritura.`);

const names = [
  'mandatoryNotificationDiseases',
  'emergencyLawDecreeUrl',
  'emergencyLawGroups',
  'emergencyLawSearchExpansions',
  'turnForms'
];
const blocks = Object.fromEntries(names.map((name) => [name, declaration(name)]));
const regionStart = blocks.mandatoryNotificationDiseases.start;
const regionEnd = blocks.turnForms.end;

const binding = `const formsData = window.CRS_FORMS_DATA || {};\nconst mandatoryNotificationDiseases = formsData.mandatoryNotificationDiseases || [];\nconst emergencyLawDecreeUrl = formsData.emergencyLawDecreeUrl || \"\";\nconst emergencyLawConditions = window.emergencyLawConditions || [];\nconst emergencyLawGroups = formsData.emergencyLawGroups || [];\nconst emergencyLawSearchExpansions = formsData.emergencyLawSearchExpansions || {};\nconst turnForms = formsData.turnForms || [];`;

const nextApp = `${source.slice(0, regionStart)}${binding}${source.slice(regionEnd)}`;
const dataFile = `(() => {\n  const externalForms = window.CRS_APP_OPERATIONAL?.externalForms || {};\n  const mandatoryNotificationDiseases = ${blocks.mandatoryNotificationDiseases.expression};\n  const emergencyLawDecreeUrl = ${blocks.emergencyLawDecreeUrl.expression};\n  const emergencyLawGroups = ${blocks.emergencyLawGroups.expression};\n  const emergencyLawSearchExpansions = ${blocks.emergencyLawSearchExpansions.expression};\n  const turnForms = ${blocks.turnForms.expression};\n\n  window.CRS_FORMS_DATA = Object.freeze({\n    mandatoryNotificationDiseases,\n    emergencyLawDecreeUrl,\n    emergencyLawGroups,\n    emergencyLawSearchExpansions,\n    turnForms\n  });\n})();\n`;

fs.writeFileSync(appPath, nextApp, 'utf8');
fs.writeFileSync(dataPath, dataFile, 'utf8');
console.log('Datos de formularios extraídos a app-forms-data.js sin modificar su contenido.');
