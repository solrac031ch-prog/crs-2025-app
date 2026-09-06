const { test, expect } = require('@playwright/test');

test('MASTER IA responde de punta a punta usando la Edge Function real', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

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

  expect(diagnostic.status, JSON.stringify(diagnostic, null, 2)).toContain('Respuesta generada únicamente con las fuentes recuperadas.');
  expect(diagnostic.answer, JSON.stringify(diagnostic, null, 2)).toMatch(/Clave Negra/i);
  expect(diagnostic.answer, JSON.stringify(diagnostic, null, 2)).toMatch(/Fuente MASTER/i);
  expect(diagnostic.sources, JSON.stringify(diagnostic, null, 2)).toMatch(/Saturación SEA y Clave Negra/i);
});
