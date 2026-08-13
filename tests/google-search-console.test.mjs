import test from 'node:test';
import assert from 'node:assert/strict';
import { submitSitemapToGoogle } from '../src/services/googleSearchConsole.js';

test('Google Search Console sitemap submission is optional without credentials', async () => {
  const result = await submitSitemapToGoogle({ credentialsJson: '' });
  assert.deepEqual(result, { configured: false, submitted: false });
});

test('Google Search Console submits the canonical sitemap using the supported endpoint', async () => {
  let request;
  const result = await submitSitemapToGoogle({
    credentials: { client_email: 'search@project.iam.gserviceaccount.com', private_key: 'unused-in-test' },
    accessToken: 'test-token',
    siteUrl: 'sc-domain:searya.com',
    sitemapUrl: 'https://searya.com/sitemap.xml',
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(null, { status: 204 });
    }
  });
  assert.equal(result.submitted, true);
  assert.equal(request.init.method, 'PUT');
  assert.equal(request.init.headers.Authorization, 'Bearer test-token');
  assert.equal(request.url, 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Asearya.com/sitemaps/https%3A%2F%2Fsearya.com%2Fsitemap.xml');
});
