"use client";

import React, { useState, useMemo } from "react";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { Trade, EquitySeries, MetricsRow } from "@/lib/types";
import { calculateMetrics, calculateEquity } from "@/lib/comparison";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  ArrowDownCircle,
  Layers,
  Zap,
  Target,
  BarChart2,
  Download,
  AlertCircle,
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
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
        <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", color.replace("text-", "bg-").replace("-400", "-400/10"))}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className={cn("text-2xl font-bold tracking-tight", color)}>{value}</div>
        {sub && <p className="text-[11px] text-muted-foreground mt-1 font-medium">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* ─── Equity chart ─── */
function EquityChart({
  series,
  currency,
}: {
  series: EquitySeries[];
  currency: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#333" : "#e5e7eb";
  const textColor = isDark ? "#9ca3af" : "#6b7280";

  const chartData = useMemo(() => {
    if (series.length === 0) return [];
    // Merge all series dates
    const dateSet = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => dateSet.add(d.date.split(" ")[0])));
    const sortedDates = Array.from(dateSet).sort(
      (a, b) => new Date(a.replace(/\./g, "/")).getTime() - new Date(b.replace(/\./g, "/")).getTime()
    );

    // Build date → equity per series map
    const seriesMaps = series.map((s) => {
      const m = new Map<string, number>();
      // Forward-fill per point
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

    // Forward-fill
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
  }, [series]);

  if (series.length === 0 || chartData.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Equity Curve</CardTitle>
            <CardDescription className="text-xs">Cumulative profit over time</CardDescription>
          </div>
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <TrendingUp size={18} className="text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="bg-card rounded-lg p-4 border border-border/20">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="date"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                tick={{ fill: textColor }}
                minTickGap={30}
              />
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                tick={{ fill: textColor }}
                tickFormatter={(v) =>
                  formatCurrency(v, currency)
                    .replace(/[^0-9\-.,kKmM$€£]/g, "")
                    .slice(0, 8)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  padding: "12px",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [formatCurrency(Number(value), currency), ""]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", fontWeight: "bold", paddingBottom: "16px" }}
              />
              {series.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color || COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  isAnimationActive={false}
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
  const { sessions } = useAnalysisStore();
  const { t } = useTranslation();

  const [filters, setFilters] = useState<FilterState>({
    selectedSessions: [],
    startDate: "",
    endDate: "",
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

  // Filter trades per session, applying date range + EA filter
  const { tradesByEA, allFilteredTrades, currency } = useMemo(() => {
    const currency = targetSessions[0]?.currency || "USD";
    const start = filters.startDate ? new Date(filters.startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const tradesByEA: Record<string, Trade[]> = {};

    targetSessions.forEach((session) => {
      let trades = session.allTrades || [];

      // Date filter
      if (start && end) {
        trades = trades.filter((t) => {
          const d = new Date(t.closeTime.replace(/\./g, "/"));
          return d >= start && d <= end;
        });
      }

      // EA filter
      if (filters.selectedEA !== "all") {
        trades = trades.filter(
          (t) => (t.eaId || t.comment || "Unknown") === filters.selectedEA
        );
      }

      trades.forEach((t) => {
        const eaKey = t.eaId || t.comment || "Unknown";
        const label = isNaN(Number(eaKey))
          ? `${eaKey} (${session.name || session.fileName})`
          : `EA #${eaKey} (${session.name || session.fileName})`;
        if (!tradesByEA[label]) tradesByEA[label] = [];
        tradesByEA[label].push(t);
      });
    });

    const allFilteredTrades = Object.values(tradesByEA).flat();
    return { tradesByEA, allFilteredTrades, currency };
  }, [targetSessions, filters.startDate, filters.endDate, filters.selectedEA]);

  // Aggregate metrics (all filtered trades combined)
  const aggregateMetrics: MetricsRow | null = useMemo(() => {
    if (allFilteredTrades.length === 0) return null;
    return calculateMetrics("Portfolio", allFilteredTrades, currency);
  }, [allFilteredTrades, currency]);

  // EquitySeries per EA for charts
  const equitySeries: EquitySeries[] = useMemo(() => {
    return Object.entries(tradesByEA).map(([name, trades], i) => ({
      name,
      data: calculateEquity(trades),
      color: COLORS[i % COLORS.length],
      currency,
    }));
  }, [tradesByEA, currency]);

  // CSV export
  const handleExport = () => {
    if (!aggregateMetrics && Object.keys(tradesByEA).length === 0) return;

    const rows: MetricsRow[] = Object.entries(tradesByEA).map(([name, trades]) =>
      calculateMetrics(name, trades, currency)
    );
    if (rows.length === 0 && aggregateMetrics) rows.push(aggregateMetrics);

    const headers = [
      "EA", "Net Profit", "Win Rate %", "Trade Count", "Profit Factor",
      "Max Drawdown %", "Sharpe Ratio", "Expectancy", "Recovery Factor",
      "Profit/Day", "Avg Profit/Trade", "Best Trade", "Worst Trade",
    ];
    const csvRows = rows.map((r) =>
      [
        r.name, r.totalProfit, r.winRate, r.tradeCount, r.profitFactor,
        r.maxDrawdown, r.sharpeRatio ?? "N/A", r.expectancy, r.recoveryFactor,
        r.profitPerDay, r.avgProfitPerTrade, r.bestTrade, r.worstTrade,
      ].join(",")
    );

    const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Empty state ───
  if (activeSessions.length === 0) {
    return (
      <Card className="border-border/50 shadow-lg animate-in fade-in zoom-in duration-500">
        <CardContent className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="p-4 bg-muted/30 rounded-full">
            <BarChart2 size={36} className="text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">No Reports Uploaded</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            Upload an MT4 or MT5 report from the Dashboard to start analyzing performance.
          </p>
        </CardContent>
      </Card>
    );
  }

  const m = aggregateMetrics;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Filters */}
      <PerformanceFilters
        sessions={sessionOptions}
        eaOptions={eaOptions}
        filters={filters}
        onChange={setFilters}
      />

      {/* No trades after filtering */}
      {allFilteredTrades.length === 0 && (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle size={28} className="text-muted-foreground" />
            <p className="text-muted-foreground text-sm font-medium">
              No trades match the current filters.
            </p>
          </CardContent>
        </Card>
      )}

      {m && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <KpiCard
              title="Net Profit"
              value={formatCurrency(m.totalProfit, currency)}
              sub={`${m.tradeCount} trades`}
              icon={m.totalProfit >= 0 ? TrendingUp : TrendingDown}
              color={m.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <KpiCard
              title="Win Rate"
              value={`${m.winRate}%`}
              sub={`${Math.round((m.winRate / 100) * m.tradeCount)} wins`}
              icon={PieChart}
              color="text-blue-400"
            />
            <KpiCard
              title="Max Drawdown"
              value={`${m.maxDrawdown.toFixed(1)}%`}
              icon={ArrowDownCircle}
              color="text-rose-400"
            />
            <KpiCard
              title="Profit Factor"
              value={m.profitFactor >= 9999 ? "∞" : m.profitFactor.toString()}
              icon={Layers}
              color="text-purple-400"
            />
            <KpiCard
              title="Sharpe Ratio"
              value={m.sharpeRatio !== null ? m.sharpeRatio.toString() : "N/A"}
              sub="Risk-adjusted return"
              icon={Zap}
              color="text-amber-400"
            />
            <KpiCard
              title="Expectancy"
              value={formatCurrency(m.expectancy, currency)}
              sub="Avg P&L per trade"
              icon={Target}
              color={m.expectancy >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <KpiCard
              title="Recovery Factor"
              value={m.recoveryFactor >= 9999 ? "∞" : m.recoveryFactor.toFixed(2)}
              sub="Profit / Max DD"
              icon={Activity}
              color="text-indigo-400"
            />
            <KpiCard
              title="Profit / Day"
              value={formatCurrency(m.profitPerDay, currency)}
              sub="Avg daily profit"
              icon={TrendingUp}
              color={m.profitPerDay >= 0 ? "text-teal-400" : "text-rose-400"}
            />
          </div>

          {/* Equity + Drawdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EquityChart series={equitySeries} currency={currency} />
            <ComparisonDrawdownChart series={equitySeries} height={300} />
          </div>

          {/* Profit Distribution */}
          <ComparisonHistogram series={equitySeries} trades={tradesByEA} height={280} />

          {/* Monthly Returns */}
          <MonthlyReturnsTable tradesByEa={tradesByEA} currency={currency} />

          {/* Export button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
