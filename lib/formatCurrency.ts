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

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: upper,
      // If the currency code is invalid, this will throw
    }).format(value);
  } catch (e) {
    // Fallback for non-standard or invalid currency codes
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${upper}`;
  }
}

/**
 * Returns the symbol for a given currency code if available,
 * otherwise returns the code itself.
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const upper = (currency || 'USD').toUpperCase();
  
  if (upper === 'USC') return 'USC';
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: upper,
    });
    
    // Extract symbol from parts
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find(p => p.type === 'currency');
    return symbolPart ? symbolPart.value : upper;
  } catch (e) {
    return upper;
  }
}
