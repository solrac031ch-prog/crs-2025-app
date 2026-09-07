const { test, expect } = require('@playwright/test');

test.describe('MASTER búsqueda y trazabilidad', () => {
  test('buscador universal encuentra TVP y abre el protocolo correcto', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

    const trigger = page.locator('[data-master-global-trigger]');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const search = page.locator('[data-master-global-search] input[type="search"]');
    await expect(search).toBeFocused();
    await search.fill('TVP');

    const result = page.locator('.master-search-result[href="#/especialidad/tvp-sospecha-eco-y-horario-inhabil"]').first();
    await expect(result).toBeVisible();
    await expect(result).toContainText(/TVP/i);
    await expect(page.locator('.master-search-ask')).toContainText(/Preguntar.*MASTER IA/i);
    await result.click();
    await expect(page).toHaveURL(/#\/especialidad\/tvp-sospecha-eco-y-horario-inhabil$/);
    await expect(page.locator('#protocolTitle')).toContainText(/TVP/i);
  });

  test('atajo Ctrl+K abre y Escape cierra el buscador', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-master-global-trigger]')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => Boolean(window.CRS_MASTER_SEARCH))).toBe(true);
    await page.keyboard.press('Control+K');
    await expect(page.locator('[data-master-global-search]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-master-global-search]')).toBeHidden();
  });

  test('fuentes de MASTER agregan referencia, protocolo y documento', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-master-global-trigger]')).toBeVisible();

    await page.evaluate(() => {
      const card = document.createElement('article');
      card.className = 'master-ai-source';
      const title = document.createElement('strong');
      title.textContent = 'TVP - sospecha, ECO y horario inhábil';
      card.append(title);
      document.body.append(card);
    });

    const card = page.locator('.master-ai-source');
    await expect(card.locator('.master-ai-source-ref')).toContainText(/p\. 18-19/i);
    await expect(card.getByRole('link', { name: 'Ver protocolo' })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Abrir documento' })).toBeVisible();
  });

  test('rotativa estructurada expone parser y búsqueda segura sin reemplazar PDF si está vacía', async ({ page }) => {
    await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
    await expect.poll(async () => page.evaluate(() => Boolean(window.CRS_STRUCTURED_CALLS))).toBe(true);

    const parsed = await page.evaluate(() => window.CRS_STRUCTURED_CALLS.parseMonthYear('Septiembre 2026'));
    expect(parsed).toEqual({ month: 9, year: 2026, label: 'Septiembre 2026' });
    await expect(page.locator('#callsSearchPanel')).toBeVisible();
  });

  test('buscador universal no genera overflow horizontal en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-global-trigger]').click();
    await page.locator('[data-master-global-search] input').fill('Clave Negra');

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      dialog: document.querySelector('.master-search-dialog')?.getBoundingClientRect().width || 0
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
    expect(widths.dialog).toBeLessThanOrEqual(widths.client + 1);
  });
});
