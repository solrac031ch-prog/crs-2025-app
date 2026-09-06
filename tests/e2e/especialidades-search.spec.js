const { test, expect } = require('@playwright/test');

test('el buscador de Especialidades busca en todas las categorías sin confundir Urología con Neurología', async ({ page }) => {
  await page.goto('/index.html#/especialidades', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#searchInput')).toBeVisible();

  const flow = page.locator('#specialtiesPage [data-category="Flujo"]');
  await expect(flow).toHaveClass(/\bactive\b/);

  await page.locator('#searchInput').fill('urologia');

  const visibleTitles = page.locator('#specialtyGroups .specialty-button:visible strong');
  await expect(visibleTitles.first()).toBeVisible();
  const titles = await visibleTitles.allTextContents();
  expect(titles.some((title) => /\burolog/i.test(title))).toBeTruthy();
  expect(titles.some((title) => /neurolog/i.test(title))).toBeFalsy();
});

test('el prefijo neuro encuentra Neurología y no Urología', async ({ page }) => {
  await page.goto('/index.html#/especialidades', { waitUntil: 'domcontentloaded' });
  await page.locator('#searchInput').fill('neuro');

  const visibleTitles = page.locator('#specialtyGroups .specialty-button:visible strong');
  await expect(visibleTitles.first()).toBeVisible();
  const titles = await visibleTitles.allTextContents();
  expect(titles.some((title) => /neurolog/i.test(title))).toBeTruthy();
  expect(titles.some((title) => /^urolog/i.test(title))).toBeFalsy();
});

test('al limpiar la búsqueda vuelve a la categoría previa', async ({ page }) => {
  await page.goto('/index.html#/especialidades', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#searchInput');
  await input.fill('urologia');
  await input.fill('');

  await expect(page.locator('#specialtiesPage [data-category="Flujo"]')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#resultsMeta')).toContainText('protocolos disponibles');
});
