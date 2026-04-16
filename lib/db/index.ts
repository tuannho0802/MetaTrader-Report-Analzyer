import Dexie, { Table } from 'dexie';

export interface UserSetting {
  id?: number;
  key: string;
  value: any;
}

export interface TradeNote {
  id?: number;
  ticket: string; // Linking to trade ticket
  note: string;
  tags: string[];
  updatedAt: number;
}

export class AppDatabase extends Dexie {
  settings!: Table<UserSetting>;
  notes!: Table<TradeNote>;

  constructor() {
    super('Mt4ProfitFilterDB');
    this.version(1).stores({
      settings: '++id, key',
      notes: '++id, ticket, updatedAt'
    });
  }
}

export const db = new AppDatabase();

// Helper functions
export async function saveSetting(key: string, value: any) {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing) {
    return db.settings.update(existing.id!, { value });
  }
  return db.settings.add({ key, value });
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const item = await db.settings.where('key').equals(key).first();
  return item ? item.value : defaultValue;
}
