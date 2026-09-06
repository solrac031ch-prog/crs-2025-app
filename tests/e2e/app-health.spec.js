const { test, expect } = require('@playwright/test');

const ROUTES = [
  ['#/inicio', '#homePage'],
  ['#/especialidades', '#specialtiesPage'],
  ['#/especialidad/saturacion-sea-y-clave-negra', '#protocolPage'],
  ['#/llamados', '#callsPage'],
  ['#/visita', '#visitPage'],
  ['#/formularios', '#formsPage'],
  ['#/formularios/ley-urgencias', '#formsPage'],
  ['#/formularios/ley-urgencias/buscar', '#formsPage'],
  ['#/formularios/ley-urgencias/formularios', '#formsPage'],
  ['#/formularios/notificacion-obligatoria', '#formsPage'],
  ['#/formularios/arsenal-terapeutico', '#formsPage'],
  ['#/telefonos', '#phonesPage'],
  ['#/noticias', '#managementPage'],
  ['#/educacion', '#educationPage'],
  ['#/paper', '#managementPage'],
  ['#/procedimientos', '#managementPage'],
  ['#/gestion', '#managementPage'],
  ['#/gestion/pacientes', '#managementPage'],
  ['#/gestion/uhd-citados', '#managementPage'],
  ['#/urgencia', '#doctorsPage'],
  ['#/medicos', '#doctorsPage'],
  ['#/equipo-urgencia', '#doctorsPage'],
  ['#/jefatura', '#chiefPage']
];

function watchRuntime(page) {
  const pageErrors = [];
  const localFailures = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    try {
      const url = new URL(request.url());
      if (url.origin !== 'http://127.0.0.1:4173') return;
      const reason = request.failure()?.errorText || 'request failed';
      localFailures.push(`${request.method()} ${url.pathname}${url.search}: ${reason}`);
    } catch (_) {
      // URLs no HTTP (data/blob) no forman parte de la integridad local del sitio.
    }
  });

  return { pageErrors, localFailures };
}

async function duplicateIds(page) {
  return page.evaluate(() => {
    const counts = new Map();
    document.querySelectorAll('[id]').forEach((node) => {
      counts.set(node.id, (counts.get(node.id) || 0) + 1);
    });
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([id, count]) => `${id} x${count}`);
  });
}

async function openRoute(page, hash, activeSelector) {
  await page.evaluate((nextHash) => { location.hash = nextHash; }, hash);
  await expect(page.locator(activeSelector)).toHaveClass(/\bactive\b/, { timeout: 15000 });
  await expect(page.locator('.page.active')).toHaveCount(1);
  expect(await duplicateIds(page), `IDs duplicados en ${hash}`).toEqual([]);
}

test('salud integral: rutas principales y secundarias navegan sin errores locales', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  for (const [hash, selector] of ROUTES) {
    await openRoute(page, hash, selector);
  }

  expect(runtime.localFailures, 'Recursos locales que fallaron al cargar').toEqual([]);
  expect(runtime.pageErrors, 'Errores JavaScript no controlados').toEqual([]);
});

test('Especialidades no reinyecta estilos ni el hero legado al navegar repetidamente', async ({ page }) => {
  await page.goto('/index.html#/especialidades', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#specialtyGroups .specialty-card-upgraded').first()).toBeVisible({ timeout: 15000 });

  await expect(page.locator('#especialidades-estable-style')).toHaveCount(0);
  await expect(page.locator('.specialty-lift-hero')).toHaveCount(0);
  await expect(page.locator('link[data-crs-route-style="especialidades-estable"]')).toHaveCount(1);
  await expect(page.locator('script[data-crs-route-module="especialidades-estable"]')).toHaveCount(1);

  for (let index = 0; index < 3; index += 1) {
    await page.evaluate(() => { location.hash = '#/inicio'; });
    await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);
    await page.evaluate(() => { location.hash = '#/especialidades'; });
    await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);
  }

  await expect(page.locator('#especialidades-estable-style')).toHaveCount(0);
  await expect(page.locator('.specialty-lift-hero')).toHaveCount(0);
  await expect(page.locator('link[data-crs-route-style="especialidades-estable"]')).toHaveCount(1);
  await expect(page.locator('script[data-crs-route-module="especialidades-estable"]')).toHaveCount(1);
});

test('las rutas de uso frecuente no generan desplazamiento horizontal global en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  const routes = [
    ['#/inicio', '#homePage'],
    ['#/especialidades', '#specialtiesPage'],
    ['#/llamados', '#callsPage'],
    ['#/formularios', '#formsPage'],
    ['#/telefonos', '#phonesPage']
  ];

  for (const [hash, selector] of routes) {
    await openRoute(page, hash, selector);
    const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
    expect(overflow, `Overflow horizontal global en ${hash}`).toBeLessThanOrEqual(1);
  }
});
