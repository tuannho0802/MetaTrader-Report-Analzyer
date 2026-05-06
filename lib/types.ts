export interface Trade {
  ticket: string;
  openTime: string;
  type: string;
  size: string;
  item: string;
  openPrice: string;
  closeTime: string;
  closePrice: string;
  commission: string;
  swap: string;
  profit: number;
  comment: string;
  eaId: string;  // Extracted from title attribute
  similarity: number; // % khớp để debug
  balance?: number;
}

export type FilterMode = 'id' | 'comment' | 'both';

export interface FilterParams {
  commentPattern: string;
  threshold: number;   // 0-100
  startDate: Date;
  endDate: Date;
  filterMode: FilterMode;
  currency?: string;
}

export interface ParseResult {
  totalProfit: number;
  trades: Trade[];
  totalFound: number;  // tổng số giao dịch trong file trước khi lọc
  currency: string;
  startDate: string | null;
  endDate: string | null;
}

export interface FilterPreset {
  id: string;
  name: string;
  commentPattern: string;
  threshold: number;
  startDate: string;
  endDate: string;
  filterMode?: FilterMode; // Optional for backward compatibility
}


export interface AnalysisSession {
  id: string;
  name: string;
  fileName: string;
  allTrades?: Trade[];
  filter: FilterParams;
  history: FilterParams[];
  historyIndex: number;
  currentResult: ParseResult | null;
  multiEaResults: Record<string, { trades: Trade[]; profit: number }>;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: number;
  archived: boolean;
  deleted?: boolean;
  favorite?: boolean;
  archivedMetadata?: SessionMetadata;
}

export interface SessionMetadata {
  tradesCount: number;
  totalProfit: number;
  archivedAt: string;
}
export interface ComparisonResult {
  mode: 'same' | 'cross';
  series: EquitySeries[];
  metrics: MetricsRow[];
  tradesByEa?: Record<string, Trade[]>;
}

export interface EquityPoint {
  time: string;
  value: number;
}

export interface EquitySeries {
  id?: string;
  dataKey?: string;
  name: string;
  data: EquityPoint[];
  color: string;
  currency?: string;
}

export interface MetricsRow {
  name: string;
  totalProfit: number;
  winRate: number;
  tradeCount: number;
  currency: string;
  profitFactor: number;
  maxDrawdown: number;
  avgProfitPerTrade: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio: number | null;
  longRate: number;
  shortRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  recoveryFactor: number;
  profitPerDay: number;
}
