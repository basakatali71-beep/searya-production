import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const campaignSource = await readFile(new URL('../marketing/x-seller-launch-en.md', import.meta.url), 'utf8');

test('English campaign links force the English interface', () => {
  assert.match(appSource, /new URLSearchParams\(window\.location\.search\)\.get\('lang'\)/);
  assert.match(appSource, /requestedLanguage === 'en' \|\| requestedLanguage === 'tr'/);
  assert.match(campaignSource, /https:\/\/searya\.com\/\?lang=en&utm_source=x/);
});

test('English mode translates the remaining launch preview labels', () => {
  for (const id of ['t-preview-view-value', 't-preview-data-value', 't-launch-chat-period']) {
    assert.match(pageSource, new RegExp(`id=["']${id}["']`));
  }
  assert.match(appSource, /'t-preview-view-value': isEn \? 'Preview'/);
  assert.match(appSource, /'t-preview-data-value': isEn \? 'Sample'/);
  assert.match(appSource, /'t-launch-chat-period': isEn \? 'during launch'/);
});
