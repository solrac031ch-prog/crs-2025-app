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
  await expect(page.locator('#uhdDocumentAction .calls-doc-link')).toHaveCount(1);
  await expect(page.locator('[data-sb-call-panel]')).toHaveCount(0);

  const search = searchPanel.locator('input[type="search"]');
  await search.fill('cardio');
  await expect(searchPanel.locator('.on-call-result')).toHaveCount(1);
  await expect(searchPanel.locator('.on-call-result')).toContainText(/Cardio/i);

  const clear = searchPanel.locator('.on-call-clear');
  await expect(clear).toHaveText('Limpiar búsqueda');
  await clear.click();
  await expect(search).toHaveValue('');
  await expect(searchPanel).not.toContainText('Escribe una especialidad; no se despliega la lista completa.');
});
