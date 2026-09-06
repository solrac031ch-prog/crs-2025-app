const { test, expect } = require('@playwright/test');

const SUPABASE_URL = 'https://mjrcymctfnnyabvmfgda.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sjDVmSUC3o1qtc50_xemoQ_ZZObT1y9';

function safeBody(value) {
  if (!value || typeof value !== 'object') return value;
  const clone = JSON.parse(JSON.stringify(value));
  if (clone.raw) clone.raw = String(clone.raw).slice(0, 500);
  return clone;
}

test('MASTER IA responde de punta a punta usando la Edge Function real', async ({ page, request }) => {
  test.setTimeout(60000);

  const apiResponse = await request.post(`${SUPABASE_URL}/functions/v1/master-ai`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Origin: 'http://127.0.0.1:4173',
      'Content-Type': 'application/json'
    },
    data: {
      question: '¿Cómo activo Clave Negra?',
      sources: [{
        title: 'Saturación SEA y Clave Negra',
        category: 'Protocolo',
        page: 'HPH · Mayo 2022',
        summary: 'Protocolo institucional de sobresaturación del SEA y Clave Negra.',
        text: 'Clave Negra requiere cumplir y registrar el checklist institucional. Jefatura médica y de enfermería informan a las jefaturas correspondientes y Gestión de Camas. El registro debe incluir fecha y hora.'
      }]
    },
    timeout: 30000,
    failOnStatusCode: false
  });

  const raw = await apiResponse.text();
  let body;
  try { body = JSON.parse(raw); } catch { body = { raw }; }
  const direct = {
    status: apiResponse.status(),
    allowOrigin: apiResponse.headers()['access-control-allow-origin'] || '',
    body: safeBody(body)
  };

  expect(direct.allowOrigin, JSON.stringify(direct, null, 2)).toBe('http://127.0.0.1:4173');
  expect(direct.status, JSON.stringify(direct, null, 2)).toBe(200);
  expect(direct.body?.configured, JSON.stringify(direct, null, 2)).toBe(true);
  expect(String(direct.body?.answer || ''), JSON.stringify(direct, null, 2)).toMatch(/Fuente MASTER/i);

  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-master-ai-launcher]').click();
  await expect(page.locator('[data-master-ai-dialog]')).toBeVisible();

  await page.locator('#masterAiQuestion').fill('¿Cómo activo Clave Negra?');
  await page.locator('[data-master-ai-form] button[type="submit"]').click();

  const status = page.locator('[data-master-ai-status]');
  await expect(status).toContainText('Respuesta generada únicamente con las fuentes recuperadas.', { timeout: 30000 });

  const answer = page.locator('[data-master-ai-answer-text]');
  await expect(answer).toContainText(/Clave Negra/i);
  await expect(answer).toContainText(/Fuente MASTER/i);
  await expect(page.locator('[data-master-ai-sources]')).toContainText(/Saturación SEA y Clave Negra/i);
});
