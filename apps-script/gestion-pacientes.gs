// MASTER Urgencias HPH - Backend de gestión ambulatoria prioritaria
//
// Propiedades del script requeridas:
// - CRS_PATIENT_CASES_SPREADSHEET_ID: se crea automáticamente si no existe.
// - CRS_PUBLIC_SERVICE_CODE: código interno rotatorio del servicio.

const CRS_SUPABASE_URL = 'https://mjrcymctfnnyabvmfgda.supabase.co';
const CRS_PATIENT_SHEET_NAME = 'Gestion_pacientes';
const CRS_HISTORY_SHEET_NAME = 'Gestion_historial';
const CRS_PATIENT_SPREADSHEET_PROPERTY = 'CRS_PATIENT_CASES_SPREADSHEET_ID';
const CRS_PUBLIC_CODE_PROPERTY = 'CRS_PUBLIC_SERVICE_CODE';
const CRS_ALLOWED_ROLES = new Set(['admin', 'owner', 'desarrollador', 'creador', 'jefatura', 'jefe', 'jefe_turno']);

const CRS_PATIENT_HEADERS = [
  'numero_solicitud', 'id', 'fecha_registro', 'registrado_por', 'medico_solicitante',
  'paciente', 'run', 'edad', 'telefono', 'ubicacion', 'flujo', 'motivo',
  'resumen_clinico', 'gestion_solicitada', 'prioridad', 'origen', 'estado',
  'resuelto', 'proximo_paso', 'responsable', 'fecha_compromiso',
  'fecha_resolucion', 'observaciones', 'actualizado'
];

function doGet() {
  return json_({ ok: true, service: 'MASTER Urgencias HPH', version: 4 });
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || '').trim();

    // El formulario público no depende de una sesión de Jefatura.
    // La segunda condición mantiene compatibilidad si el navegador o un
    // formulario anterior omiten/modifican el nombre de la acción.
    const isPublicSubmission =
      action === 'savePublicPatientCase' ||
      (
        !body.accessToken &&
        body.case &&
        typeof body.case === 'object' &&
        String(body.serviceCode || '').trim()
      );

    if (isPublicSubmission) {
      return json_(
        savePublicPatientCase_(
          body.case || {},
          body.serviceCode || ''
        )
      );
    }

    if (action === 'login') {
      return json_({
        ok: false,
        error: 'El ingreso Google legacy está desactivado. Usa Jefatura con Supabase.'
      });
    }

    const auth = authorizeSupabase_(body);

    if (action === 'listPatientCases') {
      return json_(listPatientCases_(auth));
    }

    if (action === 'savePatientCase') {
      return json_(savePatientCase_(body.case || {}, auth));
    }

    if (action === 'updatePatientCase') {
      return json_(
        updatePatientCase_(
          String(body.id || ''),
          body.patch || {},
          auth
        )
      );
    }

    return json_({
      ok: false,
      error: 'Acción no reconocida',
      action: action
    });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({
      ok: false,
      error: friendlyError_(error)
    });
  }
}

function parseBody_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  try {
    const body = JSON.parse(raw);
    return body && typeof body === 'object' ? body : {};
  } catch (_) {
    throw new Error('Solicitud JSON inválida.');
  }
}

function savePublicPatientCase_(input, serviceCode) {
  validateServiceCode_(serviceCode);
  const target = getOrCreatePatientSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const now = new Date().toISOString();
    const item = sanitizeCase_(input, { email: '', name: '' }, now);
    validatePublicCase_(item);

    item.numero_solicitud = nextCaseNumber_(target.sheet);
    item.id = item.id || 'caso-' + Date.now() + '-' + Utilities.getUuid().slice(0, 8);
    item.fecha_registro = now;
    item.registrado_por = item.medico_solicitante;
    item.estado = 'Pendiente';
    item.resuelto = 'Pendiente';
    item.proximo_paso = 'Pendiente de revisión por jefatura';
    item.responsable = 'Jefatura';
    item.actualizado = now;

    appendCase_(target.sheet, item);
    appendHistory_(target.spreadsheet, item.id, 'Solicitud creada', item.medico_solicitante, 'Registro público desde Urgencia');

    return {
      ok: true,
      case: item,
      numero_solicitud: item.numero_solicitud,
      message: 'Solicitud ' + item.numero_solicitud + ' registrada correctamente.'
    };
  } finally {
    lock.releaseLock();
  }
}

function validateServiceCode_(received) {
  const expected = String(PropertiesService.getScriptProperties().getProperty(CRS_PUBLIC_CODE_PROPERTY) || '').trim();
  if (!expected) throw new Error('El código interno no está configurado en Apps Script.');
  if (String(received || '').trim() !== expected) throw new Error('Código interno incorrecto.');
}

function validatePublicCase_(item) {
  const required = [
    ['paciente', 'nombre del paciente'],
    ['run', 'RUN'],
    ['flujo', 'especialidad o prestación requerida'],
    ['resumen_clinico', 'resumen clínico'],
    ['gestion_solicitada', 'gestión solicitada'],
    ['medico_solicitante', 'médico solicitante']
  ];
  required.forEach(function(entry) {
    if (!String(item[entry[0]] || '').trim()) throw new Error('Falta ' + entry[1] + '.');
  });
  if (!new Set(['Baja', 'Media', 'Alta', 'Crítica']).has(item.prioridad)) {
    throw new Error('Prioridad inválida.');
  }
}

function authorizeSupabase_(body) {
  const token = String(body.accessToken || '').trim();
  const anonKey = String(body.supabaseAnonKey || '').trim();
  if (!token || !anonKey) throw new Error('Sesión de Jefatura no disponible. Vuelve a iniciar sesión.');

  const userResponse = UrlFetchApp.fetch(CRS_SUPABASE_URL + '/auth/v1/user', {
    method: 'get', muteHttpExceptions: true,
    headers: { apikey: anonKey, Authorization: 'Bearer ' + token }
  });
  if (userResponse.getResponseCode() !== 200) throw new Error('La sesión de Jefatura venció o no es válida.');

  const user = JSON.parse(userResponse.getContentText() || '{}');
  const email = String(user.email || '').trim().toLowerCase();
  if (!email) throw new Error('La sesión Supabase no contiene correo.');

  const profileUrl = CRS_SUPABASE_URL + '/rest/v1/crs_admins?select=email,display_name,role,active&email=eq.' + encodeURIComponent(email) + '&limit=1';
  const profileResponse = UrlFetchApp.fetch(profileUrl, {
    method: 'get', muteHttpExceptions: true,
    headers: { apikey: anonKey, Authorization: 'Bearer ' + token, Accept: 'application/json' }
  });
  if (profileResponse.getResponseCode() !== 200) throw new Error('No se pudo comprobar el permiso de Jefatura.');

  const rows = JSON.parse(profileResponse.getContentText() || '[]');
  const profile = Array.isArray(rows) && rows.length ? rows[0] : null;
  const role = normalize_(profile && profile.role);
  if (!profile || profile.active === false || (!CRS_ALLOWED_ROLES.has(role) && email !== 'mdcarlosherrera@gmail.com')) {
    throw new Error('Usuario sin permiso activo de Jefatura.');
  }
  return { email: email, name: String(profile.display_name || email), role: role };
}

function getOrCreatePatientSheet_() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheet = null;
  const storedId = props.getProperty(CRS_PATIENT_SPREADSHEET_PROPERTY);

  if (storedId) {
    try { spreadsheet = SpreadsheetApp.openById(storedId); }
    catch (_) { props.deleteProperty(CRS_PATIENT_SPREADSHEET_PROPERTY); }
  }
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('MASTER Urgencias HPH - Gestión ambulatoria');
    props.setProperty(CRS_PATIENT_SPREADSHEET_PROPERTY, spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(CRS_PATIENT_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(CRS_PATIENT_SHEET_NAME);
  ensureHeaders_(sheet);
  return { spreadsheet: spreadsheet, sheet: sheet };
}

function ensureHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  const current = lastColumn > 0 ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0] : [];
  const oldHeaders = current.filter(String);
  const valid = CRS_PATIENT_HEADERS.every(function(header, index) { return current[index] === header; });
  if (valid) return;

  if (oldHeaders.length && sheet.getLastRow() > 1) migrateHeaders_(sheet, oldHeaders);
  else {
    sheet.getRange(1, 1, 1, CRS_PATIENT_HEADERS.length).setValues([CRS_PATIENT_HEADERS]);
    sheet.getRange(1, 1, 1, CRS_PATIENT_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function migrateHeaders_(sheet, oldHeaders) {
  const rowCount = sheet.getLastRow() - 1;
  const oldValues = rowCount > 0 ? sheet.getRange(2, 1, rowCount, oldHeaders.length).getDisplayValues() : [];
  const migrated = oldValues.map(function(row) {
    const old = {};
    oldHeaders.forEach(function(header, index) { old[header] = row[index]; });
    return CRS_PATIENT_HEADERS.map(function(header) {
      if (header === 'medico_solicitante') return old.medico_solicitante || old.registrado_por || '';
      if (header === 'ubicacion') return old.ubicacion || '';
      return old[header] || '';
    });
  });

  sheet.clearContents();
  sheet.getRange(1, 1, 1, CRS_PATIENT_HEADERS.length).setValues([CRS_PATIENT_HEADERS]);
  if (migrated.length) sheet.getRange(2, 1, migrated.length, CRS_PATIENT_HEADERS.length).setValues(migrated);
  sheet.getRange(1, 1, 1, CRS_PATIENT_HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function listPatientCases_(auth) {
  const target = getOrCreatePatientSheet_();
  const lastRow = target.sheet.getLastRow();
  const cases = lastRow <= 1 ? [] : target.sheet.getRange(2, 1, lastRow - 1, CRS_PATIENT_HEADERS.length).getDisplayValues().map(rowToCase_);
  return { ok: true, cases: cases, spreadsheetUrl: target.spreadsheet.getUrl(), viewer: { email: auth.email, role: auth.role } };
}

function savePatientCase_(input, auth) {
  const target = getOrCreatePatientSheet_();
  const now = new Date().toISOString();
  const item = sanitizeCase_(input, auth, now);
  validatePublicCase_(item);
  item.numero_solicitud = item.numero_solicitud || nextCaseNumber_(target.sheet);
  item.id = item.id || 'caso-' + Date.now() + '-' + Utilities.getUuid().slice(0, 8);
  item.fecha_registro = item.fecha_registro || now;
  item.registrado_por = item.registrado_por || auth.email;
  item.actualizado = now;
  appendCase_(target.sheet, item);
  appendHistory_(target.spreadsheet, item.id, 'Solicitud creada por Jefatura', auth.email, 'Registro protegido');
  return { ok: true, case: item, spreadsheetUrl: target.spreadsheet.getUrl() };
}

function updatePatientCase_(id, patch, auth) {
  if (!id) throw new Error('Falta el identificador del caso.');
  const target = getOrCreatePatientSheet_();
  const sheet = target.sheet;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error('Caso no encontrado.');

  const idColumn = CRS_PATIENT_HEADERS.indexOf('id') + 1;
  const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getDisplayValues();
  let rowNumber = -1;
  for (let index = 0; index < ids.length; index += 1) {
    if (String(ids[index][0]) === id) { rowNumber = index + 2; break; }
  }
  if (rowNumber < 0) throw new Error('Caso no encontrado.');

  const current = rowToCase_(sheet.getRange(rowNumber, 1, 1, CRS_PATIENT_HEADERS.length).getDisplayValues()[0]);
  const allowedPatch = {};
  ['estado', 'resuelto', 'proximo_paso', 'responsable', 'fecha_compromiso', 'fecha_resolucion', 'observaciones', 'prioridad'].forEach(function(key) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) allowedPatch[key] = patch[key];
  });

  const merged = sanitizeCase_(Object.assign({}, current, allowedPatch), auth, new Date().toISOString());
  merged.id = current.id;
  merged.numero_solicitud = current.numero_solicitud;
  merged.fecha_registro = current.fecha_registro;
  merged.registrado_por = current.registrado_por;
  merged.actualizado = new Date().toISOString();
  if ((merged.estado === 'Gestionada' || merged.estado === 'Cerrada') && !merged.fecha_resolucion) merged.fecha_resolucion = merged.actualizado.slice(0, 10);

  const values = CRS_PATIENT_HEADERS.map(function(header) { return sheetValue_(merged[header]); });
  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
  appendHistory_(target.spreadsheet, id, 'Seguimiento actualizado', auth.email, JSON.stringify(allowedPatch).slice(0, 4000));
  return { ok: true, case: merged, spreadsheetUrl: target.spreadsheet.getUrl() };
}

function nextCaseNumber_(sheet) {
  const year = new Date().getFullYear();
  const prefix = 'GA-' + year + '-';
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return prefix + '000001';
  const column = CRS_PATIENT_HEADERS.indexOf('numero_solicitud') + 1;
  const values = sheet.getRange(2, column, lastRow - 1, 1).getDisplayValues();
  let max = 0;
  values.forEach(function(row) {
    const match = String(row[0] || '').match(new RegExp('^GA-' + year + '-(\d+)$'));
    if (match) max = Math.max(max, Number(match[1]));
  });
  return prefix + String(max + 1).padStart(6, '0');
}

function appendCase_(sheet, item) {
  const values = CRS_PATIENT_HEADERS.map(function(header) { return sheetValue_(item[header]); });
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function appendHistory_(spreadsheet, caseId, action, actor, detail) {
  let sheet = spreadsheet.getSheetByName(CRS_HISTORY_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(CRS_HISTORY_SHEET_NAME);
  const headers = ['fecha', 'case_id', 'accion', 'actor', 'detalle'];
  const current = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0] : [];
  if (!headers.every(function(header, index) { return current[index] === header; })) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([new Date().toISOString(), caseId, action, actor, detail]);
}

function rowToCase_(row) {
  const result = {};
  CRS_PATIENT_HEADERS.forEach(function(header, index) { result[header] = String(row[index] == null ? '' : row[index]); });
  return result;
}

function sanitizeCase_(raw, auth, now) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const item = {};
  CRS_PATIENT_HEADERS.forEach(function(header) {
    const longField = header === 'resumen_clinico' || header === 'observaciones' || header === 'gestion_solicitada' || header === 'proximo_paso';
    item[header] = cleanText_(source[header], longField ? 5000 : 1200);
  });
  item.medico_solicitante = item.medico_solicitante || item.registrado_por;
  item.registrado_por = item.registrado_por || item.medico_solicitante || auth.email || '';
  item.ubicacion = item.ubicacion || 'Urgencia Adulto';
  item.prioridad = item.prioridad || 'Alta';
  item.estado = item.estado || 'Pendiente';
  item.resuelto = item.resuelto || 'Pendiente';
  item.actualizado = now;
  return item;
}

function cleanText_(value, maxLength) {
  return String(value == null ? '' : value).replace(/\u0000/g, '').trim().slice(0, maxLength || 1200);
}

function sheetValue_(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function normalize_(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function friendlyError_(error) {
  const message = String(error && error.message ? error.message : error || 'Error desconocido');
  return message.slice(0, 500);
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function autorizarMaster() {
  getOrCreatePatientSheet_();
}