import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

const testDir = mkdtempSync(join(tmpdir(), 'searya-free-launch-'));
process.env.PORT = '0';
process.env.HOST = '127.0.0.1';
process.env.APP_ORIGIN = 'http://127.0.0.1';
process.env.SEARYA_DB_PATH = join(testDir, 'test.sqlite');
process.env.PAYMENT_MODE = 'disabled';
process.env.LAUNCH_FREE_MODE = 'true';
process.env.NODE_ENV = 'test';
process.env.SEARYA_ADMIN_EMAIL = 'free-admin@searya.test';
process.env.SEARYA_ADMIN_PASSWORD = 'AdminSecurePass123';

const { server, db } = await import('../server.mjs');
if (!server.listening) await once(server, 'listening');
const baseUrl = `http://127.0.0.1:${server.address().port}`;

after(async () => {
  await new Promise(resolve => server.close(resolve));
  db.close();
  rmSync(testDir, { recursive: true, force: true });
});

async function register(name, email, role = 'both') {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: 'SecurePass123', role })
  });
  return { response, cookie: response.headers.getSetCookie()[0].split(';')[0], payload: await response.json() };
}

function listingBody(index) {
  return {
    type: 'sale',
    title: `Ücretsiz Lansman Projesi ${index}`,
    category: 'saas',
    price: 500 + index,
    description: 'Ücretsiz lansman ilan sınırını güvenli biçimde doğrulayan yeterince uzun açıklama.',
    techStack: ['Node.js'],
    coverImage: 'data:image/png;base64,iVBORw0KGgo='
  };
}

test('free launch exposes the public limits and hides packages', async () => {
  const health = await fetch(`${baseUrl}/api/health`).then(response => response.json());
  assert.equal(health.launchFree, true);
  assert.deepEqual(health.launchLimits, { activeListings: 3, newConnections: 10, connectionWindowDays: 30 });
  const packages = await fetch(`${baseUrl}/api/packages`).then(response => response.json());
  assert.equal(packages.launchFree, true);
  assert.deepEqual(packages.packages, []);
});

test('free launch refuses direct checkout requests', async () => {
  const { cookie } = await register('Free Checkout User', 'free-checkout@example.com', 'buyer');
  const response = await fetch(`${baseUrl}/api/packages/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ packageKey: 'buyer_connections_10' })
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, 'FREE_LAUNCH_ACTIVE');
});

test('free launch allows three active listings and rejects the fourth', async () => {
  const { cookie, payload } = await register('Free Seller', 'free-seller@example.com', 'seller');
  assert.equal(payload.user.sellerFreeListings, 3);

  for (let index = 1; index <= 3; index += 1) {
    const response = await fetch(`${baseUrl}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(listingBody(index))
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).user.sellerFreeListings, 3 - index);
  }

  const rejected = await fetch(`${baseUrl}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(listingBody(4))
  });
  assert.equal(rejected.status, 422);
  assert.equal((await rejected.json()).error.code, 'FREE_LAUNCH_LISTING_LIMIT');
});

test('free launch allows ten new seller connections in a rolling 30-day window', async () => {
  const { cookie, payload } = await register('Free Buyer', 'free-buyer@example.com', 'buyer');
  assert.equal(payload.user.buyerConnections, 10);
  const listings = (await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json())).listings;
  assert.ok(listings.length >= 11);

  for (let index = 0; index < 10; index += 1) {
    const response = await fetch(`${baseUrl}/api/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ listingId: listings[index].id, message: 'Bu proje hakkında daha fazla bilgi almak istiyorum.' })
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).user.buyerConnections, 9 - index);
  }

  const rejected = await fetch(`${baseUrl}/api/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ listingId: listings[10].id, message: 'Bu proje hakkında daha fazla bilgi almak istiyorum.' })
  });
  assert.equal(rejected.status, 422);
  assert.equal((await rejected.json()).error.code, 'FREE_LAUNCH_CONNECTION_LIMIT');

  const existing = await fetch(`${baseUrl}/api/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ listingId: listings[0].id, message: 'Mevcut görüşmeye geri dönüyorum.' })
  });
  assert.equal(existing.status, 201);
});

test('campaign attribution reaches the administrator conversion funnel', async () => {
  const pageView = await fetch(`${baseUrl}/api/analytics/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/?utm_source=x&utm_medium=paid&utm_campaign=seller_launch', referrer: 'https://t.co/example' })
  });
  assert.equal(pageView.status, 201);
  const visitorCookie = pageView.headers.getSetCookie()[0].split(';')[0];

  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: visitorCookie },
    body: JSON.stringify({ name: 'Campaign User', email: 'campaign@example.com', password: 'SecurePass123', role: 'both' })
  });
  assert.equal(registration.status, 201);
  const sessionCookie = registration.headers.getSetCookie()[0].split(';')[0];
  const cookies = `${visitorCookie}; ${sessionCookie}`;

  const listing = await fetch(`${baseUrl}/api/listings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookies }, body: JSON.stringify(listingBody(20))
  });
  assert.equal(listing.status, 201);

  const seedListing = (await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json())).listings.find(item => String(item.ownerId).startsWith('seed-'));
  const conversation = await fetch(`${baseUrl}/api/threads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookies }, body: JSON.stringify({ listingId: seedListing.id, message: 'Kampanya dönüşüm testi için bilgi istiyorum.' })
  });
  assert.equal(conversation.status, 201);

  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'free-admin@searya.test', password: 'AdminSecurePass123' })
  });
  const adminCookie = adminLogin.headers.getSetCookie()[0].split(';')[0];
  const overview = await fetch(`${baseUrl}/api/admin/overview`, { headers: { Cookie: adminCookie } }).then(response => response.json());
  const campaign = overview.analytics.campaigns.find(item => item.source === 'x' && item.medium === 'paid' && item.campaign === 'seller_launch');
  assert.ok(campaign);
  assert.equal(campaign.visitors, 1);
  assert.equal(campaign.signups, 1);
  assert.equal(campaign.listings, 1);
  assert.equal(campaign.conversations, 1);
});

test('consented behavior analytics are sanitized and visible only to administrators', async () => {
  const pageView = await fetch(`${baseUrl}/api/analytics/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/?utm_source=x&utm_medium=paid&utm_campaign=behavior_test' })
  });
  const visitorCookie = pageView.headers.getSetCookie()[0].split(';')[0];
  const sessionId = '11111111-2222-4333-8444-555555555555';
  const presence = await fetch(`${baseUrl}/api/analytics/presence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: visitorCookie },
    body: JSON.stringify({ sessionId, action: 'enter', path: '/', device: 'mobile' })
  });
  assert.equal(presence.status, 201);
  const tracked = await fetch(`${baseUrl}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: visitorCookie },
    body: JSON.stringify({
      eventName: 'search_performed',
      metadata: { sessionId, path: '/', device: 'mobile', query: 'contact person@example.com', resultCount: 0, password: 'never-store-this', message: 'private message' }
    })
  });
  assert.equal(tracked.status, 201);
  const stored = db.prepare(`SELECT metadata_json AS metadataJson FROM analytics_events WHERE event_name='search_performed' ORDER BY created_at DESC LIMIT 1`).get();
  assert.equal(stored.metadataJson.includes('never-store-this'), false);
  assert.equal(stored.metadataJson.includes('private message'), false);
  assert.equal(stored.metadataJson.includes('person@example.com'), false);

  const publicOverview = await fetch(`${baseUrl}/api/admin/overview`);
  assert.equal(publicOverview.status, 401);
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'free-admin@searya.test', password: 'AdminSecurePass123' })
  });
  const adminCookie = adminLogin.headers.getSetCookie()[0].split(';')[0];
  const overview = await fetch(`${baseUrl}/api/admin/overview`, { headers: { Cookie: adminCookie } }).then(response => response.json());
  assert.equal(overview.analytics.behavior.searches.some(item => item.query.includes('[email removed]')), true);
  assert.equal(overview.analytics.behavior.devices.some(item => item.key === 'mobile'), true);
  assert.equal(overview.analytics.behavior.journeys.some(item => item.events.some(event => event.eventName === 'search_performed')), true);
});
