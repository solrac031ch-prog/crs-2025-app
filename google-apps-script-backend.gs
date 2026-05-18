/**
 * CRS HPH 2025 - Backend Google Apps Script
 */

const CRS_CONFIG = {
  adminEmail: 'mdcarlosherrera@gmail.com',
  spreadsheetId: '',
  sheets: {
    usuarios: 'Usuarios',
    auditoria: 'Auditoria',
    casos: 'Casos_prioritarios',
    pacientes: 'Gestion_pacientes',
    planillas: 'Planillas',
    directorio: 'Directorio',
    formularios: 'Formularios',
    contenidos: 'Contenidos',
    comentarios: 'Comentarios'
  }
};

const PATIENT_CASE_HEADERS = [
  'id', 'fecha_registro', 'registrado_por', 'paciente', 'run', 'edad', 'telefono', 'flujo', 'motivo',
  'resumen_clinico', 'gestion_solicitada', 'prioridad', 'origen', 'estado', 'resuelto', 'proximo_paso',
  'responsable', 'fecha_compromiso', 'fecha_resolucion', 'observaciones', 'actualizado'
];

function ss_() {
  return CRS_CONFIG.spreadsheetId ? SpreadsheetApp.openById(CRS_CONFIG.spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
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
  sheet_(CRS_CONFIG.sheets.pacientes, PATIENT_CASE_HEADERS);
  sheet_(CRS_CONFIG.sheets.planillas, ['clave', 'url', 'descripcion', 'actualizado_por', 'actualizado']);
  sheet_(CRS_CONFIG.sheets.directorio, ['nombre', 'detalle', 'telefono', 'categoria', 'actualizado']);
  sheet_(CRS_CONFIG.sheets.formularios, ['clave', 'url', 'descripcion', 'actualizado_por', 'actualizado']);
  sheet_(CRS_CONFIG.sheets.contenidos, ['tipo', 'titulo', 'descripcion', 'url', 'publicado_por', 'fecha']);
  sheet_(CRS_CONFIG.sheets.comentarios, ['id', 'itemType', 'itemId', 'nombre', 'email', 'comentario', 'fecha', 'activo']);

  const usuarios = sheet_(CRS_CONFIG.sheets.usuarios);
  const values = usuarios.getDataRange().getValues();
  const exists = values.some(row => String(row[0]).toLowerCase() === CRS_CONFIG.adminEmail.toLowerCase());
  if (!exists) usuarios.appendRow([CRS_CONFIG.adminEmail, 'Dr Carlos Herrera', 'admin', 'SI', 'SI', new Date(), new Date()]);
  audit_(CRS_CONFIG.adminEmail, 'setup', 'Inicialización backend CRS HPH');
}

function doGet(e) {
  return json_({ ok: true, app: 'CRS HPH 2025 Backend', status: 'online', spreadsheetUrl: ss_().getUrl() });
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
    if (action === 'savePatientCase') return json_(savePatientCase_(payload.case, payload.email));
    if (action === 'listPatientCases') return json_(listPatientCases_(payload.email));
    if (action === 'updatePatientCase') return json_(updatePatientCase_(payload.id, payload.patch, payload.email));
    if (action === 'addComment') return json_(addComment_(payload.comment, payload.email));
    if (action === 'listComments') return json_(listComments_(payload.itemType, payload.itemId));
    if (action === 'deleteComment') return json_(requireAdmin_(payload.email, () => deleteComment_(payload.commentId, payload.email)));
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
  if (!user) { audit_(email, 'login_denied', 'Usuario no registrado'); return { ok: false, error: 'Usuario no registrado', email }; }
  if (String(user.activo).toUpperCase() !== 'SI') { audit_(email, 'login_denied', 'Usuario inactivo'); return { ok: false, error: 'Usuario inactivo', email }; }
  audit_(email, 'login_ok', 'Ingreso autorizado');
  return { ok: true, email, name: user.nombre || profile.name || email, picture: profile.picture || '', role: user.rol || 'equipo', canEdit: String(user.puede_editar).toUpperCase() === 'SI' };
}

function listUsers_() {
  return { ok: true, users: rowsAsObjects_(sheet_(CRS_CONFIG.sheets.usuarios)) };
}

function createUser_(user, actorEmail) {
  if (!user || !user.email) return { ok: false, error: 'Usuario inválido' };
  const email = normalizeEmail_(user.email);
  const existing = findUser_(email);
  if (existing) return updateUser_(user, actorEmail);
  sheet_(CRS_CONFIG.sheets.usuarios).appendRow([email, user.nombre || user.name || email, user.rol || user.role || 'equipo', user.activo || 'SI', user.puede_editar || user.canEdit || 'NO', new Date(), new Date()]);
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

function savePatientCase_(item, actorEmail) {
  if (!item) return { ok: false, error: 'Caso vacío' };
  const sheet = sheet_(CRS_CONFIG.sheets.pacientes, PATIENT_CASE_HEADERS);
  const row = normalizePatientCase_(item, actorEmail);
  sheet.appendRow(PATIENT_CASE_HEADERS.map(header => row[header] || ''));
  audit_(actorEmail, 'save_patient_case', row.id + ' ' + row.paciente);
  return { ok: true, id: row.id, spreadsheetUrl: ss_().getUrl() };
}

function listPatientCases_(actorEmail) {
  const sheet = sheet_(CRS_CONFIG.sheets.pacientes, PATIENT_CASE_HEADERS);
  return { ok: true, cases: rowsAsObjects_(sheet), spreadsheetUrl: ss_().getUrl() };
}

function updatePatientCase_(id, patch, actorEmail) {
  if (!id) return { ok: false, error: 'ID vacío' };
  const sheet = sheet_(CRS_CONFIG.sheets.pacientes, PATIENT_CASE_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      Object.keys(patch || {}).forEach(key => setCellByHeader_(sheet, headers, i + 1, key, patch[key]));
      setCellByHeader_(sheet, headers, i + 1, 'actualizado', new Date());
      audit_(actorEmail, 'update_patient_case', id);
      return { ok: true, id, spreadsheetUrl: ss_().getUrl() };
    }
  }
  return { ok: false, error: 'Caso no encontrado' };
}

function normalizePatientCase_(item, actorEmail) {
  const now = new Date();
  const row = {};
  PATIENT_CASE_HEADERS.forEach(header => row[header] = item[header] || '');
  row.id = row.id || Utilities.getUuid();
  row.fecha_registro = row.fecha_registro || now;
  row.registrado_por = row.registrado_por || actorEmail || '';
  row.origen = row.origen || 'Urgencia Adulto HPH';
  row.estado = row.estado || 'Pendiente';
  row.resuelto = row.resuelto || 'Pendiente';
  row.actualizado = now;
  return row;
}

function addComment_(comment, actorEmail) {
  if (!comment || !comment.itemType || !comment.itemId || !comment.text) return { ok: false, error: 'Comentario inválido' };
  const id = comment.id || Utilities.getUuid();
  sheet_(CRS_CONFIG.sheets.comentarios, ['id', 'itemType', 'itemId', 'nombre', 'email', 'comentario', 'fecha', 'activo']).appendRow([
    id, comment.itemType, comment.itemId, comment.name || actorEmail || 'Equipo Urgencia', normalizeEmail_(comment.email || actorEmail), comment.text, comment.createdAt ? new Date(comment.createdAt) : new Date(), 'SI'
  ]);
  audit_(actorEmail, 'add_comment', comment.itemType + ':' + comment.itemId);
  return { ok: true, id };
}

function listComments_(itemType, itemId) {
  const rows = rowsAsObjects_(sheet_(CRS_CONFIG.sheets.comentarios, ['id', 'itemType', 'itemId', 'nombre', 'email', 'comentario', 'fecha', 'activo']));
  const comments = rows.filter(row => String(row.activo).toUpperCase() === 'SI').filter(row => String(row.itemType) === String(itemType) && String(row.itemId) === String(itemId)).map(row => ({ id: row.id, itemType: row.itemType, itemId: row.itemId, name: row.nombre, email: row.email, text: row.comentario, createdAt: row.fecha }));
  return { ok: true, comments };
}

function deleteComment_(commentId, actorEmail) {
  const sheet = sheet_(CRS_CONFIG.sheets.comentarios, ['id', 'itemType', 'itemId', 'nombre', 'email', 'comentario', 'fecha', 'activo']);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(commentId)) {
      setCellByHeader_(sheet, headers, i + 1, 'activo', 'NO');
      audit_(actorEmail, 'delete_comment', commentId);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Comentario no encontrado' };
}

function findUser_(email) {
  email = normalizeEmail_(email);
  return rowsAsObjects_(sheet_(CRS_CONFIG.sheets.usuarios)).find(row => normalizeEmail_(row.email) === email);
}

function requireAdmin_(email, fn) {
  const user = findUser_(email);
  if (!user || String(user.activo).toUpperCase() !== 'SI') return { ok: false, error: 'No autorizado' };
  const role = String(user.rol || '').toLowerCase();
  if (!['admin', 'jefatura', 'owner', 'desarrollador'].includes(role)) return { ok: false, error: 'Requiere rol jefatura/admin' };
  return fn();
}

function audit_(usuario, accion, detalle) {
  sheet_(CRS_CONFIG.sheets.auditoria).appendRow([new Date(), normalizeEmail_(usuario), accion || '', detalle || '']);
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

function normalizeEmail_(email) { return String(email || '').trim().toLowerCase(); }
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
