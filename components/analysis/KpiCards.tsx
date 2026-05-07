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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/formatCurrency"
import { BalanceCard } from "./BalanceCard"
import { AnalysisSession } from "@/lib/types"

interface KpiCardsProps {
  analysis?: AnalysisSession;
  metrics?: {
    netProfit: number;
    totalProfit?: number; // fallback
  };
  descriptions?: Record<string, string>;
  className?: string;
}

export function KpiCards({ analysis: propsAnalysis, metrics: propsMetrics, descriptions, className }: KpiCardsProps) {
  const { sessions, activeSessionId } = useAnalysisStore()
  const activeSessions = sessions.filter(s => !s.archived)
  const activeSession = propsAnalysis || activeSessions.find(s => s.id === activeSessionId)
  const currentResult = activeSession?.currentResult || null
  const { t } = useTranslation()
  const { language } = useSettingsStore()

  if (!currentResult) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-7 w-24 bg-muted rounded mb-2" />
              <div className="h-3 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { trades, totalProfit: storeTotalProfit } = currentResult
  const totalProfit = propsMetrics ? propsMetrics.netProfit : storeTotalProfit
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

  const getFontSize = (val: string) => {
    const digits = val.replace(/[^\d]/g, "").length;
    if (digits > 9) return "text-lg";
    if (digits > 6) return "text-xl";
    return "text-2xl";
  };

  const kpis = [
    {
      id: "netProfit",
      title: t('analysis.netProfit'),
      value: formatCurrency(totalProfit, activeSession?.currency || 'USD'),
      icon: totalProfit >= 0 ? TrendingUp : TrendingDown,
      description: t('analysis.netProfit'),
      color: totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
    },
    {
      id: "winRate",
      title: t('analysis.winRate'),
      value: `${winRate.toFixed(1)}%`,
      icon: PieChart,
      description: `${wins} wins / ${tradeCount} trades`,
      color: "text-blue-400"
    },
    {
      id: "maxDrawdown",
      title: t('analysis.maxDrawdown'),
      value: `-${drawdown.percent.toFixed(1)}%`,
      subValue: `-${formatCurrency(drawdown.amount, activeSession?.currency || 'USD')}`,
      icon: ArrowDownCircle,
      description: t('analysis.maxDrawdown'),
      color: "text-rose-400",
      tooltip: t('analysis.maxDrawdown')
    },
    {
      id: "totalTrades",
      title: t('analysis.totalTrades'),
      value: tradeCount.toString(),
      icon: Activity,
      description: t('analysis.totalTrades'),
      color: "text-amber-400"
    },
    {
      id: "profitFactor",
      title: t('analysis.profitFactor'),
      value: profitFactor,
      icon: Layers,
      description: "Profit / Loss Ratio",
      color: "text-purple-400"
    }
  ]

  return (
    <div className={cn("space-y-4", className)}>
      {/* Balance Overview - Full Width */}
      <BalanceCard 
        initialBalance={activeSession?.initialBalance || 0}
        netProfit={totalProfit}
        currency={activeSession?.currency || 'USD'}
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <ReportDateCard className="h-full flex flex-col justify-center min-h-[120px]" />
        {kpis.map((kpi, i) => (
          <Card key={i} className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border min-h-[120px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
              <div className="flex items-center gap-1">
                <CardTitle className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{kpi.title}</CardTitle>
                {(kpi.tooltip || (kpi as any).id && descriptions?.[(kpi as any).id]) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-2.5 w-2.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] text-[10px] leading-snug">
                        {(kpi as any).id && descriptions?.[(kpi as any).id] || kpi.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className={cn("p-1.5 rounded-lg bg-muted/30", kpi.color.replace('text-', 'bg-').replace('-400', '-400/10'))}>
                <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={cn(getFontSize(kpi.value), "font-bold tracking-tight truncate", (kpi.id === 'netProfit' || kpi.id === 'maxDrawdown') && kpi.color)}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{kpi.value}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{kpi.value}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {'subValue' in kpi && (
                <div className="text-[11px] font-semibold text-muted-foreground mt-0.5 tabular-nums truncate">
                  {kpi.subValue}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1.5 font-medium line-clamp-1">
                {(kpi as any).id && descriptions?.[(kpi as any).id] || kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
