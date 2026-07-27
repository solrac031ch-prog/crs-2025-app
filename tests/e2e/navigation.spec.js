const { test, expect } = require('@playwright/test');

async function setRoute(page, hash, activeSelector) {
  await page.evaluate((nextHash) => { window.location.hash = nextHash; }, hash);
  await expect(page).toHaveURL(new RegExp(hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await expect(page.locator(activeSelector)).toHaveClass(/\bactive\b/);
}

test('las rutas principales renderizan su vista en un navegador real', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);

  await page.locator('a[href="#/especialidades"]').first().click();
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#searchInput')).toBeVisible();

  await setRoute(page, '#/llamados', '#callsPage');
  await setRoute(page, '#/formularios', '#formsPage');

  await setRoute(page, '#/noticias', '#managementPage');
  await expect(page.locator('#managementTitle')).toHaveText('Noticias');

  await setRoute(page, '#/educacion', '#educationPage');
  await expect(page.locator('#educationTitle')).toHaveText('Educacion medica');

  await setRoute(page, '#/paper', '#managementPage');
  await expect(page.locator('#managementTitle')).toHaveText('Paper del mes');

  await setRoute(page, '#/gestion', '#managementPage');
  await expect(page.locator('#managementTitle')).toHaveText('Gestion');

  await setRoute(page, '#/jefatura', '#chiefPage');
  await expect(page.locator('#chiefTitle')).toHaveText('Panel restringido');
});

test('las hojas separadas se cargan como CSS y no como style dinámico', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  for (const href of [
    'gestion-panel-final.css',
    'gestion-pacientes-core.css',
    'supabase-admin-users.css',
    'supabase-jefatura-panel.css'
  ]) {
    await expect(page.locator(`head link[rel="stylesheet"][href*="${href}"]`)).toHaveCount(1);
  }

  await expect(page.locator('#gestion-final-style')).toHaveCount(0);
  await expect(page.locator('#gestion-pacientes-core-style')).toHaveCount(0);
  await expect(page.locator('#crs-global-access-style')).toHaveCount(0);
  await expect(page.locator('#crs-password-recovery-style')).toHaveCount(0);
});
