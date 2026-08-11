import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const campaignSource = await readFile(new URL('../marketing/x-seller-launch-en.md', import.meta.url), 'utf8');

test('The public interface is English-only', () => {
  assert.match(pageSource, /<html lang="en"/);
  assert.doesNotMatch(pageSource, /id=["'](?:lang-select|ob-card-lang-select)["']/);
  assert.match(appSource, /lang: 'en'/);
  assert.doesNotMatch(appSource, /requestedLanguage/);
  assert.match(campaignSource, /https:\/\/searya\.com\/\?lang=en&utm_source=x/);
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
