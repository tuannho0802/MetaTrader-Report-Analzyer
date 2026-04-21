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
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EquitySeries } from "@/lib/types"
import { LayoutGrid } from "lucide-react"

interface ComparisonChartProps {
  series: EquitySeries[]
  height?: number
  title?: string
  description?: string
}

export function ComparisonChart({
  series,
  height = 400,
  title = "Comparative Equity Curve",
  description = "Cumulative profit comparison over time",
}: ComparisonChartProps) {
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

  if (series.length === 0) return null

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
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
              tickFormatter={(val) => `$${val}`}
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
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "hsl(var(--foreground))",
                paddingBottom: "20px",
              }}
            />
            {series.map((s) => (
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
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
