const { test, expect } = require('@playwright/test');

const expectedRoutes = [
  '#/especialidades',
  '#/llamados',
  '#/visita',
  '#/formularios',
  '#/telefonos',
  '#/noticias',
  '#/educacion',
  '#/paper',
  '#/gestion',
  '#/jefatura'
];

test('Inicio conserva los diez accesos y carga su capa visual dedicada', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('head link[href*="inicio-master.css"]')).toHaveCount(1);

  const cards = page.locator('#homePage .home-actions > a.action-card');
  await expect(cards).toHaveCount(10);

  const routes = await cards.evaluateAll((items) => items.map((item) => item.getAttribute('href')));
  expect(routes).toEqual(expectedRoutes);

  await expect(page.locator('#homeTitle')).toHaveText('Gestión clínica y coordinación de turno');
  await expect(page.locator('#homePage .home-panel')).toContainText('Toda derivación se realiza por Pitágoras');
});

test('Inicio mantiene lectura cómoda en pantalla móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  const hero = page.locator('#homePage .hero');
  const firstCard = page.locator('#homePage .action-card').first();

  await expect(hero).toBeVisible();
  await expect(firstCard).toBeVisible();

  const layout = await page.evaluate(() => {
    const grid = document.querySelector('#homePage .home-actions');
    const card = document.querySelector('#homePage .action-card');
    const gridBox = grid.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return {
      gridWidth: gridBox.width,
      cardWidth: cardBox.width,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length
    };
  });

  expect(layout.columns).toBe(1);
  expect(Math.abs(layout.gridWidth - layout.cardWidth)).toBeLessThan(2);
});
