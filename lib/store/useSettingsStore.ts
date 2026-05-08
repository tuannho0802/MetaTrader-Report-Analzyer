import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/lib/i18n';

interface SettingsState {
  language: Language;
  maxTabs: number;
  hasHydrated: boolean;
  baseCurrency: string;
  autoConvertCurrency: boolean;
  exchangeRates: Record<string, number> | null;
  ratesLastFetched: number | null;
  
  setLanguage: (lang: Language) => void;
  setMaxTabs: (n: number) => void;
  setHasHydrated: (b: boolean) => void;
  setBaseCurrency: (currency: string) => void;
  setAutoConvertCurrency: (enabled: boolean) => void;
  setExchangeRates: (rates: Record<string, number>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      maxTabs: 5,
      hasHydrated: false,
      baseCurrency: 'USD',
      autoConvertCurrency: false,
      exchangeRates: null,
      ratesLastFetched: null,
      
      setLanguage: (language) => set({ language }),
      setMaxTabs: (maxTabs) => set({ maxTabs }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setBaseCurrency: (baseCurrency) => set({ baseCurrency }),
      setAutoConvertCurrency: (autoConvertCurrency) => set({ autoConvertCurrency }),
      setExchangeRates: (rates) => set({ 
        exchangeRates: rates,
        ratesLastFetched: Date.now()
      }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        language: state.language,
        maxTabs: state.maxTabs,
        autoConvertCurrency: state.autoConvertCurrency,
        baseCurrency: state.baseCurrency,
      }),
    }
  )
);
