/**
 * Formats a numeric value as a currency string.
 * Supports standard ISO codes and handles special cases like MT4/MT5 "USC".
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  const upper = (currency || 'USD').toUpperCase();

  // Handle MetaTrader's Cent Account currency "USC"
  if (upper === 'USC') {
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USC`;
  }

  // VND: use vi-VN locale for correct thousands separator and ₫ symbol
  if (upper === 'VND') {
    return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
  }

  // JPY and other zero-decimal currencies: no fraction digits
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'IDR', 'VND', 'CLP', 'HUF'];
  const fractionDigits = zeroDecimalCurrencies.includes(upper) ? 0 : 2;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: upper,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch {
    // Fallback for non-standard or invalid currency codes
    return `${value.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} ${upper}`;
  }
}

/**
 * Returns the symbol for a given currency code if available,
 * otherwise returns the code itself.
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const upper = (currency || 'USD').toUpperCase();

  if (upper === 'USC') return 'USC';
  if (upper === 'VND') return '₫';

  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: upper,
    });

    // Extract symbol from parts
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find(p => p.type === 'currency');
    return symbolPart ? symbolPart.value : upper;
  } catch {
    return upper;
  }
}
