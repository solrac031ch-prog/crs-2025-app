const { test, expect } = require('@playwright/test');

test('contenido Storage usa file_path y una URL firmada temporal', async ({ page }) => {
  await page.addInitScript(() => {
    window.__crsStorageSignedCalls = [];

    const client = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null })
      },
      from(table) {
        const filters = {};
        const query = {
          select() { return query; },
          eq(column, value) { filters[column] = value; return query; },
          in() { return query; },
          order() { return query; },
          then(resolve) {
            const isPaper = table === 'crs_content_items' && filters.kind === 'paper';
            const data = isPaper ? [{
              id: 'storage-private-test',
              kind: 'paper',
              title: 'Paper Storage privado',
              description: 'Prueba de URL firmada.',
              month: '2099-01',
              status: 'published',
              file_path: 'paper/2099-01/prueba.pdf',
              url: 'https://mjrcymctfnnyabvmfgda.supabase.co/storage/v1/object/public/crs-public/paper/2099-01/prueba.pdf',
              image_url: '',
              event_url: '',
              created_at: '2099-01-01T00:00:00.000Z'
            }] : [];
            return Promise.resolve(resolve({ data, error: null }));
          }
        };
        return query;
      },
      storage: {
        from(bucket) {
          return {
            async createSignedUrl(path, ttl) {
              window.__crsStorageSignedCalls.push({ bucket, path, ttl });
              return {
                data: {
                  signedUrl: `https://mjrcymctfnnyabvmfgda.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=prueba`
                },
                error: null
              };
            }
          };
        }
      }
    };

    window.supabase = { createClient: () => client };
  });

  await page.goto('/index.html#/paper', { waitUntil: 'domcontentloaded' });

  const signedLink = page.locator('a[href*="token=prueba"]');
  await expect(signedLink).toHaveCount(1);
  await expect(signedLink).toHaveAttribute('href', /\/storage\/v1\/object\/sign\/crs-public\/paper\/2099-01\/prueba\.pdf\?token=prueba$/);

  const calls = await page.evaluate(() => window.__crsStorageSignedCalls);
  expect(calls).toEqual([{ bucket: 'crs-public', path: 'paper/2099-01/prueba.pdf', ttl: 900 }]);
});