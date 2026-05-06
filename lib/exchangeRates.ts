// Exchange rate provider - dùng free API
const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/USD';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

// Cache rates for 1 hour
let cachedRates: ExchangeRates | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  // Check cache
  if (cachedRates && 
      cachedRates.base === baseCurrency && 
      Date.now() - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates;
  }
  
  try {
    const response = await fetch(EXCHANGE_API.replace('USD', baseCurrency));
    const data = await response.json();
    
    cachedRates = {
      base: baseCurrency,
      rates: data.rates,
      timestamp: Date.now()
    };
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('exchange-rates', JSON.stringify(cachedRates));
    }
    
    return cachedRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('exchange-rates');
      if (stored) {
        cachedRates = JSON.parse(stored);
        return cachedRates!;
      }
    }
    
    // Ultimate fallback: hardcoded common rates
    return {
      base: baseCurrency,
      rates: {
        'USD': 1,
        'USC': 100,  // 1 USD = 100 USC
        'EUR': 0.92,
        'GBP': 0.79,
        'VND': 24000,
        'AUD': 1.52,
        'JPY': 149.5
      },
      timestamp: Date.now()
    };
  }
}

export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string, 
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Special handling for USC/USD
  if (fromCurrency === 'USC' && toCurrency === 'USD') {
    return amount / 100;
  }
  if (fromCurrency === 'USD' && toCurrency === 'USC') {
    return amount * 100;
  }
  
  // Convert via base currency
  const fromRate = rates.rates[fromCurrency] || 1;
  const toRate = rates.rates[toCurrency] || 1;
  
  // Convert to base first, then to target
  const inBase = amount / fromRate;
  return inBase * toRate;
}
