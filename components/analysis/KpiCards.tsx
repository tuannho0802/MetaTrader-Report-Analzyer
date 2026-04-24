"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Layers, PieChart, Activity, ArrowDownCircle, Info } from "lucide-react"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { useTranslation } from "@/lib/i18n"
import { useSettingsStore } from "@/lib/store/useSettingsStore"
import { cn, calculateDrawdown } from "@/lib/utils"
import { ReportDateCard } from "@/components/ReportDateCard"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/formatCurrency"

export function KpiCards() {
  const { sessions, activeSessionId } = useAnalysisStore()
  const activeSession = sessions.find(s => s.id === activeSessionId)
  const currentResult = activeSession?.currentResult || null
  const { t } = useTranslation()
  const { language } = useSettingsStore()

  if (!currentResult) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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

  // Drawdown calculation
  const drawdown = calculateDrawdown(trades);

  const kpis = [
    {
      title: t('analysis.netProfit'),
      value: formatCurrency(totalProfit, activeSession?.currency || 'USD'),
      icon: totalProfit >= 0 ? TrendingUp : TrendingDown,
      description: t('analysis.netProfit'),
      color: totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
    },
    {
      title: t('analysis.winRate'),
      value: `${winRate.toFixed(1)}%`,
      icon: PieChart,
      description: `${wins} wins / ${tradeCount} trades`,
      color: "text-blue-400"
    },
    {
      title: t('analysis.maxDrawdown'),
      value: `-${drawdown.percent.toFixed(1)}%`,
      subValue: `-${formatCurrency(drawdown.amount, activeSession?.currency || 'USD')}`,
      icon: ArrowDownCircle,
      description: t('analysis.maxDrawdown'),
      color: "text-rose-400",
      tooltip: t('analysis.maxDrawdown')
    },
    {
      title: t('analysis.totalTrades'),
      value: tradeCount.toString(),
      icon: Activity,
      description: t('analysis.totalTrades'),
      color: "text-amber-400"
    },
    {
      title: t('analysis.profitFactor'),
      value: profitFactor,
      icon: Layers,
      description: "Profit / Loss Ratio",
      color: "text-purple-400"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <ReportDateCard className="h-full flex flex-col justify-center" />
      {kpis.map((kpi, i) => (
        <Card key={i} className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <div className="flex items-center gap-1">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{kpi.title}</CardTitle>
              {kpi.tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-[11px] leading-snug">
                    {kpi.tooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className={cn("p-2 rounded-lg bg-muted/30", kpi.color.replace('text-', 'bg-').replace('-400', '-400/10'))}>
              <kpi.icon className={cn("h-4 w-4", kpi.color)} />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className={cn("text-3xl font-bold tracking-tight", (i === 0 || kpi.title === "Max Drawdown") && kpi.color)}>
              {kpi.value}
            </div>
            {'subValue' in kpi && (
              <div className="text-sm font-semibold text-muted-foreground mt-1 tabular-nums">
                {kpi.subValue}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
