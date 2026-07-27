import fs from 'node:fs';

function replaceExact(source, oldText, newText, label) {
  if (!source.includes(oldText)) throw new Error(`No se encontró bloque esperado: ${label}`);
  return source.replace(oldText, newText);
}

let app = fs.readFileSync('app.js', 'utf8');
let router = fs.readFileSync('app-router.js', 'utf8');

app = replaceExact(app, 'const priorityCasesStorageKey = "crsPriorityCases";\n', '', 'priorityCasesStorageKey');
app = replaceExact(app, 'const managementContent = document.querySelector("#managementContent");\n', '', 'managementContent');

const legacyStart = app.indexOf('function priorityCases() {');
const legacyEnd = app.indexOf('function appendPriorityManagement(parent, protocol) {');
if (legacyStart < 0 || legacyEnd < 0 || legacyEnd <= legacyStart) {
  throw new Error('No se pudo delimitar el bloque local heredado de pacientes.');
}
app = `${app.slice(0, legacyStart)}${app.slice(legacyEnd)}`;

app = replaceExact(
  app,
  'text.textContent = "Si requiere priorizacion, registra los datos minimos del paciente. La app guardara el caso en este dispositivo y tambien puede abrir un correo prellenado.";',
  'text.textContent = "Si requiere priorización, registra los datos mínimos del paciente. El caso se enviará a la planilla segura de Gestión y no quedará almacenado en este dispositivo.";',
  'texto de gestión prioritaria'
);

const managementStart = app.indexOf('function renderManagement() {');
if (managementStart < 0) throw new Error('No se encontró renderManagement().');
app = `${app.slice(0, managementStart).trimEnd()}\n`;

router = replaceExact(router, '    if (pageName === "gestion") renderManagement();\n', '', 'renderManagement en router');
router = replaceExact(router, `    const exportCases = event.target.closest("[data-export-cases]");\n    if (exportCases) {\n      if (exportCases.dataset.exportCases === "csv") exportPriorityCasesCsv();\n      if (exportCases.dataset.exportCases === "word") exportPriorityCasesWord();\n    }\n  \n`, '', 'exportación local heredada');
router = replaceExact(router, `    const caseDone = event.target.closest("[data-case-done]");\n    if (caseDone) {\n      const cases = priorityCases().map((item) => (\n        item.id === caseDone.dataset.caseDone ? { ...item, status: caseDone.checked ? "Gestionado" : "Pendiente" } : item\n      ));\n      savePriorityCases(cases);\n      if (activeRouteName() === "gestion") renderManagement();\n      return;\n    }\n  \n`, '', 'marcado local de casos');
router = replaceExact(router, `    const priorityForm = event.target.closest("[data-priority-form]");\n    if (priorityForm) {\n      event.preventDefault();\n      const protocol = findProtocolBySlug(priorityForm.dataset.priorityForm);\n      if (!protocol) return;\n      const data = new FormData(priorityForm);\n      savePriorityCase(protocol, {\n        patientName: data.get("patientName").trim(),\n        rut: data.get("rut").trim(),\n        phone: data.get("phone").trim(),\n        summary: data.get("summary").trim(),\n        need: data.get("need").trim()\n      });\n      const status = priorityForm.closest(".priority-panel")?.querySelector(".priority-status");\n      if (status) status.textContent = "Caso guardado en Gestion prioritaria.";\n      priorityForm.reset();\n      priorityForm.hidden = true;\n      return;\n    }\n  \n`, '', 'submit local heredado');

fs.writeFileSync('app.js', app, 'utf8');
fs.writeFileSync('app-router.js', router, 'utf8');
console.log('Gestión local heredada retirada de app.js y app-router.js.');
