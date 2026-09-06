const { test, expect } = require('@playwright/test');

test('la rotativa mensual se valida por contenido y no por nombre de archivo', async ({ page }) => {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  await expect.poll(async () => page.evaluate(() => Boolean(window.CRS_CALLS_MONTHLY_GUARD?.validateFile))).toBe(true);

  const result = await page.evaluate(async () => {
    const docs = await window.CRS_SUPABASE.fetchDocuments(['llamados']);
    const source = docs.find((doc) => doc.key === 'especialistas' && doc.status === 'published');
    if (!source?.url) throw new Error('No hay rotativa vigente para probar');
    const response = await fetch(source.url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`No se pudo abrir la rotativa: ${response.status}`);
    const blob = await response.blob();
    const file = new File([blob], 'archivo-sin-mes-ni-anio.pdf', { type: 'application/pdf' });
    return window.CRS_CALLS_MONTHLY_GUARD.validateFile(file);
  });

  expect(result.valid).toBe(true);
  expect(result.label).toBe('Septiembre 2026');
  expect(result.month).toBe(9);
  expect(result.year).toBe(2026);
  expect(result.daysInMonth).toBe(30);
  expect(result.missingDays).toEqual([]);
  expect(result.blockCount).toBeGreaterThanOrEqual(4);
  expect(result.specialtyCount).toBeGreaterThanOrEqual(6);
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
