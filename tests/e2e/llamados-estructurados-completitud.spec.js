const { test, expect } = require('@playwright/test');

const SEPTEMBER_PDF = 'https://mjrcymctfnnyabvmfgda.supabase.co/storage/v1/object/public/crs-public/llamados/2026-09-06/1788714548850-d44302d7bea678-Septiembre.pdf';

async function structuredApi(page) {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CRS_STRUCTURED_CALLS?.version >= 3, null, { timeout: 20000 });
}

function header(y) {
  return {
    y,
    norm: '7 8 9',
    text: '7 8 9',
    items: [
      { text: '7', x: 90, y, width: 20 },
      { text: '8', x: 190, y, width: 20 },
      { text: '9', x: 290, y, width: 20 }
    ]
  };
}

function specialtyRow(y, specialty, doctors) {
  return {
    y,
    text: `${specialty} ${doctors.join(' ')}`,
    norm: `${specialty} ${doctors.join(' ')}`.toLowerCase(),
    items: [
      { text: specialty, x: 8, y, width: 60 },
      { text: doctors[0], x: 80, y, width: 40 },
      { text: doctors[1], x: 180, y, width: 40 },
      { text: doctors[2], x: 280, y, width: 40 }
    ]
  };
}

test('parser conserva especialidades cuando una página repite bloques de fechas', async ({ page }) => {
  await structuredApi(page);
  const rows = await page.evaluate(() => {
    const makeHeader = (y) => ({
      y,
      norm: '7 8 9',
      text: '7 8 9',
      items: [
        { text: '7', x: 90, y, width: 20 },
        { text: '8', x: 190, y, width: 20 },
        { text: '9', x: 290, y, width: 20 }
      ]
    });
    const makeRow = (y, specialty, doctors) => ({
      y,
      text: `${specialty} ${doctors.join(' ')}`,
      norm: `${specialty} ${doctors.join(' ')}`.toLowerCase(),
      items: [
        { text: specialty, x: 8, y, width: 60 },
        { text: doctors[0], x: 80, y, width: 40 },
        { text: doctors[1], x: 180, y, width: 40 },
        { text: doctors[2], x: 280, y, width: 40 }
      ]
    });
    const pages = [{
      pageNo: 1,
      rows: [
        makeHeader(500),
        makeRow(480, 'Cardiologia', ['Dr Cardio 7', 'Dr Cardio 8', 'Dr Cardio 9']),
        makeHeader(400),
        makeRow(380, 'Urologia', ['Dr Uro 7', 'Dr Uro 8', 'Dr Uro 9'])
      ]
    }];
    return window.CRS_STRUCTURED_CALLS.extractAssignments(pages, { year: 2026, month: 9, label: 'Septiembre 2026' });
  });

  expect(rows.some((row) => row.schedule_date === '2026-09-07' && row.specialty === 'Cardiologia')).toBeTruthy();
  expect(rows.some((row) => row.schedule_date === '2026-09-07' && row.specialty === 'Urologia')).toBeTruthy();
  expect(new Set(rows.map((row) => row.specialty))).toEqual(new Set(['Cardiologia', 'Urologia']));
});

test('PDF vigente produce una base completa y recupera Urología', async ({ page }) => {
  await structuredApi(page);
  const result = await page.evaluate(
    async ({ url }) => window.CRS_STRUCTURED_CALLS.extractPublished(url, 'Septiembre 2026'),
    { url: SEPTEMBER_PDF }
  );

  const specialties = new Set(result.rows.map((row) => row.specialty));
  expect(result.meta.label).toBe('Septiembre 2026');
  expect(result.health.rows).toBeGreaterThan(177);
  expect(result.health.specialties).toBeGreaterThanOrEqual(10);
  expect(specialties.has('Urologia')).toBeTruthy();
  expect(specialties.has('Gastroenterologia')).toBeTruthy();
  expect(specialties.has('Geriatria')).toBeTruthy();

  console.log(`STRUCTURED_SUMMARY rows=${result.health.rows} specialties=${result.health.specialties} names=${[...specialties].sort().join(',')}`);
});

test('buscador estructurado mantiene el contrato del buscador vigente', async ({ page }) => {
  await structuredApi(page);
  const live = page.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 20000 });
  await expect(live.locator('[data-call-live-source]')).toContainText('Septiembre 2026');
  await expect(live.locator('[data-call-live-date]')).toBeVisible();
  await expect(live.locator('[data-call-live-query]')).toBeVisible();
  await live.locator('[data-call-live-query]').fill('infecto');
  await expect(live.locator('[data-call-live-clear]')).toBeVisible();
});
