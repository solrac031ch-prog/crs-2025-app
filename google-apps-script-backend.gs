/**
 * CRS HPH 2025 - Backend Google Apps Script
 *
 * Uso:
 * 1. Crear una planilla Google Sheets llamada "CRS HPH 2025 - Backend".
 * 2. Extensiones > Apps Script.
 * 3. Pegar este archivo.
 * 4. Ejecutar setup() una vez.
 * 5. Implementar > Nueva implementación > Aplicación web.
 *    - Ejecutar como: tú
 *    - Quién tiene acceso: cualquier usuario con el enlace, o dentro de la organización si corresponde.
 * 6. Copiar la URL de la app web en google-auth-config.js como appsScriptUrl.
 */

const CRS_CONFIG = {
  adminEmail: 'mdcarlosherrera@gmail.com',
  spreadsheetId: '', // Opcional. Si queda vacío usa la planilla activa.
  sheets: {
    usuarios: 'Usuarios',
    auditoria: 'Auditoria',
    casos: 'Casos_prioritarios',
    planillas: 'Planillas',
    directorio: 'Directorio',
    formularios: 'Formularios',
    contenidos: 'Contenidos'
  }
};

function ss_() {
  return CRS_CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CRS_CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name, headers) {
  const ss = ss_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (headers && sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
}

function setup() {
  sheet_(CRS_CONFIG.sheets.usuarios, ['email', 'nombre', 'rol', 'activo', 'puede_editar', 'creado', 'actualizado']);
  sheet_(CRS_CONFIG.sheets.auditoria, ['fecha', 'usuario', 'accion', 'detalle']);
  sheet_(CRS_CONFIG.sheets.casos, ['fecha', 'usuario', 'paciente', 'run', 'telefono', 'flujo', 'resumen', 'necesidad', 'estado']);
  sheet_(CRS_CONFIG.sheets.planillas, ['clave', 'url', 'descripcion', 'actualizado_por', 'actualizado']);
  sheet_(CRS_CONFIG.sheets.directorio, ['nombre', 'detalle', 'telefono', 'categoria', 'actualizado']);
  sheet_(CRS_CONFIG.sheets.formularios, ['clave', 'url', 'descripcion', 'actualizado_por', 'actualizado']);
  sheet_(CRS_CONFIG.sheets.contenidos, ['tipo', 'titulo', 'descripcion', 'url', 'publicado_por', 'fecha']);

  const usuarios = sheet_(CRS_CONFIG.sheets.usuarios);
  const values = usuarios.getDataRange().getValues();
  const exists = values.some(row => String(row[0]).toLowerCase() === CRS_CONFIG.adminEmail.toLowerCase());
  if (!exists) {
    usuarios.appendRow([CRS_CONFIG.adminEmail, 'Dr Carlos Herrera', 'admin', 'SI', 'SI', new Date(), new Date()]);
  }
  audit_(CRS_CONFIG.adminEmail, 'setup', 'Inicialización backend CRS HPH');
}

function doGet(e) {
  return json_({ ok: true, app: 'CRS HPH 2025 Backend', status: 'online' });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    const action = String(payload.action || '').trim();
    if (action === 'login') return json_(loginUser_(payload.email, payload.profile || {}));
    if (action === 'listUsers') return json_(requireAdmin_(payload.email, () => listUsers_()));
    if (action === 'createUser') return json_(requireAdmin_(payload.email, () => createUser_(payload.user, payload.email)));
    if (action === 'updateUser') return json_(requireAdmin_(payload.email, () => updateUser_(payload.user, payload.email)));
    if (action === 'disableUser') return json_(requireAdmin_(payload.email, () => disableUser_(payload.targetEmail, payload.email)));
    if (action === 'audit') return json_(audit_(payload.email, payload.event, payload.detail));
    return json_({ ok: false, error: 'Acción no reconocida' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function loginUser_(email, profile) {
  email = normalizeEmail_(email);
  if (!email) return { ok: false, error: 'Email vacío' };

  const user = findUser_(email);
  if (!user) {
    audit_(email, 'login_denied', 'Usuario no registrado');
    return { ok: false, error: 'Usuario no registrado', email };
  }
  if (String(user.activo).toUpperCase() !== 'SI') {
    audit_(email, 'login_denied', 'Usuario inactivo');
    return { ok: false, error: 'Usuario inactivo', email };
  }

  audit_(email, 'login_ok', 'Ingreso autorizado');
  return {
    ok: true,
    email,
    name: user.nombre || profile.name || email,
    picture: profile.picture || '',
    role: user.rol || 'equipo',
    canEdit: String(user.puede_editar).toUpperCase() === 'SI'
  };
}

function listUsers_() {
  const sheet = sheet_(CRS_CONFIG.sheets.usuarios);
  const rows = rowsAsObjects_(sheet);
  return { ok: true, users: rows };
}

function createUser_(user, actorEmail) {
  if (!user || !user.email) return { ok: false, error: 'Usuario inválido' };
  const email = normalizeEmail_(user.email);
  const existing = findUser_(email);
  if (existing) return updateUser_(user, actorEmail);
  const sheet = sheet_(CRS_CONFIG.sheets.usuarios);
  sheet.appendRow([
    email,
    user.nombre || user.name || email,
    user.rol || user.role || 'equipo',
    user.activo || 'SI',
    user.puede_editar || user.canEdit || 'NO',
    new Date(),
    new Date()
  ]);
  audit_(actorEmail, 'create_user', email);
  return { ok: true, email };
}

function updateUser_(user, actorEmail) {
  const email = normalizeEmail_(user.email);
  const sheet = sheet_(CRS_CONFIG.sheets.usuarios);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    if (normalizeEmail_(values[i][0]) === email) {
      setCellByHeader_(sheet, headers, i + 1, 'nombre', user.nombre || user.name || values[i][1]);
      setCellByHeader_(sheet, headers, i + 1, 'rol', user.rol || user.role || values[i][2]);
      setCellByHeader_(sheet, headers, i + 1, 'activo', user.activo || values[i][3]);
      setCellByHeader_(sheet, headers, i + 1, 'puede_editar', user.puede_editar || user.canEdit || values[i][4]);
      setCellByHeader_(sheet, headers, i + 1, 'actualizado', new Date());
      audit_(actorEmail, 'update_user', email);
      return { ok: true, email };
    }
  }
  return { ok: false, error: 'Usuario no encontrado' };
}

function disableUser_(targetEmail, actorEmail) {
  return updateUser_({ email: targetEmail, activo: 'NO' }, actorEmail);
}

function findUser_(email) {
  email = normalizeEmail_(email);
  const rows = rowsAsObjects_(sheet_(CRS_CONFIG.sheets.usuarios));
  return rows.find(row => normalizeEmail_(row.email) === email);
}

function requireAdmin_(email, fn) {
  const user = findUser_(email);
  if (!user || String(user.activo).toUpperCase() !== 'SI') return { ok: false, error: 'No autorizado' };
  const role = String(user.rol || '').toLowerCase();
  if (!['admin', 'jefatura', 'owner', 'desarrollador'].includes(role)) return { ok: false, error: 'Requiere rol jefatura/admin' };
  return fn();
}

function audit_(usuario, accion, detalle) {
  const sheet = sheet_(CRS_CONFIG.sheets.auditoria);
  sheet.appendRow([new Date(), normalizeEmail_(usuario), accion || '', detalle || '']);
  return { ok: true };
}

function rowsAsObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

function setCellByHeader_(sheet, headers, row, header, value) {
  const index = headers.findIndex(h => String(h).trim().toLowerCase() === String(header).trim().toLowerCase());
  if (index >= 0) sheet.getRange(row, index + 1).setValue(value);
}

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
