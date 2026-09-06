const { test, expect } = require('@playwright/test');

test('protocolo de Saturación SEA y Clave Negra carga y evalúa el checklist', async ({ page }) => {
  await page.goto('/index.html#/especialidad/saturacion-sea-y-clave-negra', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#protocolPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#protocolTitle')).toHaveText('Saturación SEA y Clave Negra');
  await expect(page.locator('#protocolDetail')).toContainText('48 camillas ocupadas');

  const evaluator = page.locator('#sea-saturation-evaluator');
  await expect(evaluator).toBeVisible();
  await expect(evaluator).toContainText('Evaluar sobresaturación y Clave Negra');

  await evaluator.locator('[data-sea-check="saturation"]').check();
  await expect(evaluator.locator('[data-sea-saturation-state]')).toContainText('Cumple criterio objetivo de sobresaturación');

  for (const key of ['reanimador', 'horizontal', 'ses']) {
    await evaluator.locator(`[data-sea-check="${key}"]`).check();
  }

  await expect(evaluator.locator('[data-sea-black-state]')).toContainText('CUMPLE CHECKLIST DE CLAVE NEGRA');
  await expect(evaluator.locator('.sea-black-actions')).toBeVisible();
  await expect(evaluator.locator('.sea-black-actions')).toContainText('Trasladar DOS pacientes');
});

test('Saturación SEA se encuentra desde Protocolos y reinicia el checklist completo', async ({ page }) => {
  await page.goto('/index.html#/especialidades', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);

  const protocolFilter = page.locator('[data-category="Protocolo"]');
  await expect(protocolFilter).toBeVisible();
  await protocolFilter.click();

  const protocolLink = page.locator('a[href="#/especialidad/saturacion-sea-y-clave-negra"]');
  await expect(protocolLink).toBeVisible();
  await expect(protocolLink).toContainText('Saturación SEA y Clave Negra');
  await protocolLink.click();

  await expect(page.locator('#protocolPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#protocolTitle')).toHaveText('Saturación SEA y Clave Negra');

  const evaluator = page.locator('#sea-saturation-evaluator');
  await expect(evaluator).toHaveCount(1);

  for (const key of ['saturation', 'reanimador', 'horizontal', 'ses']) {
    await evaluator.locator(`[data-sea-check="${key}"]`).check();
  }

  await expect(evaluator.locator('.sea-black-actions')).toBeVisible();
  await evaluator.locator('.sea-reset').click();

  for (const key of ['saturation', 'reanimador', 'horizontal', 'ses']) {
    await expect(evaluator.locator(`[data-sea-check="${key}"]`)).not.toBeChecked();
  }
  await expect(evaluator.locator('[data-sea-saturation-state]')).toContainText('No está marcado el criterio objetivo de sobresaturación');
  await expect(evaluator.locator('[data-sea-black-state]')).toContainText('0/3 criterios de Clave Negra confirmados');
  await expect(evaluator.locator('.sea-black-actions')).toBeHidden();

  await page.evaluate(() => { window.location.hash = '#/inicio'; });
  await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);
  await page.evaluate(() => { window.location.hash = '#/especialidad/saturacion-sea-y-clave-negra'; });
  await expect(page.locator('#protocolPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#sea-saturation-evaluator')).toHaveCount(1);
});