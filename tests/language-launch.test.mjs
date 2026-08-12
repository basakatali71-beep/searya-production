import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const adminPageSource = await readFile(new URL('../admin.html', import.meta.url), 'utf8');
const adminSource = await readFile(new URL('../src/admin.js', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../src/api.js', import.meta.url), 'utf8');
const serverSource = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
const privacySource = await readFile(new URL('../legal/privacy.html', import.meta.url), 'utf8');
const termsSource = await readFile(new URL('../legal/terms.html', import.meta.url), 'utf8');
const campaignSource = await readFile(new URL('../marketing/x-seller-launch-en.md', import.meta.url), 'utf8');

test('The public interface is English-only', () => {
  assert.match(pageSource, /<html lang="en"/);
  assert.doesNotMatch(pageSource, /id=["'](?:lang-select|ob-card-lang-select)["']/);
  assert.match(appSource, /lang: 'en'/);
  assert.doesNotMatch(appSource, /requestedLanguage/);
  assert.match(campaignSource, /https:\/\/searya\.com\/\?lang=en&utm_source=x/);
  assert.doesNotMatch(pageSource, /[çğıöşüÇĞİÖŞÜ]/);
  assert.doesNotMatch(pageSource, /(?:Giriş|Kayıt|İlan|Ücretsiz|Satıcı|Alıcı|Pazaryeri)/);
  assert.match(appSource, /Sign Up for Free 🎉/);
  assert.doesNotMatch(appSource, /toLocaleString\('tr-TR'\)/);
  assert.doesNotMatch(apiSource, /İstek başarısız/);
});

test('The private admin interface is Turkish', () => {
  assert.match(adminPageSource, /<html lang="tr"/);
  assert.match(adminPageSource, /Searya Yönetim Paneli/);
  assert.match(adminPageSource, /Canlı ziyaretçi takibi/);
  assert.match(adminPageSource, /Ziyaretçi Davranışları/);
  assert.match(adminSource, /toLocaleLowerCase\('tr-TR'\)/);
  assert.match(adminSource, /Yönetici girişi gerekiyor/);
});

test('Dead fake-success and paid legacy sections are not shipped', () => {
  assert.doesNotMatch(pageSource, /success-stories-section/);
  assert.doesNotMatch(pageSource, /pricing-section-legacy/);
  assert.doesNotMatch(pageSource, /\$184,500/);
  assert.doesNotMatch(pageSource, /48 Proje/);
});

test('Launch legal copy does not contain unfinished placeholders', () => {
  assert.match(privacySource, /export or permanently delete your account data from My Account/);
  assert.doesNotMatch(privacySource, /before launch|will be added|details are finalized/i);
  assert.match(termsSource, /Buyer due diligence and payment safety/);
  assert.match(termsSource, /To the fullest extent permitted by applicable law/);
  assert.doesNotMatch(termsSource, /launch-stage informational draft/i);
});

test('The footer includes a clear buyer and seller safety warning', () => {
  assert.match(pageSource, /id="marketplace-safety-warning"/);
  assert.match(pageSource, /Searya only connects buyers and sellers/);
  assert.match(pageSource, /Do not send payment until you fully trust the seller/);
  assert.match(pageSource, /Use an independent escrow service whenever possible/);
});

test('Social sharing metadata uses an absolute English preview card', () => {
  assert.match(pageSource, /<title>Searya — Discover Digital Projects, SaaS, Apps &amp; AI Tools<\/title>/);
  assert.match(pageSource, /property="og:locale" content="en_US"/);
  assert.match(pageSource, /property="og:image" content="https:\/\/searya\.com\/public\/searya-social-preview-en\.png\?v=20260811-1"/);
  assert.match(pageSource, /property="og:image:width" content="1200"/);
  assert.match(pageSource, /property="og:image:height" content="630"/);
});

test('Searya favicon and English feedback contact are published', () => {
  assert.match(pageSource, /href="\/favicon\.ico\?v=20260812-1"/);
  assert.match(pageSource, /href="\/public\/favicon-32\.png\?v=20260812-1"/);
  assert.match(pageSource, /href="mailto:basakatali71@gmail\.com\?subject=Searya%20Feedback/);
  assert.match(pageSource, /Help shape Searya/);
  assert.match(pageSource, /Send Feedback/);
});

test('The footer exposes a concise set of SEO discovery links', () => {
  assert.match(pageSource, /aria-label="Explore project categories"/);
  assert.match(pageSource, /href="\/saas-for-sale"/);
  assert.match(pageSource, /href="\/mobile-apps-for-sale"/);
  assert.match(pageSource, /href="\/ai-tools-for-sale"/);
  assert.match(pageSource, /href="\/sell-your-digital-project"/);
});

test('Featured project preview and listing cards contain no sample labels', () => {
  for (const id of ['t-preview-view-value', 't-preview-data-value', 't-launch-chat-period']) {
    assert.match(pageSource, new RegExp(`id=["']${id}["']`));
  }
  assert.match(appSource, /'t-preview-view-value': isEn \? 'Preview'/);
  assert.match(appSource, /'t-preview-data-value': 'Live'/);
  assert.match(appSource, /'t-launch-chat-period': isEn \? 'during launch'/);
  assert.doesNotMatch(pageSource, /sample/i);
  assert.doesNotMatch(appSource, />SAMPLE</);
  assert.match(pageSource, /Launch showcase profiles illustrate the listing experience/);
});

test('Listing creation requires a signed-in user before rendering the form', () => {
  assert.match(appSource, /function openCreateListingModal[\s\S]*if \(!state\.currentUser\)[\s\S]*showOnboardingPage\('register'\);[\s\S]*return;/);
});

test('Authentication submissions are limited to five attempts per minute', () => {
  assert.match(appSource, /const AUTH_ATTEMPT_LIMIT = 5;/);
  assert.match(appSource, /const AUTH_ATTEMPT_WINDOW_MS = 60_000;/);
  assert.match(appSource, /Too many attempts\. Please wait/);
});

test('Listing sorting uses timestamps, prices and view counts', () => {
  assert.match(appSource, /listingCreatedAt\(b\) - listingCreatedAt\(a\)/);
  assert.match(appSource, /state\.sortBy === 'price-low'/);
  assert.match(appSource, /state\.sortBy === 'price-high'/);
  assert.match(appSource, /state\.sortBy === 'popular'/);
});

test('Moderation approval and rejection notify the listing owner by email', () => {
  assert.match(serverSource, /subject: 'Your Searya listing review result'/);
  assert.match(serverSource, /action === 'reject' \? 'rejected after review' : action === 'verify' \? 'verified and published' : 'approved and published'/);
  assert.match(serverSource, /notificationSent = Boolean\(notification\.configured\)/);
});
