const { test, expect } = require('@playwright/test');

function syntheticSeptemberRows() {
  const rows = [
    { text: 'ROTATIVA ESPECIALISTAS SEPTIEMBRE 2026', norm: 'rotativa especialistas septiembre 2026', items: [] }
  ];
  const blocks = [
    [1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
    [28, 29, 30]
  ];
  blocks.forEach((days, blockIndex) => {
    rows.push({
      text: days.join(' '),
      norm: days.join(' '),
      items: days.map((day, index) => ({ text: String(day), x: 200 + index * 70, y: 500 - blockIndex * 90, width: 8 }))
    });
  });
  [
    'Broncopulmonar',
    'Cardiologia',
    'Diabetologia',
    'Endocrinologia',
    'Endoscopia',
    'Gastroenterologia'
  ].forEach((specialty) => rows.push({ text: specialty, norm: specialty.toLowerCase(), items: [] }));
  return rows;
}

test('la rotativa mensual valida mes, días, bloques y especialidades sin depender de Supabase', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  await expect.poll(async () => page.evaluate(() => Boolean(window.CRS_CALLS_MONTHLY_GUARD?.validateRows))).toBe(true);

  const rows = syntheticSeptemberRows();
  const result = await page.evaluate((fixture) => window.CRS_CALLS_MONTHLY_GUARD.validateRows(fixture), rows);

  expect(result.valid).toBe(true);
  expect(result.label).toBe('Septiembre 2026');
  expect(result.month).toBe(9);
  expect(result.year).toBe(2026);
  expect(result.daysInMonth).toBe(30);
  expect(result.missingDays).toEqual([]);
  expect(result.extraDays).toEqual([]);
  expect(result.blockCount).toBe(5);
  expect(result.specialtyCount).toBeGreaterThanOrEqual(6);
});

test('rechaza una rotativa mensual si falta un día del mes', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  const rows = syntheticSeptemberRows();
  rows.find((row) => row.items.some((item) => item.text === '30')).items = [
    { text: '28', x: 200, y: 140, width: 8 },
    { text: '29', x: 270, y: 140, width: 8 }
  ];

  const message = await page.evaluate((fixture) => {
    try {
      window.CRS_CALLS_MONTHLY_GUARD.validateRows(fixture);
      return 'ACEPTADO';
    } catch (error) {
      return String(error?.message || error);
    }
  }, rows);

  expect(message).not.toBe('ACEPTADO');
  expect(message).toMatch(/Faltan días: 30/i);
});

test('el guard mensual entiende todos los meses sin fechas hardcodeadas', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  const parsed = await page.evaluate(() => [
    window.CRS_CALLS_MONTHLY_GUARD.parseMonthYear('ROTATIVA ENERO 2027'),
    window.CRS_CALLS_MONTHLY_GUARD.parseMonthYear('especialistas febrero 2028'),
    window.CRS_CALLS_MONTHLY_GUARD.parseMonthYear('programación diciembre 2029')
  ]);

  expect(parsed[0]).toMatchObject({ month: 1, year: 2027, label: 'Enero 2027' });
  expect(parsed[1]).toMatchObject({ month: 2, year: 2028, label: 'Febrero 2028' });
  expect(parsed[2]).toMatchObject({ month: 12, year: 2029, label: 'Diciembre 2029' });
});
