const { test, expect } = require('@playwright/test');

test('el buscador de Especialidades busca en todas las categorías', async ({ page }) => {
  await page.goto('/index.html#/especialidades', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#searchInput')).toBeVisible();

  const flow = page.locator('#specialtiesPage [data-category="Flujo"]');
  await expect(flow).toHaveClass(/\bactive\b/);

  await page.locator('#searchInput').fill('urologia');

  await expect(page.locator('#specialtyGroups')).toContainText(/urolog/i);
  await expect(page.locator('#specialtyGroups .specialty-button:visible')).not.toHaveCount(0);
});

test('al limpiar la búsqueda vuelve a la categoría previa', async ({ page }) => {
  await page.goto('/index.html#/especialidades', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#searchInput');
  await input.fill('urologia');
  await input.fill('');

  await expect(page.locator('#specialtiesPage [data-category="Flujo"]')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#resultsMeta')).toContainText('protocolos disponibles');
});
