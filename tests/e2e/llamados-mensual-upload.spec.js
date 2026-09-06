const { test, expect } = require('@playwright/test');

test('el validador rechaza un archivo que solo se llama PDF pero no es una rotativa', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
  const message = await page.evaluate(async () => {
    const fake = new File(['esto no es un pdf'], 'octubre-2026.pdf', { type: 'application/pdf' });
    try {
      await window.CRS_CALLS_MONTHLY_GUARD.validateFile(fake);
      return 'ACEPTADO';
    } catch (error) {
      return String(error?.message || error);
    }
  });

  expect(message).not.toBe('ACEPTADO');
  expect(message).toMatch(/no pudo leerse como PDF|no se reemplazó/i);
});
