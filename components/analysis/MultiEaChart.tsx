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
import { useTranslation } from "@/lib/i18n"
import { LayoutGrid } from "lucide-react"
import { getCurrencySymbol, formatCurrency } from "@/lib/formatCurrency"

interface MultiEaChartProps {
  data?: any[];
  currency?: string;
  title?: string;
  description?: string;
  height?: number;
}

export function MultiEaChart({ data: externalData, currency: externalCurrency, title, description, height = 400 }: MultiEaChartProps) {
  const { sessions, activeSessionId } = useAnalysisStore()
  const activeSessions = sessions.filter(s => !s.archived)
  const activeSession = activeSessions.find(s => s.id === activeSessionId)
  const multiEaResults = activeSession?.multiEaResults || {}
  const { t } = useTranslation()

  const currency = externalCurrency || activeSession?.currency || "USD";

  const chartData = useMemo(() => {
    if (externalData) return externalData;

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
      new Date(a.replace(/\./g, "/")).getTime() - new Date(b.replace(/\./g, "/")).getTime()
    )

    // 2. For each timestamp, calculate cumulative profit for each EA
    const data: any[] = []
    const runningTotals: Record<string, number> = {}
    patterns.forEach(p => runningTotals[p] = 0)

    // Create chunks of trade indices for efficiency or just iterate
    const tradeIterators: Record<string, number> = {}
    patterns.forEach(p => tradeIterators[p] = 0)

    sortedTimestamps.forEach(ts => {
      const entry: any = { date: ts }
      
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

    // Downsample
    if (data.length > 300) {
      const step = Math.ceil(data.length / 300)
      return data.filter((_, i) => i % step === 0 || i === data.length - 1)
    }

    return data
  }, [multiEaResults, externalData])

  const seriesNames = useMemo(() => {
    if (externalData && externalData.length > 0) {
      return Object.keys(externalData[0]).filter(k => k !== 'date' && k !== 'time');
    }
    return Object.keys(multiEaResults);
  }, [externalData, multiEaResults]);

  if (seriesNames.length === 0) {
    return null
  }

  const colors = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#6366f1", // indigo-500
    "#f43f5e", // rose-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
  ]

  return (
    <Card className="col-span-full border-border/50 shadow-lg overflow-hidden bg-card/30 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{title || t('analysis.equityCurve')}</CardTitle>
            <CardDescription className="text-xs italic">
              {description || t('analysis.cumulativeProfit')}
            </CardDescription>
          </div>
          <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
            <LayoutGrid size={18} className="text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent style={{ height }} className="pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/20" />
            <XAxis 
              dataKey={externalData ? "date" : "time"} 
              hide={true}
            />
            <YAxis 
              tick={{ fontSize: 10, fontWeight: 500 }} 
              tickFormatter={(val) => formatCurrency(val, currency).split(".")[0]}
              axisLine={false}
              tickLine={false}
              className="fill-muted-foreground"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 0' }}
              labelStyle={{ fontSize: '10px', fontWeight: '800', color: 'hsl(var(--muted-foreground))', marginBottom: '8px', textTransform: 'uppercase' }}
              formatter={(value: any) => [formatCurrency(Number(value), currency), ""]}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: 'hsl(var(--foreground))', paddingBottom: '20px' }}
            />
            {seriesNames.map((p, i) => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={colors[i % colors.length]}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={1500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
