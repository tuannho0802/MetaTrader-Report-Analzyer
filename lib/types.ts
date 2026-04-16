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
  similarity: number; // % khớp để debug
}

export interface FilterParams {
  commentPattern: string;
  threshold: number;   // 0-100
  startDate: Date;
  endDate: Date;
}

export interface ParseResult {
  totalProfit: number;
  trades: Trade[];
  totalFound: number;  // tổng số giao dịch trong file trước khi lọc
}

export interface FilterPreset {
  id: string;
  name: string;
  commentPattern: string;
  threshold: number;
  startDate: string;
  endDate: string;
}

export interface AnalysisSession {
  id: string;
  name: string;
  filter: FilterParams;
  history: FilterParams[];
  historyIndex: number;
  currentResult: ParseResult | null;
  multiEaResults: Record<string, { trades: Trade[]; profit: number }>;
  createdAt: number;
}
