const number = value => Number(value);
const valid = value => Number.isFinite(number(value)) && number(value) >= 0 && number(value) <= 1e12;
const fail = error => ({ ok: false, error });

export function calculateSalesTax({ amount, rate, reverse = false }) {
  if (!valid(amount) || !valid(rate) || number(rate) > 100) return fail('Enter a non-negative amount and a tax rate between 0% and 100%.');
  const entered = number(amount), taxRate = number(rate) / 100;
  const subtotal = reverse ? entered / (1 + taxRate) : entered;
  const tax = reverse ? entered - subtotal : subtotal * taxRate;
  return { ok: true, subtotal, tax, total: subtotal + tax };
}

export function calculateJobCost(values) {
  const keys = ['materials', 'laborHours', 'hourlyRate', 'additional', 'overheadRate', 'markupRate'];
  if (keys.some(key => !valid(values[key])) || number(values.overheadRate) > 1000 || number(values.markupRate) > 1000) return fail('Use non-negative amounts and valid percentage values.');
  const materials = number(values.materials);
  const additional = number(values.additional);
  const labor = number(values.laborHours) * number(values.hourlyRate);
  const directCost = materials + labor + additional;
  const overhead = directCost * number(values.overheadRate) / 100;
  const totalCost = directCost + overhead;
  const grossProfit = totalCost * number(values.markupRate) / 100;
  const suggestedPrice = totalCost + grossProfit;
  return { ok: true, materials, additional, labor, directCost, overhead, totalCost, grossProfit, suggestedPrice, grossMargin: suggestedPrice ? grossProfit / suggestedPrice * 100 : 0 };
}

export function calculateHourlyRate(values) {
  const keys = ['desiredIncome', 'annualExpenses', 'taxRate', 'weeks', 'hoursPerWeek', 'billablePercent'];
  if (keys.some(key => !valid(values[key])) || number(values.taxRate) >= 100 || number(values.weeks) <= 0 || number(values.weeks) > 52 || number(values.hoursPerWeek) <= 0 || number(values.hoursPerWeek) > 168 || number(values.billablePercent) <= 0 || number(values.billablePercent) > 100) return fail('Check your inputs. Tax must be below 100%, and working time and billable percentage must be greater than zero.');
  const requiredRevenue = (number(values.desiredIncome) + number(values.annualExpenses)) / (1 - number(values.taxRate) / 100);
  const billableHours = number(values.weeks) * number(values.hoursPerWeek) * number(values.billablePercent) / 100;
  const baseRate = requiredRevenue / billableHours;
  if (![requiredRevenue, billableHours, baseRate].every(Number.isFinite)) return fail('These values produce a result that is too large.');
  return { ok: true, requiredRevenue, billableHours, baseRate, buffer10: baseRate * 1.1, buffer20: baseRate * 1.2 };
}

export function calculateBreakEven({ fixedCosts, variableCost, sellingPrice, targetProfit = 0 }) {
  if (![fixedCosts, variableCost, sellingPrice, targetProfit].every(valid)) return fail('Enter non-negative cost, price and target profit values.');
  if (number(sellingPrice) <= number(variableCost)) return fail('Selling price must be greater than variable cost per unit.');
  const contribution = number(sellingPrice) - number(variableCost);
  const exactUnits = number(fixedCosts) / contribution;
  const targetUnits = (number(fixedCosts) + number(targetProfit)) / contribution;
  return { ok: true, contribution, contributionMargin: contribution / number(sellingPrice) * 100, exactUnits, wholeUnits: Math.ceil(exactUnits), breakEvenRevenue: exactUnits * number(sellingPrice), targetProfit: number(targetProfit), targetUnits, targetWholeUnits: Math.ceil(targetUnits), targetRevenue: targetUnits * number(sellingPrice) };
}
