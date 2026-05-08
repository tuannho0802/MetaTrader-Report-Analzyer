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

  const result = {
    totalProfit: report.summary.totalNetProfit !== 0
      ? report.summary.totalNetProfit
      : trades.reduce((sum, t) => sum + t.profit, 0),
    trades,
    totalFound: trades.length,
    currency: report.accountInfo.accountCurrency || 'USD',
    startDate: report.exportInfo.dateRangeFrom ? report.exportInfo.dateRangeFrom.split(' ')[0].replace(/\//g, '-') : null,
    endDate: report.exportInfo.dateRangeTo ? report.exportInfo.dateRangeTo.split(' ')[0].replace(/\//g, '-') : null,
    initialBalance: report.accountInfo.currentBalance,
    finalBalance: report.accountInfo.currentBalance
  };

  // Fallback to deriving from trades if not available from export info
  if ((!result.startDate || !result.endDate) && trades.length > 0) {
    let minTime = new Date('2100-01-01').getTime();
    let maxTime = new Date('1970-01-01').getTime();
    
    for (const trade of trades) {
      if (!trade.closeTime) continue;
      const timeStr = trade.closeTime.replace(/\./g, '/');
      const timeVal = new Date(timeStr).getTime();
      if (!isNaN(timeVal)) {
        if (timeVal < minTime) minTime = timeVal;
        if (timeVal > maxTime) maxTime = timeVal;
      }
    }
    
    if (minTime <= maxTime && minTime !== new Date('2100-01-01').getTime()) {
      const minDate = new Date(minTime);
      const maxDate = new Date(maxTime);
      
      const formatFallback = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      if (!result.startDate) result.startDate = formatFallback(minDate);
      if (!result.endDate) result.endDate = formatFallback(maxDate);
    }
  }

  return result;
}
