import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

const testDir = mkdtempSync(join(tmpdir(), 'searya-api-'));
process.env.PORT = '0';
process.env.HOST = '127.0.0.1';
process.env.APP_ORIGIN = 'http://127.0.0.1';
process.env.SEARYA_DB_PATH = join(testDir, 'test.sqlite');
process.env.PAYMENT_MODE = 'demo';
process.env.NODE_ENV = 'test';
process.env.SEARYA_ADMIN_EMAIL = 'admin@searya.test';
process.env.SEARYA_ADMIN_PASSWORD = 'AdminSecurePass123';
process.env.SEARYA_ADMIN_NAME = 'Test Admin';

const { server, db } = await import('../server.mjs');
if (!server.listening) await once(server, 'listening');
const baseUrl = `http://127.0.0.1:${server.address().port}`;

after(async () => {
  await new Promise(resolve => server.close(resolve));
  db.close();
  rmSync(testDir, { recursive: true, force: true });
});

test('health and seeded listings are available', async () => {
  const health = await fetch(`${baseUrl}/api/health`).then(response => response.json());
  assert.equal(health.ok, true);

  const listings = await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json());
  assert.ok(listings.listings.length >= 10);
  assert.equal(listings.listings.every(item => item.type === 'sale'), true);
});

test('registration creates a secure session and listing credits are enforced', async () => {
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'API Test', email: 'api-test@example.com', password: 'SecurePass123', role: 'both' })
  });
  assert.equal(registerResponse.status, 201);
  const cookie = registerResponse.headers.getSetCookie()[0].split(';')[0];
  const user = (await registerResponse.json()).user;
  assert.equal(user.sellerFreeListings, 1);

  const listingResponse = await fetch(`${baseUrl}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      type: 'sale',
      title: 'Test SaaS Projesi',
      category: 'saas',
      price: 500,
      description: 'API testi için yeterince uzun ve güvenli bir proje açıklamasıdır.',
      techStack: ['Node.js', 'SQLite'],
      coverImage: 'data:image/png;base64,iVBORw0KGgo='
    })
  });
  assert.equal(listingResponse.status, 201);
  const listingPayload = await listingResponse.json();
  assert.equal(listingPayload.moderation, 'pending');
  assert.equal(listingPayload.user.sellerFreeListings, 0);

  const mine = await fetch(`${baseUrl}/api/me/listings`, { headers: { Cookie: cookie } }).then(response => response.json());
  assert.equal(mine.listings.length, 1);
  const update = await fetch(`${baseUrl}/api/listings/${listingPayload.listing.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ type: 'sale', title: 'Güncellenmiş Test SaaS', category: 'saas', price: 550, description: 'Güncellenmiş ve yeterince uzun proje açıklaması test metnidir.', techStack: ['Node.js'], coverImage: 'data:image/png;base64,iVBORw0KGgo=' })
  });
  assert.equal(update.status, 200);
});

test('account settings support password change, export and deletion', async () => {
  const register = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Account Test', email: 'account-test@example.com', password: 'SecurePass123', role: 'buyer' }) });
  const cookie = register.headers.getSetCookie()[0].split(';')[0];
  const exported = await fetch(`${baseUrl}/api/account/export`, { headers: { Cookie: cookie } }).then(response => response.json());
  assert.equal(exported.account.email, 'account-test@example.com');
  const passwordChange = await fetch(`${baseUrl}/api/account/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ currentPassword: 'SecurePass123', newPassword: 'NewSecurePass456' }) });
  assert.equal(passwordChange.status, 200);
  const deletion = await fetch(`${baseUrl}/api/account`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ password: 'NewSecurePass456', confirmation: 'HESABIMI SİL' }) });
  assert.equal(deletion.status, 200);
});

test('demo checkout credits only the authenticated user', async () => {
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Buyer Test', email: 'buyer-test@example.com', password: 'SecurePass123', role: 'buyer' })
  });
  const cookie = registerResponse.headers.getSetCookie()[0].split(';')[0];
  const checkoutResponse = await fetch(`${baseUrl}/api/packages/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ packageKey: 'buyer_connections_10' })
  });
  assert.equal(checkoutResponse.status, 200);
  const checkout = await checkoutResponse.json();
  assert.equal(checkout.paid, true);
  assert.equal(checkout.user.buyerConnections, 12);
});

test('Seller Pro grants separate listing, verification and boost credits', async () => {
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pro Seller', email: 'pro-seller@example.com', password: 'SecurePass123', role: 'seller' })
  });
  const cookie = registerResponse.headers.getSetCookie()[0].split(';')[0];
  const checkoutResponse = await fetch(`${baseUrl}/api/packages/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ packageKey: 'seller_vip_10' })
  });
  assert.equal(checkoutResponse.status, 200);
  const checkout = await checkoutResponse.json();
  assert.equal(checkout.amountCents, 1999);
  assert.equal(checkout.user.sellerListingCredits, 10);
  assert.equal(checkout.user.sellerVipCredits, 1);
  assert.equal(checkout.user.boostCredits, 1);

  const listingResponse = await fetch(`${baseUrl}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      type: 'sale', title: 'Pro Paket Test Projesi', category: 'saas', price: 750,
      description: 'Satıcı Pro paket haklarını doğrulamak için yeterince uzun proje açıklaması.',
      techStack: ['Node.js'], coverImage: 'data:image/png;base64,iVBORw0KGgo='
    })
  });
  const listingPayload = await listingResponse.json();
  assert.equal(listingPayload.user.sellerFreeListings, 0);
  assert.equal(listingPayload.user.sellerListingCredits, 10);
  assert.equal(listingPayload.listing.priorityReview, false);

  const verificationResponse = await fetch(`${baseUrl}/api/listings/${listingPayload.listing.id}/addon`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ addon: 'verification' })
  });
  assert.equal(verificationResponse.status, 200);
  const verification = await verificationResponse.json();
  assert.equal(verification.listing.priorityReview, true);
  assert.equal(verification.user.sellerVipCredits, 0);
});

test('an approved listing can consume a seven-day boost', async () => {
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@searya.test', password: 'AdminSecurePass123' })
  });
  const adminCookie = adminLogin.headers.getSetCookie()[0].split(';')[0];
  await fetch(`${baseUrl}/api/packages/checkout`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie }, body: JSON.stringify({ packageKey: 'seller_vip_10' })
  });
  const listingResponse = await fetch(`${baseUrl}/api/listings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ type: 'sale', title: 'Öne Çıkarma Test Projesi', category: 'ai', price: 900, description: 'Yedi günlük öne çıkarma hakkının çalışmasını doğrulayan yeterli açıklama.', techStack: ['AI'], coverImage: 'data:image/png;base64,iVBORw0KGgo=' })
  });
  const listing = (await listingResponse.json()).listing;
  assert.equal(listing.status, 'Aktif');
  const boostResponse = await fetch(`${baseUrl}/api/listings/${listing.id}/addon`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie }, body: JSON.stringify({ addon: 'boost' })
  });
  assert.equal(boostResponse.status, 200);
  const boost = await boostResponse.json();
  assert.equal(boost.listing.isBoosted, true);
  assert.ok(new Date(boost.listing.boostedUntil).getTime() > Date.now() + 6 * 24 * 60 * 60 * 1000);
});

test('administrator can review and approve a pending listing', async () => {
  const pageView = await fetch(`${baseUrl}/api/analytics/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/' })
  });
  assert.equal(pageView.status, 201);

  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@searya.test', password: 'AdminSecurePass123' })
  });
  assert.equal(adminLogin.status, 200);
  const adminCookie = adminLogin.headers.getSetCookie()[0].split(';')[0];
  const overview = await fetch(`${baseUrl}/api/admin/overview`, { headers: { Cookie: adminCookie } }).then(response => response.json());
  assert.ok(overview.counts.pendingListings >= 1);
  assert.equal(overview.counts.visitorsToday, 1);
  assert.equal(overview.daily.length, 7);
  assert.ok(overview.users.length >= 1);
  const pending = overview.pendingListings[0];

  const moderation = await fetch(`${baseUrl}/api/admin/listings/${pending.id}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ action: 'approve' })
  });
  assert.equal(moderation.status, 200);
  assert.equal((await moderation.json()).listing.status, 'Aktif');

  const targetUser = overview.users.find(user => !user.isAdmin);
  const suspend = await fetch(`${baseUrl}/api/admin/users/${targetUser.id}/status`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie }, body: JSON.stringify({ status: 'suspended' })
  });
  assert.equal(suspend.status, 200);
  const activate = await fetch(`${baseUrl}/api/admin/users/${targetUser.id}/status`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie }, body: JSON.stringify({ status: 'active' })
  });
  assert.equal(activate.status, 200);
});
