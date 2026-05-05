"use client";

import React, { useState, useMemo } from "react";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { Trade, EquitySeries, MetricsRow } from "@/lib/types";
import { calculateMetrics, calculateEquity } from "@/lib/comparison";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";
import { exportPerformanceCSV } from "@/lib/exportComparison";

import { PerformanceFilters, FilterState } from "./PerformanceFilters";
import { MultiEaChart } from "@/components/analysis/MultiEaChart";
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
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  ArrowDownCircle,
  Layers,
  Zap,
  Target,
  BarChart3,
  Download,
  AlertCircle,
  Info,
} from "lucide-react";

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
  tooltip,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
  tooltip?: string;
}) {
  const displayValue = value === null || value === undefined || (value === 0 && loading) ? "–" : value;

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
                <div className="p-0.5 rounded-full hover:bg-muted/50 cursor-help transition-colors">
                  <Info size={10} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-[11px] leading-relaxed p-3">
                {tooltip || description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className={cn("p-2 rounded-lg transition-colors group-hover:bg-opacity-20", color.replace("text-", "bg-").replace("-400", "-400/10"))}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className={cn("text-2xl font-black tracking-tight tabular-nums", displayValue === "–" ? "text-muted-foreground/30" : color)}>
          {displayValue}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 font-medium line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity leading-snug">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Main dashboard ─── */
export function PerformanceDashboard() {
  const { sessions } = useAnalysisStore();
  const { t } = useTranslation();

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

  // Filter trades per series (Session-based or EA-based)
  const { tradesBySeries, allFilteredTrades, currency } = useMemo(() => {
    const currency = targetSessions[0]?.currency || "USD";
    const start = filters.startDate;
    const end = filters.endDate;

    const tradesBySeries: Record<string, Trade[]> = {};
    const isSingleSession = targetSessions.length === 1;

    targetSessions.forEach((session) => {
      let trades = session.allTrades || [];

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

      if (trades.length === 0) return;

      if (isSingleSession && filters.selectedEA === "all") {
        // If single session and no EA filter, group by EA to show detail
        trades.forEach((t) => {
          const eaKey = t.eaId || t.comment || "Unknown";
          const label = isNaN(Number(eaKey)) ? eaKey : `EA #${eaKey}`;
          if (!tradesBySeries[label]) tradesBySeries[label] = [];
          tradesBySeries[label].push(t);
        });
      } else {
        // Multiple sessions or EA filter active -> group by Session
        const label = session.name || session.fileName;
        if (!tradesBySeries[label]) tradesBySeries[label] = [];
        tradesBySeries[label].push(...trades);
      }
    });

    const allFilteredTrades = Object.values(tradesBySeries).flat();
    return { tradesBySeries, allFilteredTrades, currency };
  }, [targetSessions, filters.startDate, filters.endDate, filters.selectedEA]);

  // Aggregate metrics (all filtered trades combined)
  const aggregateMetrics: MetricsRow | null = useMemo(() => {
    if (allFilteredTrades.length === 0) return null;
    return calculateMetrics("Portfolio", allFilteredTrades, currency);
  }, [allFilteredTrades, currency]);

  // EquitySeries per series for charts
  const equitySeries: EquitySeries[] = useMemo(() => {
    return Object.entries(tradesBySeries).map(([name, trades], i) => ({
      name,
      data: calculateEquity(trades),
      color: COLORS[i % COLORS.length],
      currency,
    }));
  }, [tradesBySeries, currency]);

  // CSV export
  const handleExport = () => {
    const rows: MetricsRow[] = Object.entries(tradesBySeries).map(([name, trades]) =>
      calculateMetrics(name, trades, currency)
    );
    if (rows.length === 0 && aggregateMetrics) rows.push(aggregateMetrics);
    exportPerformanceCSV(rows, currency);
  };

  // Merge multiple series into one chart data format { date, EA1: value, EA2: value... }
  const mergedEquityData = useMemo(() => {
    if (equitySeries.length === 0) return [];
    
    const dateSet = new Set<string>();
    equitySeries.forEach((s) => s.data.forEach((d) => dateSet.add(d.date.split(" ")[0])));
    const sortedDates = Array.from(dateSet).sort(
      (a, b) => new Date(a.replace(/\./g, "/")).getTime() - new Date(b.replace(/\./g, "/")).getTime()
    );

    const seriesMaps = equitySeries.map((s) => {
      const m = new Map<string, number>();
      let last = 0;
      const sorted = [...s.data].sort(
        (a, b) => new Date(a.date.replace(/\./g, "/")).getTime() - new Date(b.date.replace(/\./g, "/")).getTime()
      );
      sorted.forEach((d) => {
        last = d.equity;
        m.set(d.date.split(" ")[0], d.equity);
      });
      return { name: s.name, map: m, last };
    });

    const lastVal: Record<string, number> = {};
    return sortedDates.map((date) => {
      const row: Record<string, string | number> = { date };
      seriesMaps.forEach((sm) => {
        if (sm.map.has(date)) {
          lastVal[sm.name] = sm.map.get(date)!;
        }
        row[sm.name] = lastVal[sm.name] ?? 0;
      });
      return row;
    });
  }, [equitySeries]);

  // ─── Empty state (no sessions at all) ───
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
            <p className="text-muted-foreground text-sm max-w-xs mx-auto font-medium leading-relaxed">
              {t("performance.empty.noData")}
            </p>
          </div>
          <Button variant="outline" className="mt-4 rounded-full px-8 font-bold border-primary/20 hover:bg-primary/5 transition-all" onClick={() => window.location.href = "/"}>
            {t("common.dashboard")}
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
              value={formatCurrency(m.totalProfit, currency)}
              description={t("performance.kpi.netProfitDesc")}
              tooltip={t("performance.kpi.netProfitDesc")}
              icon={m.totalProfit >= 0 ? TrendingUp : TrendingDown}
              color={m.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <KpiCard
              title={t("performance.kpi.winRate")}
              value={`${m.winRate}%`}
              description={t("performance.kpi.winRateDesc")}
              tooltip={t("performance.kpi.winRateDesc")}
              icon={PieChart}
              color="text-blue-400"
            />
            <KpiCard
              title={t("performance.kpi.maxDrawdown")}
              value={`${m.maxDrawdown.toFixed(1)}%`}
              description={t("performance.kpi.maxDrawdownDesc")}
              tooltip={t("performance.kpi.maxDrawdownDesc")}
              icon={ArrowDownCircle}
              color="text-rose-400"
            />
            <KpiCard
              title={t("performance.kpi.profitFactor")}
              value={m.profitFactor >= 999 ? "∞" : m.profitFactor.toFixed(2)}
              description={t("performance.kpi.profitFactorDesc")}
              tooltip={t("performance.kpi.profitFactorDesc")}
              icon={Layers}
              color="text-purple-400"
            />
            <KpiCard
              title={t("performance.kpi.sharpeRatio")}
              value={m.sharpeRatio !== null ? m.sharpeRatio.toFixed(2) : "–"}
              description={t("performance.kpi.sharpeRatioDesc")}
              tooltip={t("performance.kpi.sharpeRatioDesc")}
              icon={Zap}
              color="text-amber-400"
            />
            <KpiCard
              title={t("performance.kpi.expectancy")}
              value={formatCurrency(m.expectancy, currency)}
              description={t("performance.kpi.expectancyDesc")}
              tooltip={t("performance.kpi.expectancyDesc")}
              icon={Target}
              color={m.expectancy >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <KpiCard
              title={t("performance.kpi.recoveryFactor")}
              value={m.recoveryFactor >= 999 ? "∞" : m.recoveryFactor.toFixed(2)}
              description={t("performance.kpi.recoveryFactorDesc")}
              tooltip={t("performance.kpi.recoveryFactorDesc")}
              icon={Activity}
              color="text-indigo-400"
            />
            <KpiCard
              title={t("performance.kpi.profitPerDay")}
              value={formatCurrency(m.profitPerDay, currency)}
              description={t("performance.kpi.profitPerDayDesc")}
              tooltip={t("performance.kpi.profitPerDayDesc")}
              icon={TrendingUp}
              color={m.profitPerDay >= 0 ? "text-teal-400" : "text-rose-400"}
            />
          </div>

          {/* Equity + Drawdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MultiEaChart 
              data={mergedEquityData}
              currency={currency} 
              title={t("performance.charts.equityCurve")}
              description={t("performance.charts.equityCurveDesc")}
              height={350}
            />
            <ComparisonDrawdownChart series={equitySeries} height={350} />
          </div>

          {/* Profit Distribution */}
          <ComparisonHistogram series={equitySeries} trades={tradesBySeries} height={300} />

          {/* Monthly Returns */}
          <Card className="border-border/50 shadow-lg bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">{t("performance.charts.monthlyReturns")}</CardTitle>
              <CardDescription className="text-xs">{t("performance.charts.monthlyReturnsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto pb-4">
                <MonthlyReturnsTable tradesByEa={tradesBySeries} currency={currency} />
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground italic font-medium border-t border-border/40 pt-2">
                {t("performance.charts.monthlyReturnsDesc")}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
