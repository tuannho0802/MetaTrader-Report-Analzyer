import { ComparisonResult } from './types';

export function exportComparisonCSV(result: ComparisonResult): void {
  const { metrics } = result;
  if (metrics.length === 0) return;
  
  const headers = [
    'EA Identifier', 'Net Profit', 'Win Rate (%)', 'Profit Factor',
    'Max Drawdown (%)', 'Avg Profit/Trade', 'Best Trade', 'Worst Trade',
    'Sharpe Ratio', 'Total Trades'
  ];
  
  const rows = metrics.map(m => [
    m.name,
    m.totalProfit.toFixed(2),
    m.winRate.toFixed(1),
    m.profitFactor === 9999 ? '∞' : m.profitFactor.toFixed(2),
    m.maxDrawdown.toFixed(2),
    m.avgProfitPerTrade.toFixed(2),
    m.bestTrade.toFixed(2),
    m.worstTrade.toFixed(2),
    m.sharpeRatio !== null ? m.sharpeRatio.toFixed(2) : 'N/A',
    m.tradeCount.toString()
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ea_comparison_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPerformanceCSV(metrics: any[], currency: string): void {
  if (metrics.length === 0) return;
  
  const headers = [
    'EA Name', 'Net Profit', 'Win Rate (%)', 'Max Drawdown (%)', 
    'Profit Factor', 'Sharpe Ratio', 'Expectancy', 'Recovery Factor', 
    'Profit / Day', 'Total Trades'
  ];
  
  const rows = metrics.map(m => [
    m.name,
    m.totalProfit.toFixed(2),
    m.winRate.toFixed(1),
    m.maxDrawdown.toFixed(2),
    m.profitFactor === 9999 ? '∞' : m.profitFactor.toFixed(2),
    m.sharpeRatio !== null ? m.sharpeRatio.toFixed(2) : 'N/A',
    m.expectancy.toFixed(2),
    m.recoveryFactor.toFixed(2),
    m.profitPerDay.toFixed(2),
    m.tradeCount.toString()
  ]);
  
  const csvContent = [
    `Currency: ${currency}`,
    headers.join(','), 
    ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `performance_export_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
