// ============================================
// EXCHANGE RATES SERVICE - Frankfurter API
// Version 3 — cache busted, robust USC/VND logic
// ============================================

import { Trade } from './types';

interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
  baseCurrency: string;
}

// Bump version to bust any corrupted old cache
const CACHE_KEY = 'exchange-rates-cache-v3';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Required currencies that must be present in a valid cache
const REQUIRED_CURRENCIES = ['USD', 'EUR', 'VND', 'USC'];

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

// ============================================
// PUBLIC API
// ============================================

/**
 * Fetch exchange rates from Frankfurter API.
 * Priority: Valid Cache → V2 API → V1 API → Stale Cache → Hardcoded.
 *
 * When hardcoded fallback is used, this function signals the store so the UI
 * can display a warning to the user.
 */
export async function fetchExchangeRates(
  baseCurrency: string = 'USD'
): Promise<Record<string, number>> {
  // Special case: USC has no API — it's always hardcoded
  if (baseCurrency === 'USC') {
    const rates = buildUscRates();
    saveCache({ rates, timestamp: Date.now(), baseCurrency });
    return rates;
  }

  // Check cache validity (version + required currencies)
  const cached = getCache();
  if (cached && cached.baseCurrency === baseCurrency && isCacheValid(cached)) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION) {
      console.log(`[ExchangeRates] Using cached rates (${Object.keys(cached.rates).length} currencies)`);
      return cached.rates;
    }
  }

  // Try live API
  try {
    const rates = await fetchFromAPI(baseCurrency);
    saveCache({ rates, timestamp: Date.now(), baseCurrency });
    // Signal to UI that we now have live rates
    signalFallback(false);
    return rates;
  } catch (error) {
    console.error('[ExchangeRates] All APIs failed:', error);

    // Fallback 1: stale cache (any age)
    if (cached && cached.baseCurrency === baseCurrency) {
      console.warn('[ExchangeRates] Using stale cache as fallback');
      signalFallback(true);
      return cached.rates;
    }

    // Fallback 2: hardcoded rates
    console.warn('[ExchangeRates] Using hardcoded fallback rates');
    signalFallback(true);
    return convertHardcodedRates(baseCurrency);
  }
}

// ============================================
// CONVERSION HELPERS
// ============================================

/**
 * Convert a monetary amount from one currency to another.
 *
 * All rates in `rates` are expressed relative to the SAME base:
 *   rates[base] = 1
 *   rates[X]    = how many X equal 1 base unit
 *
 * Conversion formula:
 *   amount_in_to = amount_in_from / rates[from] * rates[to]
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  // ── Hardcoded USC ↔ USD (no API rate needed) ──────────────────────────
  if (fromCurrency === 'USD' && toCurrency === 'USC') return amount * 100;
  if (fromCurrency === 'USC' && toCurrency === 'USD') return amount / 100;

  // ── USC ↔ anything else: route through USD ────────────────────────────
  if (fromCurrency === 'USC') {
    // USC → USD → toCurrency
    const usd = amount / 100;
    return convertCurrency(usd, 'USD', toCurrency, rates);
  }
  if (toCurrency === 'USC') {
    // fromCurrency → USD → USC
    const usd = convertCurrency(amount, fromCurrency, 'USD', rates);
    return usd * 100;
  }

  // ── General case: use rates object ────────────────────────────────────
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (fromRate === undefined || toRate === undefined) {
    console.error(
      `[ExchangeRates] Cannot convert ${fromCurrency} → ${toCurrency}. ` +
      `Available: ${Object.keys(rates).sort().join(', ')}`
    );
    // Graceful degradation: return original so UI shows something
    return amount;
  }

  // amount (in fromCurrency) → base: amount / fromRate
  // base → toCurrency:                  × toRate
  return (amount / fromRate) * toRate;
}

/**
 * Convert a Trade object's monetary fields to the target currency.
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
    commission: String(
      convertCurrency(parseFloat(trade.commission) || 0, fromCurrency, toCurrency, rates)
    ),
    swap: String(
      convertCurrency(parseFloat(trade.swap) || 0, fromCurrency, toCurrency, rates)
    ),
    balance:
      trade.balance !== undefined
        ? convertCurrency(trade.balance, fromCurrency, toCurrency, rates)
        : undefined,
  };
}

// ============================================
// INTERNAL — API FETCHING
// ============================================

async function fetchFromAPI(baseCurrency: string): Promise<Record<string, number>> {
  // ── Try V2 ────────────────────────────────────────────────────────────
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v2/rates?base=${baseCurrency}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`V2 status ${res.status}`);

    const data = await res.json();
    const rates: Record<string, number> = { [baseCurrency]: 1 };

    // V2 returns Array<{ date, base, quote, rate }>
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.quote && typeof item.rate === 'number') {
          rates[item.quote] = item.rate;
        }
      }
    } else if (data?.quotes && typeof data.quotes === 'object') {
      // Some V2 builds return { quotes: { EUR: 0.92 } }
      Object.assign(rates, data.quotes);
    }

    ensureUsc(rates, baseCurrency);
    console.log(`[ExchangeRates] V2 OK — ${Object.keys(rates).length} currencies`);
    return rates;
  } catch (v2Err) {
    console.warn('[ExchangeRates] V2 failed →', v2Err);
  }

  // ── Try V1 ────────────────────────────────────────────────────────────
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${baseCurrency}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`V1 status ${res.status}`);

    const data = await res.json();
    // V1: { base, date, rates: { EUR: 0.92, ... } }
    const rates: Record<string, number> = { [baseCurrency]: 1, ...data.rates };
    ensureUsc(rates, baseCurrency);
    console.log(`[ExchangeRates] V1 OK — ${Object.keys(rates).length} currencies`);
    return rates;
  } catch (v1Err) {
    console.error('[ExchangeRates] V1 failed →', v1Err);
    throw new Error('Both V2 and V1 failed');
  }
}

// ============================================
// INTERNAL — HELPERS
// ============================================

/** Ensure USC is always present and correct in the rates map. */
function ensureUsc(rates: Record<string, number>, baseCurrency: string): void {
  if (baseCurrency === 'USD') {
    rates.USC = 100; // 1 USD = 100 USC
  } else if (rates.USD !== undefined) {
    // rates.USD = how many USD per 1 base unit
    // USC is 100× USD, so how many USC per 1 base = rates.USD * 100
    rates.USC = rates.USD * 100;
  } else if (!rates.USC) {
    console.warn('[ExchangeRates] Cannot calculate USC (no USD rate available)');
  }
}

/** Return hardcoded rates re-based to baseCurrency. */
function convertHardcodedRates(baseCurrency: string): Record<string, number> {
  // HARDCODED_RATES are all USD-based (USD = 1)
  const baseUsdValue = HARDCODED_RATES[baseCurrency];

  if (!baseUsdValue) {
    console.warn(
      `[ExchangeRates] Unknown base currency "${baseCurrency}", defaulting to USD rates`
    );
    return { ...HARDCODED_RATES };
  }

  // Re-base: every rate becomes (rate / baseUsdValue)
  // e.g. base=VND (24500), EUR=0.92 → 0.92/24500 ≈ 0.0000376
  //   meaning "1 VND = 0.0000376 EUR" ✓
  const result: Record<string, number> = {};
  for (const [currency, usdRate] of Object.entries(HARDCODED_RATES)) {
    result[currency] = usdRate / baseUsdValue;
  }
  // baseCurrency itself = 1
  result[baseCurrency] = 1;
  return result;
}

/** Build rates when baseCurrency = USC. */
function buildUscRates(): Record<string, number> {
  // 1 USC = 0.01 USD
  const result: Record<string, number> = { USC: 1 };
  for (const [currency, usdRate] of Object.entries(HARDCODED_RATES)) {
    // 1 USC = 0.01 USD → rate in currency = usdRate * 0.01
    result[currency] = usdRate * 0.01;
  }
  result.USD = 0.01;
  return result;
}

/** Return true only if cache contains all required currencies. */
function isCacheValid(cache: ExchangeRateCache): boolean {
  return REQUIRED_CURRENCIES.every((c) => cache.rates[c] !== undefined);
}

function getCache(): ExchangeRateCache | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(cache: ExchangeRateCache): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.error('[ExchangeRates] Failed to save cache:', err);
  }
}

/** Signal to the Zustand store whether we're using fallback rates. */
function signalFallback(isFallback: boolean): void {
  try {
    // Dynamic import to avoid circular dependency issues
    const { useSettingsStore } = require('./store/useSettingsStore');
    useSettingsStore.getState().setUsingFallbackRates(isFallback);
  } catch {
    // Ignore — store may not be initialised yet (SSR)
  }
}
