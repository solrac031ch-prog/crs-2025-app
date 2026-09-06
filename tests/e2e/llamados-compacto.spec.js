const { test, expect } = require('@playwright/test');

test('Llamados y UHD usa una interfaz compacta sin avisos ni botones repetidos', async ({ page }) => {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#callsPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#callsTitle')).toHaveText('Llamados y UHD');

  const routeModule = page.locator('script[data-crs-route-module="llamados-compacto"]');
  await expect(routeModule).toHaveAttribute('data-crs-loaded', 'true');

  const searchPanel = page.locator('#callsSearchPanel');
  await expect(searchPanel).toBeVisible();
  await expect(searchPanel.locator('.on-call-meta')).toHaveCount(0);
  await expect(searchPanel.locator('.on-call-date')).toHaveCount(0);
  await expect(searchPanel.locator('.route-actions a[href="#/inicio"]')).toHaveCount(0);
  await expect(searchPanel).not.toContainText('Escribe una especialidad; no se despliega la lista completa.');

  await expect(page.locator('#callsDocumentAction .calls-doc-link')).toHaveCount(1);
  const uhdLinks = page.locator('#uhdDocumentAction a');
  expect(await uhdLinks.count()).toBeLessThanOrEqual(1);
  if (await uhdLinks.count()) await expect(uhdLinks.first()).toHaveClass(/calls-doc-link/);
  await expect(page.locator('[data-sb-call-panel]')).toHaveCount(0);

  const live = searchPanel.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 15000 });
  const search = live.locator('[data-call-live-query]');
  await search.fill('cardio');
  await expect(live.locator('.on-call-live-result').first()).toBeVisible({ timeout: 20000 });
  await expect(live.locator('.on-call-live-result').first()).toContainText(/Cardio/i);

  const clear = live.locator('[data-call-live-clear]');
  await expect(clear).toBeVisible();
  await expect(clear).toHaveText('Limpiar');
  await clear.click();
  await expect(search).toHaveValue('');
  await expect(clear).toBeHidden();
  await expect(searchPanel).not.toContainText('Escribe una especialidad; no se despliega la lista completa.');
});