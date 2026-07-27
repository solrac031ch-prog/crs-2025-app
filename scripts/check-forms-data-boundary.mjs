import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const operationalSource = read('app-operational-data.js');
const dataSource = read('app-forms-data.js');
const appSource = read('app.js');
const formsSource = read('app-forms.js');
const indexSource = read('index.html');
const errors = [];

const context = { window: {} };
vm.createContext(context);
vm.runInContext(operationalSource, context, { filename: 'app-operational-data.js' });
vm.runInContext(dataSource, context, { filename: 'app-forms-data.js' });

const data = context.window.CRS_FORMS_DATA;
if (!data || typeof data !== 'object') {
  errors.push('app-forms-data.js debe exponer window.CRS_FORMS_DATA.');
} else {
  if (!Array.isArray(data.mandatoryNotificationDiseases) || data.mandatoryNotificationDiseases.length !== 45) {
    errors.push('El dataset de notificación obligatoria debe conservar 45 patologías.');
  }
  for (const name of ['Arbovirus', 'Tuberculosis', 'Sindrome pulmonar por Hantavirus']) {
    if (!data.mandatoryNotificationDiseases?.some((item) => item.name === name)) {
      errors.push(`Falta patología esperada de notificación obligatoria: ${name}.`);
    }
  }
  const expectedGroups = ['respiratorio', 'cardiovascular', 'neurologia', 'trauma', 'digestivo-quirurgico', 'infeccioso-metabolico', 'otros'];
  if (!Array.isArray(data.emergencyLawGroups) || expectedGroups.some((id) => !data.emergencyLawGroups.some((group) => group.id === id))) {
    errors.push('Los siete grupos de Ley de Urgencias deben conservarse completos.');
  }
  if (!data.emergencyLawSearchExpansions?.acv?.includes('ictus') || Object.keys(data.emergencyLawSearchExpansions || {}).length < 25) {
    errors.push('Los sinónimos de búsqueda de Ley de Urgencias parecen incompletos.');
  }
  if (!Array.isArray(data.turnForms) || data.turnForms.length !== 7) {
    errors.push('El catálogo de formularios de turno debe conservar siete entradas.');
  }
  if (!data.turnForms?.some((item) => item.type === 'emergencyLaw') || !data.turnForms?.some((item) => item.type === 'mandatoryNotification')) {
    errors.push('El catálogo debe conservar Ley de Urgencias y Notificación obligatoria.');
  }
  if (!String(data.emergencyLawDecreeUrl || '').endsWith('decreto-34-25-oct-2022.pdf')) {
    errors.push('Debe conservarse el PDF fuente del Decreto 34 de Ley de Urgencias.');
  }
}

if (!/const\s+formsData\s*=\s*window\.CRS_FORMS_DATA\s*\|\|\s*\{\}/.test(appSource)) {
  errors.push('app.js debe consumir el dataset mediante window.CRS_FORMS_DATA.');
}
if (!/const\s+emergencyLawConditions\s*=\s*window\.emergencyLawConditions\s*\|\|\s*\[\]/.test(appSource)) {
  errors.push('app.js debe seguir consumiendo las condiciones clínicas desde ley-urgencias-data.js.');
}

const forbiddenInline = [
  /const\s+mandatoryNotificationDiseases\s*=\s*\[/,
  /const\s+emergencyLawGroups\s*=\s*\[/,
  /const\s+emergencyLawSearchExpansions\s*=\s*\{/,
  /const\s+turnForms\s*=\s*\[/
];
for (const pattern of forbiddenInline) {
  if (pattern.test(appSource) || pattern.test(formsSource)) {
    errors.push(`Los datos estáticos de formularios no deben volver a incrustarse en app.js/app-forms.js: ${pattern}.`);
  }
}

const operationalIndex = indexSource.indexOf('./app-operational-data.js');
const formsDataIndex = indexSource.indexOf('./app-forms-data.js');
const appIndex = indexSource.indexOf('./app.js');
const formsIndex = indexSource.indexOf('./app-forms.js');
if ([operationalIndex, formsDataIndex, appIndex, formsIndex].some((value) => value < 0) || !(operationalIndex < formsDataIndex && formsDataIndex < appIndex && appIndex < formsIndex)) {
  errors.push('index.html debe cargar app-operational-data.js → app-forms-data.js → app.js → app-forms.js.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Frontera de datos de formularios OK.');
