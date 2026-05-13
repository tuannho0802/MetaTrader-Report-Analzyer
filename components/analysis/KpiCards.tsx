"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Layers, PieChart, Activity, ArrowDownCircle, Info } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useSettingsStore } from "@/lib/store/useSettingsStore"
import { cn } from "@/lib/utils"
import { ReportDateCard } from "@/components/ReportDateCard"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/formatCurrency"
import { BalanceCard } from "./BalanceCard"
import { Trade } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { calculateMetrics } from "@/lib/comparison"
import { AccountInfoCard } from "./AccountInfoCard"

interface KpiCardsProps {
  trades: Trade[];
  currency: string;
  initialBalance: number;
  finalBalance: number;
  descriptions?: Record<string, string>;
  className?: string;
  isLoading?: boolean;
  broker?: string;
  accountNumber?: string;
  accountName?: string;
}

export function KpiCards({ 
  trades, 
  currency, 
  initialBalance, 
  finalBalance, 
  descriptions, 
  className,
  isLoading = false,
  broker,
  accountNumber,
  accountName
}: KpiCardsProps) {
  const autoConvertCurrency = useSettingsStore(state => state.autoConvertCurrency)
  const baseCurrency = useSettingsStore(state => state.baseCurrency)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
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

  // Calculate metrics using the shared utility
  const m = calculateMetrics('Portfolio', trades, currency, initialBalance);

  const getFontSize = (val: string) => {
    const digits = val.replace(/[^\d]/g, "").length;
    if (digits > 12) return "text-sm sm:text-base font-bold break-all leading-tight";
    if (digits > 9) return "text-base sm:text-lg font-bold break-all leading-tight";
    if (digits > 6) return "text-lg sm:text-xl font-bold break-all leading-tight";
    return "text-xl sm:text-2xl font-bold break-all leading-tight";
  };

  const kpis = [
    {
      id: "netProfit",
      title: t('analysis.netProfit'),
      value: formatCurrency(m.totalProfit, currency),
      icon: m.totalProfit >= 0 ? TrendingUp : TrendingDown,
      description: t('analysis.netProfit'),
      color: m.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
    },
    {
      id: "winRate",
      title: t('analysis.winRate'),
      value: `${m.winRate}%`,
      icon: PieChart,
      description: `${trades.filter(t => t.profit > 0).length} wins / ${trades.length} trades`,
      color: "text-blue-400"
    },
    {
      id: "maxDrawdown",
      title: t('analysis.maxDrawdown'),
      value: `${m.maxDrawdown}%`,
      icon: ArrowDownCircle,
      description: t('analysis.maxDrawdown'),
      color: "text-rose-400",
      tooltip: t('analysis.maxDrawdown')
    },
    {
      id: "totalTrades",
      title: t('analysis.totalTrades'),
      value: trades.length.toString(),
      icon: Activity,
      description: t('analysis.totalTrades'),
      color: "text-amber-400"
    },
    {
      id: "profitFactor",
      title: t('analysis.profitFactor'),
      value: m.profitFactor >= 999 ? "∞" : m.profitFactor.toFixed(2),
      icon: Layers,
      description: "Profit / Loss Ratio",
      color: "text-purple-400"
    }
  ]

  return (
    <div className={cn("space-y-4", className)}>
      <AccountInfoCard 
        broker={broker}
        accountNumber={accountNumber}
        accountName={accountName}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <BalanceCard 
            initialBalance={initialBalance}
            netProfit={m.totalProfit}
            currency={currency}
          />
        </div>
        {autoConvertCurrency && (
          <Badge variant="secondary" className="flex self-start sm:self-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-primary/20 shrink-0 font-bold tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Converted to {baseCurrency}
          </Badge>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
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
              <div className={cn(getFontSize(kpi.value), "tracking-tight min-w-0", (kpi.id === 'netProfit' || kpi.id === 'maxDrawdown') && kpi.color)}>
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
