import { Trade, ComparisonResult, EquitySeries, MetricsRow } from "./types";

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#6366f1", // indigo-500
  "#f43f5e", // rose-500
  "#8b5cf6", // violet-500
];

function calculateEquity(trades: Trade[]): { date: string; equity: number }[] {
  const sorted = [...trades].sort((a, b) => 
    new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );

  let runningTotal = 0;
  return sorted.map(t => {
    runningTotal += t.profit;
    return {
      date: t.closeTime,
      equity: Number(runningTotal.toFixed(2))
    };
  });
}

function calculateMetrics(name: string, trades: Trade[]): MetricsRow {
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const wins = trades.filter(t => t.profit > 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  return {
    name,
    totalProfit: Number(totalProfit.toFixed(2)),
    winRate: Number(winRate.toFixed(1)),
    tradeCount: trades.length
  };
}

export function compareSameReport(
  trades: Trade[],
  eaIds: string[]
): ComparisonResult {
  const series: EquitySeries[] = [];
  const metrics: MetricsRow[] = [];

  eaIds.forEach((id, index) => {
    const eaTrades = trades.filter(t => 
      (t.eaId || "").toLowerCase() === id.toLowerCase() || 
      (t.comment || "").toLowerCase().includes(id.toLowerCase())
    );

    if (eaTrades.length > 0) {
      series.push({
        name: id,
        data: calculateEquity(eaTrades),
        color: COLORS[index % COLORS.length]
      });
      metrics.push(calculateMetrics(id, eaTrades));
    }
  });

  return { mode: 'same', series, metrics };
}

export function compareCrossReport(
  reportA: { trades: Trade[]; eaId: string; name: string },
  reportB: { trades: Trade[]; eaId: string; name: string }
): ComparisonResult {
  const series: EquitySeries[] = [];
  const metrics: MetricsRow[] = [];

  // Process Report A
  const tradesA = reportA.trades.filter(t => 
    (t.eaId || "").toLowerCase() === reportA.eaId.toLowerCase() || 
    (t.comment || "").toLowerCase().includes(reportA.eaId.toLowerCase())
  );
  if (tradesA.length > 0) {
    series.push({
      name: `${reportA.eaId} (${reportA.name})`,
      data: calculateEquity(tradesA),
      color: COLORS[0]
    });
    metrics.push(calculateMetrics(`${reportA.eaId} (${reportA.name})`, tradesA));
  }

  // Process Report B
  const tradesB = reportB.trades.filter(t => 
    (t.eaId || "").toLowerCase() === reportB.eaId.toLowerCase() || 
    (t.comment || "").toLowerCase().includes(reportB.eaId.toLowerCase())
  );
  if (tradesB.length > 0) {
    series.push({
      name: `${reportB.eaId} (${reportB.name})`,
      data: calculateEquity(tradesB),
      color: COLORS[1]
    });
    metrics.push(calculateMetrics(`${reportB.eaId} (${reportB.name})`, tradesB));
  }

  return { mode: 'cross', series, metrics };
}
