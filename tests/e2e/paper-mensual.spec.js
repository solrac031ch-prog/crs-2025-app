const { test, expect } = require('@playwright/test');

test('Paper del mes organiza el histórico por año y mes', async ({ page }) => {
  await page.goto('/index.html#/paper', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#managementContent .gf-shell')).toBeVisible();
  await expect(page.locator('head link[data-crs-route-style="paper-mensual"]')).toHaveCount(1);
  await expect(page.locator('script[data-crs-route-module="paper-mensual"]')).toHaveCount(1);

  await page.evaluate(() => {
    const shell = document.querySelector('#managementContent .gf-shell');
    shell.innerHTML = `
      <section class="gf-hero"><h2>Paper del mes</h2><p>Texto previo</p></section>
      <section class="gf-paper-layout">
        <main class="gf-paper-main">
          <article class="gf-paper-featured">
            <span class="gf-tag">08/2026</span>
            <h2>Paper vigente</h2>
          </article>
        </main>
        <aside class="gf-repo">
          <h2>Repositorio</h2>
          <div class="gf-repo-list">
            <a class="gf-repo-item" href="https://example.com/julio"><strong>Paper julio</strong><span>07/2026</span></a>
            <a class="gf-repo-item" href="https://example.com/junio"><strong>Paper junio</strong><span>06/2026</span></a>
            <a class="gf-repo-item" href="https://example.com/diciembre"><strong>Paper diciembre</strong><span>12/2025</span></a>
          </div>
        </aside>
      </section>`;
    window.dispatchEvent(new CustomEvent('crs:ui-section-ready', { detail: { route: '#/paper' } }));
  });

  await expect(page.locator('.pm-paper-shell .pm-current')).toHaveText('Lectura actual');
  await expect(page.locator('.pm-paper-shell .pm-featured-month')).toHaveText('Agosto 2026');
  await expect(page.locator('.pm-repo > h2')).toHaveText('Biblioteca por mes');
  await expect(page.locator('.pm-year')).toHaveCount(2);
  await expect(page.locator('.pm-year').first().locator('.pm-year-head strong')).toHaveText('2026');
  await expect(page.locator('.pm-year').first().locator('.pm-month')).toHaveText(['Julio', 'Junio']);
  await expect(page.locator('.pm-year').nth(1).locator('.pm-year-head strong')).toHaveText('2025');
  await expect(page.locator('.pm-year').nth(1).locator('.pm-month')).toHaveText('Diciembre');
});

test('Paper del mes prioriza la fecha del paper y no la fecha de carga', async ({ page }) => {
  await page.route('https://mjrcymctfnnyabvmfgda.supabase.co/**', (route) => route.abort());
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    sessionStorage.setItem('crsPublicContentCacheV3:paper', JSON.stringify({
      savedAt: Date.now(),
      items: [
        {
          id: 'paper-2025-subido-despues',
          title: 'Paper diciembre 2025 subido hoy',
          description: 'Paper antiguo cargado recientemente.',
          month: '2025-12',
          url: 'https://example.com/2025',
          createdAt: '2026-08-22T22:00:00.000Z'
        },
        {
          id: 'paper-2026-subido-antes',
          title: 'Paper julio 2026',
          description: 'Paper más reciente por fecha clínica.',
          month: '2026-07',
          url: 'https://example.com/2026',
          createdAt: '2026-01-10T10:00:00.000Z'
        }
      ]
    }));
    location.hash = '#/paper';
  });

  await expect(page.locator('.gf-paper-featured h2')).toHaveText('Paper julio 2026');
  await expect(page.locator('.pm-featured-month')).toHaveText('Julio 2026');
  await expect(page.locator('.pm-paper-item strong')).toHaveText('Paper diciembre 2025 subido hoy');
});
