import Dexie, { type EntityTable } from 'dexie';
import { Trade } from '../types';
import { INDEXEDDB_NAME } from '../constants';

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

const db = new Dexie(INDEXEDDB_NAME) as Dexie & {
  statements: EntityTable<StatementRecord, 'id'>;
  settings: EntityTable<SettingRecord, 'key'>;
};

db.version(1).stores({
  statements: 'id, fileName, uploadedAt',
  settings: 'key'
});

// Explicitly open the database on import to ensure it's ready
// before any store hydration attempts to read from it.
if (typeof window !== 'undefined') {
  db.open().catch(err => {
    console.error('[IndexedDB] Failed to open:', err);
    // Attempt to delete corrupted DB and retry
    indexedDB.deleteDatabase(INDEXEDDB_NAME).onsuccess = () => {
      console.log('[IndexedDB] Deleted corrupted DB, retrying open...');
      db.open().catch(retryErr => {
        console.error('[IndexedDB] Retry failed:', retryErr);
      });
    };
  });
}

export async function getSetting(key: string, defaultValue: string = ""): Promise<string> {
  const record = await db.settings.get(key);
  return record ? record.value : defaultValue;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

export type { StatementRecord };
export { db };
