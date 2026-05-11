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
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { generateSeriesKey, generateDisplayName, parseMT4Date } from "@/lib/utils";

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
    <Card className="group relative overflow-hidden border border-border/50 shadow-sm bg-card/30 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:bg-card/50 group animate-in fade-in duration-500">
      {/* Subtle glow effect on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
        "bg-gradient-to-br from-transparent via-transparent",
        color.includes("emerald") && "to-emerald-500/5",
        color.includes("rose") && "to-rose-500/5",
        color.includes("blue") && "to-blue-500/5",
        color.includes("purple") && "to-purple-500/5",
        color.includes("amber") && "to-amber-500/5",
        color.includes("teal") && "to-teal-500/5",
        color.includes("indigo") && "to-indigo-500/5",
        color.includes("primary") && "to-primary/5"
      )} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5 relative z-10">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-[10px] font-extrabold tracking-widest uppercase text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
            {title}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={10} className="text-muted-foreground/40 cursor-help hover:text-muted-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-[11px] font-medium p-3 rounded-xl border-border/50 shadow-2xl backdrop-blur-xl">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className={cn(
          "p-2 rounded-xl transition-all duration-300 group-hover:scale-110",
          color.replace("text-", "bg-").replace("-400", "-400/10")
        )}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 relative z-10">
        <div className={cn(
          "text-2xl font-black tracking-tight transition-all duration-300 group-hover:translate-x-1",
          displayValue === "–" ? "text-muted-foreground/30" : color
        )}>
          {displayValue}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium line-clamp-1 opacity-50 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Scrollable custom legend ─── */
const ScrollableLegend = React.memo(function ScrollableLegend({
  series,
  visibleKeys,
  onToggle,
}: {
  series: EquitySeries[];
  visibleKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const MAX_VISIBLE = 15;
  const visibleItems = showAll ? series : series.slice(0, MAX_VISIBLE);

  return (
    <div className="space-y-3 mt-3">
      <div className={cn(
        'flex flex-wrap gap-x-4 gap-y-1.5',
        showAll && 'max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border'
      )}>
        {visibleItems.map((s) => {
          const key = s.dataKey || s.id || s.name;
          const isHidden = !visibleKeys.has(key);
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={cn(
                'flex items-center gap-1.5 text-[10px] font-bold transition-opacity hover:opacity-80',
                isHidden && 'opacity-30'
              )}
            >
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="truncate max-w-[140px]">{s.name}</span>
            </button>
          );
        })}
      </div>
      
      {series.length > MAX_VISIBLE && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-[10px] font-extrabold text-primary hover:underline transition-all flex items-center gap-1 uppercase tracking-wider"
        >
          {showAll ? 'Show less' : `Show ${series.length - MAX_VISIBLE} more`}
        </button>
      )}
    </div>
  );
});

/* ─── Equity chart ─── */
function EquityChart({
  series,
  visibleKeys,
  onToggle,
  onToggleAll,
  currency,
  title,
  description,
}: {
  series: EquitySeries[];
  visibleKeys: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (show: boolean) => void;
  currency: string;
  title: string;
  description: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const textColor = isDark ? "#9ca3af" : "#6b7280";

  // Rule 6: Control animation based on series count
  const shouldAnimate = series.length <= 10;

  const visibleSeries = series.filter(s => visibleKeys.has(s.id || s.name));

  const chartData = useMemo(() => {
    if (visibleSeries.length === 0) return [];
    const dateSet = new Set<string>();
    visibleSeries.forEach((s) => s.data.forEach((d) => dateSet.add(d.time.split(" ")[0])));
    const sortedDates = Array.from(dateSet).sort(
      (a, b) => new Date(a.replace(/\./g, "/")).getTime() - new Date(b.replace(/\./g, "/")).getTime()
    );

    const seriesMaps = visibleSeries.map((s) => {
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
        const key = visibleSeries[i].id || sm.name;
        if (sm.map.has(date)) {
          lastVal[key] = sm.map.get(date)!;
        }
        row[key] = lastVal[key] ?? 0;
      });
      return row;
    });
  }, [visibleSeries]);

  if (series.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden bg-card/30 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {series.length > 1 && (
              <button
                onClick={() => onToggleAll(visibleKeys.size !== series.length)}
                className="text-[10px] font-bold text-muted-foreground border border-border/50 rounded-full px-2.5 py-1 hover:bg-muted/50 transition-colors"
              >
                {visibleKeys.size === series.length ? 'Hide all' : 'Show all'}
              </button>
            )}
            <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
              <TrendingUp size={18} className="text-primary" />
            </div>
          </div>
        </div>
        <ScrollableLegend series={series} visibleKeys={visibleKeys} onToggle={onToggle} />
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[320px] w-full">
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
                  backdropFilter: "blur(8px)",
                }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 0' }}
                labelStyle={{ fontSize: '10px', fontWeight: '800', color: 'hsl(var(--muted-foreground))', marginBottom: '8px', textTransform: 'uppercase' }}
                formatter={(value: any, name: any) => [formatCurrency(Number(value), currency), String(name || "")]}
              />
              {visibleSeries.map((s, i) => (
                <Line
                  key={s.id || s.name}
                  type="monotone"
                  dataKey={s.id || s.name}
                  name={s.name}
                  stroke={s.color || COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  isAnimationActive={shouldAnimate}
                  animationDuration={shouldAnimate ? 800 : 0}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
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

  const [isCalculating, setIsCalculating] = useState(false);
  const [processedData, setProcessedData] = useState<{
    equitySeries: EquitySeries[];
    tradesForCharts: Record<string, Trade[]>;
    aggregateMetrics: MetricsRow | null;
    currency: string;
    convertedBalances: { initialBalance: number; finalBalance: number };
    rawTradesBySeries: Record<string, Trade[]>;
    allSessionEASeries: EquitySeries[];
  } | null>(null);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Reset visibility when equitySeries changes (mode switch)
  useEffect(() => {
    if (processedData?.equitySeries) {
      setVisibleKeys(new Set(processedData.equitySeries.map(s => s.id || s.name)));
    }
  }, [processedData?.equitySeries]);

  const toggleKey = (key: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

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

  // ── Async Data Processing ───────────────────────────────────────────
  const MAX_DETAIL_LINES = 15;
  const OTHERS_COLOR = '#94a3b8';
  const [displayMode, setDisplayMode] = useState<'ea' | 'session' | 'detail'>('ea');

  useEffect(() => {
    if (targetSessions.length === 0) {
      setProcessedData(null);
      return;
    }

    setIsCalculating(true);
    
    const ric = typeof window !== 'undefined' && (window as any).requestIdleCallback 
      ? (window as any).requestIdleCallback 
      : (cb: any) => setTimeout(cb, 1);

    ric(() => {
      try {
        const displayCurrency = autoConvertCurrency ? baseCurrency : (targetSessions[0]?.currency || "USD");
        const start = filters.startDate;
        const end = filters.endDate;

        // 1. Initial Filtering & Composite Grouping (Session::EA)
        const rawTradesBySeries: Record<string, Trade[]> = {};
        const allFilteredTrades: Trade[] = [];
        let totalInitial = 0;
        let totalFinal = 0;

        targetSessions.forEach((session) => {
          let trades = session.allTrades || [];
          const sessionCurrency = session.currency || "USD";

          if (session.initialBalance === undefined || session.initialBalance === null || session.initialBalance === 0) {
            console.warn(`[BalanceOverview] Missing initialBalance for session ${session.id}`);
          }

          if (autoConvertCurrency && exchangeRates) {
            totalInitial += convertCurrency(session.initialBalance || 0, sessionCurrency, baseCurrency, exchangeRates);
            totalFinal += convertCurrency(session.finalBalance || 0, sessionCurrency, baseCurrency, exchangeRates);
          } else {
            totalInitial += session.initialBalance || 0;
            totalFinal += session.finalBalance || 0;
          }

          if (start) {
            trades = trades.filter((t) => {
              const d = parseMT4Date(t.closeTime);
              return d ? d >= start : true;
            });
          }
          if (end) {
            const adjustedEnd = new Date(end);
            adjustedEnd.setHours(23, 59, 59, 999);
            trades = trades.filter((t) => {
              const d = parseMT4Date(t.closeTime);
              return d ? d <= adjustedEnd : true;
            });
          }

          if (filters.selectedEA !== "all") {
            trades = trades.filter((t) => (t.eaId || t.comment || "Unknown") === filters.selectedEA);
          }

          trades.forEach((trade) => {
            const eaId = trade.eaId || trade.comment || "Unknown";
            const compositeId = generateSeriesKey(session.id, eaId);
            
            if (!rawTradesBySeries[compositeId]) rawTradesBySeries[compositeId] = [];
            
            const convertedTrade = (autoConvertCurrency && exchangeRates && sessionCurrency !== baseCurrency)
              ? convertTrade(trade, sessionCurrency, baseCurrency, exchangeRates)
              : trade;
            
            rawTradesBySeries[compositeId].push(convertedTrade);
            allFilteredTrades.push(convertedTrade);
          });
        });

        // 2. Secondary Grouping based on Display Mode
        const finalGroupedTrades: Record<string, { trades: Trade[], name: string, color: string }> = {};

        if (displayMode === 'ea') {
          const byEa = new Map<string, Trade[]>();
          Object.entries(rawTradesBySeries).forEach(([compositeId, trades]) => {
            const [, eaId] = compositeId.split('::');
            const existing = byEa.get(eaId) || [];
            byEa.set(eaId, [...existing, ...trades]);
          });
          Array.from(byEa.entries()).forEach(([eaId, trades], i) => {
            const id = `ea_${eaId}`;
            const name = isNaN(Number(eaId)) ? eaId : `EA #${eaId}`;
            finalGroupedTrades[id] = { trades, name, color: COLORS[i % COLORS.length] };
          });
        } else if (displayMode === 'session') {
          const bySession = new Map<string, Trade[]>();
          Object.entries(rawTradesBySeries).forEach(([compositeId, trades]) => {
            const [sessionId] = compositeId.split('::');
            const existing = bySession.get(sessionId) || [];
            bySession.set(sessionId, [...existing, ...trades]);
          });
          Array.from(bySession.entries()).forEach(([sessionId, trades], i) => {
            const session = targetSessions.find(s => s.id === sessionId);
            const name = session?.name || session?.fileName || sessionId.slice(0, 8);
            finalGroupedTrades[sessionId] = { trades, name, color: COLORS[i % COLORS.length] };
          });
        } else {
          // DETAIL MODE: session x EA, sorted by profit, max 15 + others
          const sortedEntries = Object.entries(rawTradesBySeries).map(([compositeId, trades]) => ({
            compositeId,
            trades,
            absProfit: Math.abs(trades.reduce((s, t) => s + (t.profit || 0), 0)),
          })).sort((a, b) => b.absProfit - a.absProfit);

          const top = sortedEntries.slice(0, MAX_DETAIL_LINES);
          const rest = sortedEntries.slice(MAX_DETAIL_LINES);

          top.forEach(({ compositeId, trades }, i) => {
            const [sessionId, eaId] = compositeId.split('::');
            const session = targetSessions.find(s => s.id === sessionId)!;
            const name = generateDisplayName(session, eaId, targetSessions);
            finalGroupedTrades[compositeId] = { trades, name, color: COLORS[i % COLORS.length] };
          });

          if (rest.length > 0) {
            const othersTrades = rest.flatMap(r => r.trades);
            finalGroupedTrades['others'] = { 
              trades: othersTrades, 
              name: `Others (${rest.length} EA)`, 
              color: OTHERS_COLOR 
            };
          }
        }

        // 3. Final metrics & series assembly
        const tradesForCharts: Record<string, Trade[]> = {};
        const equitySeries: EquitySeries[] = Object.entries(finalGroupedTrades).map(([id, group]) => {
          tradesForCharts[id] = group.trades;
          return {
            id,
            dataKey: id.replace(/[^a-zA-Z0-9]/g, '_'),
            name: group.name,
            data: calculateEquity(group.trades, 0),
            color: group.color,
            currency: displayCurrency
          };
        });

        const aggregateMetrics = allFilteredTrades.length > 0 
          ? calculateMetrics("Portfolio", allFilteredTrades, displayCurrency, totalInitial)
          : null;

        // 4. Create full session-EA series for the table (regardless of displayMode)
        const allSessionEASeries: EquitySeries[] = Object.entries(rawTradesBySeries).map(([id, trades], i) => {
          const [sessionId, eaId] = id.split('::');
          const session = targetSessions.find(s => s.id === sessionId)!;
          return {
            id,
            dataKey: id.replace(/[^a-zA-Z0-9]/g, '_'),
            name: generateDisplayName(session, eaId, targetSessions),
            data: [], // Data not needed for table
            color: COLORS[i % COLORS.length],
            currency: displayCurrency
          };
        });

        setProcessedData({
          equitySeries,
          tradesForCharts,
          aggregateMetrics,
          currency: displayCurrency,
          convertedBalances: { initialBalance: totalInitial, finalBalance: totalFinal },
          rawTradesBySeries,
          allSessionEASeries
        });
      } catch (err) {
        console.error("Async calculation failed:", err);
      } finally {
        setIsCalculating(false);
      }
    });
  }, [targetSessions, filters, displayMode, autoConvertCurrency, exchangeRates, baseCurrency]);

  // CSV export
  const handleExport = () => {
    if (!processedData) return;
    const { tradesForCharts, currency, aggregateMetrics } = processedData;

    const rows: MetricsRow[] = Object.entries(tradesForCharts).map(([compositeId, trades]) => {
      const [sessionId, eaId] = compositeId.split('::');
      const session = targetSessions.find(s => s.id === sessionId);
      const displayName = generateDisplayName(session, eaId, targetSessions);
      
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

  const m = processedData?.aggregateMetrics;
  const equitySeries = processedData?.equitySeries || [];
  const tradesForCharts = processedData?.tradesForCharts || {};
  const currency = processedData?.currency || "USD";

  if (isCalculating || isLoadingRates) {
    return (
      <div className="space-y-8 pb-12 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex gap-4 w-full max-w-2xl">
            <Skeleton className="h-12 w-1/3 rounded-full" />
            <Skeleton className="h-12 w-1/3 rounded-full" />
            <Skeleton className="h-12 w-1/3 rounded-full" />
          </div>
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl border border-border/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[420px] rounded-xl border border-border/50" />
          <Skeleton className="h-[420px] rounded-xl border border-border/50" />
        </div>
        <Skeleton className="h-[380px] rounded-xl border border-border/50" />
        <Skeleton className="h-[450px] rounded-xl border border-border/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* ── Toolbar: filters + display mode + export ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PerformanceFilters
          sessions={sessionOptions}
          eaOptions={eaOptions}
          filters={filters}
          onChange={setFilters}
        />
        <div className="flex items-center gap-3 shrink-0">
          {/* Display Mode Pills */}
          <div className="flex items-center bg-muted/40 border border-border/50 rounded-full p-1 gap-0.5 text-xs font-bold">
            {(['ea', 'session', 'detail'] as const).map((mode) => {
              const labels = { 
                ea: t('performance.displayMode.ea'), 
                session: t('performance.displayMode.session'), 
                detail: t('performance.displayMode.detail') 
              };
              return (
                <button
                  key={mode}
                  onClick={() => setDisplayMode(mode)}
                  className={cn(
                    'px-3 py-1.5 rounded-full transition-all',
                    displayMode === mode
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
          {processedData && (
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
      {(!processedData || equitySeries.length === 0) && (
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
              description={hasMixedCurrencies ? "Mixed currencies" : t("performance.kpi.netProfitDesc")}
              icon={m.totalProfit >= 0 ? TrendingUp : TrendingDown}
              color={m.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
              loading={isCalculating}
            />
            <KpiCard
              title={t("performance.kpi.winRate")}
              value={`${m.winRate}%`}
              description={t("performance.kpi.winRateDesc")}
              icon={PieChart}
              color="text-blue-400"
              loading={isCalculating}
            />
            <KpiCard
              title={t("performance.kpi.maxDrawdown")}
              value={`${m.maxDrawdown.toFixed(1)}%`}
              description={t("performance.kpi.maxDrawdownDesc")}
              icon={ArrowDownCircle}
              color="text-rose-400"
              loading={isCalculating}
            />
            <KpiCard
              title={t("performance.kpi.profitFactor")}
              value={m.profitFactor >= 999 ? "∞" : m.profitFactor.toFixed(2)}
              description={t("performance.kpi.profitFactorDesc")}
              icon={Layers}
              color="text-purple-400"
              loading={isCalculating}
            />
            <KpiCard
              title={t("performance.kpi.sharpeRatio")}
              value={m.sharpeRatio !== null ? m.sharpeRatio.toFixed(2) : "–"}
              description={t("performance.kpi.sharpeRatioDesc")}
              icon={Zap}
              color="text-amber-400"
              loading={isCalculating}
            />
            <KpiCard
              title={t("performance.kpi.expectancy")}
              value={hasMixedCurrencies ? "—" : formatCurrency(m.expectancy, currency)}
              description={hasMixedCurrencies ? "Mixed currencies" : t("performance.kpi.expectancyDesc")}
              icon={m.expectancy >= 0 ? TrendingUp : TrendingDown}
              color={m.expectancy >= 0 ? "text-emerald-400" : "text-rose-400"}
              loading={isCalculating}
            />
            <KpiCard
              title={t("performance.kpi.recoveryFactor")}
              value={m.recoveryFactor >= 999 ? "∞" : m.recoveryFactor.toFixed(2)}
              description={t("performance.kpi.recoveryFactorDesc")}
              icon={Activity}
              color="text-indigo-400"
              loading={isCalculating}
            />
            <KpiCard
              title={t("performance.kpi.profitPerDay")}
              value={hasMixedCurrencies ? "—" : formatCurrency(m.profitPerDay, currency)}
              description={hasMixedCurrencies ? "Mixed currencies" : t("performance.kpi.profitPerDayDesc")}
              icon={TrendingUp}
              color={m.profitPerDay >= 0 ? "text-teal-400" : "text-rose-400"}
              loading={isCalculating}
            />
          </div>

          {/* Equity + Drawdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EquityChart 
              series={equitySeries} 
              visibleKeys={visibleKeys}
              onToggle={toggleKey}
              onToggleAll={(show) => setVisibleKeys(show ? new Set(equitySeries.map(s => s.id || s.name)) : new Set())}
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
                <ComparisonDrawdownChart 
                  series={equitySeries} 
                  height={350} 
                  hiddenSeries={new Set(equitySeries.filter(s => !visibleKeys.has(s.id || s.name)).map(s => s.id || s.name))}
                  onLegendClick={toggleKey}
                />
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
              <ComparisonHistogram 
                series={equitySeries} 
                trades={tradesForCharts} 
                height={300} 
                hiddenSeries={new Set(equitySeries.filter(s => !visibleKeys.has(s.id || s.name)).map(s => s.id || s.name))}
                onLegendClick={(name) => {
                  const id = equitySeries.find(s => s.name === name)?.id || name;
                  toggleKey(id);
                }}
              />
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
                {(() => {
                  if (!processedData) return null;
                  
                  // Monthly Returns should ALWAYS show separated Session-EA pairs
                  // based on the user's urgent requirement, but filtered by visibleKeys if aggregated
                  // Actually, let's follow Step 2 & 3: show individual rows.
                  
                  const { rawTradesBySeries, allSessionEASeries, currency, equitySeries, tradesForCharts } = processedData;

                  // If in EA mode, we filter the raw series based on which EA is visible
                  // If in Session mode, we filter based on which Session is visible
                  // If in Detail mode, we use the raw series directly (filtered by visibleKeys)
                  
                  let tableSeries = allSessionEASeries;
                  let tableTrades = rawTradesBySeries;

                  if (displayMode === 'ea') {
                    // Only show rows whose EA ID is in a visible aggregated EA series
                    const visibleEAs = new Set(equitySeries.filter(s => visibleKeys.has(s.id || s.name)).map(s => (s.id || s.name).replace('ea_', '')));
                    tableSeries = allSessionEASeries.filter(s => visibleEAs.has((s.id || '').split('::')[1]));
                  } else if (displayMode === 'session') {
                    const visibleSessions = new Set(equitySeries.filter(s => visibleKeys.has(s.id || s.name)).map(s => s.id || s.name));
                    tableSeries = allSessionEASeries.filter(s => visibleSessions.has((s.id || '').split('::')[0]));
                  } else {
                    tableSeries = allSessionEASeries.filter(s => visibleKeys.has(s.id || s.name) || (visibleKeys.has('others') && !equitySeries.some(es => es.id === (s.id || s.name))));
                  }
                  
                  tableTrades = Object.fromEntries(tableSeries.map(s => [s.id || '', rawTradesBySeries[s.id || '']]));

                  console.log('[MonthlyReturns] tradesByEa keys:', Object.keys(tableTrades));
                  console.log('[MonthlyReturns] tradesByEa sample:', Object.entries(tableTrades).slice(0,5).map(([k,v]) => ({key: k, count: v.length})));
                  
                  return (
                    <MonthlyReturnsTable 
                      series={tableSeries} 
                      tradesByEa={tableTrades} 
                      currency={currency} 
                      sessionsCount={targetSessions.length}
                      displayMode={displayMode}
                      allSessions={targetSessions}
                    />
                  );
                })()}
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
