import { create } from 'zustand';
import { Trade, ParseResult, FilterParams, AnalysisSession } from '@/lib/types';
import { parseHTMLStatement, isCommentMatch, parseMT4Date, recalculateResult } from '@/lib/parser';
import { db } from '@/lib/db';
import { Language } from '@/lib/i18n';

interface CachedInfo {
  fileName: string;
  uploadedAt: number;
  totalTrades: number;
}

interface AnalysisState {
  file: File | null;
  allTrades: Trade[]; // Unfiltered trades from the statement
  sessions: AnalysisSession[];
  activeSessionId: string;
  language: Language;
  isProcessing: boolean;
  statusMsg: string;
  errorMsg: string;
  cachedStatementInfo: CachedInfo | null;
  
  // Actions
  setFile: (file: File | null) => void;
  processStatement: (html: string, params: FilterParams) => void;
  processMultiEa: (patterns: string[], threshold: number, startDate: Date, endDate: Date) => void;
  loadCachedStatement: () => Promise<void>;
  clearCache: () => Promise<void>;
  setLanguage: (lang: Language) => void;
  
  // Session Actions
  addSession: (filters?: FilterParams) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

const DEFAULT_FILTERS: FilterParams = {
  commentPattern: "",
  threshold: 80,
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: new Date(),
};

const createInitialSession = (): AnalysisSession => ({
  id: crypto.randomUUID(),
  name: "Analysis 1",
  filter: DEFAULT_FILTERS,
  history: [DEFAULT_FILTERS],
  historyIndex: 0,
  currentResult: null,
  multiEaResults: {},
  createdAt: Date.now(),
});

const STORAGE_KEY_SESSIONS = 'mt4-analyzer-sessions';

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  file: null,
  allTrades: [],
  sessions: [createInitialSession()],
  activeSessionId: "", // Will be set in init
  language: "en",
  isProcessing: false,
  statusMsg: '',
  errorMsg: '',
  cachedStatementInfo: null,

  setLanguage: (lang) => {
    localStorage.setItem('mt4-analyzer-lang', lang);
    set({ language: lang });
  },

  setFile: (file) => set({ file, allTrades: [], errorMsg: '' }),

  processStatement: async (html, params) => {
    const { activeSessionId, sessions } = get();
    set({ isProcessing: true, statusMsg: 'Analyzing statement...' });
    
    try {
      const result = parseHTMLStatement(html, params);
      
      const allTradesResult = parseHTMLStatement(html, {
        commentPattern: '',
        threshold: 0,
        startDate: new Date(0),
        endDate: new Date(2100, 0, 1),
      });

      const fileName = get().file?.name || 'Uploaded Statement';
      const uploadedAt = Date.now();
      
      await db.statements.put({
        id: 'latest',
        fileName,
        uploadedAt,
        totalTrades: allTradesResult.trades.length,
        tradesJson: JSON.stringify(allTradesResult.trades)
      });

      const updatedSessions = sessions.map(s => {
        if (s.id === activeSessionId) {
          // Push to history
          const newHistory = s.history.slice(0, s.historyIndex + 1);
          newHistory.push(params);
          if (newHistory.length > 20) newHistory.shift();
          
          return { 
            ...s, 
            currentResult: result, 
            filter: params,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        }
        return s;
      });

      set({ 
        sessions: updatedSessions,
        allTrades: allTradesResult.trades,
        cachedStatementInfo: {
          fileName,
          uploadedAt,
          totalTrades: allTradesResult.trades.length
        },
        isProcessing: false, 
        statusMsg: '' 
      });

      // Persist session filters
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions.map(s => ({
        id: s.id,
        name: s.name,
        filter: s.filter,
        createdAt: s.createdAt,
        history: s.history,
        historyIndex: s.historyIndex
      }))));

    } catch (err: any) {
      set({ errorMsg: err.message || 'Error parsing file', isProcessing: false, statusMsg: '' });
    }
  },

  loadCachedStatement: async () => {
    try {
      const savedLang = localStorage.getItem('mt4-analyzer-lang') as Language;
      if (savedLang) set({ language: savedLang });

      // Load sessions first
      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      let sessions = get().sessions;
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        sessions = parsed.map((s: any) => ({
          ...s,
          filter: {
            ...s.filter,
            startDate: new Date(s.filter.startDate),
            endDate: new Date(s.filter.endDate)
          },
          history: s.history.map((h: any) => ({
            ...h,
            startDate: new Date(h.startDate),
            endDate: new Date(h.endDate)
          })),
          currentResult: null,
          multiEaResults: {}
        }));
      }

      const latest = await db.statements.get('latest');
      if (latest) {
        const trades = JSON.parse(latest.tradesJson);
        
        // Recalculate results for active session on load
        const nextActiveId = sessions[0].id;
        const active = sessions.find(s => s.id === nextActiveId);
        
        if (active) {
            // Recalculate result from cached trades instead of re-parsing HTML
            const result = recalculateResult(trades, active.filter);
            sessions = sessions.map(s => s.id === nextActiveId ? { ...s, currentResult: result } : s);
        }

        set({ 
          allTrades: trades,
          sessions,
          activeSessionId: nextActiveId,
          cachedStatementInfo: {
            fileName: latest.fileName,
            uploadedAt: latest.uploadedAt,
            totalTrades: latest.totalTrades
          }
        });
      } else {
        set({ sessions, activeSessionId: sessions[0].id });
      }
    } catch (err) {
      console.error('Failed to load cached statement', err);
    }
  },

  clearCache: async () => {
    await db.statements.delete('latest');
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    const initialSession = createInitialSession();
    set({ 
      allTrades: [], 
      sessions: [initialSession], 
      activeSessionId: initialSession.id, 
      cachedStatementInfo: null, 
      file: null 
    });
  },

  addSession: (filters) => {
    const { sessions } = get();
    const f = filters || DEFAULT_FILTERS;
    const newSession: AnalysisSession = {
      id: crypto.randomUUID(),
      name: `Analysis ${sessions.length + 1}`,
      filter: f,
      history: [f],
      historyIndex: 0,
      currentResult: null,
      multiEaResults: {},
      createdAt: Date.now(),
    };
    const updated = [...sessions, newSession];
    set({ sessions: updated, activeSessionId: newSession.id });
  },

  removeSession: (id) => {
    const { sessions, activeSessionId } = get();
    if (sessions.length <= 1) return;
    
    const updated = sessions.filter(s => s.id !== id);
    let nextActive = activeSessionId;
    if (activeSessionId === id) {
      nextActive = updated[0].id;
    }
    set({ sessions: updated, activeSessionId: nextActive });
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  undo: () => {
    const { sessions, activeSessionId, allTrades } = get();
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session || session.historyIndex <= 0) return;

    const newIndex = session.historyIndex - 1;
    const newFilter = session.history[newIndex];
    const newResult = recalculateResult(allTrades, newFilter);

    const updatedSessions = sessions.map(s => 
      s.id === activeSessionId ? { ...s, filter: newFilter, historyIndex: newIndex, currentResult: newResult } : s
    );

    set({ sessions: updatedSessions });
  },

  redo: () => {
    const { sessions, activeSessionId, allTrades } = get();
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session || session.historyIndex >= session.history.length - 1) return;

    const newIndex = session.historyIndex + 1;
    const newFilter = session.history[newIndex];
    const newResult = recalculateResult(allTrades, newFilter);

    const updatedSessions = sessions.map(s => 
      s.id === activeSessionId ? { ...s, filter: newFilter, historyIndex: newIndex, currentResult: newResult } : s
    );

    set({ sessions: updatedSessions });
  },

  processMultiEa: (patterns, threshold, startDate, endDate) => {
    const { allTrades, activeSessionId, sessions } = get();
    if (allTrades.length === 0) return;

    set({ isProcessing: true, statusMsg: 'Comparing EAs...' });
    
    const results: Record<string, { trades: Trade[]; profit: number }> = {};
    const st = new Date(startDate);
    st.setHours(0, 0, 0, 0);
    const en = new Date(endDate);
    en.setHours(23, 59, 59, 999);

    patterns.forEach(pattern => {
      const trimmed = pattern.trim();
      if (!trimmed) return;

      const filtered = allTrades.filter(t => {
        const match = isCommentMatch(trimmed, t.comment, threshold);
        if (!match) return false;
        const tDate = parseMT4Date(t.closeTime) || parseMT4Date(t.openTime);
        if (!tDate) return true;
        return tDate >= st && tDate <= en;
      });

      results[trimmed] = {
        trades: filtered,
        profit: Number(filtered.reduce((sum, t) => sum + t.profit, 0).toFixed(2))
      };
    });

    const updatedSessions = sessions.map(s => 
      s.id === activeSessionId ? { ...s, multiEaResults: results } : s
    );

    set({ sessions: updatedSessions, isProcessing: false, statusMsg: '' });
  },

  reset: () => {
    const initialSession = createInitialSession();
    set({ 
      file: null, 
      allTrades: [], 
      sessions: [initialSession], 
      activeSessionId: initialSession.id, 
      errorMsg: '', 
      statusMsg: '' 
    })
  }
}));
