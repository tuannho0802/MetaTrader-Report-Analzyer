import { ParseResult, Trade } from '../types';
import { MT5Report } from './types';

/**
 * Adapts a parsed MT5Report to the existing ParseResult interface,
 * making the MT5 parser a transparent drop-in for the existing UI.
 *
 * Key type alignment notes (matching lib/types.ts Trade interface):
 * - size, openPrice, closePrice, commission, swap → kept as strings
 * - profit → number (the only numeric Trade field besides similarity)
 * - similarity → always 0 (not applicable for CSV import)
 * - eaId → Magic Number string from MT5
 */
export function adaptMT5ToParseResult(report: MT5Report): ParseResult {
  const trades: Trade[] = report.trades.map((mt5Trade): Trade => ({
    ticket:     mt5Trade.ticket,
    openTime:   mt5Trade.openTime,
    type:       mt5Trade.type,
    size:       mt5Trade.size,          // string
    item:       mt5Trade.item,          // raw symbol including any suffix (e.g. XAUUSD.s)
    openPrice:  mt5Trade.openPrice,     // string
    closeTime:  mt5Trade.closeTime,
    closePrice: mt5Trade.closePrice,    // string
    commission: mt5Trade.commission,    // string
    swap:       mt5Trade.swap,          // string
    profit:     mt5Trade.profit,        // number — Net Profit
    comment:    mt5Trade.comment,
    eaId:       mt5Trade.eaId,          // Magic Number
    similarity: 0,                      // N/A for imported CSV
  }));

  return {
    // Use summary total when available, fall back to summing trades
    totalProfit: report.summary.totalNetProfit !== 0
      ? report.summary.totalNetProfit
      : trades.reduce((sum, t) => sum + t.profit, 0),
    trades,
    totalFound: trades.length,
    currency: report.accountInfo.accountCurrency || 'USD',
    startDate: report.exportInfo.dateRangeFrom ? report.exportInfo.dateRangeFrom.replace(/\//g, '-') : null,
    endDate: report.exportInfo.dateRangeTo ? report.exportInfo.dateRangeTo.replace(/\//g, '-') : null
  };
}
