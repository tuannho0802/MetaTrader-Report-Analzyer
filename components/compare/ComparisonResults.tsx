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
import { Table as TableIcon, Info, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { formatCurrency } from "@/lib/formatCurrency"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComparisonDrawdownChart } from "./ComparisonDrawdownChart"
import { ComparisonHistogram } from "./ComparisonHistogram"
import { MonthlyReturnsTable } from "./MonthlyReturnsTable"
import { exportComparisonCSV } from "@/lib/exportComparison"
import { Button } from "@/components/ui/button"

interface ComparisonResultsProps {
  data: ComparisonResult
}

export function ComparisonResults({ data }: ComparisonResultsProps) {
  const { t } = useTranslation()

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
  
  const bestMaxDrawdown = getBestValue('maxDrawdown'); 
  const worstMaxDrawdown = getWorstValue('maxDrawdown');
  
  const bestAvgProfit = getBestValue('avgProfitPerTrade');
  const worstAvgProfit = getWorstValue('avgProfitPerTrade');
  const bestTradeValue = getBestValue('bestTrade');
  const worstTradeValue = getWorstValue('worstTrade');
  const bestSharpe = getBestValue('sharpeRatio');
  const worstSharpe = getWorstValue('sharpeRatio');
  const bestLongRate = getBestValue('longRate');
  const worstLongRate = getWorstValue('longRate');
  const bestShortRate = getBestValue('shortRate');
  const worstShortRate = getWorstValue('shortRate');
  const bestAvgWin = getBestValue('avgWin');
  const worstAvgWin = getWorstValue('avgWin');
  const bestAvgLoss = getBestValue('avgLoss');
  const worstAvgLoss = getWorstValue('avgLoss');
  const bestExpectancy = getBestValue('expectancy');
  const worstExpectancy = getWorstValue('expectancy');
  const bestRecovery = getBestValue('recoveryFactor');
  const worstRecovery = getWorstValue('recoveryFactor');
  const bestProfitPerDay = getBestValue('profitPerDay');
  const worstProfitPerDay = getWorstValue('profitPerDay');

  const highlightClass = (val: number | null, best: number | null, worst: number | null, pad = true) => {
    if (val === null || best === null || worst === null || best === worst) return "";
    const padding = pad ? " px-2 py-0.5 rounded" : "";
    if (val === best) return "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" + padding;
    if (val === worst) return "bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400" + padding;
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

  const renderMetricsCards = () => {
    return (
      <div className={`grid gap-4 p-4 ${data.metrics.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {data.metrics.map((row, idx) => {
          const seriesColor = data.series.find(s => s.name === row.name)?.color || '#ccc';
          return (
            <Card key={row.name} className="overflow-hidden border-border/50 shadow-sm relative">
              <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: seriesColor }} />
              <CardHeader className="pb-3 pt-5">
                <CardTitle className="text-lg font-bold">{row.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('analysis.netProfit')}</span>
                  <span className={cn("font-bold font-mono", row.totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400", highlightClass(row.totalProfit, bestTotalProfit, worstTotalProfit))}>
                    {row.totalProfit > 0 ? "+" : ""}{formatCurrency(row.totalProfit, row.currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('analysis.winRate')}</span>
                  <span className={cn("font-medium", highlightClass(row.winRate, bestWinRate, worstWinRate))}>{row.winRate}%</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.profitFactor')}</span>
                  <span className={cn("font-medium", highlightClass(row.profitFactor, bestProfitFactor, worstProfitFactor))}>
                    {row.profitFactor === 9999 ? "∞" : row.profitFactor.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.maxDrawdown')}</span>
                  <span className={cn("font-medium", row.maxDrawdown < 0 ? "text-rose-600 dark:text-rose-400" : "", highlightClass(row.maxDrawdown, bestMaxDrawdown, worstMaxDrawdown))}>
                    {row.maxDrawdown.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.avgProfit')}</span>
                  <span className={cn("font-medium font-mono", highlightClass(row.avgProfitPerTrade, bestAvgProfit, worstAvgProfit))}>
                    {formatCurrency(row.avgProfitPerTrade, row.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.bestTrade')}</span>
                  <span className={cn("font-medium font-mono text-emerald-600 dark:text-emerald-400", highlightClass(row.bestTrade, bestTradeValue, worstTradeValue))}>
                    +{formatCurrency(row.bestTrade, row.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.worstTrade')}</span>
                  <span className={cn("font-medium font-mono text-rose-600 dark:text-rose-400", highlightClass(row.worstTrade, bestTradeValue, worstTradeValue))}>
                    {formatCurrency(row.worstTrade, row.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {t('comparison.columns.sharpeRatio')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help"><Info className="w-3 h-3" /></TooltipTrigger>
                        <TooltipContent><p>{t('comparison.columns.sharpeRatioDesc')}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className={cn("font-medium", highlightClass(row.sharpeRatio, bestSharpe, worstSharpe))}>
                    {row.sharpeRatio !== null ? row.sharpeRatio.toFixed(2) : "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('analysis.totalTrades')}</span>
                  <span className="font-medium text-foreground">{row.tradeCount}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 border-b border-border/40">
                  <div className="flex justify-between items-center py-2 border-r border-border/40 pr-2">
                    <span className="text-xs text-muted-foreground">{t('comparison.columns.longRate')}</span>
                    <span className={cn("text-xs font-medium", highlightClass(row.longRate, bestLongRate, worstLongRate))}>{row.longRate}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 pl-2">
                    <span className="text-xs text-muted-foreground">{t('comparison.columns.shortRate')}</span>
                    <span className={cn("text-xs font-medium", highlightClass(row.shortRate, bestShortRate, worstShortRate))}>{row.shortRate}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.avgWin')}</span>
                  <span className={cn("font-medium text-emerald-600 dark:text-emerald-400", highlightClass(row.avgWin, bestAvgWin, worstAvgWin))}>
                    +{formatCurrency(row.avgWin, row.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.avgLoss')}</span>
                  <span className={cn("font-medium text-rose-600 dark:text-rose-400", highlightClass(row.avgLoss, bestAvgLoss, worstAvgLoss))}>
                    {formatCurrency(row.avgLoss, row.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.expectancy')}</span>
                  <span className={cn("font-bold font-mono", row.expectancy >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400", highlightClass(row.expectancy, bestExpectancy, worstExpectancy))}>
                    {formatCurrency(row.expectancy, row.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{t('comparison.columns.recoveryFactor')}</span>
                  <span className={cn("font-medium", highlightClass(row.recoveryFactor, bestRecovery, worstRecovery))}>
                    {row.recoveryFactor === 9999 ? "∞" : row.recoveryFactor.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">{t('comparison.columns.profitPerDay')}</span>
                  <span className={cn("font-medium font-mono", highlightClass(row.profitPerDay, bestProfitPerDay, worstProfitPerDay))}>
                    {formatCurrency(row.profitPerDay, row.currency)}
                  </span>
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const useCardsLayout = data.metrics.length === 2;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tabs defaultValue="equity" className="w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="equity">{t('chart.equityTitle')}</TabsTrigger>
            <TabsTrigger value="drawdown">{t('comparison.drawdown')}</TabsTrigger>
            <TabsTrigger value="distribution">{t('comparison.profitDistribution')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('comparison.monthlyReturns')}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="equity" className="mt-0">
          <ComparisonChart series={data.series} height={380} hiddenSeries={hiddenSeries} onLegendClick={toggleSeries} />
        </TabsContent>
        <TabsContent value="drawdown" className="mt-0">
          <ComparisonDrawdownChart series={data.series} height={380} hiddenSeries={hiddenSeries} onLegendClick={toggleSeries} />
        </TabsContent>
        <TabsContent value="distribution" className="mt-0">
          <ComparisonHistogram series={data.series} trades={data.tradesByEa || {}} height={380} hiddenSeries={hiddenSeries} onLegendClick={toggleSeries} />
        </TabsContent>
        <TabsContent value="monthly" className="mt-0">
          <MonthlyReturnsTable tradesByEa={data.tradesByEa || {}} currency={data.series[0]?.currency || "USD"} />
        </TabsContent>
      </Tabs>

      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-base">
            <TableIcon size={18} className="text-primary" />
            {t('comparison.metrics')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportComparisonCSV(data)}
            className="flex items-center gap-2 h-8"
          >
            <Download size={14} />
            <span className="hidden sm:inline">{t('comparison.exportCsv') || "Export CSV"}</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Always show cards on mobile. Show cards on desktop if length == 2 */}
          <div className={cn("block", useCardsLayout ? "md:block" : "md:hidden")}>
            {renderMetricsCards()}
          </div>

          <div className={cn("hidden", useCardsLayout ? "md:hidden" : "md:block overflow-x-auto -mx-6 px-6 pb-2")}>
            <Table className="min-w-[800px]">
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase whitespace-nowrap sticky left-0 bg-muted/50 shadow-[1px_0_0_0_hsl(var(--border))]">
                    {t('comparison.eaIdentifier')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('analysis.netProfit')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('analysis.winRate')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('comparison.columns.profitFactor')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('comparison.columns.maxDrawdown')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('comparison.columns.avgProfit')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('comparison.columns.bestTrade')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('comparison.columns.worstTrade')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
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
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden lg:table-cell">
                    {t('comparison.columns.longRate')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden lg:table-cell">
                    {t('comparison.columns.shortRate')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden xl:table-cell">
                    {t('comparison.columns.avgWin')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden xl:table-cell">
                    {t('comparison.columns.avgLoss')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden 2xl:table-cell">
                    {t('comparison.columns.expectancy')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden 2xl:table-cell">
                    {t('comparison.columns.recoveryFactor')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap hidden 2xl:table-cell">
                    {t('comparison.columns.profitPerDay')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap">
                    {t('analysis.totalTrades')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.metrics.map((row) => (
                  <TableRow key={row.name} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-4 py-4 font-bold text-sm whitespace-nowrap sticky left-0 bg-background shadow-[1px_0_0_0_hsl(var(--border))]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.series.find(s => s.name === row.name)?.color || '#ccc' }} />
                        {row.name}
                      </div>
                    </TableCell>
                    
                    <TableCell
                      className={cn(
                        "px-4 py-4 text-right font-bold font-mono whitespace-nowrap",
                        row.totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                        highlightClass(row.totalProfit, bestTotalProfit, worstTotalProfit, false)
                      )}
                    >
                      {row.totalProfit > 0 ? "+" : ""}
                      {formatCurrency(row.totalProfit, row.currency)}
                    </TableCell>
                    
                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap",
                      highlightClass(row.winRate, bestWinRate, worstWinRate, false)
                    )}>
                      {row.winRate}%
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap",
                      highlightClass(row.profitFactor, bestProfitFactor, worstProfitFactor, false)
                    )}>
                      {row.profitFactor === 9999 ? "∞" : row.profitFactor.toFixed(2)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap",
                      row.maxDrawdown < 0 ? "text-rose-600 dark:text-rose-400" : "",
                      highlightClass(row.maxDrawdown, bestMaxDrawdown, worstMaxDrawdown, false)
                    )}>
                      {row.maxDrawdown.toFixed(2)}%
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap",
                      highlightClass(row.avgProfitPerTrade, bestAvgProfit, worstAvgProfit, false)
                    )}>
                      {formatCurrency(row.avgProfitPerTrade, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap text-emerald-600 dark:text-emerald-400",
                      highlightClass(row.bestTrade, bestTradeValue, worstTradeValue, false)
                    )}>
                      +{formatCurrency(row.bestTrade, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap text-rose-600 dark:text-rose-400",
                      highlightClass(row.worstTrade, bestTradeValue, worstTradeValue, false)
                    )}>
                      {formatCurrency(row.worstTrade, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap",
                      highlightClass(row.sharpeRatio, bestSharpe, worstSharpe, false)
                    )}>
                      {row.sharpeRatio !== null ? row.sharpeRatio.toFixed(2) : "N/A"}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap hidden lg:table-cell",
                      highlightClass(row.longRate, bestLongRate, worstLongRate, false)
                    )}>
                      {row.longRate}%
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap hidden lg:table-cell",
                      highlightClass(row.shortRate, bestShortRate, worstShortRate, false)
                    )}>
                      {row.shortRate}%
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap text-emerald-600 dark:text-emerald-400 hidden xl:table-cell",
                      highlightClass(row.avgWin, bestAvgWin, worstAvgWin, false)
                    )}>
                      +{formatCurrency(row.avgWin, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap text-rose-600 dark:text-rose-400 hidden xl:table-cell",
                      highlightClass(row.avgLoss, bestAvgLoss, worstAvgLoss, false)
                    )}>
                      {formatCurrency(row.avgLoss, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-bold font-mono whitespace-nowrap hidden 2xl:table-cell",
                      row.expectancy >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                      highlightClass(row.expectancy, bestExpectancy, worstExpectancy, false)
                    )}>
                      {formatCurrency(row.expectancy, row.currency)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium whitespace-nowrap hidden 2xl:table-cell",
                      highlightClass(row.recoveryFactor, bestRecovery, worstRecovery, false)
                    )}>
                      {row.recoveryFactor === 9999 ? "∞" : row.recoveryFactor.toFixed(2)}
                    </TableCell>

                    <TableCell className={cn(
                      "px-4 py-4 text-right font-medium font-mono whitespace-nowrap hidden 2xl:table-cell",
                      highlightClass(row.profitPerDay, bestProfitPerDay, worstProfitPerDay, false)
                    )}>
                      {formatCurrency(row.profitPerDay, row.currency)}
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
