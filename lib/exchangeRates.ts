// ============================================
// EXCHANGE RATES SERVICE - Frankfurter API
// ============================================

import { Trade } from './types';

interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
  baseCurrency: string;
}

const CACHE_KEY = 'exchange-rates-cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Hardcoded fallback rates (relative to USD = 1)
const HARDCODED_RATES: Record<string, number> = {
  USD: 1,
  USC: 100,      // Custom: 1 USD = 100 USC
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  VND: 24500,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
};

/**
 * Fetch exchange rates from Frankfurter API
 * Priority: V2 → V1 → Cache → Hardcoded
 */
export async function fetchExchangeRates(
  baseCurrency: string = 'USD'
): Promise<Record<string, number>> {
  // Special case: USC is hardcoded
  if (baseCurrency === 'USC') {
    const rates = { USC: 1, USD: 0.01 };
    saveCache({ rates, timestamp: Date.now(), baseCurrency });
    return rates;
  }

  // Check cache first
  const cached = getCache();
  if (cached && cached.baseCurrency === baseCurrency) {
    const now = Date.now();
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log('[ExchangeRates] Using cached rates');
      return cached.rates;
    }
  }

  // Try API (V2 first, then V1)
  try {
    const rates = await fetchFromAPI(baseCurrency);
    saveCache({ rates, timestamp: Date.now(), baseCurrency });
    return rates;
  } catch (error) {
    console.error('[ExchangeRates] API fetch failed:', error);
    
    // Fallback 1: Use expired cache if available
    if (cached && cached.baseCurrency === baseCurrency) {
      console.warn('[ExchangeRates] Using expired cache as fallback');
      return cached.rates;
    }
    
    // Fallback 2: Use hardcoded rates
    console.warn('[ExchangeRates] Using hardcoded fallback rates');
    return convertHardcodedRates(baseCurrency);
  }
}

/**
 * Fetch from API with V2 → V1 fallback
 */
async function fetchFromAPI(baseCurrency: string): Promise<Record<string, number>> {
  // Try V2 API first
  try {
    const url = `https://api.frankfurter.dev/v2/rates?base=${baseCurrency}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) throw new Error(`V2 API failed: ${response.status}`);
    
    const data = await response.json();
    
    // V2 format: { date: "...", base: "EUR", quotes: { USD: 1.09, ... } }
    const rates: Record<string, number> = { 
      [baseCurrency]: 1,
      ...data.quotes 
    };
    
    // Add USC if base is USD
    if (baseCurrency === 'USD') {
      rates.USC = 100;
    } else if (rates.USD) {
      // Calculate USC from USD rate
      rates.USC = rates.USD * 100;
    }
    
    console.log('[ExchangeRates] Fetched from V2 API');
    return rates;
  } catch (v2Error) {
    console.warn('[ExchangeRates] V2 failed, trying V1...', v2Error);
    
    // Fallback to V1 API
    try {
      const url = `https://api.frankfurter.dev/v1/latest?base=${baseCurrency}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) throw new Error(`V1 API failed: ${response.status}`);
      
      const data = await response.json();
      
      // V1 format: { base: "EUR", rates: { USD: 1.09, ... } }
      const rates: Record<string, number> = { 
        [baseCurrency]: 1,
        ...data.rates 
      };
      
      // Add USC
      if (baseCurrency === 'USD') {
        rates.USC = 100;
      } else if (rates.USD) {
        rates.USC = rates.USD * 100;
      }
      
      console.log('[ExchangeRates] Fetched from V1 API');
      return rates;
    } catch (v1Error) {
      console.error('[ExchangeRates] V1 also failed:', v1Error);
      throw new Error('Both V2 and V1 APIs failed');
    }
  }
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  // Special case: USD <-> USC (hardcoded conversion)
  if (fromCurrency === 'USD' && toCurrency === 'USC') return amount * 100;
  if (fromCurrency === 'USC' && toCurrency === 'USD') return amount / 100;

  // Get rates
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) {
    console.warn(`[ExchangeRates] Missing rate for ${fromCurrency} or ${toCurrency}`);
    return amount; // Return original if conversion impossible
  }

  // Convert: amount * (toRate / fromRate)
  return amount * (toRate / fromRate);
}

/**
 * Convert a Trade object to target currency
 */
export function convertTrade(
  trade: Trade,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): Trade {
  if (fromCurrency === toCurrency) return trade;

  return {
    ...trade,
    profit: convertCurrency(trade.profit, fromCurrency, toCurrency, rates),
    commission: String(convertCurrency(parseFloat(trade.commission) || 0, fromCurrency, toCurrency, rates)),
    swap: String(convertCurrency(parseFloat(trade.swap) || 0, fromCurrency, toCurrency, rates)),
    balance: trade.balance !== undefined 
      ? convertCurrency(trade.balance, fromCurrency, toCurrency, rates)
      : undefined,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCache(): ExchangeRateCache | null {
  try {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function saveCache(cache: ExchangeRateCache): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[ExchangeRates] Failed to save cache:', error);
  }
}

/**
 * Convert hardcoded rates to any base currency
 */
function convertHardcodedRates(baseCurrency: string): Record<string, number> {
  const baseRate = HARDCODED_RATES[baseCurrency];
  
  if (!baseRate) {
    console.warn(`[ExchangeRates] Unknown base currency ${baseCurrency}, using USD`);
    return { ...HARDCODED_RATES };
  }

  // Convert all rates relative to baseCurrency
  const converted: Record<string, number> = {};
  
  Object.entries(HARDCODED_RATES).forEach(([currency, rate]) => {
    converted[currency] = rate / baseRate;
  });

  return converted;
}
