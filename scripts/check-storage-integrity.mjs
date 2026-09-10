import fs from 'node:fs';

const source = fs.readFileSync('supabase-backend.js', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260910170000_private_published_storage.sql', 'utf8');
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

if (!/createSignedUrl\(path, SIGNED_URL_TTL_SECONDS\)/.test(source)) {
  errors.push('Los archivos Storage deben resolverse mediante URLs firmadas temporales.');
}

if (/getPublicUrl\s*\(/.test(source)) {
  errors.push('El frontend no debe reconstruir URLs públicas permanentes de Storage.');
}

if (!/if \(item\?\.file_path\) return fileAccessUrl\(item\.file_path\)/.test(source)) {
  errors.push('file_path debe ser la fuente canónica para objetos Storage históricos.');
}

if (/url:\s*explicitUrl\s*\|\|\s*safeUrl\(uploaded\.url\)/.test(source)) {
  errors.push('Las nuevas publicaciones no deben persistir una URL pública derivada del archivo subido.');
}

if (!/set public = false/i.test(migration)) {
  errors.push('La migración de cutover debe convertir crs-public en bucket privado.');
}

if (!/drop policy if exists crs_storage_public_read/i.test(migration)) {
  errors.push('La migración debe retirar la lectura global anterior de Storage.');
}

if (!/create policy crs_storage_published_read/i.test(migration)) {
  errors.push('La migración debe instalar una política SELECT ligada a publicaciones.');
}

for (const table of ['crs_content_items', 'crs_documents', 'crs_flows']) {
  const pattern = new RegExp(`from public\\.${table}[\\s\\S]*?status = 'published'`, 'i');
  if (!pattern.test(migration)) {
    errors.push(`La política de Storage debe exigir status=published para ${table}.`);
  }
}

if (!/c\.file_path = storage\.objects\.name/.test(migration)
  || !/d\.file_path = storage\.objects\.name/.test(migration)
  || !/f\.file_path = storage\.objects\.name/.test(migration)) {
  errors.push('La política debe vincular exactamente file_path con storage.objects.name.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Integridad de publicaciones y Storage OK.');