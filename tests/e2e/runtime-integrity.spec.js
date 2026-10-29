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


test('Gestión y Jefatura usan el perfil seguro y roles consistentes', async ({ request }) => {
  const runtimeResponse = await request.get('/gestion-pacientes-runtime.js');
  expect(runtimeResponse.ok()).toBeTruthy();
  const runtime = await runtimeResponse.text();
  expect(runtime).toContain('action: "getMe"');
  expect(runtime).not.toContain('.from("crs_admins")');

  const adminResponse = await request.get('/supabase-admin-users.js');
  expect(adminResponse.ok()).toBeTruthy();
  const admin = await adminResponse.text();
  for (const role of ['admin', 'jefatura', 'jefe', 'jefe_turno', 'owner', 'desarrollador']) {
    expect(admin).toContain(`"${role}"`);
  }
});
