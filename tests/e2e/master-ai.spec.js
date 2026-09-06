const { test, expect } = require('@playwright/test');

test.describe('MASTER IA', () => {
  test('carga diferida, recupera fuentes y muestra respuesta basada en MASTER', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

    const launcher = page.locator('[data-master-ai-launcher]');
    await expect(launcher).toBeVisible();
    await expect(page.locator('script[data-master-ai-runtime]')).toHaveCount(0);

    await launcher.click();
    await expect(page.locator('[data-master-ai-dialog]')).toBeVisible();
    await expect(page.locator('script[data-master-ai-runtime]')).toHaveCount(1);

    await page.evaluate(() => {
      window.CRS_SUPABASE.client = () => ({
        functions: {
          invoke: async (_name, options) => ({
            data: {
              configured: true,
              mode: 'generative',
              answer: 'Usa el flujo institucional recuperado y verifica la fuente MASTER.',
              sources: options.body.sources
            },
            error: null
          })
        }
      });
    });

    await page.locator('#masterAiQuestion').fill('TVP en horario inhábil: ¿cuál es el flujo?');
    await page.locator('[data-master-ai-form] button[type="submit"]').click();

    await expect(page.locator('[data-master-ai-answer]')).toBeVisible();
    await expect(page.locator('[data-master-ai-answer-text]')).toContainText('flujo institucional');
    await expect(page.locator('[data-master-ai-sources]')).toContainText(/TVP/i);
    await expect(page.locator('[data-master-ai-status]')).toContainText('fuentes recuperadas');
  });

  test('si la redacción generativa falla conserva una respuesta extractiva con fuentes', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-ai-launcher]').click();

    await page.evaluate(() => {
      window.CRS_SUPABASE.client = () => ({
        functions: {
          invoke: async (_name, options) => ({
            data: {
              configured: true,
              mode: 'sources',
              answer: 'Respuesta extractiva basada solo en MASTER.\n\nFuente MASTER: Saturación SEA y Clave Negra',
              sources: options.body.sources,
              notice: 'La redacción generativa está temporalmente no disponible; se muestra únicamente contenido extraído de MASTER.'
            },
            error: null
          })
        }
      });
    });

    await page.locator('#masterAiQuestion').fill('¿Cómo activo Clave Negra?');
    await page.locator('[data-master-ai-form] button[type="submit"]').click();

    await expect(page.locator('[data-master-ai-answer]')).toBeVisible();
    await expect(page.locator('[data-master-ai-answer-text]')).toContainText(/Fuente MASTER/i);
    await expect(page.locator('[data-master-ai-status]')).toContainText(/Respuesta extractiva/i);
    await expect(page.locator('[data-master-ai-config]')).toBeVisible();
    await expect(page.locator('[data-master-ai-config]')).toContainText(/temporalmente/i);
  });

  test('bloquea datos identificatorios antes de invocar IA', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-ai-launcher]').click();

    await page.evaluate(() => {
      window.__masterAiInvocations = 0;
      window.CRS_SUPABASE.client = () => ({
        functions: {
          invoke: async () => {
            window.__masterAiInvocations += 1;
            return { data: { configured: true, mode: 'generative', answer: 'NO DEBE APARECER', sources: [] }, error: null };
          }
        }
      });
    });

    await page.locator('#masterAiQuestion').fill('Paciente RUT 12.345.678-5 con TVP');
    await page.locator('[data-master-ai-form] button[type="submit"]').click();

    await expect(page.locator('[data-master-ai-status]')).toContainText(/Retira RUT/i);
    expect(await page.evaluate(() => window.__masterAiInvocations)).toBe(0);
  });

  test('si no hay fuente suficiente no inventa una respuesta', async ({ page }) => {
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-ai-launcher]').click();

    await page.locator('#masterAiQuestion').fill('protocolo inexistente xyzqwerty');
    await page.locator('[data-master-ai-form] button[type="submit"]').click();

    await expect(page.locator('[data-master-ai-answer]')).toBeVisible();
    await expect(page.locator('[data-master-ai-answer-text]')).toContainText(/No encontré respaldo suficiente/i);
  });

  test('el panel no provoca overflow horizontal en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-master-ai-launcher]').click();
    await expect(page.locator('[data-master-ai-dialog]')).toBeVisible();

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      sheet: document.querySelector('.master-ai-sheet')?.getBoundingClientRect().width || 0
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
    expect(widths.sheet).toBeLessThanOrEqual(widths.client + 1);
  });
});
