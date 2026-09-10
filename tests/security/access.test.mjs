import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const backend = fs.readFileSync('apps-script/gestion-pacientes.gs', 'utf8');
function script(extra = {}) {
  const context = vm.createContext({ console: { ...console, error() {} }, ...extra });
  vm.runInContext(backend, context);
  return context;
}

test('JSON rejects arrays, null, malformed and excessive payloads', () => {
  const c = script();
  for (const text of ['[]', 'null', '{', 'x'.repeat(65537)]) {
    assert.throws(() => c.parseBody_({ postData: { contents: text } }));
  }
  assert.equal(c.parseBody_({ postData: { contents: '{"action":"listPatientCases"}' } }).action, 'listPatientCases');
});

test('unknown action with doctor RUT does not enter public submission', () => {
  const c = script();
  c.authorizeSupabase_ = () => { throw new Error('AUTH_REQUIRED'); };
  c.savePublicPatientCase_ = () => { throw new Error('PUBLIC_ROUTE_USED'); };
  c.json_ = x => x;
  const r = c.doPost({ postData: { contents: JSON.stringify({ action: 'unexpected', doctorRut: '12345678-5', case: {} }) } });
  assert.equal(r.error, 'AUTH_REQUIRED');
});

test('configured spreadsheet failure never deletes its ID or creates a replacement', () => {
  const c = script({
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'existing', deleteProperty: () => assert.fail('deleted ID') }) },
    SpreadsheetApp: { openById: () => { throw new Error('temporary outage'); }, create: () => assert.fail('replacement created') }
  });
  assert.throws(() => c.getOrCreatePatientSheet_(), /No se pudo abrir/);
});

test('all protected writes acquire and release lock even on failure', () => {
  for (const name of ['savePatientCase_', 'updatePatientCase_']) {
    const sequence = [];
    const c = script({ LockService: { getScriptLock: () => ({ waitLock: () => sequence.push('lock'), releaseLock: () => sequence.push('release') }) } });
    c[name + 'locked_'] = () => { sequence.push('write'); throw new Error('failed write'); };
    assert.throws(() => c[name]({}, {}), /failed write/);
    assert.deepEqual(sequence, ['lock', 'write', 'release']);
  }
});

test('patient authorization requires explicit active role, including owner email', () => {
  for (const [role, active, allowed] of [['jefe', true, true], ['jefe', null, false], ['jefe', false, false], ['unknown', true, false]]) {
    let request = 0;
    const c = script({ UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(request++ === 0 ? { email: 'mdcarlosherrera@gmail.com' } : [{ role, active }]) }) } });
    const invoke = () => c.authorizeSupabase_({ accessToken: 'synthetic', supabaseAnonKey: 'synthetic' });
    if (allowed) assert.equal(invoke().role, role); else assert.throws(invoke, /sin permiso/);
  }
});

const edge = stripTypeScriptTypes(fs.readFileSync('supabase/functions/crs-admin-users/index.ts', 'utf8').replace(/^import .*;\n/, ''));
async function edgeResponse(role, active, body = { action: 'unknown' }, validUser = true) {
  let handler;
  const c = vm.createContext({
    Response, Request, crypto, console,
    Deno: { env: { get: () => 'synthetic' }, serve: fn => { handler = fn; } },
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: validUser ? { email: 'tester@example.invalid' } : null } }) },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role, active } }) }) }) })
    })
  });
  vm.runInContext(edge, c);
  return handler(new Request('https://example.invalid', { method: 'POST', headers: { Authorization: 'Bearer synthetic', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
}

test('user administration rejects nonmanager and inactive accounts', async () => {
  for (const role of ['jefe', 'jefatura', 'unknown', '']) assert.equal((await edgeResponse(role, true)).status, 403);
  assert.equal((await edgeResponse('creador', false)).status, 403);
  assert.equal((await edgeResponse('creador', true, {}, false)).status, 401);
});

test('manager reaches dispatch but cannot assign an unsupported role', async () => {
  for (const role of ['creador', 'admin', 'disenador', 'diseñador']) {
    const response = await edgeResponse(role, true);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'Accion no reconocida.');
  }
  const response = await edgeResponse('creador', true, { action: 'upsertUser', email: 'new@example.invalid', role: 'superuser' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'Rol no permitido.');
});

function patientRuntime() {
  const events = {};
  let signedIn = true;
  let pending;
  const api = {
    auth: {
      getUser: async () => ({ data: { user: signedIn ? { email: 'chief@example.invalid' } : null } }),
      getSession: async () => ({ data: { session: { access_token: 'synthetic' } } })
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'jefe', active: true } }) }) }) })
  };
  const window = {
    CRS_SUPABASE: { client: () => api },
    CRS_SUPABASE_CONFIG: { anonKey: 'synthetic' },
    CRS_PATIENT_CASES_CONFIG: { appsScriptUrl: 'https://example.invalid' },
    addEventListener: (name, fn) => { events[name] = fn; }
  };
  vm.runInNewContext(fs.readFileSync('gestion-pacientes-runtime.js', 'utf8'), {
    window, console, URL, setTimeout, clearTimeout,
    location: { hash: '#/inicio' },
    localStorage: { removeItem() {} },
    document: { readyState: 'loading', addEventListener() {}, querySelector() { return null; } },
    fetch: async () => pending ? pending : ({ text: async () => JSON.stringify({ ok: true, cases: [{ id: 'synthetic-case', paciente: 'TEST ONLY' }] }) })
  });
  return {
    cases: window.CRS_PATIENT_CASES,
    signOut() { signedIn = false; events['crs:auth-changed'](); },
    hold() { let release; pending = new Promise(resolve => { release = resolve; }); return () => release({ text: async () => JSON.stringify({ ok: true, cases: [{ id: 'late-case' }] }) }); }
  };
}

test('logout clears patient cache before another read', async () => {
  const r = patientRuntime();
  assert.equal((await r.cases.listCases()).rows.length, 1);
  r.signOut();
  assert.equal((await r.cases.listCases()).rows.length, 0);
});

test('a response from the previous session cannot restore patient cache', async () => {
  const r = patientRuntime();
  await r.cases.refreshAuth();
  const release = r.hold();
  const request = r.cases.listCases();
  await new Promise(resolve => setTimeout(resolve, 0));
  r.signOut();
  release();
  assert.equal((await request).rows.length, 0);
  assert.equal((await r.cases.listCases()).rows.length, 0);
});
