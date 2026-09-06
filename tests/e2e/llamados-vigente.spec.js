const { test, expect } = require('@playwright/test');

test('buscador de llamados usa la rotativa vigente publicada por Jefatura', async ({ page }) => {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#callsPage')).toHaveClass(/\bactive\b/);

  const live = page.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 15000 });
  await expect(live.locator('[data-call-live-source]')).toContainText('Septiembre 2026');
  await expect(live.locator('[data-call-live-source]')).toContainText('Rotativa vigente');

  const date = live.locator('[data-call-live-date]');
  await expect(date).toHaveValue(/^2026-09-/);
});

test('buscar uro devuelve Urología y nunca Neurología', async ({ page }) => {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  const live = page.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 15000 });

  await live.locator('[data-call-live-query]').fill('uro');

  const cards = live.locator('.on-call-live-result');
  await expect(cards.first()).toBeVisible({ timeout: 20000 });
  const specialties = await cards.locator('.on-call-specialty').allTextContents();
  expect(specialties.some((name) => /^Urolog/i.test(name))).toBeTruthy();
  expect(specialties.some((name) => /Neurolog/i.test(name))).toBeFalsy();
  await expect(live.locator('[data-call-live-status]')).not.toContainText('No encontré');
});

test('buscador de llamados deduplica coincidencias y no repite metadatos en cada tarjeta', async ({ page }) => {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  const live = page.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 15000 });

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
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  const live = page.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 15000 });
  await expect(live.locator('[data-call-live-source]')).not.toContainText('Mayo 2026');
});
