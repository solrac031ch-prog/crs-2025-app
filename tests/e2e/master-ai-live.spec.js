const { test, expect } = require('@playwright/test');

test('MASTER IA responde de punta a punta usando la Edge Function real', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  await page.locator('[data-master-ai-launcher]').click();
  await expect(page.locator('[data-master-ai-dialog]')).toBeVisible();

  await page.locator('#masterAiQuestion').fill('¿Cómo activo Clave Negra?');
  await page.locator('[data-master-ai-form] button[type="submit"]').click();

  const status = page.locator('[data-master-ai-status]');
  await expect(status).toContainText('Respuesta generada únicamente con las fuentes recuperadas.', { timeout: 60000 });

  const answer = page.locator('[data-master-ai-answer-text]');
  await expect(answer).toContainText(/Clave Negra/i);
  await expect(answer).toContainText(/Fuente MASTER/i);
  await expect(page.locator('[data-master-ai-sources]')).toContainText(/Saturación SEA y Clave Negra/i);
});
