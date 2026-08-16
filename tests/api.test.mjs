import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { blogPosts } from '../src/data/blogPosts.js';
import { INDEXNOW_KEY, indexNowKeyPath } from '../src/services/indexNow.js';

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
process.env.POLAR_WEBHOOK_SECRET = 'test-polar-webhook-secret';
process.env.POLAR_PRODUCT_BUYER_CONNECTIONS_10 = '11111111-1111-4111-8111-111111111111';
process.env.POLAR_PRODUCT_SELLER_LISTINGS_3 = '22222222-2222-4222-8222-222222222222';
process.env.POLAR_PRODUCT_SELLER_VIP_10 = '33333333-3333-4333-8333-333333333333';

const { server, db, fulfillPolarOrder } = await import('../server.mjs');
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
  assert.deepEqual(health.socialAuth, { google: false });

  const listings = await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json());
  assert.ok(listings.listings.length >= 10);
  assert.equal(listings.listings.every(item => item.type === 'sale'), true);
});

test('private application files are never exposed by the static server', async () => {
  for (const path of ['/server.mjs', '/package.json', '/package-lock.json', '/data/searya.sqlite', '/.env', '/.git/config', '/src/services/indexNow.js']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 404, `${path} must not be publicly readable`);
  }

  const publicScript = await fetch(`${baseUrl}/src/app.js`);
  assert.equal(publicScript.status, 200);
  assert.match(publicScript.headers.get('content-security-policy') || '', /^$/);

  const home = await fetch(`${baseUrl}/`);
  const homeHtml = await home.text();
  const contentSecurityPolicy = home.headers.get('content-security-policy') || '';
  assert.match(contentSecurityPolicy, /frame-ancestors 'none'/);
  assert.doesNotMatch(contentSecurityPolicy, /unsafe-eval|unpkg\.com|cdn\.tailwindcss\.com/);
  assert.doesNotMatch(homeHtml, /unpkg\.com|cdn\.tailwindcss\.com/);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('x-frame-options'), 'DENY');

  const localUiAsset = await fetch(`${baseUrl}/public/vendor/tailwind.css?v=3.4.19`);
  assert.equal(localUiAsset.status, 200);
  assert.match(localUiAsset.headers.get('content-type') || '', /text\/css/);
});

test('request validation rejects cross-site mutations, non-JSON bodies and oversized payloads', async () => {
  const crossSite = await fetch(`${baseUrl}/api/analytics/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example', 'Sec-Fetch-Site': 'cross-site' },
    body: JSON.stringify({ path: '/' })
  });
  assert.equal(crossSite.status, 403);

  const formEncoded = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'name=Invalid&email=invalid%40example.com&password=SecurePass123'
  });
  assert.equal(formEncoded.status, 415);

  const oversized = await fetch(`${baseUrl}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName: 'button_clicked', metadata: { value: 'x'.repeat(140_000) } })
  });
  assert.equal(oversized.status, 413);

  const weakPassword = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Weak Password', email: 'weak-password@example.com', password: 'short123', role: 'buyer' })
  });
  assert.equal(weakPassword.status, 422);
});

test('sign-in throttling also protects an account across repeated attempts', async () => {
  const statuses = [];
  for (let attempt = 0; attempt < 9; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `198.51.100.${attempt + 1}` },
      body: JSON.stringify({ email: 'targeted-account@example.com', password: 'IncorrectPassword123' })
    });
    statuses.push(response.status);
  }
  assert.deepEqual(statuses.slice(0, 8), Array(8).fill(401));
  assert.equal(statuses[8], 429);
});

test('technical SEO exposes canonical metadata, robots rules and public sitemap URLs', async () => {
  const indexNowKey = await fetch(`${baseUrl}${indexNowKeyPath()}`);
  assert.equal(indexNowKey.status, 200);
  assert.equal(await indexNowKey.text(), INDEXNOW_KEY);

  const homepage = await fetch(`${baseUrl}/?utm_source=test`).then(response => response.text());
  assert.match(homepage, /<title>Searya Tools — Free QR, Time Card &amp; Invoice Tools<\/title>/);
  assert.match(homepage, /<meta name="description" content="Create QR codes, calculate work hours, and make professional invoices, quotes and receipts\. Fast, private and free to use\.">/);
  assert.match(homepage, /Small business work,/);
  assert.match(homepage, /finished faster\./);
  assert.match(homepage, /No account required/);
  assert.match(homepage, /<link rel="canonical" href="https:\/\/searya\.com\/">/);
  assert.match(homepage, /"@type":"Organization"/);
  assert.match(homepage, /"@type":"WebSite"/);
  assert.match(homepage, /"@type":"ItemList"/);
  assert.match(homepage, /href="\/qr-code-generator"/);
  assert.match(homepage, /href="\/time-card-calculator"/);
  assert.match(homepage, /href="\/invoice-generator"/);

  const robots = await fetch(`${baseUrl}/robots.txt`).then(response => response.text());
  assert.match(robots, /Disallow: \/admin\.html/);
  assert.match(robots, /Disallow: \/messages/);
  assert.match(robots, /Sitemap: https:\/\/searya\.com\/sitemap\.xml/);

  const listings = await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json());
  const listing = listings.listings[0];
  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then(response => response.text());
  for (const path of ['/qr-code-generator', '/time-card-calculator', '/work-hours-calculator', '/invoice-generator', '/quote-generator', '/receipt-maker']) {
    assert.match(sitemap, new RegExp(`https:\\/\\/searya\\.com${path}`));
  }
  assert.match(sitemap, new RegExp(`https:\\/\\/searya\\.com\\/projects\\/${listing.slug}`));
  assert.match(sitemap, /https:\/\/searya\.com\/projects\/category\/saas/);
  assert.doesNotMatch(sitemap, /\?listing=|\?sort=|utm_source/);

  const detail = await fetch(`${baseUrl}/projects/${listing.slug}?utm_source=test`).then(response => response.text());
  assert.match(detail, new RegExp(`<title>${listing.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| 0% Commission Marketplace — Searya<\\/title>`));
  assert.match(detail, new RegExp(`<meta name="description" content="Connect directly with the owner of ${listing.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\. 0% platform commission and direct founder messaging\\. Arrange due diligence and transfer independently\\.">`));
  assert.match(detail, new RegExp(`<link rel="canonical" href="https:\\/\\/searya\\.com\\/projects\\/${listing.slug}">`));
  assert.match(detail, /"@type":"WebPage"/);
  assert.match(detail, /"@type":"BreadcrumbList"/);
  assert.match(detail, /"@type":"Product"/);
  assert.match(detail, new RegExp(`"offers":\\{"@type":"Offer","url":"https:\\/\\/searya\\.com\\/projects\\/${listing.slug}","price":"${Number(listing.askingPrice).toFixed(2)}","priceCurrency":"USD"`));
  assert.match(detail, /"name":"Marketplace commission","value":"0%"/);
  assert.doesNotMatch(detail, /"price":"0"/);

  const missing = await fetch(`${baseUrl}/projects/not-a-public-project`);
  assert.equal(missing.status, 404);
});

test('business tools expose dedicated SEO pages and generate real QR SVG output', async () => {
  const timePage = await fetch(`${baseUrl}/time-card-calculator`).then(response => response.text());
  assert.match(timePage, /<title>Free Time Card Calculator with Overtime \| Searya Tools<\/title>/);
  assert.match(timePage, /<link rel="canonical" href="https:\/\/searya\.com\/time-card-calculator">/);
  assert.match(timePage, /"@type":"SoftwareApplication"/);
  assert.match(timePage, /"price":"0"/);

  const qrResponse = await fetch(`${baseUrl}/api/tools/qr?text=${encodeURIComponent('https://searya.com/')}`);
  assert.equal(qrResponse.status, 200);
  assert.match(qrResponse.headers.get('content-type') || '', /image\/svg\+xml/);
  const qrSvg = await qrResponse.text();
  assert.match(qrSvg, /^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(qrSvg, /<path/);

  const invalidQr = await fetch(`${baseUrl}/api/tools/qr?text=`);
  assert.equal(invalidQr.status, 422);
});

test('blog hub exposes all searchable articles, detail metadata and sitemap URLs', async () => {
  const blog = await fetch(`${baseUrl}/blog`).then(response => response.text());
  assert.match(blog, /<link rel="canonical" href="https:\/\/searya\.com\/blog">/);
  assert.match(blog, /Searya Editorial/);
  assert.match(blog, /id="blog-search"/);
  assert.match(blog, /data-blog-filter="all"/);
  assert.match(blog, /class="blog-navbar"/);
  assert.match(blog, /class="blog-announcement"/);
  assert.match(blog, /id="blog-theme-toggle"/);
  assert.match(blog, /src="\/src\/assets\/searya-logo\.png/);
  assert.match(blog, /src="\/public\/blog-theme\.js/);
  assert.equal((blog.match(/data-blog-card/g) || []).length, blogPosts.length);

  const post = blogPosts[0];
  const detailResponse = await fetch(`${baseUrl}${post.slug}`);
  assert.equal(detailResponse.status, 200);
  const detail = await detailResponse.text();
  assert.match(detail, new RegExp(`<link rel="canonical" href="https:\/\/searya\\.com${post.slug}">`));
  assert.match(detail, new RegExp(`<meta name="description" content="${post.metaDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(detail, /"@type":"Article"/);
  assert.match(detail, /"wordCount":1[3-4]\d{2}/);
  assert.match(detail, /<h1>/);
  assert.match(detail, /<h2>/);
  assert.match(detail, /<h3>/);
  assert.match(detail, /<ul>/);
  assert.match(detail, /href="https:\/\/searya\.com\/#listings-grid"/);

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then(response => response.text());
  assert.match(sitemap, /https:\/\/searya\.com\/blog<\/loc>/);
  for (const article of blogPosts) {
    assert.match(sitemap, new RegExp(`https:\/\/searya\\.com${article.slug}<\\/loc><lastmod>${article.publishedDate}<\\/lastmod>`));
  }
});

test('showcase listing messages are routed to the administrator with transparent identity', async () => {
  const buyerRegister = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.90' },
    body: JSON.stringify({ name: 'Showcase Buyer', email: 'showcase-buyer@example.com', password: 'SecurePass123', role: 'buyer' })
  });
  const buyerCookie = buyerRegister.headers.getSetCookie()[0].split(';')[0];
  const listing = (await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json())).listings.find(item => item.managedBySearya);
  assert.ok(listing);
  const started = await fetch(`${baseUrl}/api/threads`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: buyerCookie }, body: JSON.stringify({ listingId: listing.id, message: 'Can you clarify what is included?' }) });
  assert.equal(started.status, 201);
  const threadId = (await started.json()).threadId;
  const buyerThreads = await fetch(`${baseUrl}/api/threads`, { headers: { Cookie: buyerCookie } }).then(response => response.json());
  const buyerThread = buyerThreads.threads.find(thread => thread.id === threadId);
  assert.equal(buyerThread.partnerName, 'Searya Showcase Desk');
  assert.equal(buyerThread.managedBySearya, true);

  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@searya.test', password: 'AdminSecurePass123' }) });
  const adminCookie = adminLogin.headers.getSetCookie()[0].split(';')[0];
  const overview = await fetch(`${baseUrl}/api/admin/overview`, { headers: { Cookie: adminCookie } }).then(response => response.json());
  assert.ok(overview.seedMessageThreads.some(thread => thread.id === threadId && thread.messages[0].body.includes('clarify')));
  const reply = await fetch(`${baseUrl}/api/threads/${threadId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie }, body: JSON.stringify({ message: 'Searya manages this showcase conversation during launch.' }) });
  assert.equal(reply.status, 201);
});

test('high-intent landing routes have unique metadata, visible FAQs and real filtered listings', async () => {
  const routes = new Map([
    ['/saas-for-sale', 'Discover SaaS Projects for Sale'],
    ['/micro-saas-for-sale', 'Discover Micro SaaS Projects for Sale'],
    ['/mobile-apps-for-sale', 'Discover Mobile App Projects for Sale'],
    ['/ai-tools-for-sale', 'Discover AI Tools &amp; Projects for Sale'],
    ['/chrome-extensions-for-sale', 'Discover Chrome Extension Projects for Sale'],
    ['/websites-for-sale', 'Discover Websites &amp; Web Projects for Sale'],
    ['/sell-your-saas', 'Looking to Sell Your SaaS? Get Discovered by Potential Buyers'],
    ['/sell-your-app', 'Looking to Sell Your App? Find Potential Buyers'],
    ['/sell-your-digital-project', 'Find Potential Buyers for Your Digital Project']
  ]);
  const titles = new Set();
  for (const [route, h1] of routes) {
    const response = await fetch(`${baseUrl}${route}?utm_source=test`);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, new RegExp(`<link rel="canonical" href="https:\\/\\/searya\\.com${route}">`), route);
    assert.match(html, /<h1>The 0% Commission Marketplace for Digital Projects &amp; SaaS<\/h1>/, route);
    assert.match(html, /<h2 class="intro fee-subheading">Direct Founder-to-Buyer Messaging with Zero Transaction Fees<\/h2>/, route);
    assert.match(html, /<title>[^<]*0% Commission &amp; Direct Messaging — Searya<\/title>/, route);
    assert.match(html, /<meta name="description" content="[^"]*0% platform commission and direct buyer messaging\.">/, route);
    assert.match(html, new RegExp(h1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), route);
    assert.match(html, /"@type":"FAQPage"/, route);
    assert.match(html, /"@type":"BreadcrumbList"/, route);
    if (/class="project-card"/.test(html)) assert.match(html, /"@type":"ItemList"/, route);
    assert.match(html, /<section class="section">[\s\S]*Frequently asked questions/, route);
    assert.doesNotMatch(html, /Buy now|Secure checkout|Transaction protection|guaranteed buyers|guaranteed sales/i, route);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `unique title for ${route}`);
    titles.add(title);
  }

  const mobileListings = await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json());
  const mobile = mobileListings.listings.find(item => item.category === 'mobile');
  const mobilePage = await fetch(`${baseUrl}/mobile-apps-for-sale`).then(response => response.text());
  assert.match(mobilePage, new RegExp(`/projects/${mobile.slug}`));
  const websitePage = await fetch(`${baseUrl}/websites-for-sale`).then(response => response.text());
  assert.match(websitePage, /No projects in this category yet/);

  const requests = await fetch(`${baseUrl}/api/listings?type=wtb`).then(response => response.json());
  const request = requests.listings.find(item => item.category === 'mobile');
  const sellerPage = await fetch(`${baseUrl}/sell-your-app`).then(response => response.text());
  assert.match(sellerPage, new RegExp(`/projects/${request.slug}`));

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then(response => response.text());
  for (const route of routes.keys()) assert.match(sitemap, new RegExp(`https:\\/\\/searya\\.com${route}`));
});

test('transactional search-intent pages expose unique H1 copy, real inventory and sitemap URLs', async () => {
  const routes = new Map([
    ['/buy-micro-saas-under-5000', 'Buy Micro SaaS Projects Under $5,000'],
    ['/saas-projects-for-sale-by-owner', 'SaaS Projects for Sale Directly by Owners'],
    ['/buy-source-code-from-developers', 'Buy Project Source Code Directly From Developers'],
    ['/sell-saas-without-commission', 'Sell Your SaaS Without Marketplace Commission'],
    ['/zero-commission-startup-marketplace', 'A 0% Commission Marketplace for Startup Projects'],
    ['/buy-chrome-extension-business', 'Buy a Chrome Extension Project or Business'],
    ['/mobile-apps-with-source-code-for-sale', 'Mobile Apps With Source Code for Sale'],
    ['/notion-templates-for-sale-marketplace', 'Discover Notion Templates and Template Businesses for Sale'],
    ['/where-to-sell-a-side-project', 'Where to Sell Your Side Project Directly'],
    ['/direct-founder-marketplace', 'A Direct Founder-to-Buyer Marketplace for Digital Projects']
  ]);
  const titles = new Set();
  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then(response => response.text());
  for (const [route, heading] of routes) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, new RegExp(`<h1>${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`), route);
    assert.match(html, /<h2 class="intro fee-subheading">Direct Founder-to-Buyer Messaging with Zero Transaction Fees<\/h2>/, route);
    assert.match(html, /<title>[^<]*0% Commission &amp; Direct Messaging — Searya<\/title>/, route);
    assert.match(html, /<meta name="description" content="[^"]*(?:0%|zero)[^"]*(?:direct|Direct)[^"]*">|<meta name="description" content="[^"]*(?:direct|Direct)[^"]*(?:0%|zero)[^"]*">/, route);
    assert.match(html, /"@type":"FAQPage"/, route);
    assert.match(html, /class="project-card"/, route);
    assert.match(sitemap, new RegExp(`https:\\/\\/searya\\.com${route}<\\/loc>`), route);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `unique title for ${route}`);
    titles.add(title);
  }
  const budgetPage = await fetch(`${baseUrl}/buy-micro-saas-under-5000`).then(response => response.text());
  const projectSlugs = [...budgetPage.matchAll(/href="\/projects\/([^"]+)"/g)].map(match => match[1]);
  const allSales = await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json());
  const bySlug = new Map(allSales.listings.map(item => [item.slug, item]));
  assert.ok(projectSlugs.length > 0);
  assert.equal(projectSlugs.every(slug => Number(bySlug.get(slug)?.askingPrice || Infinity) <= 5000), true);
});

test('guides hub and long-form guide routes expose indexable editorial content', async () => {
  const routes = new Map([
    ['/guides/how-to-sell-a-saas', 'How to Sell a SaaS'],
    ['/guides/where-to-sell-a-saas', 'Where Can You Sell a SaaS Project?'],
    ['/guides/how-much-is-my-saas-worth', 'How Much Is My SaaS Worth?'],
    ['/guides/selling-a-saas-with-no-revenue', 'Can You Sell a SaaS With No Revenue?'],
    ['/guides/how-to-sell-an-app', 'How to Sell a Mobile App'],
    ['/guides/how-to-sell-a-side-project', 'How to Sell a Side Project Instead of Letting It Sit'],
    ['/guides/how-to-buy-a-small-saas', 'How to Buy a Small SaaS Project'],
    ['/guides/what-to-check-before-buying-a-saas', 'What to Check Before Buying a SaaS'],
    ['/guides/buy-app-vs-build-from-scratch', 'Buy an Existing App or Build From Scratch?'],
    ['/guides/how-to-find-buyers-for-a-digital-project', 'How to Find Potential Buyers for a Digital Project']
  ]);
  const hubResponse = await fetch(`${baseUrl}/guides?utm_source=test`);
  assert.equal(hubResponse.status, 200);
  const hub = await hubResponse.text();
  assert.match(hub, /<link rel="canonical" href="https:\/\/searya\.com\/guides">/);
  assert.match(hub, /"@type":"CollectionPage"/);
  for (const route of routes.keys()) assert.match(hub, new RegExp(`href="${route}"`));

  const titles = new Set();
  for (const [route, h1] of routes) {
    const response = await fetch(`${baseUrl}${route}?utm_source=test`);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, new RegExp(`<link rel="canonical" href="https:\/\/searya\.com${route}">`), route);
    assert.ok(html.includes(`<h1>${h1.replaceAll('&', '&amp;')}</h1>`), route);
    assert.match(html, /"@type":"Article"/, route);
    assert.match(html, /"@type":"BreadcrumbList"/, route);
    assert.match(html, /"datePublished":"2026-08-12"/, route);
    assert.match(html, /Published by Searya/, route);
    assert.match(html, /does not process acquisitions/, route);
    assert.doesNotMatch(html, /guaranteed (sale|buyer|return)|secure checkout|Buy now/i, route);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `unique guide title for ${route}`);
    titles.add(title);
    const visibleWords = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
    assert.ok(visibleWords >= 900 && visibleWords <= 1600, `${route} has ${visibleWords} visible words`);
  }

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then(response => response.text());
  assert.match(sitemap, /https:\/\/searya\.com\/guides<\/loc>/);
  for (const route of routes.keys()) assert.match(sitemap, new RegExp(`https:\/\/searya\.com${route}<\\/loc>`));

  const malformed = await fetch(`${baseUrl}/guides/not-a-published-guide`, { headers: { Accept: 'text/html' } });
  assert.equal(malformed.status, 404);
  const trailingSlash = await fetch(`${baseUrl}/guides/how-to-sell-a-saas/`, { redirect: 'manual' });
  assert.equal(trailingSlash.status, 302);
  assert.equal(trailingSlash.headers.get('location'), 'https://searya.com/guides/how-to-sell-a-saas');
});

test('curated discovery routes use real public inventory and enforce the shared index threshold', async () => {
  const indexableRoutes = new Map([
    ['/discover/nextjs-saas-projects', 'Next.js SaaS Projects'],
    ['/discover/nodejs-saas-projects', 'Node.js SaaS Projects'],
    ['/discover/vue-saas-projects', 'Vue SaaS Projects'],
    ['/discover/flutter-mobile-apps', 'Flutter Mobile App Projects'],
    ['/discover/react-native-mobile-apps', 'React Native Mobile App Projects'],
    ['/discover/firebase-mobile-apps', 'Firebase Mobile App Projects'],
    ['/discover/python-ai-tools', 'Python AI Tools &amp; Projects'],
    ['/discover/openai-api-projects', 'OpenAI API Projects'],
    ['/discover/nextjs-ai-tools', 'Next.js AI Tools &amp; Projects'],
    ['/discover/chrome-extension-projects', 'Chrome Extension Projects']
  ]);
  const belowThresholdRoutes = new Map([
    ['/discover/react-saas-projects', 'React SaaS Projects'],
    ['/discover/supabase-saas-projects', 'Supabase SaaS Projects']
  ]);
  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then(response => response.text());
  for (const [route, h1] of indexableRoutes) {
    const response = await fetch(`${baseUrl}${route}?sort=recent`);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.ok(html.includes(`<h1>${h1}</h1>`), route);
    assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/, route);
    assert.match(html, new RegExp(`<link rel="canonical" href="https:\/\/searya\.com${route}">`), route);
    assert.match(html, /"@type":"CollectionPage"/, route);
    assert.match(html, /"@type":"BreadcrumbList"/, route);
    assert.match(html, /data-discovery-slug=/, route);
    assert.match(sitemap, new RegExp(`https:\/\/searya\.com${route}<\\/loc>`), route);
  }
  for (const [route, h1] of belowThresholdRoutes) {
    const html = await fetch(`${baseUrl}${route}`).then(response => response.text());
    assert.ok(html.includes(`<h1>${h1}</h1>`), route);
    assert.match(html, /<meta name="robots" content="noindex, follow">/, route);
    assert.doesNotMatch(sitemap, new RegExp(`https:\/\/searya\.com${route}<\\/loc>`), route);
  }

  const nextPage = await fetch(`${baseUrl}/discover/nextjs-saas-projects`).then(response => response.text());
  assert.match(nextPage, /<strong>\d+<\/strong> matching public projects currently listed/);
  assert.match(nextPage, /ClientPulse Retention Dashboard/);
  assert.doesNotMatch(nextPage, /Briefly AI Content Planner/);
  assert.doesNotMatch(nextPage, /Looking for a Small SaaS Product/);
  assert.doesNotMatch(nextPage, /"@type":"Product"|"@type":"Offer"/);

  const missing = await fetch(`${baseUrl}/discover/arbitrary-user-tag`, { headers: { Accept: 'text/html' } });
  assert.equal(missing.status, 404);
  const trailing = await fetch(`${baseUrl}/discover/nextjs-saas-projects/`, { redirect: 'manual' });
  assert.equal(trailing.status, 302);
  assert.equal(trailing.headers.get('location'), 'https://searya.com/discover/nextjs-saas-projects');
});

test('anonymous visitors cannot create listings', async () => {
  const response = await fetch(`${baseUrl}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Anonymous listing attempt' })
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'AUTH_REQUIRED');
});

test('listing views are counted once per short client window', async () => {
  const listings = await fetch(`${baseUrl}/api/listings?type=sale`).then(response => response.json());
  const listing = listings.listings[0];
  const first = await fetch(`${baseUrl}/api/listings/${listing.id}/view`, { method: 'POST', headers: { 'X-Forwarded-For': '203.0.113.45' } }).then(response => response.json());
  const second = await fetch(`${baseUrl}/api/listings/${listing.id}/view`, { method: 'POST', headers: { 'X-Forwarded-For': '203.0.113.45' } }).then(response => response.json());
  assert.equal(first.views, listing.views + 1);
  assert.equal(second.views, first.views);
});

test('unconfigured social sign-in fails safely instead of showing a dead action', async () => {
  const response = await fetch(`${baseUrl}/api/auth/oauth/google/start?role=both`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.searchParams.get('oauth'), 'error');
  assert.equal(location.searchParams.get('provider'), 'google');
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

test('Polar fulfillment validates the product and grants a paid order only once', async () => {
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Polar Buyer', email: 'polar-buyer@example.com', password: 'SecurePass123', role: 'buyer' })
  });
  const user = (await registerResponse.json()).user;
  const purchaseId = 'polar-purchase-test';
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO purchases(id,user_id,package_key,amount_cents,currency,status,created_at,updated_at) VALUES(?,?,?,900,'usd','pending',?,?)`).run(purchaseId, user.id, 'buyer_connections_10', createdAt, createdAt);
  const order = {
    id: 'polar-order-test', paid: true, currency: 'usd', subtotalAmount: 900,
    productId: process.env.POLAR_PRODUCT_BUYER_CONNECTIONS_10,
    metadata: { purchase_id: purchaseId, user_id: user.id, package_key: 'buyer_connections_10' }
  };
  assert.deepEqual(fulfillPolarOrder(order).granted, true);
  assert.deepEqual(fulfillPolarOrder(order).granted, false);
  assert.equal(db.prepare('SELECT buyer_connections AS count FROM users WHERE id=?').get(user.id).count, 12);
  assert.equal(db.prepare('SELECT status FROM purchases WHERE id=?').get(purchaseId).status, 'paid');
});

test('Polar webhook rejects unsigned requests', async () => {
  const response = await fetch(`${baseUrl}/api/polar/webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'INVALID_SIGNATURE');
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
  assert.equal(listing.status, 'Active');
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
  const visitorCookie = pageView.headers.getSetCookie()[0].split(';')[0];
  const presenceSessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const presenceEnter = await fetch(`${baseUrl}/api/analytics/presence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: visitorCookie },
    body: JSON.stringify({ sessionId: presenceSessionId, action: 'enter', path: '/' })
  });
  assert.equal(presenceEnter.status, 201);

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
  assert.equal(overview.analytics.presence.activeNow, 1);
  assert.equal(overview.analytics.presence.enteredToday, 1);
  assert.equal(overview.analytics.presence.exitedToday, 0);
  assert.equal(overview.daily.length, 7);
  assert.ok(overview.users.length >= 1);
  const pending = overview.pendingListings[0];

  const moderation = await fetch(`${baseUrl}/api/admin/listings/${pending.id}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ action: 'approve' })
  });
  assert.equal(moderation.status, 200);
  assert.equal((await moderation.json()).listing.status, 'Active');

  const presenceLeave = await fetch(`${baseUrl}/api/analytics/presence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: visitorCookie },
    body: JSON.stringify({ sessionId: presenceSessionId, action: 'leave', path: '/' })
  });
  assert.equal(presenceLeave.status, 200);
  const overviewAfterLeave = await fetch(`${baseUrl}/api/admin/overview`, { headers: { Cookie: adminCookie } }).then(response => response.json());
  assert.equal(overviewAfterLeave.analytics.presence.activeNow, 0);
  assert.equal(overviewAfterLeave.analytics.presence.exitedToday, 1);

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

test('verification email can be requested again without revealing account state', async () => {
  const register = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Verify Again', email: 'verify-again@example.com', password: 'SecurePass123', role: 'buyer' })
  });
  assert.equal(register.status, 201);
  const user = (await register.json()).user;
  db.prepare('UPDATE users SET email_verified=0 WHERE id=?').run(user.id);
  const resend = await fetch(`${baseUrl}/api/auth/resend-verification`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email })
  });
  assert.equal(resend.status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM email_verifications WHERE user_id=? AND used_at IS NULL').get(user.id).count, 1);
  const unknown = await fetch(`${baseUrl}/api/auth/resend-verification`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'missing@example.com' })
  });
  assert.equal(unknown.status, 200);
});

test('unread messages are counted and blocking stops existing conversations', async () => {
  const sellerRegister = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.10' },
    body: JSON.stringify({ name: 'Message Seller', email: 'message-seller@example.com', password: 'SecurePass123', role: 'seller' })
  });
  const sellerCookie = sellerRegister.headers.getSetCookie()[0].split(';')[0];
  const seller = (await sellerRegister.json()).user;
  const listingResponse = await fetch(`${baseUrl}/api/listings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: sellerCookie },
    body: JSON.stringify({ type: 'sale', title: 'Mesajlaşma Test Projesi', category: 'saas', price: 640, description: 'Okunmamış mesaj ve engelleme akışını doğrulayan yeterli açıklama.', techStack: ['Node.js'], coverImage: 'data:image/png;base64,iVBORw0KGgo=' })
  });
  const listing = (await listingResponse.json()).listing;
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@searya.test', password: 'AdminSecurePass123' })
  });
  const adminCookie = adminLogin.headers.getSetCookie()[0].split(';')[0];
  await fetch(`${baseUrl}/api/admin/listings/${listing.id}/moderate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie }, body: JSON.stringify({ action: 'approve' })
  });
  const buyerRegister = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.11' },
    body: JSON.stringify({ name: 'Message Buyer', email: 'message-buyer@example.com', password: 'SecurePass123', role: 'buyer' })
  });
  const buyerCookie = buyerRegister.headers.getSetCookie()[0].split(';')[0];
  const buyer = (await buyerRegister.json()).user;
  const threadResponse = await fetch(`${baseUrl}/api/threads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: buyerCookie }, body: JSON.stringify({ listingId: listing.id, message: 'Bu proje hakkında detaylı bilgi almak istiyorum.' })
  });
  const threadId = (await threadResponse.json()).threadId;
  const sellerMessage = await fetch(`${baseUrl}/api/threads/${threadId}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: sellerCookie }, body: JSON.stringify({ message: 'Elbette, proje hâlen satış için uygundur.' })
  });
  assert.equal(sellerMessage.status, 201);
  const unread = await fetch(`${baseUrl}/api/threads/unread-count`, { headers: { Cookie: buyerCookie } }).then(response => response.json());
  assert.equal(unread.unreadCount, 1);
  const threads = await fetch(`${baseUrl}/api/threads`, { headers: { Cookie: buyerCookie } }).then(response => response.json());
  assert.equal(threads.threads.find(thread => thread.id === threadId).unread, true);
  const read = await fetch(`${baseUrl}/api/threads/${threadId}/read`, { method: 'POST', headers: { Cookie: buyerCookie } }).then(response => response.json());
  assert.equal(read.unreadCount, 0);
  const block = await fetch(`${baseUrl}/api/blocks`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: buyerCookie }, body: JSON.stringify({ userId: seller.id })
  });
  assert.equal(block.status, 201);
  const blockedMessage = await fetch(`${baseUrl}/api/threads/${threadId}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: sellerCookie }, body: JSON.stringify({ message: 'Bu mesaj engellemeden sonra gönderilmemeli.' })
  });
  assert.equal(blockedMessage.status, 403);
  assert.equal((await blockedMessage.json()).error.code, 'USER_BLOCKED');
  assert.ok(buyer.id);
});

test('registration limits use the forwarded client IP instead of the Render proxy IP', async () => {
  for (let index = 0; index < 9; index += 1) {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `198.51.100.${index + 1}` },
      body: JSON.stringify({ name: `Proxy User ${index}`, email: `proxy-${index}@example.com`, password: 'SecurePass123', role: 'buyer' })
    });
    assert.equal(response.status, 201);
  }
});
