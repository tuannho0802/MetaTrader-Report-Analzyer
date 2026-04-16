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
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"

export function MultiEaChart() {
  const { multiEaResults } = useAnalysisStore()

  const chartData = useMemo(() => {
    const patterns = Object.keys(multiEaResults)
    if (patterns.length === 0) return []

    // 1. Collect all unique timestamps (sorted)
    const allTimestampsSet = new Set<string>()
    patterns.forEach(p => {
      multiEaResults[p].trades.forEach(t => {
        allTimestampsSet.add(t.closeTime)
      })
    })

    const sortedTimestamps = Array.from(allTimestampsSet).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    )

    // 2. For each timestamp, calculate cumulative profit for each EA
    const data: any[] = []
    const runningTotals: Record<string, number> = {}
    patterns.forEach(p => runningTotals[p] = 0)

    // Create chunks of trade indices for efficiency or just iterate
    const tradeIterators: Record<string, number> = {}
    patterns.forEach(p => tradeIterators[p] = 0)

    sortedTimestamps.forEach(ts => {
      const entry: any = { time: ts }
      
      patterns.forEach(p => {
        const trades = multiEaResults[p].trades
        // Add all trades that happened at THIS timestamp
        while (
          tradeIterators[p] < trades.length && 
          trades[tradeIterators[p]].closeTime === ts
        ) {
          runningTotals[p] += trades[tradeIterators[p]].profit
          tradeIterators[p]++
        }
        entry[p] = Number(runningTotals[p].toFixed(2))
      })
      
      data.push(entry)
    })

    // Downsample if too many points (> 200) to keep chart snappy
    if (data.length > 200) {
      const step = Math.ceil(data.length / 200)
      return data.filter((_, i) => i % step === 0 || i === data.length - 1)
    }

    return data
  }, [multiEaResults])

  if (Object.keys(multiEaResults).length === 0) {
    return null
  }

  const colors = [
    "#2563eb", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
  ]

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Comparative Equity Curve</CardTitle>
        <CardDescription>
          Cumulative Net Profit over time for selected EA patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              hide={true} // Hide complex date strings on X axis for cleaner look
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickFormatter={(val) => `${val}`}
              className="fill-muted-foreground"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Legend />
            {Object.keys(multiEaResults).map((p, i) => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
