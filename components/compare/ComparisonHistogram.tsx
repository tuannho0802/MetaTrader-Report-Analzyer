"use client"

import React, { useMemo, useState } from "react"
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
import { formatCurrency } from "@/lib/formatCurrency"
import { cn } from "@/lib/utils"

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

  const { bins, totalTradesMap, currency } = useMemo(() => {
    if (!trades || Object.keys(trades).length === 0 || series.length === 0) {
      return { bins: [], totalTradesMap: {}, currency: "" };
    }

    const allTradesList = Object.values(trades).flat();
    if (allTradesList.length === 0) return { bins: [], totalTradesMap: {}, currency: "" };

    const profits = allTradesList.map(t => t.profit);
    const minProfit = Math.min(...profits);
    const maxProfit = Math.max(...profits);
    const currency = series[0]?.currency || "";

    // Rule 4: Sturges' formula for optimal bin count
    const n = allTradesList.length;
    const sturgesCount = Math.ceil(Math.log2(n) + 1);
    const binCount = Math.max(10, Math.min(25, sturgesCount));
    
    let binSize = (maxProfit - minProfit) / binCount;
    if (binSize === 0) binSize = 1;

    const resultBins: any[] = [];
    
    for (let i = 0; i < binCount; i++) {
      const binStart = minProfit + (i * binSize);
      const binEnd = binStart + binSize;
      
      const formatVal = (v: number) => formatCurrency(v, currency).split('.')[0];

      const binObj: any = {
        name: `${formatVal(binStart)} .. ${formatVal(binEnd)}`,
        rangeLabel: formatVal(binStart),
        binStart,
        binEnd,
        tradesByEa: [] as { name: string; count: number; color: string; percentage: number }[]
      };

      // Initialize counts to 0 for each series
      series.forEach(s => {
        binObj[s.id || s.name] = 0;
      });

      resultBins.push(binObj);
    }

    // Populate bins
    Object.entries(trades).forEach(([eaId, eaTrades]) => {
      const s = series.find(ser => (ser.id || ser.name) === eaId);
      if (!s) return;

      eaTrades.forEach(trade => {
        const binIndex = Math.min(
          Math.floor((trade.profit - minProfit) / binSize),
          binCount - 1
        );
        
        if (resultBins[binIndex]) {
          resultBins[binIndex][eaId] = (resultBins[binIndex][eaId] || 0) + 1;
        }
      });
    });

    // Post-process to calculate percentages for tooltip
    resultBins.forEach(bin => {
      let binTotal = 0;
      series.forEach(s => {
        const count = bin[s.id || s.name] || 0;
        if (count > 0) {
          binTotal += count;
        }
      });

      series.forEach(s => {
        const count = bin[s.id || s.name] || 0;
        if (count > 0) {
          bin.tradesByEa.push({
            name: s.name,
            count,
            color: s.color,
            percentage: (count / binTotal) * 100
          });
        }
      });
      
      bin.tradesByEa.sort((a: any, b: any) => b.count - a.count);
      bin.totalCount = binTotal;
    });

    const totalTradesMap: Record<string, number> = {};
    Object.entries(trades).forEach(([eaId, eaTrades]) => {
      totalTradesMap[eaId] = eaTrades.length;
    });

    return { bins: resultBins, totalTradesMap, currency };
  }, [trades, series]);

  if (bins.length === 0) return null;

  const isDark = theme === "dark"
  const gridColor = isDark ? "#333" : "#e5e7eb"
  const textColor = isDark ? "#9ca3af" : "#6b7280"

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    
    return (
      <Card className="p-3 shadow-xl border-border/50 bg-card/90 backdrop-blur-md min-w-[200px]">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
          {t('comparison.histogram.rangeLabel') || "Range"}
        </p>
        <p className="text-sm font-bold mb-3">{data.name}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold pb-1 border-b border-border/50">
            <span>{t('dashboard.trades')}</span>
            <span>{data.totalCount}</span>
          </div>
          
          {data.tradesByEa.slice(0, 8).map((ea: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ea.color }} />
                <span className="text-[11px] font-medium truncate max-w-[120px]">{ea.name}</span>
              </div>
              <span className="text-[11px] font-mono font-bold">
                {ea.count} <span className="text-[9px] text-muted-foreground ml-1">({ea.percentage.toFixed(0)}%)</span>
              </span>
            </div>
          ))}
          {data.tradesByEa.length > 8 && (
            <p className="text-[9px] text-center text-muted-foreground pt-1">
              + {data.tradesByEa.length - 8} more EAs
            </p>
          )}
        </div>
      </Card>
    );
  };

  const [showAllLegend, setShowAllLegend] = useState(false);
  const MAX_LEGEND = 15;

  const renderLegend = (props: any) => {
    const { payload } = props;
    const items = showAllLegend ? payload : payload.slice(0, MAX_LEGEND);

    return (
      <div className="space-y-3 mb-4">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {items.filter((entry: any) => entry.type !== 'none').map((entry: any, index: number) => {
            const s = series.find(ser => (ser.id || ser.name) === entry.dataKey);
            if (!s) return null;
            const isHidden = hiddenSeries.has(s.id || s.name);
            
            return (
              <li 
                key={`item-${index}`} 
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold cursor-pointer transition-opacity",
                  isHidden ? "opacity-30 line-through" : "hover:opacity-80"
                )}
                onClick={() => onLegendClick?.(s.name)}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span style={{ color: textColor }}>{s.name}</span>
              </li>
            );
          })}
        </ul>
        {payload.length > MAX_LEGEND && (
          <div className="flex justify-center">
            <button 
              onClick={() => setShowAllLegend(!showAllLegend)}
              className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest"
            >
              {showAllLegend ? 'Show less' : `Show ${payload.length - MAX_LEGEND} more`}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={bins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="rangeLabel" 
            stroke={textColor}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            stroke={textColor}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
          <Legend content={renderLegend} verticalAlign="top" height={40}/>
          {series.map((s) => !hiddenSeries.has(s.id || s.name) && (
            <React.Fragment key={s.id || s.name}>
              <Bar
                dataKey={s.id || s.name}
                name={s.name}
                fill={s.color}
                radius={[2, 2, 0, 0]}
                isAnimationActive={series.length <= 10}
              />
              <Line
                type="monotone"
                dataKey={s.id || s.name}
                name={s.name}
                stroke={s.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                opacity={0.3}
                legendType="none"
              />
            </React.Fragment>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
