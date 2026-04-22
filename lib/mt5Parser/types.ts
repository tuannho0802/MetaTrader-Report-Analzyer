// MT5-specific type definitions — independent from MT4/Trade interface

export interface MT5AccountInfo {
  accountName: string;
  accountNumber: string;
  broker: string;
  server: string;
  accountCurrency: string;
  leverage: string;
  currentBalance: number;
  currentEquity: number;
}

export interface MT5ExportInfo {
  exportDateTime: string;
  dateRangeFrom: string;
  dateRangeTo: string;
  terminal: string;
  terminalBuild: number;
  terminalCompany: string;
  exportPath: string;
}

export interface MT5Trade {
  // Core fields (mapped to Trade interface)
  ticket: string;
  eaId: string;           // Magic Number
  openTime: string;
  closeTime: string;
  type: string;           // "buy" or "sell"
  size: string;           // Volume — stored as string to match Trade interface
  item: string;           // Symbol (e.g. XAUUSD.s kept raw, normalized on output)
  openPrice: string;
  closePrice: string;
  commission: string;
  swap: string;
  profit: number;         // Net Profit — numeric (matches Trade.profit)
  comment: string;

  // Extended MT5-specific fields (not in Trade interface)
  durationHours: number;
  stopLoss: string;
  takeProfit: string;
  points: number;
  grossProfit: number;    // "Profit" column — before swap/commission
  netProfitPercent: number;
  entryId: string;
  exitId: string;
}

export interface MT5Summary {
  totalPositionsExported: number;
  totalGrossProfit: number;
  totalCommission: number;
  totalSwap: number;
  totalNetProfit: number;
}

export interface MT5Report {
  accountInfo: MT5AccountInfo;
  exportInfo: MT5ExportInfo;
  trades: MT5Trade[];
  summary: MT5Summary;
}
