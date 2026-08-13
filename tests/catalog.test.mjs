import test from 'node:test';
import assert from 'node:assert/strict';

import { initialForSaleListings, initialWtbListings, seedProfiles } from '../src/data/seedListings.js';

test('seed catalogue includes fifty unique listings for each side', () => {
  assert.equal(initialForSaleListings.length, 50);
  assert.equal(initialWtbListings.length, 50);
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

test('all seed profiles include unique usernames, biographies, roles, and gender-matched avatars', () => {
  assert.equal(seedProfiles.length, 100);
  assert.equal(new Set(seedProfiles.map(profile => profile.username)).size, 100);
  assert.equal(new Set(seedProfiles.map(profile => profile.avatar)).size, 100);
  assert.equal(new Set(seedProfiles.map(profile => profile.bio)).size, 100);
  for (const profile of seedProfiles) {
    assert.ok(['Developer', 'Founder', 'Designer', 'Maker'].includes(profile.role));
    assert.ok(profile.bio.length > 40);
    assert.match(profile.avatar, new RegExp(`/portraits/${profile.gender === 'male' ? 'men' : 'women'}/`));
  }
});

test('seller seed data has long descriptions, clean slugs, valid prices, images, and all categories', () => {
  const categories = new Set(['saas', 'mobile', 'ai', 'extension', 'notion', 'ui-kit', 'api']);
  assert.deepEqual(new Set(initialForSaleListings.map(item => item.category)), categories);
  assert.equal(Math.min(...initialForSaleListings.map(item => item.askingPrice)), 49);
  assert.equal(Math.max(...initialForSaleListings.map(item => item.askingPrice)), 15000);
  for (const listing of initialForSaleListings) {
    assert.ok(listing.fullDescEn.trim().split(/\s+/).length >= 150);
    assert.ok(listing.askingPrice >= 49 && listing.askingPrice <= 15000);
    assert.match(listing.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(listing.coverImage, /^https:\/\/images\.unsplash\.com\//);
    assert.ok(Array.isArray(listing.techStack) && listing.techStack.length >= 3);
    assert.ok(!Number.isNaN(Date.parse(listing.createdAtIso)));
  }
});

test('buyer seed data contains explicit budget ranges and detailed requirements', () => {
  for (const listing of initialWtbListings) {
    assert.ok(listing.budgetMin >= 75);
    assert.ok(listing.budgetMax <= 10000 && listing.budgetMax >= listing.budgetMin);
    assert.match(listing.budgetRange, /^\$[\d,]+–\$[\d,]+$/);
    assert.ok(listing.fullDescEn.trim().split(/\s+/).length >= 100);
    assert.match(listing.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
});
