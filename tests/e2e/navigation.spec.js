const { test, expect } = require('@playwright/test');

async function setRoute(page, hash, activeSelector) {
  await page.evaluate((nextHash) => { window.location.hash = nextHash; }, hash);
  await expect(page).toHaveURL(new RegExp(hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await expect(page.locator(activeSelector)).toHaveClass(/\bactive\b/);
}

async function beginActivePageTrace(page) {
  await page.evaluate(() => {
    window.__crsActivePageTrace = [];
    window.__crsActivePageObserver?.disconnect?.();
    const snapshot = () => Array.from(document.querySelectorAll('.page.active')).map((item) => item.id).sort().join(',');
    window.__crsActivePageTrace.push(snapshot());
    const observer = new MutationObserver(() => window.__crsActivePageTrace.push(snapshot()));
    observer.observe(document.querySelector('main'), { subtree: true, attributes: true, attributeFilter: ['class'] });
    window.__crsActivePageObserver = observer;
  });
}

test('las rutas principales renderizan su vista en un navegador real', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);

  await page.locator('a[href="#/especialidades"]').first().click();
  await expect(page.locator('#specialtiesPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#searchInput')).toBeVisible();

  await setRoute(page, '#/llamados', '#callsPage');
  await setRoute(page, '#/formularios', '#formsPage');

  await setRoute(page, '#/noticias', '#managementPage');
  await expect(page.locator('#managementTitle')).toHaveText('Noticias');

  await setRoute(page, '#/educacion', '#educationPage');
  await expect(page.locator('#educationTitle')).toHaveText('Educacion medica');

  await setRoute(page, '#/paper', '#managementPage');
  await expect(page.locator('#managementTitle')).toHaveText('Paper del mes');

  await setRoute(page, '#/gestion', '#managementPage');
  await expect(page.locator('#managementTitle')).toHaveText('Gestion');

  await setRoute(page, '#/jefatura', '#chiefPage');
  await expect(page.locator('#chiefTitle')).toHaveText('Panel restringido');
});

test('Gestión y Jefatura no pasan por una página equivocada al cambiar de ruta', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  const routes = [
    ['#/gestion', 'managementPage'],
    ['#/noticias', 'managementPage'],
    ['#/educacion', 'educationPage'],
    ['#/paper', 'managementPage'],
    ['#/gestion/pacientes', 'managementPage'],
    ['#/jefatura', 'chiefPage'],
    ['#/equipo-urgencia', 'doctorsPage']
  ];

  for (const [hash, expectedPage] of routes) {
    await page.evaluate(() => { window.location.hash = '#/inicio'; });
    await expect(page.locator('#homePage')).toHaveClass(/\bactive\b/);
    await beginActivePageTrace(page);
    await page.evaluate((nextHash) => { window.location.hash = nextHash; }, hash);
    await page.waitForTimeout(350);
    await expect(page.locator(`#${expectedPage}`)).toHaveClass(/\bactive\b/);
    const trace = await page.evaluate(() => window.__crsActivePageTrace || []);
    const afterStart = trace.slice(1).filter(Boolean);
    expect(afterStart.every((entry) => entry === expectedPage)).toBeTruthy();
  }
});

test('Gestión de casos tiene configuración explícita y un único flujo activo', async ({ page }) => {
  await page.goto('/index.html#/gestion', { waitUntil: 'domcontentloaded' });
  const config = await page.evaluate(() => ({
    url: window.CRS_PATIENT_CASES_CONFIG?.appsScriptUrl || '',
    apiReady: Boolean(window.CRS_PATIENT_CASES?.listCases)
  }));
  expect(config.url).toMatch(/^https:\/\/script\.google\.com\/macros\/s\//);
  expect(config.apiReady).toBeTruthy();
  await expect(page.locator('a[href="#/gestion/pacientes"]')).toBeVisible();
  await page.locator('a[href="#/gestion/pacientes"]').click();
  await expect(page.locator('#managementPage')).toHaveClass(/\bactive\b/);
  await expect(page.locator('.patient-shell')).toBeVisible();
});

test('no reaparecen parches heredados ni Service Worker', async ({ page }) => {
  await page.goto('/index.html#/jefatura', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);
  await expect(page.locator('#crs-global-responsive-guard')).toHaveCount(0);
  await expect(page.locator('script[data-jefatura-usuarios]')).toHaveCount(0);
  await expect(page.locator('#jefatura-usuarios-style')).toHaveCount(0);

  const registrations = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return [];
    return (await navigator.serviceWorker.getRegistrations()).map((item) => item.scope);
  });
  expect(registrations.filter((scope) => scope.includes('/crs-2025-app/'))).toHaveLength(0);
});

test('las hojas separadas se cargan como CSS y no como style dinámico', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  for (const href of [
    'gestion-panel-final.css',
    'gestion-pacientes-core.css',
    'supabase-admin-users.css',
    'supabase-jefatura-panel.css'
  ]) {
    await expect(page.locator(`head link[rel="stylesheet"][href*="${href}"]`)).toHaveCount(1);
  }

  await expect(page.locator('#gestion-final-style')).toHaveCount(0);
  await expect(page.locator('#gestion-pacientes-core-style')).toHaveCount(0);
  await expect(page.locator('#crs-global-access-style')).toHaveCount(0);
  await expect(page.locator('#crs-password-recovery-style')).toHaveCount(0);
});
