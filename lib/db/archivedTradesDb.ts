import Dexie, { Table } from 'dexie';
import { Trade } from '../types';

export interface ArchivedTradeData {
  sessionId: string;
  trades: Trade[];
  tradesCount: number;
  totalProfit: number;
}

export class ArchivedTradesDB extends Dexie {
  archivedTrades!: Table<ArchivedTradeData, string>;

  constructor() {
    super('MT4Analyzer_ArchivedTrades');
    this.version(1).stores({
      archivedTrades: 'sessionId'
    });
  }
}

export const archivedTradesDb = new ArchivedTradesDB();

export async function saveArchivedTrades(sessionId: string, trades: Trade[]) {
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  await archivedTradesDb.archivedTrades.put({
    sessionId,
    trades,
    tradesCount: trades.length,
    totalProfit
  });
}

export async function loadArchivedTrades(sessionId: string): Promise<Trade[] | null> {
  const data = await archivedTradesDb.archivedTrades.get(sessionId);
  return data ? data.trades : null;
}

export async function deleteArchivedTrades(sessionId: string) {
  await archivedTradesDb.archivedTrades.delete(sessionId);
}
