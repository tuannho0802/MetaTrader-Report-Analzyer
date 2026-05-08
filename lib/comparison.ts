import { Trade, ComparisonResult, EquitySeries, MetricsRow, EquityPoint } from "./types";
import { parseMT4Date } from "./parser";

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#6366f1", // indigo-500
  "#f43f5e", // rose-500
  "#8b5cf6", // violet-500
];


export function calculateEquity(
  trades: Trade[], 
  initialBalance: number = 0
): EquityPoint[] {
  if (trades.length === 0) return [];
  
  // Sort by close time
  const sorted = [...trades].sort((a, b) => {
    const dA = parseMT4Date(a.closeTime);
    const dB = parseMT4Date(b.closeTime);
    if (!dA || !dB) return 0;
    return dA.getTime() - dB.getTime();
  });
  
  const points: EquityPoint[] = [];
  let runningBalance = initialBalance;
  
  // Add initial point
  const firstDate = sorted[0].closeTime.split(' ')[0].replace(/\./g, '-');
  points.push({ time: firstDate, value: runningBalance });
  
  // Build equity curve
  sorted.forEach(trade => {
    // PRIORITY 1: Use balance from report if available
    if (trade.balance !== undefined) {
      runningBalance = trade.balance;
    } else {
      // FALLBACK: Calculate from profit
      runningBalance += trade.profit + (parseFloat(trade.swap) || 0) + (parseFloat(trade.commission) || 0);
    }
    
    const date = trade.closeTime.split(' ')[0].replace(/\./g, '-');
    points.push({ time: date, value: Number(runningBalance.toFixed(2)) });
  });
  
  return points;
}

export function calculateDrawdown(equityPoints: EquityPoint[]): EquityPoint[] {
  if (equityPoints.length === 0) return [];
  
  let peak = equityPoints[0].value;
  const drawdownPoints: EquityPoint[] = [];
  
  equityPoints.forEach(point => {
    // Update peak if current value is higher
    if (point.value > peak) {
      peak = point.value;
    }
    
    // Calculate drawdown percentage
    // Peak must be > 0 to have a meaningful drawdown %
    let drawdown = 0;
    if (peak > 0) {
      drawdown = ((point.value - peak) / peak) * 100;
    } else if (point.value < peak) {
      // If peak is 0 or negative, any further drop is technically a 100% loss of initial 0 balance
      drawdown = -100;
    }
    
    // CRITICAL: Clamp -100% to 0% as per professional standards
    const clampedDrawdown = Math.max(-100, Math.min(0, drawdown));
    
    drawdownPoints.push({
      time: point.time,
      value: Number(clampedDrawdown.toFixed(2))
    });
  });
  
  return drawdownPoints;
}

export function calculateMetrics(name: string, trades: Trade[], currency: string, initialBalance: number = 0): MetricsRow {
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const wins = trades.filter(t => t.profit > 0);
  const losses = trades.filter(t => t.profit <= 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;

  const grossProfit = wins.reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = losses.reduce((sum, t) => sum + t.profit, 0);
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 9999 : 0) : grossProfit / Math.abs(grossLoss);

  // Calculate Max Drawdown (Percentage and Absolute)
  let maxEquity = initialBalance;
  let maxDrawdown = 0; // %
  let maxDrawdownAbs = 0; // Absolute amount
  let runningEquity = initialBalance;
  
  // Need to sort trades to calculate drawdown correctly
  const sorted = [...trades].sort((a, b) => 
    new Date(a.closeTime.replace(/\./g, '/')).getTime() - new Date(b.closeTime.replace(/\./g, '/')).getTime()
  );

  const profits: number[] = [];
  const uniqueDays = new Set<string>();
  
  for (const t of sorted) {
    // Priority: Use trade balance if available (usually more accurate)
    if (t.balance !== undefined) {
      runningEquity = t.balance;
    } else {
      runningEquity += t.profit + (parseFloat(t.swap) || 0) + (parseFloat(t.commission) || 0);
    }
    
    profits.push(t.profit);
    
    // Track unique trading days based on close time
    const day = t.closeTime.split(' ')[0];
    if (day) uniqueDays.add(day);

    if (runningEquity > maxEquity) {
      maxEquity = runningEquity;
    }
    
    // Drawdown amount
    const currentDrawdownAbs = maxEquity - runningEquity;
    if (currentDrawdownAbs > maxDrawdownAbs) {
      maxDrawdownAbs = currentDrawdownAbs;
    }

    // Drawdown percentage
    const currentDrawdown = maxEquity > 0 ? ((runningEquity - maxEquity) / maxEquity) * 100 : 0;
    if (currentDrawdown < maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
  }

  const avgProfitPerTrade = trades.length > 0 ? totalProfit / trades.length : 0;
  const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.profit)) : 0;
  const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.profit)) : 0;

  // New Metrics
  const buyTrades = trades.filter(t => t.type?.toLowerCase().includes('buy'));
  const sellTrades = trades.filter(t => t.type?.toLowerCase().includes('sell'));
  const longRate = trades.length > 0 ? (buyTrades.length / trades.length) * 100 : 0;
  const shortRate = trades.length > 0 ? (sellTrades.length / trades.length) * 100 : 0;

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const expectancy = (winRate / 100 * avgWin) + ((1 - winRate / 100) * avgLoss);
  
  const recoveryFactor = maxDrawdownAbs <= 0 ? (totalProfit > 0 ? 9999 : 0) : totalProfit / maxDrawdownAbs;
  const profitPerDay = uniqueDays.size > 0 ? totalProfit / uniqueDays.size : 0;

  let sharpeRatio: number | null = null;
  if (profits.length > 1) {
    const mean = totalProfit / profits.length;
    const variance = profits.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / (profits.length - 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0) {
      sharpeRatio = mean / stdDev;
    } else {
      sharpeRatio = 0;
    }
  } else if (profits.length === 1) {
    sharpeRatio = 0;
  }

  return {
    name,
    totalProfit: Number(totalProfit.toFixed(2)),
    winRate: Number(winRate.toFixed(1)),
    tradeCount: trades.length,
    currency,
    profitFactor: Number(profitFactor.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    avgProfitPerTrade: Number(avgProfitPerTrade.toFixed(2)),
    bestTrade: Number(bestTrade.toFixed(2)),
    worstTrade: Number(worstTrade.toFixed(2)),
    sharpeRatio: sharpeRatio !== null ? Number(sharpeRatio.toFixed(2)) : null,
    longRate: Number(longRate.toFixed(1)),
    shortRate: Number(shortRate.toFixed(1)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    recoveryFactor: Number(recoveryFactor.toFixed(2)),
    profitPerDay: Number(profitPerDay.toFixed(2))
  };
}

export function compareSameReport(
  trades: Trade[],
  eaIds: string[],
  currency: string
): ComparisonResult {
  const series: EquitySeries[] = [];
  const metrics: MetricsRow[] = [];

  const tradesByEa: Record<string, Trade[]> = {};

  eaIds.forEach((id, index) => {
    const eaTrades = trades.filter(t => 
      (t.eaId || "").toLowerCase() === id.toLowerCase() || 
      (t.comment || "").toLowerCase().includes(id.toLowerCase())
    );

    if (eaTrades.length > 0) {
      tradesByEa[id] = eaTrades;
      series.push({
        name: id,
        data: calculateEquity(eaTrades),
        color: COLORS[index % COLORS.length],
        currency
      });
      metrics.push(calculateMetrics(id, eaTrades, currency));
    }
  });

  return { mode: 'same', series, metrics, tradesByEa };
}

export function compareCrossReport(
  reportA: { trades: Trade[]; eaId: string; name: string; currency: string },
  reportB: { trades: Trade[]; eaId: string; name: string; currency: string }
): ComparisonResult {
  const series: EquitySeries[] = [];
  const metrics: MetricsRow[] = [];

  const tradesByEa: Record<string, Trade[]> = {};

  // Process Report A
  const tradesA = reportA.trades.filter(t => 
    (t.eaId || "").toLowerCase() === reportA.eaId.toLowerCase() || 
    (t.comment || "").toLowerCase().includes(reportA.eaId.toLowerCase())
  );
  if (tradesA.length > 0) {
    const nameA = `${reportA.eaId} (${reportA.name})`;
    tradesByEa[nameA] = tradesA;
    series.push({
      name: nameA,
      data: calculateEquity(tradesA),
      color: COLORS[0],
      currency: reportA.currency
    });
    metrics.push(calculateMetrics(nameA, tradesA, reportA.currency));
  }

  // Process Report B
  const tradesB = reportB.trades.filter(t => 
    (t.eaId || "").toLowerCase() === reportB.eaId.toLowerCase() || 
    (t.comment || "").toLowerCase().includes(reportB.eaId.toLowerCase())
  );
  if (tradesB.length > 0) {
    const nameB = `${reportB.eaId} (${reportB.name})`;
    tradesByEa[nameB] = tradesB;
    series.push({
      name: nameB,
      data: calculateEquity(tradesB),
      color: COLORS[1],
      currency: reportB.currency
    });
    metrics.push(calculateMetrics(nameB, tradesB, reportB.currency));
  }

  return { mode: 'cross', series, metrics, tradesByEa };
}
