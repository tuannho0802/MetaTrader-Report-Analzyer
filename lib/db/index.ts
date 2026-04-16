import Dexie, { type EntityTable } from 'dexie';
import { Trade } from '../types';

interface StatementRecord {
  id: string; // Generic ID, or 'latest'
  fileName: string;
  uploadedAt: number;
  totalTrades: number;
  tradesJson: string; // Stringified Trade[]
}

interface SettingRecord {
  key: string;
  value: string;
}

const db = new Dexie('MT4AnalyzerDB') as Dexie & {
  statements: EntityTable<StatementRecord, 'id'>;
  settings: EntityTable<SettingRecord, 'key'>;
};

db.version(1).stores({
  statements: 'id, fileName, uploadedAt',
  settings: 'key'
});

export async function getSetting(key: string, defaultValue: string = ""): Promise<string> {
  const record = await db.settings.get(key);
  return record ? record.value : defaultValue;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

export type { StatementRecord };
export { db };
