"use client"

import React, { useMemo } from "react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EquitySeries, Trade } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"
import { useTheme } from "next-themes"

interface ComparisonHistogramProps {
  series: EquitySeries[];
  trades: Record<string, Trade[]>;
  height?: number;
  hiddenSeries?: Set<string>;
  onLegendClick?: (name: string) => void;
}

export function ComparisonHistogram({ series, trades, height = 300, hiddenSeries = new Set(), onLegendClick }: ComparisonHistogramProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const chartData = useMemo(() => {
    if (!trades || Object.keys(trades).length === 0 || series.length === 0) return null;

    const allTrades = Object.values(trades).flat();
    if (allTrades.length < 5) return { error: "notEnoughData" };

    let minProfit = Infinity;
    let maxProfit = -Infinity;

    // Find global min and max profit
    allTrades.forEach(trade => {
      if (trade.profit < minProfit) minProfit = trade.profit;
      if (trade.profit > maxProfit) maxProfit = trade.profit;
    });

    if (minProfit === Infinity || maxProfit === -Infinity) return null;

    // If all profits are the same, expand range to avoid division by zero or single bin
    if (minProfit === maxProfit) {
      minProfit -= 1;
      maxProfit += 1;
    }

    // Calculate bin size and ranges (around 15 bins for better balance)
    const binCount = 15;
    const range = maxProfit - minProfit;
    const binSize = range / binCount;

    const currency = series[0]?.currency || "";

    const bins: any[] = [];
    for (let i = 0; i < binCount; i++) {
      const binStart = minProfit + (i * binSize);
      const binEnd = binStart + binSize;
      
      const formatVal = (v: number) => {
        const absStr = Math.abs(v).toFixed(0);
        return v < 0 ? `-${currency}${absStr}` : `${currency}${absStr}`;
      };

      const binObj: any = {
        name: `${formatVal(binStart)} .. ${formatVal(binEnd)}`,
        rangeLabel: formatVal(binStart),
        binStart,
        binEnd
      };

      // Initialize counts to 0 for each series
      series.forEach(s => {
        binObj[s.name] = 0;
      });

      bins.push(binObj);
    }

    // Populate bins
    Object.entries(trades).forEach(([seriesName, seriesTrades]) => {
      seriesTrades.forEach(trade => {
        // Find which bin this trade belongs to
        let binIndex = Math.floor((trade.profit - minProfit) / binSize);
        // Clamp index
        binIndex = Math.max(0, Math.min(binIndex, binCount - 1));
        
        if (bins[binIndex] && bins[binIndex][seriesName] !== undefined) {
          bins[binIndex][seriesName] += 1;
        }
      });
    });

    const totalTradesMap: Record<string, number> = {};
    Object.entries(trades).forEach(([seriesName, seriesTrades]) => {
      totalTradesMap[seriesName] = seriesTrades.length;
    });

    return { bins, totalTradesMap };
  }, [trades, series]);

  if (!chartData) return null;

  if ('error' in chartData) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border">
        <p className="text-sm font-medium">{t('performance.charts.notEnoughData')}</p>
      </div>
    );
  }

  const { bins, totalTradesMap } = chartData;

  const isDark = theme === "dark"
  const gridColor = isDark ? "#333" : "#e5e7eb"
  const textColor = isDark ? "#9ca3af" : "#6b7280"

  // Custom Legend Renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-2">
        {payload.filter((entry: any) => entry.type !== 'none').map((entry: any, index: number) => {
          const isHidden = hiddenSeries.has(entry.value);
          return (
            <li 
              key={`item-${index}`} 
              className={`flex items-center gap-2 text-xs font-medium cursor-pointer transition-opacity ${isHidden ? 'opacity-40 line-through' : 'opacity-100 hover:opacity-80'}`}
              onClick={() => onLegendClick?.(entry.value)}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              <span style={{ color: textColor }}>{entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Card className="border-border/50 shadow-lg mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold">{t('comparison.profitDistribution')}</CardTitle>
        <CardDescription>{t('comparison.profitDistributionDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: height, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={bins} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} barGap={2} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="rangeLabel" 
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis 
                stroke={textColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  color: isDark ? '#f9fafb' : '#111827',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return `${t('comparison.histogram.rangeLabel')}: ${payload[0].payload.name}`;
                  }
                  return label;
                }}
                formatter={(value: any, name: any) => {
                  const count = Number(value);
                  const total = totalTradesMap[name as string] || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  return [`${count} ${t('dashboard.trades')} (${pct}%)`, name];
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
                cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }}
              />
              <Legend content={renderLegend} verticalAlign="top" height={36}/>
              {series.map((s) => !hiddenSeries.has(s.name) && (
                <React.Fragment key={s.name}>
                  <Bar
                    dataKey={s.name}
                    fill={s.color}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    opacity={0.5}
                    legendType="none"
                  />
                </React.Fragment>
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-xs text-muted-foreground italic border-t border-border/40 pt-2">
          {t('comparison.histogramChartNote')}
        </p>
      </CardContent>
    </Card>
  )
}
