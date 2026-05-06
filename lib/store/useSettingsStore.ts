import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/lib/i18n';

interface SettingsState {
  language: Language;
  maxTabs: number;
  hasHydrated: boolean;
  setLanguage: (lang: Language) => void;
  setMaxTabs: (n: number) => void;
  setHasHydrated: (b: boolean) => void;
  baseCurrency: string;
  autoConvertCurrency: boolean;
  setBaseCurrency: (currency: string) => void;
  setAutoConvertCurrency: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      maxTabs: 5,
      hasHydrated: false,
      baseCurrency: 'USD',
      autoConvertCurrency: true,
      setLanguage: (language) => set({ language }),
      setMaxTabs: (maxTabs) => set({ maxTabs }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setBaseCurrency: (baseCurrency) => set({ baseCurrency }),
      setAutoConvertCurrency: (autoConvertCurrency) => set({ autoConvertCurrency }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
