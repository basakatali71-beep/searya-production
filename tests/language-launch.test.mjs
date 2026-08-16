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

test('The homepage explains the free tools and local-first document handling', () => {
  assert.match(pageSource, /No account required/);
  assert.match(pageSource, /Your document data stays in this browser/);
  assert.match(pageSource, /All core tools are free today/);
});

test('Social sharing metadata uses an absolute English preview card', () => {
  assert.match(pageSource, /<title>Searya Tools — Free QR, Time Card & Invoice Tools<\/title>/);
  assert.match(pageSource, /property="og:locale" content="en_US"/);
  assert.match(pageSource, /property="og:image" content="https:\/\/searya\.com\/public\/searya-tools-preview\.png\?v=20260816-1"/);
  assert.match(pageSource, /property="og:image:width" content="1200"/);
  assert.match(pageSource, /property="og:image:height" content="630"/);
});

test('Searya favicon and English feedback contact are published', () => {
  assert.match(pageSource, /href="\/favicon\.ico\?v=20260816-1"/);
  assert.match(pageSource, /href="\/public\/favicon-32\.png\?v=20260816-1"/);
  assert.match(pageSource, /href="mailto:basakatali71@gmail\.com"/);
  assert.match(pageSource, />Feedback<\/a>/);
});

test('The homepage exposes the core tools as crawlable links', () => {
  assert.match(pageSource, /href="\/qr-code-generator"/);
  assert.match(pageSource, /href="\/time-card-calculator"/);
  assert.match(pageSource, /href="\/invoice-generator"/);
});

test('The tool workspace includes the three functional launch surfaces', () => {
  assert.match(pageSource, /id="qr-form"/);
  assert.match(pageSource, /id="time-rows"/);
  assert.match(pageSource, /id="document-form"/);
  assert.match(pageSource, /id="print-document"/);
});

test('The tool homepage has clear navigation and launch pricing', () => {
  assert.match(pageSource, /aria-label="Main navigation"/);
  assert.match(pageSource, /href="\/#how-it-works"/);
  assert.match(pageSource, /href="\/#pricing"/);
  assert.match(pageSource, /\$0/);
});

test('The homepage contains no marketplace samples or fake traction claims', () => {
  assert.doesNotMatch(pageSource, /sample|marketplace|commission|buyers|sellers/i);
  assert.doesNotMatch(pageSource, /\d+[,+] users|trusted by|projects sold/i);
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
