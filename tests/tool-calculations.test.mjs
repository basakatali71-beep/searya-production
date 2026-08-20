import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSalesTax, calculateJobCost, calculateHourlyRate, calculateBreakEven } from '../src/tool-calculations.js';

test('sales tax supports add and reverse modes with decimal rates', () => {
  const added = calculateSalesTax({ amount: 100, rate: 8.25 });
  assert.equal(added.ok, true); assert.equal(added.tax, 8.25); assert.equal(added.total, 108.25);
  const reversed = calculateSalesTax({ amount: 108.25, rate: 8.25, reverse: true });
  assert.ok(Math.abs(reversed.subtotal - 100) < 1e-9); assert.ok(Math.abs(reversed.tax - 8.25) < 1e-9);
  assert.equal(calculateSalesTax({ amount: -1, rate: 8 }).ok, false);
});

test('job cost applies overhead and markup without confusing margin', () => {
  const result = calculateJobCost({ materials: 500, laborHours: 10, hourlyRate: 30, additional: 200, overheadRate: 10, markupRate: 25 });
  assert.deepEqual({ labor: result.labor, directCost: result.directCost, overhead: result.overhead, totalCost: result.totalCost, grossProfit: result.grossProfit, suggestedPrice: result.suggestedPrice }, { labor: 300, directCost: 1000, overhead: 100, totalCost: 1100, grossProfit: 275, suggestedPrice: 1375 });
  assert.equal(result.grossMargin, 20);
  assert.equal(result.materials, 500); assert.equal(result.additional, 200);
});

test('hourly rate uses tax gross-up and billable capacity', () => {
  const result = calculateHourlyRate({ desiredIncome: 60000, annualExpenses: 15000, taxRate: 25, weeks: 50, hoursPerWeek: 40, billablePercent: 50 });
  assert.equal(result.requiredRevenue, 100000); assert.equal(result.billableHours, 1000); assert.equal(result.baseRate, 100); assert.equal(result.buffer20, 120);
  assert.equal(calculateHourlyRate({ desiredIncome: 1, annualExpenses: 0, taxRate: 100, weeks: 50, hoursPerWeek: 40, billablePercent: 50 }).ok, false);
});

test('break-even reports exact and whole units and rejects no contribution', () => {
  const result = calculateBreakEven({ fixedCosts: 5000, variableCost: 20, sellingPrice: 50, targetProfit: 1000 });
  assert.equal(result.contribution, 30); assert.equal(result.wholeUnits, 167); assert.ok(Math.abs(result.exactUnits - 166.6666667) < 0.0001); assert.ok(Math.abs(result.breakEvenRevenue - 8333.3333333) < 0.0001);
  assert.equal(result.targetUnits, 200); assert.equal(result.targetWholeUnits, 200); assert.equal(result.targetRevenue, 10000);
  assert.equal(calculateBreakEven({ fixedCosts: 5000, variableCost: 50, sellingPrice: 50 }).ok, false);
});
