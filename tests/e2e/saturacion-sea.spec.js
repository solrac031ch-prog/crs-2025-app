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