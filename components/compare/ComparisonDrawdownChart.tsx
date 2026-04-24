"use client"

import React, { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EquitySeries } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"
import { useTheme } from "next-themes"

interface ComparisonDrawdownChartProps {
  series: EquitySeries[];
  height?: number;
  hiddenSeries?: Set<string>;
  onLegendClick?: (name: string) => void;
}

export function ComparisonDrawdownChart({ series, height = 300, hiddenSeries = new Set(), onLegendClick }: ComparisonDrawdownChartProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const { chartData, dataKeys, minDrawdown } = useMemo(() => {
    const dataKeys: { name: string; color: string }[] = []
    
    // First, convert each series into a list of drawdowns
    const seriesDrawdowns = series.map(s => {
      let maxEquity = 0;
      dataKeys.push({ name: s.name, color: s.color });
      
      const drawdowns = s.data.map(point => {
        if (point.equity > maxEquity) {
          maxEquity = point.equity;
        }
        const dd = maxEquity > 0 ? ((point.equity - maxEquity) / maxEquity) * 100 : 0;
        return { date: point.date, drawdown: dd };
      });
      return { name: s.name, drawdowns };
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
        
        // We only want to keep the latest drawdown per day if multiple trades happen on the same day
        // For simplicity and to match the equity chart, we just overwrite.
        // If we want absolute minimum drawdown for that day, we should Math.min
        if (currentObj[s.name] === undefined || point.drawdown < currentObj[s.name]) {
            currentObj[s.name] = point.drawdown;
            if (point.drawdown < minDd) minDd = point.drawdown;
        }
        
        mergedData.set(date, currentObj)
      })
    })

    // Sort by date
    const finalData = Array.from(mergedData.values()).sort((a, b) => 
      new Date(a.date.replace(/\./g, '/')).getTime() - new Date(b.date.replace(/\./g, '/')).getTime()
    )

    // Forward fill missing data for each series so the area chart doesn't break
    const lastValues: Record<string, number> = {}
    finalData.forEach(row => {
      dataKeys.forEach(key => {
        if (row[key.name] === undefined) {
          if (lastValues[key.name] !== undefined) {
            row[key.name] = lastValues[key.name]
          } else {
            row[key.name] = 0 // default 0 before first trade
          }
        } else {
          lastValues[key.name] = row[key.name]
        }
      })
    })

    return { chartData: finalData, dataKeys, minDrawdown: minDd }
  }, [series])

  if (chartData.length === 0) return null

  const isDark = theme === "dark"
  const gridColor = isDark ? "#333" : "#e5e7eb"
  const textColor = isDark ? "#9ca3af" : "#6b7280"

  // Custom Legend Renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-2">
        {payload.map((entry: any, index: number) => {
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
        <CardTitle className="text-base font-bold">Drawdown</CardTitle>
        <CardDescription>So sánh mức sụt giảm tài khoản theo thời gian</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: height, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => val.split(" ")[0]}
                stroke={textColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                tickFormatter={(val) => `${val.toFixed(1)}%`}
                stroke={textColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[Math.floor(minDrawdown - 5), 0]}
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
                formatter={(value: any, name: any) => {
                  const numValue = typeof value === 'number' ? value : Number(value) || 0;
                  return [`${numValue.toFixed(2)}%`, name];
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
              />
              <Legend content={renderLegend} verticalAlign="top" height={36}/>
              {dataKeys.map((key) => !hiddenSeries.has(key.name) && (
                <Area
                  key={key.name}
                  type="monotone"
                  dataKey={key.name}
                  stroke={key.color}
                  fill={key.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
