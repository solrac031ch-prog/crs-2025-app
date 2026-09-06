const { test, expect } = require('@playwright/test');

test('los runtimes diferidos se cargan una sola vez al navegar entre rutas', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => { location.hash = '#/especialidades'; });
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('script[data-crs-route-module="gestion-pacientes-runtime"]')).toHaveCount(1);
  await expect(page.locator('script[data-crs-route-module="protocolos-detalle-polish-runtime"]')).toHaveCount(1);

  await page.evaluate(() => { location.hash = '#/inicio'; });
  await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);
  await page.evaluate(() => { location.hash = '#/especialidades'; });
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);

  await expect(page.locator('script[data-crs-route-module="gestion-pacientes-runtime"]')).toHaveCount(1);
  await expect(page.locator('script[data-crs-route-module="protocolos-detalle-polish-runtime"]')).toHaveCount(1);
});
