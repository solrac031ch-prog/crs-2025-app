import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('diagnóstico de la rotativa real publicada por Jefatura', async ({ page }) => {
  await page.goto('/index.html#/llamados');
  await expect(page.locator('#callsPage')).toHaveClass(/active/);

  await page.waitForFunction(() => Boolean(window.CRS_SUPABASE?.fetchDocuments));
  const source = await page.evaluate(async () => {
    const docs = await window.CRS_SUPABASE.fetchDocuments(['llamados']);
    return docs.find((doc) => doc.key === 'especialistas' && doc.status === 'published') || null;
  });

  expect(source?.url).toBeTruthy();
  await page.waitForFunction(() => Boolean(window.pdfjsLib?.getDocument), null, { timeout: 20000 });

  const diagnostic = await page.evaluate(async (url) => {
    const clean = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const wanted = ['bronco', 'cardio', 'diab', 'endocr', 'endosc', 'gastro', 'geria', 'onco', 'hemato', 'infect', 'nefro', 'neuro', 'reuma', 'uro'];
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`PDF ${response.status}`);
    const buffer = await response.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages = [];

    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      const rows = [];
      const items = (content.items || [])
        .filter((item) => String(item.str || '').trim())
        .map((item) => ({ text: String(item.str || '').trim(), x: Number(item.transform?.[4] || 0), y: Number(item.transform?.[5] || 0), width: Number(item.width || 0) }))
        .sort((a, b) => b.y - a.y || a.x - b.x);

      for (const item of items) {
        let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2.6);
        if (!row) { row = { y: item.y, items: [] }; rows.push(row); }
        row.items.push(item);
      }

      rows.forEach((row) => {
        row.items.sort((a, b) => a.x - b.x);
        row.text = row.items.map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim();
        row.firstX = Math.min(...row.items.map((item) => item.x));
      });
      rows.sort((a, b) => b.y - a.y);

      const headers = rows
        .map((row) => ({
          y: Math.round(row.y * 10) / 10,
          text: row.text,
          nums: row.items
            .filter((item) => /^\d{1,2}$/.test(item.text) && Number(item.text) >= 1 && Number(item.text) <= 31)
            .map((item) => ({ value: Number(item.text), x: Math.round((item.x + item.width / 2) * 10) / 10 }))
        }))
        .filter((row) => row.nums.length >= 3);

      const specialties = rows
        .filter((row) => wanted.some((term) => clean(row.text).includes(term)))
        .map(({ y, firstX, text }) => ({ y: Math.round(y * 10) / 10, firstX: Math.round(firstX * 10) / 10, text }));

      pages.push({ pageNo, headers, specialties });
    }

    return { numPages: pdf.numPages, pages };
  }, source.url);

  writeFileSync('diagnostico-llamados.json', JSON.stringify({ title: source.title, file_name: source.file_name, url: source.url, diagnostic }, null, 2));
});
