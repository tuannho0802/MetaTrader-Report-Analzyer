import { create } from 'zustand';
import { Trade, ParseResult, FilterParams, AnalysisSession } from '@/lib/types';
import { parseHTMLStatement, isCommentMatch, parseMT4Date, recalculateResult } from '@/lib/parser';
import { parseMT5Csv, adaptMT5ToParseResult } from '@/lib/mt5Parser';
import { db } from '@/lib/db';
import {
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
  STORAGE_KEY_SESSIONS,
  STORAGE_KEY_LANG,
  INDEXEDDB_NAME
} from '@/lib/constants';

// ─── Version Gate ────────────────────────────────────────────────
// Runs once on module load (client-side only).
// If the stored version doesn't match the current STORAGE_VERSION,
// we wipe localStorage + IndexedDB to prevent stale/corrupt data.
if (typeof window !== 'undefined') {
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);

  if (storedVersion !== String(STORAGE_VERSION)) {
    console.log('[Storage] Version mismatch, clearing old data');

    // Preserve theme preference
    const theme = localStorage.getItem('theme');

    localStorage.clear();
    indexedDB.deleteDatabase(INDEXEDDB_NAME);

    // Restore theme
    if (theme) localStorage.setItem('theme', theme);

    // Stamp current version
    localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
  }
}

// ─── Types ───────────────────────────────────────────────────────
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
  isProcessing: boolean;
  statusMsg: string;
  errorMsg: string;
  cachedStatementInfo: CachedInfo | null;
  isHydrated: boolean;
  filteredTrades: Trade[];

  // Actions
  setFile: (file: File | null) => void;
  processStatement: (html: string, params: FilterParams) => void;
  processMT5Statement: (csvContent: string, fileName: string, params: FilterParams) => Promise<void>;
  processMultiEa: (patterns: string[], threshold: number, startDate: Date, endDate: Date) => void;
  loadCachedStatement: () => Promise<void>;
  clearCache: () => Promise<void>;

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

// ─── Store ───────────────────────────────────────────────────────
export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  file: null,
  allTrades: [],
  sessions: [],
  activeSessionId: "",
  isProcessing: false,
  statusMsg: '',
  errorMsg: '',
  cachedStatementInfo: null,
  isHydrated: false,
  filteredTrades: [],



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
          currency: result.currency,
          startDate: result.startDate,
          endDate: result.endDate,
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
              filter: { ...params, currency: s.currency, reportStartDate: s.startDate, reportEndDate: s.endDate },
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
        filteredTrades: updatedSessions.find(s => s.id === newActiveId)?.currentResult?.trades || [],
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
        historyIndex: s.historyIndex,
        currency: s.currency,
        startDate: s.startDate,
        endDate: s.endDate
      }))));

    } catch (err: any) {
      set({ errorMsg: err.message || 'Error parsing file', isProcessing: false, statusMsg: '' });
    }
  },

  processMT5Statement: async (csvContent, fileName, params) => {
    const { sessions } = get();

    if (sessions.length >= 5) {
      set({ errorMsg: 'Maximum 5 reports allowed. Please close a tab before uploading a new one.' });
      return;
    }

    set({ isProcessing: true, statusMsg: 'Parsing MT5 CSV...' });

    try {
      // Step 1: Parse raw CSV → MT5Report
      const mt5Report = parseMT5Csv(csvContent);

      // Step 2: Convert MT5Report → ParseResult (all trades, unfiltered)
      const parseResult = adaptMT5ToParseResult(mt5Report);

      if (parseResult.trades.length === 0) {
        throw new Error('No trades found in the MT5 CSV file.');
      }

      // Step 3: Apply filter params so the first render shows filtered view
      const { filterTrades } = await import('@/lib/parser');
      const { filtered } = filterTrades(parseResult.trades, params);
      const filteredResult = {
        ...parseResult,
        trades: filtered,
        totalProfit: filtered.reduce((s, t) => s + t.profit, 0),
        totalFound: parseResult.trades.length,
        currency: parseResult.currency,
        startDate: parseResult.startDate,
        endDate: parseResult.endDate,
      };

      const sessionId = crypto.randomUUID();
      const sessionName = fileName.replace(/\.csv$/i, '');
      const uploadedAt = Date.now();

      const newSession: AnalysisSession = {
        id: sessionId,
        name: sessionName,
        fileName,
        filter: params,
        history: [params],
        historyIndex: 0,
        currentResult: filteredResult,
        startDate: parseResult.startDate,
        endDate: parseResult.endDate,
        allTrades: parseResult.trades, // unfiltered – needed for comparator
        multiEaResults: {},
        currency: parseResult.currency,
        createdAt: uploadedAt,
      };

      const updatedSessions = [...sessions, newSession];

      // Step 4: Persist trades to IndexedDB
      await db.statements.put({
        id: sessionId,
        fileName,
        uploadedAt,
        totalTrades: parseResult.trades.length,
        tradesJson: JSON.stringify(parseResult.trades),
      });

      // Step 5: Persist session metadata to localStorage
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions.map(s => ({
        id: s.id,
        name: s.name,
        fileName: s.fileName,
        filter: s.filter,
        createdAt: s.createdAt,
        history: s.history,
        historyIndex: s.historyIndex,
        currency: s.currency,
        startDate: s.startDate,
        endDate: s.endDate,
      }))));

      set({
        sessions: updatedSessions,
        activeSessionId: sessionId,
        allTrades: parseResult.trades,
        filteredTrades: filteredResult.trades,
        isProcessing: false,
        statusMsg: '',
        file: null,
      });
    } catch (err: any) {
      set({ errorMsg: err.message || 'Error parsing MT5 CSV', isProcessing: false, statusMsg: '' });
    }
  },

  loadCachedStatement: async () => {
    try {
      // 1. Read session metadata from localStorage
      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (!savedSessions) {
        set({ isHydrated: true });
        return;
      }

      const parsedSessions = JSON.parse(savedSessions);
      if (parsedSessions.length === 0) {
        set({ isHydrated: true });
        return;
      }

      // 3. Ensure IndexedDB is open before querying
      if (!db.isOpen()) {
        await db.open();
      }

      // 4. Load trades for each session from IndexedDB
      const sessionsWithTrades: AnalysisSession[] = await Promise.all(parsedSessions.map(async (s: any) => {
        let trades: Trade[] = [];
        try {
          const record = await db.statements.get(s.id);
          if (record) {
            trades = JSON.parse(record.tradesJson).map((t: any) => ({
              ...t,
              eaId: t.eaId || "",
              comment: t.comment || ""
            }));
          }
        } catch (dbErr) {
          console.error(`[Store] Failed to load trades for session ${s.id}:`, dbErr);
        }

        const filter = {
          ...s.filter,
          startDate: new Date(s.filter.startDate),
          endDate: new Date(s.filter.endDate),
          currency: s.currency,
          reportStartDate: s.startDate,
          reportEndDate: s.endDate
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
        filteredTrades: sessionsWithTrades.find(s => s.id === lastActiveId)?.currentResult?.trades || [],
        isHydrated: true
      });
    } catch (err) {
      console.error('[Store] Failed to load cached statement:', err);

      // Auto-clear corrupted storage
      try {
        localStorage.removeItem(STORAGE_KEY_SESSIONS);
        await db.delete();
        await db.open();
      } catch (cleanupErr) {
        console.error('[Store] Failed to clean up corrupted storage:', cleanupErr);
      }

      set({ isHydrated: true });
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
      filteredTrades: [],
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
      currency: 'USD',
      startDate: null,
      endDate: null,
      createdAt: Date.now(),
    };
    const updated = [...sessions, newSession];
    set({ sessions: updated, activeSessionId: newSession.id, allTrades: [], filteredTrades: [] });
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
      allTrades: nextTrades,
      filteredTrades: updated.find(s => s.id === nextActive)?.currentResult?.trades || []
    });

    // Update metadata persistence
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated.map(s => ({
      id: s.id,
      name: s.name,
      fileName: s.fileName,
      filter: s.filter,
      createdAt: s.createdAt,
      history: s.history,
      historyIndex: s.historyIndex,
      currency: s.currency,
      startDate: s.startDate,
      endDate: s.endDate
    }))));
  },

  setActiveSession: (id) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === id);
    set({ 
      activeSessionId: id,
      allTrades: session?.allTrades || [],
      filteredTrades: session?.currentResult?.trades || []
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

    set({ sessions: updatedSessions, filteredTrades: newResult?.trades || [] });
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

    set({ sessions: updatedSessions, filteredTrades: newResult?.trades || [] });
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
