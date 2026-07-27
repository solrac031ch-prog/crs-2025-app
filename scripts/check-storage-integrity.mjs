import fs from 'node:fs';

const source = fs.readFileSync('supabase-backend.js', 'utf8');
const errors = [];

if (!/async function rollbackUploadedFile\s*\(/.test(source) || !/storage\.from\(bucket\)\.remove/.test(source)) {
  errors.push('El backend debe poder eliminar archivos recién subidos cuando falla la escritura en base de datos.');
}

const rollbackCalls = (source.match(/rollbackUploadedFile\(uploaded\)/g) || []).length;
if (rollbackCalls < 3) {
  errors.push('Publicaciones, documentos y flujos deben hacer rollback del archivo si falla su escritura.');
}

if (!/async function existingDocument\s*\(/.test(source)) {
  errors.push('Los documentos reemplazables deben leer la versión previa antes del upsert.');
}

if (!/uploaded\.file_path\s*\|\|\s*previous\?\.file_path/.test(source)) {
  errors.push('Un upsert sin archivo nuevo debe conservar file_path del documento previo.');
}

if (!/uploaded\.file_name\s*\|\|\s*previous\?\.file_name/.test(source)) {
  errors.push('Un upsert sin archivo nuevo debe conservar metadatos del documento previo.');
}

if (!/removeStoredFile\(previous\.file_path\)/.test(source)) {
  errors.push('Al reemplazar un archivo debe limpiarse la versión anterior después de un upsert exitoso.');
}

if (!/const tableByType\s*=\s*\{/.test(source) || !/if \(!table\) throw new Error/.test(source)) {
  errors.push('archiveItem debe rechazar tipos desconocidos en vez de usar una tabla por defecto.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Integridad de publicaciones y Storage OK.');
