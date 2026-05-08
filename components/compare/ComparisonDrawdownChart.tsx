"use client"

import React, { useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceDot,
  Label
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EquitySeries } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ComparisonDrawdownChartProps {
  series: EquitySeries[];
  height?: number;
  hiddenSeries?: Set<string>;
  onLegendClick?: (id: string) => void;
}

export function ComparisonDrawdownChart({ series, height = 300, hiddenSeries = new Set(), onLegendClick }: ComparisonDrawdownChartProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [showAllLegend, setShowAllLegend] = useState(false);
  const MAX_LEGEND = 15;

  const { chartData, dataKeys, minDrawdown } = useMemo(() => {
    const dataKeys: { id: string; name: string; color: string }[] = []
    
    // First, convert each series into a list of drawdowns
    const seriesDrawdowns = series.map(s => {
      let maxEquity = -Infinity;
      const key = s.id || s.name;
      dataKeys.push({ id: key, name: s.name, color: s.color });
      
      const drawdowns = s.data.map(point => {
        if (point.value > maxEquity) {
          maxEquity = point.value;
        }
        
        let dd = 0;
        if (maxEquity > 0) {
          dd = ((point.value - maxEquity) / maxEquity) * 100;
        } else if (point.value < maxEquity) {
          dd = -100;
        }
        
        // Clamp -100% to 0%
        return { date: point.time, drawdown: Math.max(-100, Math.min(0, dd)) };
      });
      return { id: key, name: s.name, drawdowns };
    });

    // Merge data by date
    const mergedData = new Map<string, any>()
    let minDd = 0;

    seriesDrawdowns.forEach(s => {
      s.drawdowns.forEach(point => {
        const date = point.date.split(" ")[0]
        
        if (!mergedData.has(date)) {
          mergedData.set(date, { date })
        }
        
        const currentObj = mergedData.get(date)
        const key = s.id;
        
        if (currentObj[key] === undefined || point.drawdown < currentObj[key]) {
            currentObj[key] = point.drawdown;
            if (point.drawdown < minDd) minDd = point.drawdown;
        }
      })
    })

    // Sort by date
    const finalData = Array.from(mergedData.values()).sort((a, b) => 
      new Date(a.date.replace(/\./g, '/')).getTime() - new Date(b.date.replace(/\./g, '/')).getTime()
    )

    // Forward fill missing data
    const lastValues: Record<string, number> = {}
    finalData.forEach(row => {
      dataKeys.forEach(k => {
        if (row[k.id] === undefined) {
          row[k.id] = lastValues[k.id] ?? 0;
        } else {
          lastValues[k.id] = row[k.id];
        }
      })
    })

    return { chartData: finalData, dataKeys, minDrawdown: minDd }
  }, [series])

  // Find lowest trough (Max Drawdown) points for each EA
  const troughs = useMemo(() => {
    const t: Record<string, { date: string, value: number }> = {};
    series.forEach(s => {
      let maxEq = -Infinity;
      let maxDd = 0;
      let minDate = '';
      
      s.data.forEach(d => {
        if (d.value > maxEq) maxEq = d.value;
        
        let dd = 0;
        if (maxEq > 0) {
          dd = ((d.value - maxEq) / maxEq) * 100;
        } else if (d.value < maxEq) {
          dd = -100;
        }
        
        const clampedDd = Math.max(-100, Math.min(0, dd));
        if (clampedDd < maxDd) {
          maxDd = clampedDd;
          minDate = d.time.split(" ")[0];
        }
      });
      if (minDate) t[s.id || s.name] = { date: minDate, value: maxDd };
    });
    return t;
  }, [series]);

  if (chartData.length === 0) return null

  const isDark = theme === "dark"
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
  const textColor = isDark ? "#9ca3af" : "#6b7280"
  const shouldAnimate = series.length <= 10;

  // Custom Legend Renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    const items = showAllLegend ? payload : payload.slice(0, MAX_LEGEND);
    
    return (
      <div className="space-y-3 mb-6">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {items.map((entry: any, index: number) => {
            const isHidden = hiddenSeries.has(entry.dataKey);
            const s = series.find(ser => (ser.id || ser.name) === entry.dataKey);
            
            return (
              <li 
                key={`item-${index}`} 
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold cursor-pointer transition-opacity",
                  isHidden ? "opacity-30 line-through" : "hover:opacity-80"
                )}
                onClick={() => onLegendClick?.(entry.dataKey)}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span style={{ color: textColor }}>{s?.name || entry.value}</span>
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
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => val.split(" ")[0]}
            stroke={textColor}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis 
            tickFormatter={(val) => `${val.toFixed(0)}%`}
            stroke={textColor}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[Math.max(Math.floor(minDrawdown - 5), -100), 0]}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))",
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '11px'
            }}
            formatter={(value: any, name: any) => {
              const numValue = Number(value) || 0;
              const s = series.find(ser => (ser.id || ser.name) === name);
              return [`${numValue.toFixed(2)}%`, s?.name || name];
            }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '10px', textTransform: 'uppercase' }}
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Legend content={renderLegend} verticalAlign="top" align="center" />
          {series.map((s) => !hiddenSeries.has(s.id || s.name) && (
            <Area
              key={s.id || s.name}
              type="monotone"
              dataKey={s.id || s.name}
              name={s.name}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.05}
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={shouldAnimate}
              animationDuration={shouldAnimate ? 800 : 0}
            />
          ))}
          {series.map((s) => {
            if (hiddenSeries.has(s.id || s.name)) return null;
            const trough = troughs[s.id || s.name];
            if (!trough || trough.value === 0) return null;
            
            const exists = chartData.some(d => d.date === trough.date);
            if (!exists) return null;

            return (
              <ReferenceDot
                key={`trough-${s.id || s.name}`}
                x={trough.date}
                y={trough.value}
                r={3}
                fill={s.color}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                <Label value="MAX" position="bottom" fill={s.color} fontSize={9} fontWeight="900" />
              </ReferenceDot>
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
