import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, normalizeCurrency, IMAGE_UPLOAD_MAX_BYTES, SUPPORTED_IMAGE_TYPES } from '../src/tool-utils.js';

test('shared currency formatting supports all calculator currencies without conversion', () => {
  assert.equal(normalizeCurrency('$'), 'USD');
  assert.match(formatCurrency(1234.5, 'USD'), /\$1,234\.50/);
  assert.match(formatCurrency(1234.5, 'EUR'), /€1,234\.50/);
  assert.match(formatCurrency(1234.5, 'GBP'), /£1,234\.50/);
  assert.equal(formatCurrency(1234.5, 'CAD'), 'CA$1,234.50');
  assert.equal(formatCurrency(1234.5, 'AUD'), 'A$1,234.50');
  assert.equal(formatCurrency(-4, 'USD'), '−$4.00');
});

test('shared image policy accepts web images up to fifteen megabytes', () => {
  assert.equal(IMAGE_UPLOAD_MAX_BYTES, 15 * 1024 * 1024);
  assert.deepEqual([...SUPPORTED_IMAGE_TYPES], ['image/png', 'image/jpeg', 'image/webp']);
});
