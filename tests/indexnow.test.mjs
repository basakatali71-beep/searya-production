import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalIndexNowUrls, indexNowKeyPath, submitIndexNow } from '../src/services/indexNow.js';

test('IndexNow only submits canonical URLs from the Searya host', async () => {
  let request;
  const result = await submitIndexNow(['/blog/new-post#section', 'https://searya.com/projects/example', 'https://example.com/skip'], {
    origin: 'https://searya.com',
    key: 'test-indexnow-key-1234',
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response('', { status: 202 });
    }
  });
  assert.equal(result.submitted, 2);
  assert.equal(request.url, 'https://api.indexnow.org/indexnow');
  const body = JSON.parse(request.init.body);
  assert.deepEqual(body.urlList, ['https://searya.com/blog/new-post', 'https://searya.com/projects/example']);
  assert.equal(body.keyLocation, 'https://searya.com/test-indexnow-key-1234.txt');
});

test('IndexNow validates the public key path and deduplicates URLs', () => {
  assert.equal(indexNowKeyPath('valid-key-1234'), '/valid-key-1234.txt');
  assert.throws(() => indexNowKeyPath('short'));
  assert.deepEqual(canonicalIndexNowUrls(['/blog/a', '/blog/a'], 'https://searya.com'), ['https://searya.com/blog/a']);
});
