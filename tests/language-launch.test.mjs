import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const adminPageSource = await readFile(new URL('../admin.html', import.meta.url), 'utf8');
const adminSource = await readFile(new URL('../src/admin.js', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../src/api.js', import.meta.url), 'utf8');
const privacySource = await readFile(new URL('../legal/privacy.html', import.meta.url), 'utf8');
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

test('The admin interface is English-only', () => {
  assert.match(adminPageSource, /<html lang="en"/);
  assert.match(adminPageSource, /Searya Admin Center/);
  assert.match(adminPageSource, /Live visitor tracking/);
  assert.doesNotMatch(adminPageSource, /[çğıöşüÇĞİÖŞÜ]/);
  assert.doesNotMatch(adminSource, /toLocaleString\('tr-TR'\)/);
  assert.match(adminSource, /Administrator sign-in required/);
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
});

test('Social sharing metadata uses an absolute English preview card', () => {
  assert.match(pageSource, /<title>Searya \| Buy &amp; Sell Digital Projects<\/title>/);
  assert.match(pageSource, /property="og:locale" content="en_US"/);
  assert.match(pageSource, /property="og:image" content="https:\/\/searya\.com\/public\/searya-social-preview-en\.png\?v=20260811-1"/);
  assert.match(pageSource, /property="og:image:width" content="1200"/);
  assert.match(pageSource, /property="og:image:height" content="630"/);
});

test('English mode translates the remaining launch preview labels', () => {
  for (const id of ['t-preview-view-value', 't-preview-data-value', 't-launch-chat-period']) {
    assert.match(pageSource, new RegExp(`id=["']${id}["']`));
  }
  assert.match(appSource, /'t-preview-view-value': isEn \? 'Preview'/);
  assert.match(appSource, /'t-preview-data-value': isEn \? 'Sample'/);
  assert.match(appSource, /'t-launch-chat-period': isEn \? 'during launch'/);
});
