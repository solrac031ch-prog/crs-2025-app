import fs from 'node:fs';

const source = fs.readFileSync('sw.js', 'utf8');
const errors = [];

if (!/const CACHE_PREFIX\s*=\s*["']crs-hph-/.test(source)) {
  errors.push('sw.js debe definir un prefijo de caché exclusivo de CRS.');
}

if (!/filter\s*\(\s*\(key\)\s*=>[\s\S]*key\.startsWith\(CACHE_PREFIX\)/.test(source)) {
  errors.push('sw.js debe filtrar por CACHE_PREFIX antes de eliminar cachés.');
}

if (/keys\.map\s*\(\s*\(key\)\s*=>\s*caches\.delete\(key\)/.test(source)) {
  errors.push('sw.js no puede borrar indiscriminadamente todos los cachés del origen.');
}

if (!/self\.registration\.unregister\(\)/.test(source)) {
  errors.push('El service worker de limpieza debe seguir desregistrándose después de limpiar CRS.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Alcance de caché CRS OK.');
