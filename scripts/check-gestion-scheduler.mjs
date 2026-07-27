import fs from "node:fs";

const source = fs.readFileSync("gestion-panel-final.js", "utf8");

const failures = [];
const warnings = [];

const timeoutRenderCalls = [...source.matchAll(/setTimeout\(\(\) => render\(\)\.catch\(console\.error\),\s*\d+\)/g)];
if (timeoutRenderCalls.length > 1) {
  failures.push(`gestion-panel-final.js programa ${timeoutRenderCalls.length} renders por schedule(); debe existir uno solo.`);
}

if (!/let\s+renderTimer\s*=\s*null/.test(source)) {
  warnings.push("El scheduler no declara un timer cancelable; revisar si vuelve a crecer el numero de eventos.");
}

if (!/clearTimeout\(renderTimer\)/.test(source)) {
  warnings.push("El scheduler no cancela una ejecucion pendiente antes de programar la siguiente.");
}

for (const warning of warnings) console.warn(`AVISO: ${warning}`);

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log("Scheduler de Gestion sin renders duplicados.");
