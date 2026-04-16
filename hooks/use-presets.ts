import { useState, useEffect, useCallback } from 'react';
import { FilterPreset } from '@/lib/types';

const STORAGE_KEY = 'mt4-filter-presets';

export function usePresets() {
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse presets', e);
      }
    }
  }, []);

  const savePreset = useCallback((name: string, data: Omit<FilterPreset, 'id' | 'name'>) => {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      ...data
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [presets]);

  const deletePreset = useCallback((id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [presets]);

  return { presets, savePreset, deletePreset };
}
