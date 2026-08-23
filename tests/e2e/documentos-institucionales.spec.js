const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');

const managedKeys = [
  'antimicrobianosHph',
  'examenesManualesHph',
  'transfusion',
  'medicamentosUsoOcasional',
  'solicitudVih',
  'notificacionObligatoria',
  'leyUrgenciasDecreto',
  'leyUrgenciasActivacion',
  'leyUrgenciasConsentimiento'
];

test('gestor institucional declara todos los formularios con claves estables', async () => {
  const source = fs.readFileSync(path.join(root, 'documentos-institucionales.js'), 'utf8');

  for (const key of managedKeys) {
    expect(source).toContain(`key: "${key}"`);
  }

  expect(source).toContain('form.dataset.formBase = "true"');
  expect(source).toContain('form.dataset.formKey = definition.key');
  expect(source).not.toContain('Versión institucional vigente publicada por Jefatura.');
  expect(source).not.toContain('Versión vigente publicada por Jefatura');
  expect(source).toContain('Administra desde aquí todos los documentos y enlaces publicados en Formularios.');
});

test('rutas de Jefatura y Formularios cargan la versión 3 del gestor institucional', async () => {
  const source = fs.readFileSync(path.join(root, 'route-modules.js'), 'utf8');
  const matches = source.match(/documentos-institucionales\.js/g) || [];

  expect(matches.length).toBe(2);
  expect(source).toContain('loadScript("documentos-institucionales", "./documentos-institucionales.js", 3)');
});

test('Formularios conserva todos los accesos locales mientras no exista reemplazo global', async ({ page }) => {
  await page.goto('/index.html#/formularios', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#formsPage')).toHaveClass(/\bactive\b/);
  for (const title of [
    'Antimicrobianos H. Padre Hurtado',
    'Ley de urgencias',
    'Orden de examenes manuales HPH',
    'Transfusion',
    'Medicamentos de uso ocasional',
    'Solicitud de VIH',
    'Formularios de notificación obligatoria'
  ]) {
    await expect(page.locator('#turnFormsList')).toContainText(title);
  }

  await expect(page.getByRole('link', { name: 'Abrir orden de examenes' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Abrir documento de transfusion' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Abrir EPIVIGILA' })).toHaveCount(1);

  await page.goto('/index.html#/formularios/ley-urgencias/formularios', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#turnFormsList')).toContainText('Formularios rellenables');
  await expect(page.getByRole('link', { name: 'Abrir activación' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Abrir consentimiento' })).toHaveCount(1);
});
