import { create } from 'zustand';
import { Trade, ParseResult, FilterParams } from '@/lib/types';
import { parseHTMLStatement, isCommentMatch, parseMT4Date } from '@/lib/parser';

interface AnalysisState {
  file: File | null;
  allTrades: Trade[]; // Unfiltered trades from the statement
  currentResult: ParseResult | null; // Filtered result for the single pattern
  multiEaResults: Record<string, { trades: Trade[]; profit: number }>;
  isProcessing: boolean;
  statusMsg: string;
  errorMsg: string;
  
  // Actions
  setFile: (file: File | null) => void;
  processStatement: (html: string, params: FilterParams) => void;
  processMultiEa: (patterns: string[], threshold: number, startDate: Date, endDate: Date) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  file: null,
  allTrades: [],
  currentResult: null,
  multiEaResults: {},
  isProcessing: false,
  statusMsg: '',
  errorMsg: '',

  setFile: (file) => set({ file, allTrades: [], currentResult: null, multiEaResults: {}, errorMsg: '' }),

  processStatement: (html, params) => {
    set({ isProcessing: true, statusMsg: 'Analyzing statement...' });
    
    try {
      // 1. Get current filtered result using the existing parser
      const result = parseHTMLStatement(html, params);
      
      // 2. Also keep all trades to allow multi-EA comparison without re-parsing the HTML
      // We run a "catch-all" pass to get every transaction in the Closed Transactions table
      const allTradesResult = parseHTMLStatement(html, {
        commentPattern: '',
        threshold: 0,
        startDate: new Date(0),
        endDate: new Date(2100, 0, 1),
      });

      set({ 
        currentResult: result, 
        allTrades: allTradesResult.trades,
        isProcessing: false, 
        statusMsg: '' 
      });
    } catch (err: any) {
      set({ errorMsg: err.message || 'Error parsing file', isProcessing: false, statusMsg: '' });
    }
  },

  processMultiEa: (patterns, threshold, startDate, endDate) => {
    const { allTrades } = get();
    if (allTrades.length === 0) return;

    set({ isProcessing: true, statusMsg: 'Comparing EAs...' });
    
    const results: Record<string, { trades: Trade[]; profit: number }> = {};
    
    // Normalize date filters
    const st = new Date(startDate);
    st.setHours(0, 0, 0, 0);
    const en = new Date(endDate);
    en.setHours(23, 59, 59, 999);

    patterns.forEach(pattern => {
      const trimmed = pattern.trim();
      if (!trimmed) return;

      const filtered = allTrades.filter(t => {
        // 1. Match Pattern using the same logic as the main parser
        const match = isCommentMatch(trimmed, t.comment, threshold);
        if (!match) return false;

        // 2. Match Date
        const tDate = parseMT4Date(t.closeTime) || parseMT4Date(t.openTime);
        if (!tDate) return true; // If no date, include it

        return tDate >= st && tDate <= en;
      });

      results[trimmed] = {
        trades: filtered,
        profit: Number(filtered.reduce((sum, t) => sum + t.profit, 0).toFixed(2))
      };
    });

    set({ multiEaResults: results, isProcessing: false, statusMsg: '' });
  },

  reset: () => set({ file: null, allTrades: [], currentResult: null, multiEaResults: {}, errorMsg: '', statusMsg: '' })
}));
