const { test, expect } = require('@playwright/test');

test('protocolo de Saturación SEA y Clave Negra carga, evalúa y prepara la notificación imprimible Carta', async ({ page }) => {
  await page.addInitScript(() => {
    window.__seaPrintCalled = false;
    window.print = () => { window.__seaPrintCalled = true; };
  });

  await page.goto('/index.html#/especialidad/saturacion-sea-y-clave-negra', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#protocolPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#protocolTitle')).toHaveText('Saturación SEA y Clave Negra');
  await expect(page.locator('#protocolDetail')).toContainText('48 camillas ocupadas');

  const evaluator = page.locator('#sea-saturation-evaluator');
  await expect(evaluator).toBeVisible();
  await expect(evaluator).toContainText('Evaluar sobresaturación y Clave Negra');

  const notification = page.locator('#sea-clave-negra-notification');
  await expect(notification).toBeHidden();

  await evaluator.locator('[data-sea-check="saturation"]').check();
  await expect(evaluator.locator('[data-sea-saturation-state]')).toContainText('Cumple criterio objetivo de sobresaturación');

  for (const key of ['reanimador', 'horizontal', 'ses']) {
    await evaluator.locator(`[data-sea-check="${key}"]`).check();
  }

  await expect(evaluator.locator('[data-sea-black-state]')).toContainText('CUMPLE CHECKLIST DE CLAVE NEGRA');
  await expect(evaluator.locator('.sea-black-actions')).toBeVisible();
  await expect(evaluator.locator('.sea-black-actions')).toContainText('Trasladar DOS pacientes');

  await expect(notification).toBeVisible();
  await expect(notification).toContainText('Notificación de Clave Negra lista para imprimir');

  const paper = notification.locator('.sea-print-paper');
  await expect(paper).toContainText('ANEXO 1');
  await expect(paper).toContainText('Identificación Clave Negra');
  await expect(paper).toContainText('Clave Negra SEA');
  await expect(paper).toContainText('Reanimador con 5 pacientes con número 6 inminente');
  await expect(paper).toContainText('Descartar posibilidad de cupos horizontales');
  await expect(paper).toContainText('pacientes autovalentes en ESPERA DE ALTA');
  await expect(paper).toContainText('Firma Jefe de turno');
  await expect(paper).toContainText('Página 5 de 5');
  await expect(paper.locator('[data-sea-print-date]')).not.toHaveText('');
  await expect(paper.locator('[data-sea-print-time]')).not.toHaveText('');

  await page.emulateMedia({ media: 'print' });
  const printMetrics = await paper.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      clientWidth: node.clientWidth,
      clientHeight: node.clientHeight,
      scrollWidth: node.scrollWidth,
      scrollHeight: node.scrollHeight,
      bodyHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
    };
  });
  expect(printMetrics.width).toBeGreaterThanOrEqual(814);
  expect(printMetrics.width).toBeLessThanOrEqual(818);
  expect(printMetrics.height).toBeGreaterThanOrEqual(1054);
  expect(printMetrics.height).toBeLessThanOrEqual(1058);
  expect(printMetrics.scrollWidth).toBeLessThanOrEqual(printMetrics.clientWidth + 1);
  expect(printMetrics.scrollHeight).toBeLessThanOrEqual(printMetrics.clientHeight + 1);
  expect(printMetrics.bodyHeight).toBeLessThanOrEqual(1058);
  await page.emulateMedia({ media: 'screen' });

  await notification.locator('.sea-print-button').click();
  await expect.poll(() => page.evaluate(() => window.__seaPrintCalled)).toBe(true);
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
  await expect(page.locator('#sea-clave-negra-notification')).toBeVisible();
  await evaluator.locator('.sea-reset').click();

  for (const key of ['saturation', 'reanimador', 'horizontal', 'ses']) {
    await expect(evaluator.locator(`[data-sea-check="${key}"]`)).not.toBeChecked();
  }
  await expect(evaluator.locator('[data-sea-saturation-state]')).toContainText('No está marcado el criterio objetivo de sobresaturación');
  await expect(evaluator.locator('[data-sea-black-state]')).toContainText('0/3 criterios de Clave Negra confirmados');
  await expect(evaluator.locator('.sea-black-actions')).toBeHidden();
  await expect(page.locator('#sea-clave-negra-notification')).toBeHidden();

  await page.evaluate(() => { window.location.hash = '#/inicio'; });
  await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);
  await page.evaluate(() => { window.location.hash = '#/especialidad/saturacion-sea-y-clave-negra'; });
  await expect(page.locator('#protocolPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#sea-saturation-evaluator')).toHaveCount(1);
  await expect(page.locator('#sea-clave-negra-notification')).toHaveCount(1);
});
