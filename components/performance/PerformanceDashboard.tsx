"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { Trade, EquitySeries, MetricsRow } from "@/lib/types";
import { calculateMetrics, calculateEquity } from "@/lib/comparison";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";
import { exportPerformanceCSV } from "@/lib/exportComparison";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { fetchExchangeRates, convertCurrency, convertTrade } from "@/lib/exchangeRates";
import { 
  Loader2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  PieChart, 
  ArrowDownCircle, 
  Layers, 
  Zap, 
  Target, 
  BarChart3, 
  Info 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { PerformanceFilters, FilterState } from "./PerformanceFilters";
import { ComparisonDrawdownChart } from "@/components/compare/ComparisonDrawdownChart";
import { ComparisonHistogram } from "@/components/compare/ComparisonHistogram";
import { MonthlyReturnsTable } from "@/components/compare/MonthlyReturnsTable";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#f43f5e",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

/* ─── KPI mini-card ─── */
function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  loading = false,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  const displayValue = value === null || value === undefined || value === 0 && loading ? "–" : value;

  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border group animate-in fade-in duration-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
            {title}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={10} className="text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-[11px]">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className={cn("p-2 rounded-lg transition-colors group-hover:bg-opacity-20", color.replace("text-", "bg-").replace("-400", "-400/10"))}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className={cn("text-2xl font-black tracking-tight", displayValue === "–" ? "text-muted-foreground/30" : color)}>
          {displayValue}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 font-medium line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Equity chart ─── */
function EquityChart({
  series,
  currency,
  title,
  description,
}: {
  series: EquitySeries[];
  currency: string;
  title: string;
  description: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const textColor = isDark ? "#9ca3af" : "#6b7280";

  const chartData = useMemo(() => {
    if (series.length === 0) return [];
    const dateSet = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => dateSet.add(d.time.split(" ")[0])));
    const sortedDates = Array.from(dateSet).sort(
      (a, b) => new Date(a.replace(/\./g, "/")).getTime() - new Date(b.replace(/\./g, "/")).getTime()
    );

    const seriesMaps = series.map((s) => {
      const m = new Map<string, number>();
      let last = 0;
      const sorted = [...s.data].sort(
        (a, b) => new Date(a.time.replace(/\./g, "/")).getTime() - new Date(b.time.replace(/\./g, "/")).getTime()
      );
      sorted.forEach((d) => {
        last = d.value;
        m.set(d.time.split(" ")[0], d.value);
      });
      return { name: s.name, map: m, last };
    });

    const lastVal: Record<string, number> = {};
    return sortedDates.map((date) => {
      const row: Record<string, string | number> = { date };
      seriesMaps.forEach((sm, i) => {
        const key = series[i].dataKey || series[i].id || sm.name;
        if (sm.map.has(date)) {
          lastVal[key] = sm.map.get(date)!;
        }
        row[key] = lastVal[key] ?? 0;
      });
      return row;
    });
  }, [series]);

  if (series.length === 0 || chartData.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden bg-card/30 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
            <TrendingUp size={18} className="text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="date"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: textColor, fontWeight: 500 }}
                minTickGap={40}
              />
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: textColor, fontWeight: 500 }}
                tickFormatter={(v) => formatCurrency(v, currency).split(".")[0]}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  padding: "12px",
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
                wrapperStyle={{ fontSize: "11px", fontWeight: "700", paddingBottom: "20px" }}
              />
              {series.map((s, i) => (
                <Line
                  key={s.id || s.name}
                  type="monotone"
                  dataKey={s.dataKey || s.id || s.name}
                  name={s.name}
                  stroke={s.color || COLORS[i % COLORS.length]}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground italic font-medium">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Main dashboard ─── */
export function PerformanceDashboard() {
  const { sessions, isLoading } = useAnalysisStore();
  const { baseCurrency, autoConvertCurrency } = useSettingsStore();
  const setExchangeRatesStore = useSettingsStore(state => state.setExchangeRates);
  const { t } = useTranslation();

  // Exchange rates state
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!autoConvertCurrency) {
      setExchangeRates(null);
      setRatesError(null);
      return;
    }

    let isMounted = true;

    async function loadRates() {
      setIsLoadingRates(true);
      setRatesError(null);
      
      try {
        const fetchedRates = await fetchExchangeRates(baseCurrency);
        
        if (isMounted) {
          setExchangeRates(fetchedRates);
          setExchangeRatesStore(fetchedRates);
          console.log('[Dashboard] Exchange rates loaded:', Object.keys(fetchedRates).length, 'currencies');
        }
      } catch (error) {
        if (isMounted) {
          console.error('[Dashboard] Failed to load exchange rates:', error);
          setRatesError(
            'Unable to load live exchange rates. Using fallback rates. ' +
            'Check your internet connection or disable browser extensions that block requests.'
          );
          
          // Even on error, fetchExchangeRates returns fallback rates
          const fallbackRates = await fetchExchangeRates(baseCurrency);
          setExchangeRates(fallbackRates);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRates(false);
        }
      }
    }

    loadRates();

    return () => {
      isMounted = false;
    };
  }, [baseCurrency, autoConvertCurrency, setExchangeRatesStore]);

  const [filters, setFilters] = useState<FilterState>({
    selectedSessions: [],
    startDate: undefined,
    endDate: undefined,
    selectedEA: "all",
  });

  // Active (non-archived) sessions with trades
  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.archived && s.allTrades && s.allTrades.length > 0),
    [sessions]
  );

  // Session options for the filter bar
  const sessionOptions = useMemo(
    () => activeSessions.map((s) => ({ value: s.id, label: s.name || s.fileName })),
    [activeSessions]
  );

  // Target sessions based on selection
  const targetSessions = useMemo(() => {
    if (filters.selectedSessions.length === 0) return activeSessions;
    return activeSessions.filter((s) => filters.selectedSessions.includes(s.id));
  }, [activeSessions, filters.selectedSessions]);

  // Build EA options from target sessions
  const eaOptions = useMemo(() => {
    const map = new Map<string, string>();
    targetSessions.forEach((s) => {
      (s.allTrades || []).forEach((t) => {
        const id = t.eaId || t.comment || "Unknown";
        if (!map.has(id)) map.set(id, isNaN(Number(id)) ? id : `EA #${id}`);
      });
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [targetSessions]);

  // Check if we have mixed currencies without conversion
  const hasMixedCurrencies = useMemo(() => {
    if (autoConvertCurrency) return false;
    const currencies = new Set(targetSessions.map(s => s.currency || 'USD'));
    return currencies.size > 1;
  }, [targetSessions, autoConvertCurrency]);

  // Filter trades per session, applying date range + EA filter + currency conversion
  const { tradesBySeries, allFilteredTrades, currency, convertedBalances } = useMemo(() => {
    const displayCurrency = autoConvertCurrency ? baseCurrency : (targetSessions[0]?.currency || "USD");
    const start = filters.startDate;
    const end = filters.endDate;

    const tradesBySeries: Record<string, Trade[]> = {};
    const allFilteredTrades: Trade[] = [];
    
    // Convert balances
    let totalInitial = 0;
    let totalFinal = 0;

    targetSessions.forEach((session) => {
      let trades = session.allTrades || [];
      const sessionCurrency = session.currency || "USD";

      // Convert session balances to display currency
      if (autoConvertCurrency && exchangeRates) {
        totalInitial += convertCurrency(session.initialBalance || 0, sessionCurrency, baseCurrency, exchangeRates);
        totalFinal += convertCurrency(session.finalBalance || 0, sessionCurrency, baseCurrency, exchangeRates);
      } else {
        totalInitial += session.initialBalance || 0;
        totalFinal += session.finalBalance || 0;
      }

      // Date filter
      if (start) {
        trades = trades.filter((t) => new Date(t.closeTime.replace(/\./g, "/")) >= start);
      }
      if (end) {
        const adjustedEnd = new Date(end);
        adjustedEnd.setHours(23, 59, 59, 999);
        trades = trades.filter((t) => new Date(t.closeTime.replace(/\./g, "/")) <= adjustedEnd);
      }

      // EA filter
      if (filters.selectedEA !== "all") {
        trades = trades.filter(
          (t) => (t.eaId || t.comment || "Unknown") === filters.selectedEA
        );
      }

      trades.forEach((trade) => {
        const eaId = trade.eaId || trade.comment || "Unknown";
        const compositeId = `${session.id}::${eaId}`;
        
        if (!tradesBySeries[compositeId]) {
          tradesBySeries[compositeId] = [];
        }
        
        // CONVERT TRADE if enabled
        const convertedTrade = (autoConvertCurrency && exchangeRates && sessionCurrency !== baseCurrency)
          ? convertTrade(trade, sessionCurrency, baseCurrency, exchangeRates)
          : trade;
        
        tradesBySeries[compositeId].push(convertedTrade);
        allFilteredTrades.push(convertedTrade);
      });
    });

    return { 
      tradesBySeries, 
      allFilteredTrades, 
      currency: displayCurrency,
      convertedBalances: { initialBalance: totalInitial, finalBalance: totalFinal }
    };
  }, [targetSessions, filters.startDate, filters.endDate, filters.selectedEA, autoConvertCurrency, exchangeRates, baseCurrency]);

  const aggregateMetrics: MetricsRow | null = useMemo(() => {
    if (allFilteredTrades.length === 0) return null;
    return calculateMetrics("Portfolio", allFilteredTrades, currency, convertedBalances.initialBalance);
  }, [allFilteredTrades, currency, convertedBalances.initialBalance]);

  // EquitySeries per EA for charts
  const equitySeries: EquitySeries[] = useMemo(() => {
    return Object.entries(tradesBySeries).map(([compositeId, trades], index) => {
      const dataKey = compositeId.replace(/[^a-zA-Z0-9]/g, '_');
      const [sessionId, eaId] = compositeId.split('::');
      const session = targetSessions.find(s => s.id === sessionId);
      const displayName = isNaN(Number(eaId))
        ? `${eaId} (${session?.name || 'Unknown'})`
        : `EA #${eaId} (${session?.name || 'Unknown'})`;

      return {
        id: compositeId,
        dataKey,
        name: displayName,
        data: calculateEquity(trades, 0),
        color: COLORS[index % COLORS.length],
        currency: autoConvertCurrency ? baseCurrency : (session?.currency || 'USD')
      };
    });
  }, [tradesBySeries, targetSessions, autoConvertCurrency, baseCurrency]);

  // CSV export
  const handleExport = () => {
    const rows: MetricsRow[] = Object.entries(tradesBySeries).map(([compositeId, trades]) => {
      const [sessionId, eaId] = compositeId.split('::');
      const session = targetSessions.find(s => s.id === sessionId);
      const displayName = isNaN(Number(eaId))
        ? `${eaId} (${session?.name || 'Unknown'})`
        : `EA #${eaId} (${session?.name || 'Unknown'})`;
      
      // For individual EAs, we often start from 0 initial balance unless we have more info
      return calculateMetrics(displayName, trades, currency, 0);
    });
    if (rows.length === 0 && aggregateMetrics) rows.push(aggregateMetrics);
    exportPerformanceCSV(rows, currency);
  };

  if (isLoading || isLoadingRates) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">
          {isLoadingRates ? t("performance.currency.loadingRates") : "Loading workspace..."}
        </p>
      </div>
    );
  }

  if (activeSessions.length === 0) {
    return (
      <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in duration-700">
        <CardContent className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="p-6 bg-primary/5 rounded-full ring-1 ring-primary/20 animate-pulse">
            <BarChart3 size={48} className="text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-black text-2xl tracking-tight">
              {t("performance.empty.noData").split(".")[0]}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto font-medium">
              {t("performance.empty.noData").split(".")[1]}
            </p>
          </div>
          <Button variant="outline" className="mt-4 rounded-full px-8 font-bold border-primary/20 hover:bg-primary/5" onClick={() => window.location.href = "/"}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const m = aggregateMetrics;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PerformanceFilters
          sessions={sessionOptions}
          eaOptions={eaOptions}
          filters={filters}
          onChange={setFilters}
        />
        {m && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="rounded-full gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all font-bold px-5 h-11 shrink-0 shadow-sm"
          >
            <Download size={16} />
            {t("performance.export")}
          </Button>
        )}
      </div>

      {ratesError && (
        <Alert variant="warning" className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle>Exchange Rate Notice</AlertTitle>
          <AlertDescription className="text-sm">
            {ratesError}
          </AlertDescription>
        </Alert>
      )}

      {hasMixedCurrencies && !autoConvertCurrency && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Mixed Currencies Detected</AlertTitle>
          <AlertDescription className="text-xs font-medium">
            Multiple currencies found. Please enable **Auto-Convert Currency** in Settings for accurate portfolio aggregation.
          </AlertDescription>
        </Alert>
      )}

      {/* No trades after filtering */}
      {allFilteredTrades.length === 0 && (
        <Card className="border-dashed border-2 border-border/40 bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="p-4 bg-muted/20 rounded-full">
              <AlertCircle size={32} className="text-muted-foreground/60" />
            </div>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
              {t("performance.empty.noResults")}
            </p>
          </CardContent>
        </Card>
      )}

      {m && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <KpiCard
              title={t("performance.kpi.netProfit")}
              value={hasMixedCurrencies ? "—" : formatCurrency(m.totalProfit, currency)}
              description={hasMixedCurrencies ? "Mixed currencies - convert in Settings" : t("performance.kpi.netProfitDesc")}
              icon={m.totalProfit >= 0 ? TrendingUp : TrendingDown}
              color={m.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <KpiCard
              title={t("performance.kpi.winRate")}
              value={`${m.winRate}%`}
              description={t("performance.kpi.winRateDesc")}
              icon={PieChart}
              color="text-blue-400"
            />
            <KpiCard
              title={t("performance.kpi.maxDrawdown")}
              value={`${m.maxDrawdown.toFixed(1)}%`}
              description={t("performance.kpi.maxDrawdownDesc")}
              icon={ArrowDownCircle}
              color="text-rose-400"
            />
            <KpiCard
              title={t("performance.kpi.profitFactor")}
              value={m.profitFactor >= 999 ? "∞" : m.profitFactor.toFixed(2)}
              description={t("performance.kpi.profitFactorDesc")}
              icon={Layers}
              color="text-purple-400"
            />
            <KpiCard
              title={t("performance.kpi.sharpeRatio")}
              value={m.sharpeRatio !== null ? m.sharpeRatio.toFixed(2) : "–"}
              description={t("performance.kpi.sharpeRatioDesc")}
              icon={Zap}
              color="text-amber-400"
            />
            <KpiCard
              title={t("performance.kpi.expectancy")}
              value={hasMixedCurrencies ? "—" : formatCurrency(m.expectancy, currency)}
              description={hasMixedCurrencies ? "Mixed currencies" : t("performance.kpi.expectancyDesc")}
              icon={Target}
              color={m.expectancy >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <KpiCard
              title={t("performance.kpi.recoveryFactor")}
              value={m.recoveryFactor >= 999 ? "∞" : m.recoveryFactor.toFixed(2)}
              description={t("performance.kpi.recoveryFactorDesc")}
              icon={Activity}
              color="text-indigo-400"
            />
            <KpiCard
              title={t("performance.kpi.profitPerDay")}
              value={hasMixedCurrencies ? "—" : formatCurrency(m.profitPerDay, currency)}
              description={hasMixedCurrencies ? "Mixed currencies" : t("performance.kpi.profitPerDayDesc")}
              icon={TrendingUp}
              color={m.profitPerDay >= 0 ? "text-teal-400" : "text-rose-400"}
            />
          </div>

          {/* Equity + Drawdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EquityChart 
              series={equitySeries} 
              currency={currency} 
              title={t("performance.charts.equityCurve")}
              description={t("performance.charts.equityCurveDesc")}
            />
            <Card className="border-border/50 shadow-lg bg-card/30 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">{t("performance.charts.drawdown")}</CardTitle>
                <CardDescription className="text-xs">{t("performance.charts.drawdownDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ComparisonDrawdownChart series={equitySeries} height={350} />
                <p className="mt-4 text-[10px] text-muted-foreground italic font-medium">
                  {t("performance.charts.drawdownDesc")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profit Distribution */}
          <Card className="border-border/50 shadow-lg bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">{t("performance.charts.profitDistribution")}</CardTitle>
              <CardDescription className="text-xs">{t("performance.charts.profitDistributionDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ComparisonHistogram series={equitySeries} trades={tradesBySeries} height={300} />
              <p className="mt-4 text-[10px] text-muted-foreground italic font-medium">
                {t("performance.charts.profitDistributionDesc")}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Returns */}
          <Card className="border-border/50 shadow-lg bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">{t("performance.charts.monthlyReturns")}</CardTitle>
              <CardDescription className="text-xs">{t("performance.charts.monthlyReturnsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 overflow-hidden">
              <div className="overflow-x-auto pb-4">
                <MonthlyReturnsTable tradesByEa={tradesBySeries} currency={currency} />
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground italic font-medium">
                {t("performance.charts.monthlyReturnsDesc")}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
