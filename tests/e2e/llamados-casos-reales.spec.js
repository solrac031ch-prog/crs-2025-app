const { test, expect } = require('@playwright/test');

test('casos reales confirmados del 7 de septiembre', async ({ page }) => {
  await page.goto('/index.html#/llamados', { waitUntil: 'domcontentloaded' });
  const live = page.locator('[data-call-live-search]');
  await expect(live).toBeVisible({ timeout: 20000 });

  const diagnostic = await page.evaluate(async () => {
    const docs = await window.CRS_SUPABASE.fetchDocuments(['llamados']);
    const source = docs.find((doc) => doc.key === 'especialistas' && doc.status === 'published');
    while (!window.pdfjsLib?.getDocument) await new Promise((resolve) => setTimeout(resolve, 50));
    const response = await fetch(source.url, { cache: 'no-store' });
    const buffer = await response.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const page1 = await pdf.getPage(1);
    const content = await page1.getTextContent();
    const items = (content.items || []).map((item) => ({
      text: String(item.str || '').trim(),
      x: Number(item.transform?.[4] || 0),
      y: Number(item.transform?.[5] || 0),
      width: Number(item.width || 0)
    })).filter((item) => item.text);
    const targets = [];
    for (const anchor of items.filter((item) => /Endocrinolog|Endoscopia/i.test(item.text))) {
      if (anchor.y < 438 && anchor.y > 338) {
        targets.push({
          anchor,
          row: items.filter((item) => Math.abs(item.y - anchor.y) <= 2.6).sort((a, b) => a.x - b.x)
        });
      }
    }
    const headers = items
      .filter((item) => /^\d{1,2}$/.test(item.text) && item.y < 440 && item.y > 435)
      .sort((a, b) => a.x - b.x);
    return { headers, targets };
  });
  console.log('LLAMADOS_COORDS', JSON.stringify(diagnostic));

  const date = live.locator('[data-call-live-date]');
  const query = live.locator('[data-call-live-query]');
  const cards = live.locator('.on-call-live-result');

  await date.fill('2026-09-07');
  await query.fill('endoscopia');
  await expect(cards).toHaveCount(1, { timeout: 20000 });
  await expect(cards.first().locator('.on-call-specialty')).toHaveText(/Endoscopia/i);
  await expect(cards.first().locator('strong')).toHaveText(/^Dr\. Camilo Navarrete$/i);

  await query.fill('endocrino');
  await expect(cards).toHaveCount(1, { timeout: 20000 });
  await expect(cards.first().locator('.on-call-specialty')).toHaveText(/Endocrinolog/i);
  await expect(cards.first().locator('strong')).toContainText(/Mar[ií]a Doberti/i);
  await expect(cards.first().locator('strong')).toContainText(/Teleinterconsulta/i);
});
