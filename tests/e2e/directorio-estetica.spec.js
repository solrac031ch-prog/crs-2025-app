const { test, expect } = require('@playwright/test');

test('el directorio carga su capa visual dedicada sin perder funcionalidad', async ({ page }) => {
  await page.goto('/index.html#/telefonos', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#phonesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('head link[data-crs-route-style="directorio-telefonico"]')).toHaveCount(1);
  await expect(page.locator('head link[href*="directorio-telefonico.css"]')).toHaveCount(1);

  await expect(page.locator('#phonesContent .dt-sos')).toBeVisible();
  await expect(page.locator('#phonesContent [data-dt-search]')).toBeVisible();
  await expect(page.locator('#phonesContent .dt-quick button')).toHaveCount(5);
  await expect(page.locator('#phonesContent [data-dt-results]')).toBeVisible();
});
