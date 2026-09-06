const { test, expect } = require('@playwright/test');

test('Inicio no descarga runtimes pesados ni el SDK de Supabase', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);
  await page.waitForTimeout(900);

  await expect(page.locator('script[data-crs-route-module="gestion-pacientes-runtime"]')).toHaveCount(0);
  await expect(page.locator('script[data-crs-route-module="protocolos-detalle-polish-runtime"]')).toHaveCount(0);
  await expect(page.locator('script[data-supabase-sdk]')).toHaveCount(0);
});

test('las rutas cargan sólo los módulos pesados que necesitan', async ({ page }) => {
  await page.goto('/index.html#/telefonos', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#phonesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('script[data-crs-route-module="gestion-pacientes-runtime"]')).toHaveCount(0);
  await expect(page.locator('script[data-crs-route-module="protocolos-detalle-polish-runtime"]')).toHaveCount(0);
  await expect(page.locator('script[data-supabase-sdk]')).toHaveCount(0);

  await page.goto('/index.html#/gestion', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#managementPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('script[data-crs-route-module="gestion-pacientes-runtime"]')).toHaveAttribute('data-crs-loaded', 'true');
  await expect(page.locator('script[data-supabase-sdk]')).toHaveCount(1);

  await page.goto('/index.html#/especialidades', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('script[data-crs-route-module="protocolos-detalle-polish-runtime"]')).toHaveAttribute('data-crs-loaded', 'true');
  await expect(page.locator('script[data-crs-route-module="gestion-pacientes-runtime"]')).toHaveAttribute('data-crs-loaded', 'true');
});

test('el arranque liviano sigue purgando respaldos clínicos heredados', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('crsPatientCasesBackupV1', 'dato-clinico-antiguo');
    localStorage.setItem('crsPriorityCases', 'dato-clinico-antiguo');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  const stored = await page.evaluate(() => ({
    backup: localStorage.getItem('crsPatientCasesBackupV1'),
    priority: localStorage.getItem('crsPriorityCases')
  }));
  expect(stored).toEqual({ backup: null, priority: null });
});
