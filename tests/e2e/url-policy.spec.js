const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');

function source(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('política común acepta URLs seguras y bloquea esquemas peligrosos', async ({ page }) => {
  await page.goto('/index.html#/inicio', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const policy = window.CRS_URL_POLICY;
    const requiredRejectsJavascript = (() => {
      try {
        policy.required('javascript:alert(1)', 'URL de prueba');
        return false;
      } catch (error) {
        return /HTTPS/.test(String(error?.message || error));
      }
    })();

    return {
      https: policy.safe('https://example.com/documento.pdf'),
      protocolRelative: policy.safe('//example.com/documento.pdf'),
      relative: policy.safe('./form-docs/documento.pdf'),
      hash: policy.safe('#/paper'),
      javascript: policy.safe('javascript:alert(1)'),
      data: policy.safe('data:text/html,<script>alert(1)</script>'),
      blob: policy.safe('blob:https://example.com/abc'),
      file: policy.safe('file:///tmp/documento.pdf'),
      mailto: policy.safe('mailto:test@example.com'),
      httpRemote: policy.safe('http://example.com/documento.pdf'),
      controls: policy.safe('https://example.com/\ndocumento.pdf'),
      requiredRejectsJavascript
    };
  });

  expect(result.https).toBe('https://example.com/documento.pdf');
  expect(result.protocolRelative).toBe('https://example.com/documento.pdf');
  expect(result.relative).toMatch(/\/form-docs\/documento\.pdf$/);
  expect(result.hash).toContain('#/paper');
  expect(result.javascript).toBe('');
  expect(result.data).toBe('');
  expect(result.blob).toBe('');
  expect(result.file).toBe('');
  expect(result.mailto).toBe('');
  expect(result.httpRemote).toBe('');
  expect(result.controls).toBe('');
  expect(result.requiredRejectsJavascript).toBe(true);
});

test('Supabase valida URLs al ingresar, leer y renderizar documentos', async () => {
  const backend = source('supabase-backend.js');

  expect(backend).toContain('const safeUrl = (value) => window.CRS_URL_POLICY?.safe?.(value) || ""');
  expect(backend).toContain('const href = safeUrl(row.url);');
  expect(backend).toContain('eventUrl: safeUrl(item.event_url)');
  expect(backend).toContain('imageUrl: safeUrl(item.image_url)');
  expect(backend).toContain('createSignedUrl(path, SIGNED_URL_TTL_SECONDS)');
  expect(backend).toContain('if (item?.file_path) return fileAccessUrl(item.file_path);');
  expect(backend).not.toContain('getPublicUrl(');
  expect(backend).toContain('const explicitEventUrl = requiredUrl(formData.get("eventUrl"), "URL de evento")');
  expect(backend).toContain('const explicitUrl = requiredUrl(formData.get("url"), "URL del documento")');
  expect(backend).toContain('const explicitUrl = requiredUrl(formData.get("url"), "URL del flujo")');
});

test('renderer público vuelve a validar enlaces, imágenes y limpia caché previa', async () => {
  const renderer = source('gestion-panel-final.js');

  expect(renderer).toContain('const safeUrl = (value) => window.CRS_URL_POLICY?.safe?.(value) || ""');
  expect(renderer).toContain('const CACHE_PREFIX = "crsPublicContentCacheV3:"');
  expect(renderer).toContain('.map(safeUrl).filter(Boolean)');
  expect(renderer).toContain('const href = safeUrl(item.eventUrl || item.url || "")');
  expect(renderer).toContain('const href = safeUrl(paper.url)');
  expect(renderer).not.toContain('href="${esc(paper.url || "#/paper")}"');
});
