const { test, expect } = require('@playwright/test');

test('casos reales confirmados del 7 de septiembre', async ({ page }) => {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  const live = page.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 20000 });
  const date = live.locator('[data-call-live-date]');
  const query = live.locator('[data-call-live-query]');
  const cards = live.locator('.on-call-live-result');

  await date.fill('2026-09-07');
  await query.fill('endoscopia');
  await expect(cards).toHaveCount(1, { timeout: 20000 });
  await expect(cards.first().locator('.on-call-specialty')).toHaveText(/Endoscopia/i);
  await expect(cards.first().locator('strong')).toHaveText(/^Dr\. Camilo Navarrete$/i);

  await query.fill('endocrino');
  await expect(cards).toHaveCount(1, { timeout: 20000 });
  await expect(cards.first().locator('.on-call-specialty')).toHaveText(/Endocrinolog/i);
  await expect(cards.first().locator('strong')).toContainText(/Mar[ií]a Doberti/i);
  await expect(cards.first().locator('strong')).toContainText(/Teleinterconsulta/i);
});
