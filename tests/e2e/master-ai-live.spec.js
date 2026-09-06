const { test, expect } = require('@playwright/test');

test('MASTER IA responde de punta a punta usando la Edge Function real', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  const direct = await page.evaluate(async () => {
    const cfg = window.CRS_SUPABASE_CONFIG;
    const response = await fetch(`${cfg.url}/functions/v1/master-ai`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: '¿Cómo activo Clave Negra?',
        sources: [{
          title: 'Saturación SEA y Clave Negra',
          category: 'Protocolo',
          page: 'HPH · Mayo 2022',
          summary: 'Protocolo institucional de sobresaturación del SEA y Clave Negra.',
          text: 'Clave Negra requiere cumplir y registrar el checklist institucional. Jefatura médica y de enfermería informan a las jefaturas correspondientes y Gestión de Camas. El registro debe incluir fecha y hora.'
        }]
      })
    });
    const raw = await response.text();
    let body = null;
    try { body = JSON.parse(raw); } catch { body = { raw }; }
    return { ok: response.ok, status: response.status, body };
  });

  expect(direct.status, JSON.stringify(direct, null, 2)).toBe(200);
  expect(direct.body?.configured, JSON.stringify(direct, null, 2)).toBe(true);
  expect(String(direct.body?.answer || ''), JSON.stringify(direct, null, 2)).toMatch(/Fuente MASTER/i);

  await page.locator('[data-master-ai-launcher]').click();
  await expect(page.locator('[data-master-ai-dialog]')).toBeVisible();

  await page.locator('#masterAiQuestion').fill('¿Cómo activo Clave Negra?');
  await page.locator('[data-master-ai-form] button[type="submit"]').click();

  await page.waitForTimeout(12000);
  const diagnostic = await page.evaluate(() => ({
    status: document.querySelector('[data-master-ai-status]')?.textContent?.trim() || '',
    answer: document.querySelector('[data-master-ai-answer-text]')?.textContent?.trim() || '',
    configVisible: !document.querySelector('[data-master-ai-config]')?.hidden,
    sources: document.querySelector('[data-master-ai-sources]')?.textContent?.trim() || ''
  }));

  expect(diagnostic.status, JSON.stringify({ direct, diagnostic }, null, 2)).toContain('Respuesta generada únicamente con las fuentes recuperadas.');
  expect(diagnostic.answer, JSON.stringify({ direct, diagnostic }, null, 2)).toMatch(/Clave Negra/i);
  expect(diagnostic.answer, JSON.stringify({ direct, diagnostic }, null, 2)).toMatch(/Fuente MASTER/i);
  expect(diagnostic.sources, JSON.stringify({ direct, diagnostic }, null, 2)).toMatch(/Saturación SEA y Clave Negra/i);
});
