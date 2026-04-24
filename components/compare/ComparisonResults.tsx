"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComparisonResult, MetricsRow } from "@/lib/types"
import { ComparisonChart } from "./ComparisonChart"
import { Table as TableIcon, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { formatCurrency } from "@/lib/formatCurrency"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComparisonDrawdownChart } from "./ComparisonDrawdownChart"

interface ComparisonResultsProps {
  data: ComparisonResult
}

export function ComparisonResults({ data }: ComparisonResultsProps) {
  const { t } = useTranslation()

  // Helper functions for highlighting
  const getBestValue = (key: keyof MetricsRow) => {
    if (data.metrics.length === 0) return null;
    const values = data.metrics.map(m => m[key] as number).filter(v => v !== null && !isNaN(v));
    if (values.length === 0) return null;
    return Math.max(...values);
  };

  const getWorstValue = (key: keyof MetricsRow) => {
    if (data.metrics.length === 0) return null;
    const values = data.metrics.map(m => m[key] as number).filter(v => v !== null && !isNaN(v));
    if (values.length === 0) return null;
    return Math.min(...values);
  };

  const bestTotalProfit = getBestValue('totalProfit');
  const worstTotalProfit = getWorstValue('totalProfit');
  const bestWinRate = getBestValue('winRate');
  const worstWinRate = getWorstValue('winRate');
  const bestProfitFactor = getBestValue('profitFactor');
  const worstProfitFactor = getWorstValue('profitFactor');
  
  // For maxDrawdown, higher is better (e.g. -2.5 is better than -15.4)
  const bestMaxDrawdown = getBestValue('maxDrawdown'); 
  const worstMaxDrawdown = getWorstValue('maxDrawdown');
  
  const bestAvgProfit = getBestValue('avgProfitPerTrade');
  const worstAvgProfit = getWorstValue('avgProfitPerTrade');
  const bestTradeValue = getBestValue('bestTrade');
  const worstTradeValue = getWorstValue('worstTrade');
  const bestSharpe = getBestValue('sharpeRatio');
  const worstSharpe = getWorstValue('sharpeRatio');

  const highlightClass = (val: number | null, best: number | null, worst: number | null) => {
    if (val === null || best === null || worst === null || best === worst) return "";
    if (val === best) return "bg-emerald-500/10 dark:bg-emerald-500/20";
    if (val === worst) return "bg-rose-500/10 dark:bg-rose-500/20";
    return "";
  };

  const [hiddenSeries, setHiddenSeries] = React.useState<Set<string>>(new Set());

  const toggleSeries = (name: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tabs defaultValue="equity" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="equity">{t('chart.equityTitle') || "Tăng trưởng (Equity)"}</TabsTrigger>
            <TabsTrigger value="drawdown">Sụt giảm (Drawdown)</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="equity" className="mt-0">
          <ComparisonChart series={data.series} height={380} hiddenSeries={hiddenSeries} onLegendClick={toggleSeries} />
        </TabsContent>
        <TabsContent value="drawdown" className="mt-0">
          <ComparisonDrawdownChart series={data.series} height={380} hiddenSeries={hiddenSeries} onLegendClick={toggleSeries} />
        </TabsContent>
      </Tabs>

      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TableIcon size={18} className="text-primary" />
            {t('comparison.metrics')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase whitespace-nowrap">
                    {t('comparison.eaIdentifier')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('analysis.netProfit')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('analysis.winRate')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden md:table-cell">
                    {t('comparison.columns.profitFactor')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('comparison.columns.maxDrawdown')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden lg:table-cell">
                    {t('comparison.columns.avgProfit')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden xl:table-cell">
                    {t('comparison.columns.bestTrade')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden xl:table-cell">
                    {t('comparison.columns.worstTrade')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden lg:table-cell">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-end gap-1 w-full cursor-help">
                          {t('comparison.columns.sharpeRatio')}
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Risk-adjusted return. Higher is better.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('analysis.totalTrades')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.metrics.map((row) => (
                  <TableRow key={row.name} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-4 font-bold text-sm whitespace-nowrap">{row.name}</TableCell>
                    
                    <TableCell
                      className={cn(
                        "px-4 py-4 text-right font-bold font-mono whitespace-nowrap",
                        row.totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                        highlightClass(row.totalProfit, bestTotalProfit, worstTotalProfit)
                      )}
                    >
                      {row.totalProfit > 0 ? "+" : ""}
                      {formatCurrency(row.totalProfit, row.currency)}
                    </TableCell>
                    
                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap",
                      highlightClass(row.winRate, bestWinRate, worstWinRate)
                    )}>
                      {row.winRate}%
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap hidden md:table-cell",
                      highlightClass(row.profitFactor, bestProfitFactor, worstProfitFactor)
                    )}>
                      {row.profitFactor === 9999 ? "∞" : row.profitFactor.toFixed(2)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap",
                      row.maxDrawdown < 0 ? "text-rose-600 dark:text-rose-400" : "",
                      highlightClass(row.maxDrawdown, bestMaxDrawdown, worstMaxDrawdown)
                    )}>
                      {row.maxDrawdown.toFixed(2)}%
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap hidden lg:table-cell",
                      highlightClass(row.avgProfitPerTrade, bestAvgProfit, worstAvgProfit)
                    )}>
                      {formatCurrency(row.avgProfitPerTrade, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap hidden xl:table-cell text-emerald-600 dark:text-emerald-400",
                      highlightClass(row.bestTrade, bestTradeValue, worstTradeValue)
                    )}>
                      +{formatCurrency(row.bestTrade, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap hidden xl:table-cell text-rose-600 dark:text-rose-400",
                      highlightClass(row.worstTrade, bestTradeValue, worstTradeValue)
                    )}>
                      {formatCurrency(row.worstTrade, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap hidden lg:table-cell",
                      highlightClass(row.sharpeRatio, bestSharpe, worstSharpe)
                    )}>
                      {row.sharpeRatio !== null ? row.sharpeRatio.toFixed(2) : "N/A"}
                    </TableCell>

                    <TableCell className="px-4 py-4 text-right text-muted-foreground whitespace-nowrap">
                      {row.tradeCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
