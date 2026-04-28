"use client"

import React, { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  Label
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EquitySeries } from "@/lib/types"
import { LayoutGrid } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { getCurrencySymbol, formatCurrency } from "@/lib/formatCurrency"

interface ComparisonChartProps {
  series: EquitySeries[]
  height?: number
  title?: string
  description?: string
  hiddenSeries?: Set<string>
  onLegendClick?: (name: string) => void
}

export function ComparisonChart({
  series,
  height = 400,
  title,
  description,
  hiddenSeries = new Set(),
  onLegendClick,
}: ComparisonChartProps) {
  const { t } = useTranslation()
  const displayTitle = title || t('chart.equityTitle')
  const displayDescription = description || t('chart.equityDesc')

  const chartData = useMemo(() => {
    if (series.length === 0) return []

    // Collect all unique date strings across all series
    const allDatesSet = new Set<string>()
    series.forEach((s) => s.data.forEach((d) => allDatesSet.add(d.date)))

    const sortedDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )

    // Build a flat array where each entry has { date, [seriesName]: equity }
    // We forward-fill equity values for series that have no data at a given date
    const lastEquity: Record<string, number> = {}
    series.forEach((s) => (lastEquity[s.name] = 0))

    // Build lookup: seriesName → Map<date, equity>
    const lookups: Record<string, Map<string, number>> = {}
    series.forEach((s) => {
      lookups[s.name] = new Map(s.data.map((d) => [d.date, d.equity]))
    })

    const data = sortedDates.map((date) => {
      const entry: Record<string, any> = { date }
      series.forEach((s) => {
        if (lookups[s.name].has(date)) {
          lastEquity[s.name] = lookups[s.name].get(date)!
        }
        entry[s.name] = lastEquity[s.name]
      })
      return entry
    })

    // Downsample to max 300 points for perf
    if (data.length > 300) {
      const step = Math.ceil(data.length / 300)
      return data.filter((_, i) => i % step === 0 || i === data.length - 1)
    }

    return data
  }, [series])

  // Find Peak points for each EA to render ReferenceDots
  const peaks = useMemo(() => {
    const p: Record<string, { date: string, value: number }> = {};
    series.forEach(s => {
      let max = -Infinity;
      let maxDate = '';
      s.data.forEach(d => {
        if (d.equity > max) {
          max = d.equity;
          maxDate = d.date;
        }
      });
      if (maxDate) p[s.name] = { date: maxDate, value: max };
    });
    return p;
  }, [series]);

  if (series.length === 0) return null

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{displayTitle}</CardTitle>
            <CardDescription className="text-xs">{displayDescription}</CardDescription>
          </div>
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <LayoutGrid size={18} className="text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent style={{ height }} className="pt-6 pr-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
            <XAxis dataKey="date" hide={true} />
            <YAxis
              tick={{ fontSize: 10, fontWeight: 500 }}
              tickFormatter={(val) => `${getCurrencySymbol(series[0]?.currency)}${val}`}
              axisLine={false}
              tickLine={false}
              className="fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                padding: "12px",
              }}
              itemStyle={{ fontSize: "12px", fontWeight: "600", padding: "2px 0" }}
              labelStyle={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "hsl(var(--muted-foreground))",
                marginBottom: "8px",
              }}
              formatter={(value: any, name: any) => {
                const s = series.find(ser => ser.name === name);
                return [formatCurrency(value, s?.currency), name];
              }}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              content={(props) => {
                const { payload } = props;
                return (
                  <ul className="flex flex-wrap justify-end gap-4 pb-5">
                    {payload?.map((entry: any, index: number) => {
                      const isHidden = hiddenSeries.has(entry.value);
                      return (
                        <li 
                          key={`item-${index}`} 
                          className={`flex items-center gap-2 text-xs font-bold cursor-pointer transition-opacity ${isHidden ? 'opacity-40 line-through' : 'opacity-100 hover:opacity-80'}`}
                          onClick={() => onLegendClick?.(entry.value)}
                        >
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: entry.color }} 
                          />
                          <span className="text-foreground">{entry.value}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }}
            />
            {series.map((s) => !hiddenSeries.has(s.name) && (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={800}
                connectNulls
              />
            ))}
            {series.map((s) => {
              if (hiddenSeries.has(s.name)) return null;
              const peak = peaks[s.name];
              if (!peak) return null;
              
              // Only render dot if the point actually exists in downsampled chartData
              const exists = chartData.some(d => d.date === peak.date);
              if (!exists) return null;

              return (
                <ReferenceDot
                  key={`peak-${s.name}`}
                  x={peak.date}
                  y={peak.value}
                  r={4}
                  fill={s.color}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  <Label value="Peak" position="top" fill={s.color} fontSize={10} fontWeight="bold" />
                </ReferenceDot>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-4 text-xs text-muted-foreground italic border-t border-border/40 pt-2">
          {t('comparison.equityChartNote')}
        </p>
      </CardContent>
    </Card>
  )
}
