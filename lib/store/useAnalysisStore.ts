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
  allTrades: Trade[]; // Unfiltered trades from the active session
  sessions: AnalysisSession[];
  activeSessionId: string;
  language: Language;
  isProcessing: boolean;
  statusMsg: string;
  errorMsg: string;
  cachedStatementInfo: CachedInfo | null;
  view: 'dashboard' | 'comparator';

  // Actions
  setFile: (file: File | null) => void;
  processStatement: (html: string, params: FilterParams) => void;
  processMultiEa: (patterns: string[], threshold: number, startDate: Date, endDate: Date) => void;
  loadCachedStatement: () => Promise<void>;
  clearCache: () => Promise<void>;
  setLanguage: (lang: Language) => void;
  setView: (view: 'dashboard' | 'comparator') => void;

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
  filterMode: 'id',
};

const STORAGE_KEY_SESSIONS = 'mt4-analyzer-sessions';

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  file: null,
  allTrades: [],
  sessions: [],
  activeSessionId: "",
  language: "en",
  isProcessing: false,
  statusMsg: '',
  errorMsg: '',
  cachedStatementInfo: null,
  view: 'dashboard',

  setView: (view) => set({ view }),

  setLanguage: (lang) => {
    localStorage.setItem('mt4-analyzer-lang', lang);
    set({ language: lang });
  },

  setFile: (file) => set({ file, errorMsg: '' }),

  processStatement: async (html, params) => {
    const { activeSessionId, sessions, file } = get();
    
    // If it's a new file upload, check limit
    if (file && sessions.length >= 5) {
      set({ errorMsg: 'Maximum 5 reports allowed. Please close a tab before uploading a new one.' });
      return;
    }

    set({ isProcessing: true, statusMsg: 'Analyzing statement...' });
    
    try {
      const result = parseHTMLStatement(html, params);
      
      if (result.trades.length === 0 && result.totalFound === 0) {
        throw new Error("No trades found in the statement.");
      }

      const allTradesResult = parseHTMLStatement(html, {
        commentPattern: '',
        threshold: 0,
        startDate: new Date(0),
        endDate: new Date(2100, 0, 1),
        filterMode: 'comment',
      });

      const fileName = file?.name || (sessions.find(s => s.id === activeSessionId)?.fileName) || 'Uploaded Statement';
      const uploadedAt = Date.now();
      
      let updatedSessions = [...sessions];
      let newActiveId = activeSessionId;

      if (file) {
        // Create NEW session
        const sessionId = crypto.randomUUID();
        const sessionName = fileName.replace(/\.html?$/i, '');
        
        const newSession: AnalysisSession = {
          id: sessionId,
          name: sessionName,
          fileName: fileName,
          filter: params,
          history: [params],
          historyIndex: 0,
          currentResult: result,
          allTrades: allTradesResult.trades,
          multiEaResults: {},
          createdAt: uploadedAt,
        };

        updatedSessions.push(newSession);
        newActiveId = sessionId;

        // Save trades to IndexedDB for THIS session
        await db.statements.put({
          id: sessionId,
          fileName,
          uploadedAt,
          totalTrades: allTradesResult.trades.length,
          tradesJson: JSON.stringify(allTradesResult.trades)
        });
      } else {
        // Update existing session
        updatedSessions = sessions.map(s => {
          if (s.id === activeSessionId) {
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
      }

      set({ 
        sessions: updatedSessions,
        activeSessionId: newActiveId,
        allTrades: updatedSessions.find(s => s.id === newActiveId)?.allTrades || [],
        file: null, // Clear file after processing
        isProcessing: false, 
        statusMsg: '' 
      });

      // Persist session metadata
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions.map(s => ({
        id: s.id,
        name: s.name,
        fileName: s.fileName,
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

      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (!savedSessions) return;

      const parsedSessions = JSON.parse(savedSessions);
      if (parsedSessions.length === 0) return;

      // Load trades for each session from IndexedDB
      const sessionsWithTrades: AnalysisSession[] = await Promise.all(parsedSessions.map(async (s: any) => {
        const record = await db.statements.get(s.id);
        let trades: Trade[] = [];
        if (record) {
          trades = JSON.parse(record.tradesJson).map((t: any) => ({
            ...t,
            eaId: t.eaId || "",
            comment: t.comment || ""
          }));
        }

        const filter = {
          ...s.filter,
          startDate: new Date(s.filter.startDate),
          endDate: new Date(s.filter.endDate)
        };

        const result = trades.length > 0 ? recalculateResult(trades, filter) : null;

        return {
          ...s,
          filter,
          history: s.history.map((h: any) => ({
            ...h,
            startDate: new Date(h.startDate),
            endDate: new Date(h.endDate)
          })),
          allTrades: trades,
          currentResult: result,
          multiEaResults: {}
        };
      }));

      const lastActiveId = sessionsWithTrades[0]?.id || "";

      set({ 
        sessions: sessionsWithTrades,
        activeSessionId: lastActiveId,
        allTrades: sessionsWithTrades.find(s => s.id === lastActiveId)?.allTrades || [],
      });
    } catch (err) {
      console.error('Failed to load cached statement', err);
    }
  },

  clearCache: async () => {
    const { sessions } = get();
    for (const s of sessions) {
      await db.statements.delete(s.id);
    }
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    set({ 
      allTrades: [], 
      sessions: [], 
      activeSessionId: "", 
      cachedStatementInfo: null, 
      file: null 
    });
  },

  addSession: (filters) => {
    // This is now purely for "empty" sessions if needed, 
    // but the requirement says NO placeholder tabs.
    // So I'll keep it for future use but it might not be reachable.
    const { sessions } = get();
    if (sessions.length >= 5) {
      set({ errorMsg: 'Maximum 5 reports allowed.' });
      return;
    }
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
    set({ sessions: updated, activeSessionId: newSession.id, allTrades: [] });
  },

  removeSession: async (id) => {
    const { sessions, activeSessionId } = get();
    
    // Delete from IndexedDB
    await db.statements.delete(id);

    const updated = sessions.filter(s => s.id !== id);
    let nextActive = activeSessionId;
    if (activeSessionId === id) {
      nextActive = updated.length > 0 ? updated[0].id : "";
    }
    
    const nextTrades = updated.find(s => s.id === nextActive)?.allTrades || [];

    set({ 
      sessions: updated, 
      activeSessionId: nextActive,
      allTrades: nextTrades
    });

    // Update metadata persistence
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated.map(s => ({
      id: s.id,
      name: s.name,
      fileName: s.fileName,
      filter: s.filter,
      createdAt: s.createdAt,
      history: s.history,
      historyIndex: s.historyIndex
    }))));
  },

  setActiveSession: (id) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === id);
    set({ 
      activeSessionId: id,
      allTrades: session?.allTrades || []
    });
  },

  undo: () => {
    const { sessions, activeSessionId } = get();
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session || session.historyIndex <= 0) return;

    const newIndex = session.historyIndex - 1;
    const newFilter = session.history[newIndex];
    const newResult = recalculateResult(session.allTrades || [], newFilter);

    const updatedSessions = sessions.map(s => 
      s.id === activeSessionId ? { ...s, filter: newFilter, historyIndex: newIndex, currentResult: newResult } : s
    );

    set({ sessions: updatedSessions });
  },

  redo: () => {
    const { sessions, activeSessionId } = get();
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session || session.historyIndex >= session.history.length - 1) return;

    const newIndex = session.historyIndex + 1;
    const newFilter = session.history[newIndex];
    const newResult = recalculateResult(session.allTrades || [], newFilter);

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
        const session = sessions.find(s => s.id === activeSessionId);
        const mode = session?.filter.filterMode || 'comment';
        
        const tDate = parseMT4Date(t.closeTime) || parseMT4Date(t.openTime);
        const isDateMatch = !tDate || (tDate >= st && tDate <= en);
        
        if (!isDateMatch) return false;

        if (mode === 'id') {
          return (t.eaId || "").toLowerCase().includes(trimmed.toLowerCase());
        } else if (mode === 'comment') {
          return isCommentMatch(trimmed, t.comment || "", threshold);
        } else {
          return (t.eaId || "").toLowerCase().includes(trimmed.toLowerCase()) && 
                 isCommentMatch(trimmed, t.comment || "", threshold);
        }
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
    set({ 
      file: null, 
      allTrades: [], 
      sessions: [], 
      activeSessionId: "", 
      errorMsg: '', 
      statusMsg: '' 
    })
  }
}));
