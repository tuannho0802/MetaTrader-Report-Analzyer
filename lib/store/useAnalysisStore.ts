import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trade, ParseResult, AnalysisSession, FilterParams } from '../types';
import { parseHTMLStatement, recalculateResult, parseMT4Date, isCommentMatch } from '../parser';
import { parseMT5Csv } from '../mt5Parser/parser';
import { adaptMT5ToParseResult } from '../mt5Parser/adapter';
import { db } from '../db';
import { saveArchivedTrades, loadArchivedTrades, deleteArchivedTrades } from '../db/archivedTradesDb';


interface AnalysisStore {
  // State
  sessions: AnalysisSession[];
  activeSessionId: string | null;
  
  // UI State
  isProcessing: boolean;
  statusMsg: string;
  errorMsg: string;
  file: File | null;
  isHydrated: boolean;

  // Actions
  setFile: (file: File | null) => void;
  processStatement: (html: string, params: FilterParams) => Promise<void>;
  processMT5Statement: (csv: string, fileName: string, params: FilterParams) => Promise<void>;
  loadCachedSessions: () => Promise<void>;
  setActiveSession: (id: string) => void;
  archiveSession: (id: string) => Promise<void>;
  restoreSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>; // Permanent delete
  toggleFavorite: (id: string) => void;
  undo: () => void;
  redo: () => void;
  processMultiEa: (patterns: string[], threshold: number, startDate: string, endDate: string) => void;
  reset: () => Promise<void>;

}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isProcessing: false,
      statusMsg: '',
      errorMsg: '',
      file: null,
      isHydrated: false,



      setFile: (file) => set({ file }),

      processStatement: async (html, params) => {
        const { sessions, activeSessionId } = get();
        const activeSessions = sessions.filter(s => !s.archived);
        if (activeSessions.length >= 5 && !activeSessions.some(s => s.id === activeSessionId)) {
          set({ errorMsg: "Maximum 5 active reports allowed." });
          return;
        }
        set({ isProcessing: true, statusMsg: 'Analyzing...' });
        try {
          const result = parseHTMLStatement(html, params);
          const allTradesResult = parseHTMLStatement(html, {
            commentPattern: '', threshold: 0, startDate: new Date(0), endDate: new Date(2100, 0, 1), filterMode: 'comment',
          });
          const fileName = get().file?.name || 'Uploaded Statement';
          const uploadedAt = Date.now();
          const sessionId = crypto.randomUUID();
          const sessionName = fileName.replace(/\.html?$/i, '');
          const newSession: AnalysisSession = {
            id: sessionId, name: sessionName, fileName, filter: params, history: [params], historyIndex: 0,
            currentResult: result, allTrades: allTradesResult.trades, multiEaResults: {},
            currency: result.currency, startDate: result.startDate, endDate: result.endDate, createdAt: uploadedAt,
            archived: false,
            favorite: false
          };
          if (!newSession.allTrades || newSession.allTrades.length === 0) {
            console.error('Cannot add session without trades');
            throw new Error('Invalid session: no trades data');
          }
          await db.statements.put({ id: sessionId, fileName, uploadedAt, totalTrades: allTradesResult.trades.length, tradesJson: JSON.stringify(allTradesResult.trades) });
          const updatedSessions = [...sessions, newSession];
          set({ sessions: updatedSessions, activeSessionId: sessionId, file: null, isProcessing: false, statusMsg: '' });
        } catch (err: any) { set({ errorMsg: err.message || 'Error', isProcessing: false, statusMsg: '' }); }
      },

      processMT5Statement: async (csvContent, fileName, params) => {
        const { sessions } = get();
        const activeSessions = sessions.filter(s => !s.archived);
        if (activeSessions.length >= 5) { set({ errorMsg: 'Max 5 active reports.' }); return; }
        set({ isProcessing: true, statusMsg: 'Parsing...' });
        try {
          const mt5Report = parseMT5Csv(csvContent);
          const parseResult = adaptMT5ToParseResult(mt5Report);
          const { filterTrades } = await import('@/lib/parser');
          const { filtered } = filterTrades(parseResult.trades, params);
          const filteredResult = { ...parseResult, trades: filtered, totalProfit: filtered.reduce((s, t) => s + t.profit, 0), totalFound: parseResult.trades.length };
          const sessionId = crypto.randomUUID();
          const sessionName = fileName.replace(/\.csv$/i, '');
          const uploadedAt = Date.now();
          const newSession: AnalysisSession = {
            id: sessionId, name: sessionName, fileName, filter: params, history: [params], historyIndex: 0,
            currentResult: filteredResult, allTrades: parseResult.trades, multiEaResults: {},
            currency: parseResult.currency, startDate: parseResult.startDate, endDate: parseResult.endDate, createdAt: uploadedAt,
            archived: false,
            favorite: false
          };
          if (!newSession.allTrades || newSession.allTrades.length === 0) {
            console.error('Cannot add session without trades');
            throw new Error('Invalid session: no trades data');
          }
          await db.statements.put({ id: sessionId, fileName, uploadedAt, totalTrades: parseResult.trades.length, tradesJson: JSON.stringify(parseResult.trades) });
          const updatedSessions = [...sessions, newSession];
          set({ sessions: updatedSessions, activeSessionId: sessionId, file: null, isProcessing: false, statusMsg: '' });
        } catch (err: any) { set({ errorMsg: err.message || 'Error', isProcessing: false, statusMsg: '' }); }
      },

      loadCachedSessions: async () => {
        try {
          set({ isHydrated: true });
        } catch (err) { set({ isHydrated: true }); }
      },

      setActiveSession: (id) => {
        const { sessions } = get();
        if (sessions.find(s => s.id === id && !s.archived)) { set({ activeSessionId: id }); }
      },

      archiveSession: async (sessionId) => {
        const state = get();
        const session = state.sessions.find(s => s.id === sessionId);
        
        if (!session || !session.allTrades || session.allTrades.length === 0) {
          console.error('Cannot archive session without trades');
          return;
        }
        
        try {
          await saveArchivedTrades(sessionId, session.allTrades);
          
          const totalProfit = session.allTrades.reduce((sum, t) => sum + t.profit, 0);
          const archivedMetadata = {
            tradesCount: session.allTrades.length,
            totalProfit,
            archivedAt: new Date().toISOString(),
          };
          
          set(state => ({
            sessions: state.sessions.map(s => 
              s.id === sessionId 
                ? { ...s, archived: true, allTrades: undefined, archivedMetadata }
                : s
            ),
            activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
          }));
          
          console.log(`✅ Session ${session.name} archived.`);
        } catch (error) {
          console.error('❌ Archive failed:', error);
          alert('Failed to archive session. Data will remain in memory.');
          throw error;
        }
      },

      restoreSession: async (sessionId) => {
        const state = get();
        const session = state.sessions.find(s => s.id === sessionId);
        
        if (!session || !session.archived) {
          console.error('Cannot unarchive non-archived session');
          return;
        }
        
        try {
          const trades = await loadArchivedTrades(sessionId);
          
          if (!trades || trades.length === 0) {
            throw new Error('Archived trades not found in database. Data may be corrupted.');
          }
          
          if (session.archivedMetadata && trades.length !== session.archivedMetadata.tradesCount) {
            console.warn(
              `⚠️ Trade count mismatch: metadata says ${session.archivedMetadata.tradesCount}, ` +
              `but loaded ${trades.length} trades`
            );
          }
          
          set(state => ({
            sessions: state.sessions.map(s => 
              s.id === sessionId 
                ? { ...s, archived: false, allTrades: trades, archivedMetadata: undefined }
                : s
            ),
            activeSessionId: sessionId,
          }));
          
          // Optionally delete from archivedTradesDb if we want to save DB space, but leaving it is fine too.
          await deleteArchivedTrades(sessionId);
          
          console.log(`✅ Session ${session.name} unarchived.`);
        } catch (error) {
          console.error('❌ Unarchive failed:', error);
          alert('Failed to restore archived session. Data may be lost.');
          throw error;
        }
      },

      deleteSession: async (sessionId) => {
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
        }));
        await deleteArchivedTrades(sessionId);
        await db.statements.delete(sessionId);
      },

      toggleFavorite: (id) => {
        const { sessions } = get();
        const updatedSessions = sessions.map(s => s.id === id ? { ...s, favorite: !s.favorite } : s);
        set({ sessions: updatedSessions });
      },

      undo: () => {
        const { sessions, activeSessionId } = get();
        const session = sessions.find(s => s.id === activeSessionId);
        if (!session || session.historyIndex <= 0) return;
        const newIdx = session.historyIndex - 1;
        const newF = session.history[newIdx];
        const newR = recalculateResult(session.allTrades || [], newF);
        const updated = sessions.map(s => s.id === activeSessionId ? { ...s, filter: newF, historyIndex: newIdx, currentResult: newR } : s);
        set({ sessions: updated });
      },

      redo: () => {
        const { sessions, activeSessionId } = get();
        const session = sessions.find(s => s.id === activeSessionId);
        if (!session || session.historyIndex >= session.history.length - 1) return;
        const newIdx = session.historyIndex + 1;
        const newF = session.history[newIdx];
        const newR = recalculateResult(session.allTrades || [], newF);
        const updated = sessions.map(s => s.id === activeSessionId ? { ...s, filter: newF, historyIndex: newIdx, currentResult: newR } : s);
        set({ sessions: updated });
      },

      processMultiEa: (patterns, threshold, startDate, endDate) => {
        const { sessions, activeSessionId } = get();
        const session = sessions.find(s => s.id === activeSessionId);
        if (!session || !session.allTrades) return;
        set({ isProcessing: true, statusMsg: 'Simulating...' });
        const results: Record<string, { trades: Trade[]; profit: number }> = {};
        const st = new Date(startDate); st.setHours(0, 0, 0, 0);
        const en = new Date(endDate); en.setHours(23, 59, 59, 999);
        patterns.forEach(pattern => {
          const trimmed = pattern.trim(); if (!trimmed) return;
          const filtered = session.allTrades!.filter(t => {
            const mode = session.filter.filterMode || 'comment';
            const tDate = parseMT4Date(t.closeTime) || parseMT4Date(t.openTime);
            const isDateMatch = !tDate || (tDate >= st && tDate <= en);
            if (!isDateMatch) return false;
            if (mode === 'id') return (t.eaId || "").toLowerCase().includes(trimmed.toLowerCase());
            else if (mode === 'comment') return isCommentMatch(trimmed, t.comment || "", threshold);
            else return (t.eaId || "").toLowerCase().includes(trimmed.toLowerCase()) && isCommentMatch(trimmed, t.comment || "", threshold);
          });
          results[trimmed] = { trades: filtered, profit: Number(filtered.reduce((sum, t) => sum + t.profit, 0).toFixed(2)) };
        });
        const updated = sessions.map(s => s.id === activeSessionId ? { ...s, multiEaResults: results } : s);
        set({ sessions: updated, isProcessing: false, statusMsg: '' });
      },

      reset: async () => {
        set({ file: null, sessions: [], activeSessionId: null, errorMsg: '', statusMsg: '' });
        await db.statements.clear();
      }
    }),
    {
      name: 'analysis-sessions-v3',
      storage: {
        getItem: async (name) => {
          const record = await db.settings.get(name);
          if (!record) return null;
          try {
            return JSON.parse(record.value);
          } catch (e) {
            return null;
          }
        },
        setItem: async (name, value) => {
          await db.settings.put({ key: name, value: JSON.stringify(value) });
        },
        removeItem: async (name) => {
          await db.settings.delete(name);
        },
      },
      version: 1
    }
  )
);
