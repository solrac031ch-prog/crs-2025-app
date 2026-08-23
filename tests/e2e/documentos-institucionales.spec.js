const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');

test('gestor institucional declara documentos con claves estables', async () => {
  const source = fs.readFileSync(path.join(root, 'documentos-institucionales.js'), 'utf8');

  for (const key of [
    'solicitudVih',
    'leyUrgenciasDecreto',
    'leyUrgenciasActivacion',
    'leyUrgenciasConsentimiento'
  ]) {
    expect(source).toContain(`key: "${key}"`);
  }

  expect(source).toContain('form.dataset.formBase = "true"');
  expect(source).toContain('form.dataset.formKey = definition.key');
  expect(source).toContain('Versión institucional vigente publicada por Jefatura.');
});

test('rutas de Jefatura y Formularios cargan el gestor institucional', async () => {
  const source = fs.readFileSync(path.join(root, 'route-modules.js'), 'utf8');
  const matches = source.match(/documentos-institucionales\.js/g) || [];

  expect(matches.length).toBe(2);
  expect(source).toContain('loadScript("documentos-institucionales", "./documentos-institucionales.js", 1)');
});

test('Solicitud VIH conserva fallback y Ley de Urgencias conserva documentos locales', async ({ page }) => {
  await page.goto('/index.html#/formularios', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#formsPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#turnFormsList')).toContainText('Solicitud de VIH');
  await expect(page.locator('#turnFormsList')).toContainText('Ley de urgencias');

  await page.goto('/index.html#/formularios/ley-urgencias/formularios', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#turnFormsList')).toContainText('Formularios rellenables');
  await expect(page.getByRole('link', { name: 'Abrir activación' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Abrir consentimiento' })).toHaveCount(1);
});
