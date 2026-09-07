const { test, expect } = require('@playwright/test');

test.describe('MASTER IA costo cero', () => {
  test('carga diferida y responde localmente sin invocar servicios externos de IA', async ({ page }) => {
    let paidAiRequests = 0;
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/functions/v1/master-ai') || url.includes('api.openai.com') || url.includes('api.cloudflare.com')) paidAiRequests += 1;
    });

    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    const launcher = page.locator('[data-master-ai-launcher]');
    await expect(launcher).toBeVisible();
    await expect(page.locator('script[data-master-ai-runtime]')).toHaveCount(0);

    await launcher.click();
    await expect(page.locator('[data-master-ai-dialog]')).toBeVisible();
    await expect(page.locator('script[data-master-ai-runtime]')).toHaveCount(1);
    await expect(page.locator('.master-ai-kicker')).toContainText('$0');

    await page.locator('#masterAiQuestion').fill('TVP en horario inhábil: ¿cuál es el flujo?');
    await page.locator('[data-master-ai-form] button[type="submit"]').click();

    await expect(page.locator('[data-master-ai-answer]')).toBeVisible();
    await expect(page.locator('[data-master-ai-answer-text]')).toContainText(/TVP/i);
    await expect(page.locator('[data-master-ai-answer-text]')).toContainText(/Fuente MASTER/i);
    await expect(page.locator('[data-master-ai-sources]')).toContainText(/TVP/i);
    await expect(page.locator('[data-master-ai-status]')).toContainText(/local.*\$0/i);
    await expect(page.locator('[data-master-ai-config]')).toContainText(/no se envió a OpenAI/i);
    expect(paidAiRequests).toBe(0);
  });

  test('bloquea datos identificatorios y no envía la consulta fuera del navegador', async ({ page }) => {
    let externalAiRequests = 0;
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/functions/v1/master-ai') || url.includes('api.openai.com') || url.includes('api.cloudflare.com')) externalAiRequests += 1;
    });

    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-ai-launcher]').click();
    await page.locator('#masterAiQuestion').fill('Paciente RUT 12.345.678-5 con TVP');
    await page.locator('[data-master-ai-form] button[type="submit"]').click();

    await expect(page.locator('[data-master-ai-status]')).toContainText(/Retira RUT/i);
    expect(externalAiRequests).toBe(0);
  });

  test('si no hay fuente suficiente no inventa una respuesta', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-ai-launcher]').click();
    await page.locator('#masterAiQuestion').fill('protocolo inexistente xyzqwerty');
    await page.locator('[data-master-ai-form] button[type="submit"]').click();

    await expect(page.locator('[data-master-ai-answer]')).toBeVisible();
    await expect(page.locator('[data-master-ai-answer-text]')).toContainText(/No encontré respaldo suficiente/i);
  });

  test('Clave Negra devuelve fuente institucional y advertencias disponibles', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-ai-launcher]').click();
    await page.locator('#masterAiQuestion').fill('¿Cómo activo Clave Negra?');
    await page.locator('[data-master-ai-form] button[type="submit"]').click();

    const answer = page.locator('[data-master-ai-answer-text]');
    await expect(answer).toContainText(/Clave Negra/i);
    await expect(answer).toContainText(/Fuente MASTER/i);
    await expect(page.locator('[data-master-ai-sources]')).toContainText(/Saturación|Clave Negra/i);
  });

  test('el panel no provoca overflow horizontal en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-ai-launcher]').click();
    await expect(page.locator('[data-master-ai-dialog]')).toBeVisible();

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      sheet: document.querySelector('.master-ai-sheet')?.getBoundingClientRect().width || 0
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
    expect(widths.sheet).toBeLessThanOrEqual(widths.client + 1);
  });
});
