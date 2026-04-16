"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Layers, PieChart, Activity } from "lucide-react"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { cn } from "@/lib/utils"

export function KpiCards() {
  const { currentResult } = useAnalysisStore()

  if (!currentResult) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { trades, totalProfit } = currentResult
  const tradeCount = trades.length
  
  // Win Rate calculation
  const wins = trades.filter(t => t.profit > 0).length
  const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0

  // Profit Factor calculation
  const grossProfit = trades.reduce((sum, t) => t.profit > 0 ? sum + t.profit : sum, 0)
  const grossLoss = trades.reduce((sum, t) => t.profit < 0 ? sum + Math.abs(t.profit) : sum, 0)
  
  let profitFactor: string = "0.00"
  if (tradeCount > 0) {
    if (grossLoss === 0) {
      profitFactor = grossProfit > 0 ? "∞" : "0.00"
    } else {
      profitFactor = (grossProfit / grossLoss).toFixed(2)
    }
  }

  const kpis = [
    {
      title: "Total Net Profit",
      value: `${totalProfit.toFixed(2)} USD`,
      icon: totalProfit >= 0 ? TrendingUp : TrendingDown,
      description: "Lợi nhuận ròng từ các lệnh đã lọc",
      color: totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: PieChart,
      description: `${wins} lệnh thắng trên tổng số ${tradeCount}`,
      color: "text-blue-500"
    },
    {
      title: "Total Trades",
      value: tradeCount.toString(),
      icon: Activity,
      description: "Số lượng giao dịch khớp điều kiện",
      color: "text-amber-500"
    },
    {
      title: "Profit Factor",
      value: profitFactor,
      icon: Layers,
      description: "Gross Profit / Gross Loss",
      color: "text-purple-500"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className={cn("h-4 w-4", kpi.color)} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", i === 0 && kpi.color)}>{kpi.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
