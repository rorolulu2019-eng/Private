export const APR = 0.022;
export function paymentFor(principal: number, months: number, annualRate = APR): number {
  if (![principal, months, annualRate].every(Number.isFinite) || principal < 0 || months <= 0 || annualRate < 0) throw new RangeError('Ungültige Kreditparameter');
  if (annualRate === 0) return Math.round((principal / months) * 100) / 100;
  const i = annualRate / 12, factor = (1 + i) ** months;
  return Math.round((principal * i * factor / (factor - 1)) * 100) / 100;
}
export const euro = (n: number) => new Intl.NumberFormat('de-DE', {style:'currency',currency:'EUR'}).format(n);
