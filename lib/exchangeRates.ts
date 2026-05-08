// ============================================
// EXCHANGE RATES SERVICE - Multi-Provider Strategy
// Version 5 — ExchangeRate-API > Frankfurter > fawazahmed0 > Hardcoded
// ============================================

import { Trade } from './types';

interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
  baseCurrency: string;
  source: string;
}

// v5: busts all previous caches
const CACHE_KEY = 'exchange-rates-cache-v5';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Required currencies to consider cache valid
const REQUIRED_CURRENCIES = ['USD', 'EUR', 'VND', 'USC'];

// ============================================================
// HARDCODED FALLBACK RATES (relative to USD = 1)
// Updated May 2025 — used only when ALL APIs fail
// ============================================================
const HARDCODED_RATES: Record<string, number> = {
  USD: 1,
  USC: 100,      // 1 USD = 100 USC (MetaTrader Cent Account)
  EUR: 0.851,
  GBP: 0.736,
  JPY: 156.61,
  CHF: 0.78,
  AUD: 1.38,
  CAD: 1.36,
  NZD: 1.68,
  SGD: 1.27,
  CNY: 6.82,
  KRW: 1454.18,
  INR: 94.35,
  VND: 26310,
};

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Fetch exchange rates with multi-provider fallback strategy:
 *   1. Cache (localStorage, TTL 1 hour)
 *   2. ExchangeRate-API (open.er-api.com)  ← supports VND, no key needed
 *   3. Frankfurter (api.frankfurter.dev)   ← ECB data, ~30 currencies
 *   4. fawazahmed0/currency-api (jsDelivr) ← broad coverage including VND
 *   5. HARDCODED_RATES (offline fallback)
 */
export async function fetchExchangeRates(
  baseCurrency: string = 'USD'
): Promise<Record<string, number>> {
  // USC is always hardcoded — no external API tracks it
  if (baseCurrency === 'USC') {
    const rates = buildUscRates();
    saveCache({ rates, timestamp: Date.now(), baseCurrency, source: 'usc-hardcoded' });
    return rates;
  }

  // 1. Valid cache?
  const cached = getCache();
  if (cached && cached.baseCurrency === baseCurrency && isCacheValid(cached)) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION) {
      console.log(
        `[ExchangeRates] ✅ Using cached rates (source: ${cached.source}, ` +
        `age: ${Math.round(age / 60000)}m, ${Object.keys(cached.rates).length} currencies)`
      );
      return cached.rates;
    }
  }

  // 2-4. Try each live provider in order
  const providers: Array<{ name: string; fn: () => Promise<Record<string, number>> }> = [
    { name: 'ExchangeRate-API',     fn: () => fetchFromOpenErApi(baseCurrency) },
    { name: 'Frankfurter',          fn: () => fetchFromFrankfurter(baseCurrency) },
    { name: 'fawazahmed0/currency-api', fn: () => fetchFromFawazAhmed(baseCurrency) },
  ];

  for (const provider of providers) {
    console.log(`[ExchangeRates] Trying ${provider.name}...`);
    try {
      const rates = await provider.fn();

      // Validate: must contain base, VND, and a reasonable number of currencies
      if (!rates || !rates[baseCurrency] || Object.keys(rates).length < 10) {
        throw new Error('Insufficient rates returned');
      }

      console.log(
        `[ExchangeRates] ✅ Success from ${provider.name} ` +
        `(${Object.keys(rates).length} currencies)`
      );
      console.log('[ExchangeRates] Sample rates:', {
        USD: rates['USD'],
        EUR: rates['EUR'],
        VND: rates['VND'],
        USC: rates['USC'],
        [baseCurrency]: rates[baseCurrency],
      });

      saveCache({ rates, timestamp: Date.now(), baseCurrency, source: provider.name });
      signalFallback(false);
      return rates;
    } catch (error) {
      console.warn(`[ExchangeRates] ❌ Failed: ${provider.name}`, error);
    }
  }

  // 5. All APIs failed — use stale cache or hardcoded
  if (cached && cached.baseCurrency === baseCurrency) {
    console.warn(
      `[ExchangeRates] ⚠️  All providers failed. Using stale cache ` +
      `(source: ${cached.source}, ${Object.keys(cached.rates).length} currencies)`
    );
    signalFallback(true);
    return cached.rates;
  }

  console.warn('[ExchangeRates] ⚠️  All providers failed. Using HARDCODED_RATES.');
  signalFallback(true);
  return convertHardcodedRates(baseCurrency);
}

// ============================================================
// CONVERSION HELPERS
// ============================================================

/**
 * Convert a monetary amount from one currency to another.
 *
 * All `rates` values are relative to the same base:
 *   rates[base] = 1,  rates[X] = "how many X per 1 base unit"
 *
 * Formula:  amount_in_to = (amount_in_from / rates[from]) × rates[to]
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  // ── Hardcoded USD ↔ USC (no API needed) ─────────────────────────────
  if (fromCurrency === 'USD' && toCurrency === 'USC') return amount * 100;
  if (fromCurrency === 'USC' && toCurrency === 'USD') return amount / 100;

  // ── USC ↔ anything: route via USD ───────────────────────────────────
  if (fromCurrency === 'USC') {
    return convertCurrency(amount / 100, 'USD', toCurrency, rates);
  }
  if (toCurrency === 'USC') {
    return convertCurrency(amount, fromCurrency, 'USD', rates) * 100;
  }

  // ── General ─────────────────────────────────────────────────────────
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (fromRate === undefined || toRate === undefined) {
    console.error(
      `[ExchangeRates] Cannot convert ${fromCurrency} → ${toCurrency}. ` +
      `Available: ${Object.keys(rates).sort().join(', ')}`
    );
    return amount; // graceful degradation
  }

  return (amount / fromRate) * toRate;
}

/**
 * Convert all monetary fields of a Trade to the target currency.
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

// ============================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================

/**
 * Provider 1: ExchangeRate-API (open.er-api.com)
 * Response: { result, base_code, rates: { "VND": 26310, ... } }
 * Supports VND, no API key, updated daily.
 */
async function fetchFromOpenErApi(base: string): Promise<Record<string, number>> {
  const res = await fetch(
    `https://open.er-api.com/v6/latest/${base}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();

  if (data.result !== 'success' || !data.rates) {
    throw new Error(`Unexpected response: ${JSON.stringify(data).slice(0, 100)}`);
  }

  const rates: Record<string, number> = { [base]: 1, ...data.rates };
  ensureUsc(rates, base);
  return rates;
}

/**
 * Provider 2: Frankfurter (api.frankfurter.dev)
 * V2 response: Array<{ date, base, quote, rate }>
 * V1 response: { base, date, rates: { EUR: 0.92, ... } }
 * ~30 major currencies from ECB — does NOT include VND.
 */
async function fetchFromFrankfurter(base: string): Promise<Record<string, number>> {
  // Try V2 first
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v2/rates?base=${base}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`V2 HTTP ${res.status}`);

    const data = await res.json();
    const rates: Record<string, number> = { [base]: 1 };

    if (Array.isArray(data)) {
      // V2 array format: [{quote, rate}]
      for (const item of data) {
        if (item.quote && typeof item.rate === 'number') {
          rates[item.quote] = item.rate;
        }
      }
    } else if (data?.quotes && typeof data.quotes === 'object') {
      Object.assign(rates, data.quotes);
    } else if (data?.rates && typeof data.rates === 'object') {
      Object.assign(rates, data.rates);
    }

    ensureUsc(rates, base);
    return rates;
  } catch {
    // V1 fallback
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${base}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`V1 HTTP ${res.status}`);

    const data = await res.json();
    if (!data.rates) throw new Error('No rates in V1 response');

    const rates: Record<string, number> = { [base]: 1, ...data.rates };
    ensureUsc(rates, base);
    return rates;
  }
}

/**
 * Provider 3: fawazahmed0/currency-api (via jsDelivr CDN)
 * Response: { "date": "...", "usd": { "vnd": 26310, ... } }
 * Supports VND and many others, sourced from multiple public APIs.
 */
async function fetchFromFawazAhmed(base: string): Promise<Record<string, number>> {
  const baseLower = base.toLowerCase();
  const res = await fetch(
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseLower}.json`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const inner = data[baseLower];
  if (!inner || typeof inner !== 'object') {
    throw new Error(`No inner rates object for key "${baseLower}"`);
  }

  // Keys are lowercase — convert to uppercase
  const rates: Record<string, number> = { [base]: 1 };
  for (const [k, v] of Object.entries(inner)) {
    if (typeof v === 'number') {
      rates[k.toUpperCase()] = v;
    }
  }

  ensureUsc(rates, base);
  return rates;
}

// ============================================================
// HELPERS
// ============================================================

/** Ensure USC is always present and correct. */
function ensureUsc(rates: Record<string, number>, base: string): void {
  if (base === 'USD') {
    rates.USC = 100;
  } else if (rates.USD !== undefined) {
    rates.USC = rates.USD * 100;
  } else if (!rates.USC) {
    console.warn('[ExchangeRates] Cannot calculate USC — no USD rate available');
  }
}

/** Return HARDCODED_RATES re-based to `baseCurrency`. */
function convertHardcodedRates(baseCurrency: string): Record<string, number> {
  const baseUsdValue = HARDCODED_RATES[baseCurrency];

  if (!baseUsdValue) {
    console.warn(
      `[ExchangeRates] Unknown base currency "${baseCurrency}", defaulting to USD`
    );
    return { ...HARDCODED_RATES };
  }

  // All HARDCODED_RATES are USD-based.
  // Re-base: rate_new = rate_usd / baseUsdValue
  const result: Record<string, number> = {};
  for (const [currency, usdRate] of Object.entries(HARDCODED_RATES)) {
    result[currency] = usdRate / baseUsdValue;
  }
  result[baseCurrency] = 1;
  return result;
}

/** Build rates when baseCurrency = USC (1 USC = 0.01 USD). */
function buildUscRates(): Record<string, number> {
  const result: Record<string, number> = { USC: 1 };
  for (const [currency, usdRate] of Object.entries(HARDCODED_RATES)) {
    result[currency] = usdRate * 0.01; // 1 USC = 0.01 USD → convert to other
  }
  result.USD = 0.01;
  return result;
}

/** True if cache contains all required currencies. */
function isCacheValid(cache: ExchangeRateCache): boolean {
  return REQUIRED_CURRENCIES.every(c => cache.rates[c] !== undefined);
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

/** Signal to Zustand store whether fallback rates are in use. */
function signalFallback(isFallback: boolean): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSettingsStore } = require('./store/useSettingsStore');
    useSettingsStore.getState().setUsingFallbackRates(isFallback);
  } catch {
    // Ignore — store may not be initialised yet (SSR)
  }
}
