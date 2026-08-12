import test from 'node:test';
import assert from 'node:assert/strict';

import { initialForSaleListings, initialWtbListings } from '../src/data/mockData.js';

test('showcase catalogue includes ten new unique listings for each side', () => {
  assert.equal(initialForSaleListings.length, 38);
  assert.equal(initialWtbListings.length, 26);
  assert.equal(new Set(initialForSaleListings.map(item => item.id)).size, initialForSaleListings.length);
  assert.equal(new Set(initialWtbListings.map(item => item.id)).size, initialWtbListings.length);
  assert.equal(new Set(initialForSaleListings.map(item => item.titleEn)).size, initialForSaleListings.length);
  assert.equal(new Set(initialWtbListings.map(item => item.titleEn)).size, initialWtbListings.length);
});

test('showcase profiles use unique English names and unique portrait photos', () => {
  const profiles = [
    ...initialForSaleListings.map(item => item.seller),
    ...initialWtbListings.map(item => item.buyer)
  ];
  assert.equal(new Set(profiles.map(profile => profile.name)).size, profiles.length);
  assert.equal(new Set(profiles.map(profile => profile.avatar)).size, profiles.length);
  for (const profile of profiles) {
    assert.match(profile.name, /^[A-Za-z]+(?: [A-Za-z]+)+$/);
    assert.match(profile.avatar, /^https:\/\/randomuser\.me\/api\/portraits\/(?:women|men)\/\d+\.jpg$/);
  }
});
