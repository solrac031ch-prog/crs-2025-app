const { test, expect } = require('@playwright/test');

async function liveSearch(page) {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#callsPage')).toHaveClass(/\bactive\b/);
  const live = page.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 20000 });
  return live;
}

async function expectCall(live, dateValue, query, specialty, doctorPattern) {
  await live.locator('[data-call-live-date]').fill(dateValue);
  await live.locator('[data-call-live-query]').fill(query);

  const cards = live.locator('.on-call-live-result');
  await expect(cards.first()).toBeVisible({ timeout: 20000 });
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('.on-call-specialty')).toHaveText(specialty);
  if (doctorPattern) await expect(cards.first().locator('strong')).toHaveText(doctorPattern);
  await expect(live.locator('[data-call-live-status]')).not.toContainText('No encontré');
}

test('buscador de llamados usa la rotativa vigente publicada por Jefatura', async ({ page }) => {
  const live = await liveSearch(page);
  await expect(live.locator('[data-call-live-source]')).toContainText('Septiembre 2026');
  await expect(live.locator('[data-call-live-source]')).toContainText('Rotativa vigente');

  const date = live.locator('[data-call-live-date]');
  await expect(date).toHaveValue(/^2026-09-/);
  await expect(page.locator('#callsSearchPanel')).not.toContainText('Mayo 2026');
  await expect(page.locator('#callsSearchPanel .on-call-meta')).toHaveCount(0);
});

test('buscar uro devuelve Urología y nunca Neurología', async ({ page }) => {
  const live = await liveSearch(page);
  await live.locator('[data-call-live-date]').fill('2026-09-07');
  await live.locator('[data-call-live-query]').fill('uro');

  const cards = live.locator('.on-call-live-result');
  await expect(cards.first()).toBeVisible({ timeout: 20000 });
  const specialties = await cards.locator('.on-call-specialty').allTextContents();
  expect(specialties).toEqual(['Urologia']);
  expect(specialties.some((name) => /Neurolog/i.test(name))).toBeFalsy();
});

test('alias renal nunca deriva a Urología', async ({ page }) => {
  const live = await liveSearch(page);
  await live.locator('[data-call-live-date]').fill('2026-09-07');
  await live.locator('[data-call-live-query]').fill('renal');

  const cards = live.locator('.on-call-live-result');
  if (await cards.count()) {
    const specialties = await cards.locator('.on-call-specialty').allTextContents();
    expect(specialties.some((name) => /^Urolog/i.test(name))).toBeFalsy();
  }
});

test('buscador lee correctamente el bloque semanal 7 a 13', async ({ page }) => {
  const live = await liveSearch(page);
  await expectCall(live, '2026-09-07', 'infecto', /Infectolog/i, /Felipe Gómez/i);
});

test('buscador lee correctamente el bloque semanal 14 a 20', async ({ page }) => {
  const live = await liveSearch(page);
  await expectCall(live, '2026-09-14', 'endoscopia', /Endoscopia/i, /Cesar Serrano/i);
});

test('buscador lee correctamente el bloque semanal 21 a 27', async ({ page }) => {
  const live = await liveSearch(page);
  await expectCall(live, '2026-09-22', 'neuro', /Neurolog/i, /Laura Fonseca/i);
});

test('buscador lee correctamente el último bloque 28 a 30', async ({ page }) => {
  const live = await liveSearch(page);
  await expectCall(live, '2026-09-28', 'infecto', /Infectolog/i, /Felipe Gómez/i);
  await expectCall(live, '2026-09-28', 'neuro', /Neurolog/i, /Laura Fonseca/i);
  await expectCall(live, '2026-09-28', 'endoscopia', /Endoscopia/i, /Hugo Veis/i);
});

test('cambiar fecha con la misma búsqueda cambia al bloque semanal correcto', async ({ page }) => {
  const live = await liveSearch(page);
  const date = live.locator('[data-call-live-date]');
  const query = live.locator('[data-call-live-query]');
  const doctor = live.locator('.on-call-live-result strong');

  await date.fill('2026-09-07');
  await query.fill('endoscopia');
  await expect(doctor).toHaveText(/Camilo Navarrete/i, { timeout: 20000 });

  await date.fill('2026-09-14');
  await expect(doctor).toHaveText(/Cesar Serrano/i, { timeout: 20000 });

  await date.fill('2026-09-28');
  await expect(doctor).toHaveText(/Hugo Veis/i, { timeout: 20000 });
});

test('buscador de llamados deduplica coincidencias y no repite metadatos en cada tarjeta', async ({ page }) => {
  const live = await liveSearch(page);
  await live.locator('[data-call-live-date]').fill('2026-09-07');
  await live.locator('[data-call-live-query]').fill('infecto');

  const cards = live.locator('.on-call-live-result');
  await expect(cards.first()).toBeVisible({ timeout: 20000 });
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('.on-call-specialty')).toHaveText(/Infectolog/i);
  await expect(cards.first()).toContainText(/Felipe Gómez/i);
  await expect(cards.first()).not.toContainText(/Vigente/i);
  await expect(cards.first()).not.toContainText(/fuente Septiembre 2026/i);
  await expect(live.locator('[data-call-live-clear]')).toHaveText('Limpiar');
});

test('buscador de llamados no vuelve a mostrar Mayo 2026 como fuente activa', async ({ page }) => {
  const live = await liveSearch(page);
  await expect(live.locator('[data-call-live-source]')).not.toContainText('Mayo 2026');
  await expect(page.locator('#callsSearchPanel')).not.toContainText('Mayo 2026');
});
