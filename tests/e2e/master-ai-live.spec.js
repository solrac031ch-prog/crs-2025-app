const { test, expect } = require('@playwright/test');

const SUPABASE_URL = 'https://mjrcymctfnnyabvmfgda.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sjDVmSUC3o1qtc50_xemoQ_ZZObT1y9';
const LIVE_ENABLED = process.env.MASTER_AI_LIVE === '1';

test('Edge Function de compatibilidad MASTER IA permanece en modo $0', async ({ request }) => {
  test.skip(!LIVE_ENABLED, 'Prueba remota opt-in; la app normal no necesita invocar la Edge Function.');
  test.setTimeout(30000);

  const response = await request.post(`${SUPABASE_URL}/functions/v1/master-ai`, {
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
        text: 'Clave Negra requiere cumplir y registrar el checklist institucional. El registro debe incluir fecha y hora.'
      }]
    },
    failOnStatusCode: false
  });

  const body = await response.json();
  expect(response.status()).toBe(200);
  expect(body.configured).toBe(false);
  expect(body.mode).toBe('sources');
  expect(body.zero_cost).toBe(true);
  expect(String(body.answer || '')).toMatch(/Fuente MASTER/i);
  expect(String(body.notice || '')).toMatch(/no llama a OpenAI/i);
});
