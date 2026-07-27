// CRS HPH 2025 - Backend de Gestión prioritaria de pacientes
//
// Desplegar este archivo como Web App de Google Apps Script ejecutando como
// el propietario del script. El frontend envía una sesión Supabase real y
// este backend la valida contra el servidor Auth antes de permitir acceso.

const CRS_SUPABASE_URL = 'https://mjrcymctfnnyabvmfgda.supabase.co';
const CRS_PATIENT_SHEET_NAME = 'Gestion_pacientes';
const CRS_PATIENT_SPREADSHEET_PROPERTY = 'CRS_PATIENT_CASES_SPREADSHEET_ID';
const CRS_ALLOWED_ROLES = new Set(['admin', 'owner', 'desarrollador', 'creador', 'jefatura', 'jefe', 'jefe_turno']);

const CRS_PATIENT_HEADERS = [
  'id',
  'fecha_registro',
  'registrado_por',
  'paciente',
  'run',
  'edad',
  'telefono',
  'flujo',
  'motivo',
  'resumen_clinico',
  'gestion_solicitada',
  'prioridad',
  'origen',
  'estado',
  'resuelto',
  'proximo_paso',
  'responsable',
  'fecha_compromiso',
  'fecha_resolucion',
  'observaciones',
  'actualizado'
];

function doGet() {
  return json_({ ok: true, service: 'CRS HPH - Gestion pacientes', version: 2 });
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || '').trim();

    if (action === 'login') {
      return json_({ ok: false, error: 'El ingreso Google legacy está desactivado. Usa Jefatura con Supabase.' });
    }

    const auth = authorizeSupabase_(body);

    if (action === 'listPatientCases') return json_(listPatientCases_(auth));
    if (action === 'savePatientCase') return json_(savePatientCase_(body.case || {}, auth));
    if (action === 'updatePatientCase') return json_(updatePatientCase_(String(body.id || ''), body.patch || {}, auth));

    return json_({ ok: false, error: 'Acción no reconocida', action: action });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, error: friendlyError_(error) });
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

function authorizeSupabase_(body) {
  const token = String(body.accessToken || '').trim();
  const anonKey = String(body.supabaseAnonKey || '').trim();
  if (!token || !anonKey) throw new Error('Sesión de Jefatura no disponible. Vuelve a iniciar sesión.');

  const userResponse = UrlFetchApp.fetch(CRS_SUPABASE_URL + '/auth/v1/user', {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + token
    }
  });
  if (userResponse.getResponseCode() !== 200) {
    throw new Error('La sesión de Jefatura venció o no es válida.');
  }

  const user = JSON.parse(userResponse.getContentText() || '{}');
  const email = String(user.email || '').trim().toLowerCase();
  if (!email) throw new Error('La sesión Supabase no contiene correo.');

  const profileUrl = CRS_SUPABASE_URL + '/rest/v1/crs_admins?select=email,display_name,role,active&email=eq.' + encodeURIComponent(email) + '&limit=1';
  const profileResponse = UrlFetchApp.fetch(profileUrl, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + token,
      Accept: 'application/json'
    }
  });
  if (profileResponse.getResponseCode() !== 200) {
    throw new Error('No se pudo comprobar el permiso de Jefatura.');
  }

  const rows = JSON.parse(profileResponse.getContentText() || '[]');
  const profile = Array.isArray(rows) && rows.length ? rows[0] : null;
  const role = normalize_(profile && profile.role);
  if (!profile || profile.active === false || !CRS_ALLOWED_ROLES.has(role)) {
    throw new Error('Usuario sin permiso activo de Jefatura.');
  }

  return {
    email: email,
    name: String(profile.display_name || email),
    role: role
  };
}

function getOrCreatePatientSheet_() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheet = null;
  const storedId = props.getProperty(CRS_PATIENT_SPREADSHEET_PROPERTY);

  if (storedId) {
    try {
      spreadsheet = SpreadsheetApp.openById(storedId);
    } catch (_) {
      props.deleteProperty(CRS_PATIENT_SPREADSHEET_PROPERTY);
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('CRS HPH - Gestión prioritaria de pacientes');
    props.setProperty(CRS_PATIENT_SPREADSHEET_PROPERTY, spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(CRS_PATIENT_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CRS_PATIENT_SHEET_NAME);
  }

  ensureHeaders_(sheet);
  return { spreadsheet: spreadsheet, sheet: sheet };
}

function ensureHeaders_(sheet) {
  const current = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), CRS_PATIENT_HEADERS.length)).getDisplayValues()[0]
    : [];
  const valid = CRS_PATIENT_HEADERS.every(function(header, index) { return current[index] === header; });
  if (!valid) {
    sheet.getRange(1, 1, 1, CRS_PATIENT_HEADERS.length).setValues([CRS_PATIENT_HEADERS]);
    sheet.getRange(1, 1, 1, CRS_PATIENT_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function listPatientCases_(auth) {
  const target = getOrCreatePatientSheet_();
  const sheet = target.sheet;
  const lastRow = sheet.getLastRow();
  const cases = lastRow <= 1
    ? []
    : sheet.getRange(2, 1, lastRow - 1, CRS_PATIENT_HEADERS.length).getDisplayValues().map(rowToCase_);

  return {
    ok: true,
    cases: cases,
    spreadsheetUrl: target.spreadsheet.getUrl(),
    viewer: { email: auth.email, role: auth.role }
  };
}

function savePatientCase_(input, auth) {
  const target = getOrCreatePatientSheet_();
  const now = new Date().toISOString();
  const item = sanitizeCase_(input, auth, now);
  if (!item.id) item.id = 'caso-' + Date.now() + '-' + Utilities.getUuid().slice(0, 8);
  if (!item.fecha_registro) item.fecha_registro = now.slice(0, 10);
  item.registrado_por = auth.email;
  item.actualizado = now;

  const values = CRS_PATIENT_HEADERS.map(function(header) { return sheetValue_(item[header]); });
  target.sheet.getRange(target.sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
  return { ok: true, case: item, spreadsheetUrl: target.spreadsheet.getUrl() };
}

function updatePatientCase_(id, patch, auth) {
  if (!id) throw new Error('Falta el identificador del caso.');
  const target = getOrCreatePatientSheet_();
  const sheet = target.sheet;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error('Caso no encontrado.');

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  let rowNumber = -1;
  for (let index = 0; index < ids.length; index += 1) {
    if (String(ids[index][0]) === id) {
      rowNumber = index + 2;
      break;
    }
  }
  if (rowNumber < 0) throw new Error('Caso no encontrado.');

  const current = rowToCase_(sheet.getRange(rowNumber, 1, 1, CRS_PATIENT_HEADERS.length).getDisplayValues()[0]);
  const allowedPatch = {};
  [
    'estado', 'resuelto', 'proximo_paso', 'responsable', 'fecha_compromiso',
    'fecha_resolucion', 'observaciones'
  ].forEach(function(key) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) allowedPatch[key] = patch[key];
  });

  const merged = sanitizeCase_(Object.assign({}, current, allowedPatch), auth, new Date().toISOString());
  merged.id = current.id;
  merged.fecha_registro = current.fecha_registro;
  merged.registrado_por = current.registrado_por;
  merged.actualizado = new Date().toISOString();

  const values = CRS_PATIENT_HEADERS.map(function(header) { return sheetValue_(merged[header]); });
  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
  return { ok: true, case: merged, spreadsheetUrl: target.spreadsheet.getUrl() };
}

function rowToCase_(row) {
  const result = {};
  CRS_PATIENT_HEADERS.forEach(function(header, index) {
    result[header] = String(row[index] == null ? '' : row[index]);
  });
  return result;
}

function sanitizeCase_(raw, auth, now) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const item = {};
  CRS_PATIENT_HEADERS.forEach(function(header) {
    item[header] = cleanText_(source[header], header === 'resumen_clinico' || header === 'observaciones' ? 4000 : 1200);
  });
  item.registrado_por = item.registrado_por || auth.email;
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
