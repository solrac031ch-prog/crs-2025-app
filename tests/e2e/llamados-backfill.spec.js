const { test, expect } = require('@playwright/test');

test('Jefatura puede montar la acción para indexar el PDF vigente sin re-subirlo', async ({ page }) => {
  await page.goto('/#/jefatura');
  await page.waitForFunction(() => Boolean(window.CRS_CALLS_BACKFILL?.mount));

  await page.evaluate(() => {
    const host = document.querySelector('#chiefContent') || document.body;
    const form = document.createElement('form');
    form.dataset.uploadCall = 'true';
    form.dataset.callType = 'especialistas';
    host.append(form);
    window.CRS_CALLS_BACKFILL.mount();
  });

  const button = page.locator('[data-calls-structured-backfill]');
  await expect(button).toHaveCount(1);
  await expect(button).toHaveText('Construir base estructurada desde PDF vigente');
  await expect(page.locator('[data-calls-structured-backfill-status]')).toContainText('No reemplaza el PDF');

  await page.evaluate(() => window.CRS_CALLS_BACKFILL.mount());
  await expect(button).toHaveCount(1);
});
