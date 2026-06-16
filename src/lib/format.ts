/** Shared formatting helpers used across all report renderers. */

export function formatCurrency(
  value: number,
  currency = 'CAD',
  opts: { decimals?: number; showCurrency?: boolean } = {}
): string {
  const { decimals = 0, showCurrency = false } = opts;
  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    currencyDisplay: 'narrowSymbol',
  }).format(value);
  return showCurrency ? `${formatted} ${currency}` : formatted;
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '' : ''}${value.toFixed(decimals)}%`;
}

/** Returns the value formatted with an explicit sign, e.g. +1.23% / -4.56% */
export function formatSignedPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Colour class for positive / negative numbers (returns, gains). */
export function signClass(value: number): string {
  if (value > 0) return 'text-[#2f9e6e]';
  if (value < 0) return 'text-[#d4183d]';
  return 'text-[#657381]';
}
