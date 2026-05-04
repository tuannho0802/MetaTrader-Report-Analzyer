"use client";

import React, { useState } from "react";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/formatCurrency";
import { useTheme } from "next-themes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { LayoutGrid, Trophy, LineChart as LineChartIcon, BarChart3, Database, Layers, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EaAggregate {
  id: string; // composite key
  displayName: string;
  totalProfit: number;
  tradeCount: number;
  wins: number;
  currency: string;
}

export default function StatisticsPage() {
  const { sessions } = useAnalysisStore();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const tooltipLabelColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 / slate-500
  const tooltipItemColor  = isDark ? '#f1f5f9' : '#0f172a'; // slate-100 / slate-900
  const axisTickColor     = isDark ? '#cbd5e1' : '#475569'; // slate-300 / slate-600

  const activeSessions = sessions.filter(s => !(s as any).deleted && !(s as any).archived);

  const [selectedEaKey, setSelectedEaKey] = useState<string>("");

  if (activeSessions.length === 0) {
    return (
      <Card className="border-border/50 shadow-lg animate-in fade-in zoom-in duration-500">
        <CardContent className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="p-4 bg-muted/30 rounded-full">
            <Database size={32} className="text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">{t('statistics.noSessions')}</h3>
          <p className="text-muted-foreground text-sm">{t('statistics.noSessionsDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  // Aggregate KPIs
  const allFilteredTrades = activeSessions.flatMap(s => s.currentResult?.trades || []);
  const totalProfit = allFilteredTrades.reduce((s, t) => s + t.profit, 0);
  const currency = activeSessions[0]?.currency || 'USD';

  // EA Leaderboard (Composite Key)
  const eaMap = new Map<string, EaAggregate>();

  activeSessions.forEach(session => {
    const trades = session.currentResult?.trades || [];
    const sessionName = session.name || session.fileName || 'Unknown';

    trades.forEach(trade => {
      const rawEaId = trade.eaId || trade.comment || 'Unknown';
      const compositeKey = `${session.id}::${rawEaId}`;

      if (!eaMap.has(compositeKey)) {
        const label = isNaN(Number(rawEaId)) ? rawEaId : `EA #${rawEaId}`;
        eaMap.set(compositeKey, {
          id: compositeKey,
          displayName: `${label} (${sessionName})`,
          totalProfit: 0,
          tradeCount: 0,
          wins: 0,
          currency: session.currency || 'USD',
        });
      }

      const ea = eaMap.get(compositeKey)!;
      ea.totalProfit += trade.profit;
      ea.tradeCount += 1;
      if (trade.profit > 0) ea.wins += 1;
    });
  });

  const leaderboard = Array.from(eaMap.values())
    .map(ea => ({
      ...ea,
      totalProfit: Number(ea.totalProfit.toFixed(2)),
      winRate: ea.tradeCount > 0 ? Number(((ea.wins / ea.tradeCount) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit);

  // EA Trend Chart
  let trendData: { name: string; profit: number }[] = [];
  if (selectedEaKey) {
    const [sessId, rawEaId] = selectedEaKey.split('::');
    const targetSession = activeSessions.find(s => s.id === sessId);
    const eaTrades = (targetSession?.currentResult?.trades || [])
      .filter(t => (t.eaId || t.comment || 'Unknown') === rawEaId)
      .sort((a, b) => new Date((a.closeTime || "").replace(/\./g, '/')).getTime() - new Date((b.closeTime || "").replace(/\./g, '/')).getTime());

    const dailyMap = new Map<string, number>();
    eaTrades.forEach(t => {
      const day = (t.closeTime || "").split(' ')[0];
      dailyMap.set(day, (dailyMap.get(day) || 0) + t.profit);
    });

    let cumulative = 0;
    trendData = Array.from(dailyMap.keys()).sort().map(day => {
      cumulative += dailyMap.get(day) || 0;
      return { name: day.replace(/\./g, '/'), profit: Number(cumulative.toFixed(2)) };
    });
  }

  // Top Symbols
  const symbolMap = new Map<string, number>();
  activeSessions.forEach(s => {
    (s.currentResult?.trades || []).forEach(t => {
      const sym = t.item || 'Unknown';
      symbolMap.set(sym, (symbolMap.get(sym) || 0) + 1);
    });
  });

  const symbolData = Array.from(symbolMap.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('statistics.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('statistics.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('statistics.totalSessions')}</CardTitle>
            <div className="p-2 rounded-lg bg-muted/30 bg-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-bold tracking-tight">
              {activeSessions.length}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('statistics.totalTrades')}</CardTitle>
            <div className="p-2 rounded-lg bg-muted/30 bg-amber-400/10">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-bold tracking-tight">
              {allFilteredTrades.length}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('statistics.totalProfit')}</CardTitle>
            <div className={cn("p-2 rounded-lg bg-muted/30", totalProfit >= 0 ? "bg-emerald-400/10" : "bg-rose-400/10")}>
              <TrendingUp className={cn("h-4 w-4", totalProfit >= 0 ? "text-emerald-400" : "text-rose-400")} />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className={cn("text-3xl font-bold tracking-tight", totalProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {formatCurrency(totalProfit, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('statistics.totalEAs')}</CardTitle>
            <div className="p-2 rounded-lg bg-muted/30 bg-blue-400/10">
              <LayoutGrid className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-bold tracking-tight">
              {eaMap.size}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy size={18} className="text-primary" />
                {t('statistics.leaderboardTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>{t('statistics.rank')}</TableHead>
                    <TableHead>{t('statistics.eaName')}</TableHead>
                    <TableHead className="text-right">{t('statistics.profit')}</TableHead>
                    <TableHead className="text-right">{t('statistics.trades')}</TableHead>
                    <TableHead className="text-right">{t('statistics.winRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((ea, idx) => (
                    <TableRow
                      key={ea.id}
                      onClick={() => setSelectedEaKey(ea.id === selectedEaKey ? "" : ea.id)}
                      className={cn("cursor-pointer hover:bg-muted/30 transition-colors", selectedEaKey === ea.id && "bg-primary/5")}
                    >
                      <TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-bold">{ea.displayName}</TableCell>
                      <TableCell className={cn("text-right font-bold font-mono", ea.totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        {ea.totalProfit > 0 ? '+' : ''}{formatCurrency(ea.totalProfit, ea.currency)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{ea.tradeCount}</TableCell>
                      <TableCell className="text-right">{ea.winRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* EA Trend Chart */}
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{t('statistics.trendTitle')}</CardTitle>
                  <CardDescription className="text-xs">{t('statistics.trendDesc')}</CardDescription>
                </div>
                <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                  <LineChartIcon size={18} className="text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {!selectedEaKey ? (
                <div className="flex items-center justify-center h-[250px] bg-muted/10 rounded-lg border border-border/20 border-dashed">
                  <p className="text-muted-foreground text-sm">{t('statistics.selectEa')}</p>
                </div>
              ) : (
                <div className="bg-card rounded-lg p-4 border border-border/20">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={{ stroke: 'hsl(var(--border))' }} 
                        tick={{ fill: axisTickColor }} 
                        interval="preserveStartEnd"
                        tickCount={6}
                      />
                      <YAxis 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={{ stroke: 'hsl(var(--border))' }} 
                        tick={{ fill: axisTickColor }} 
                        tickFormatter={(v) => formatCurrency(v, currency).replace(/[^0-9\-.,kKmM$€£]/g, '').slice(0, 8)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          padding: "12px",
                        }}
                        itemStyle={{ fontSize: "12px", fontWeight: "600", color: tooltipItemColor }}
                        labelStyle={{ fontSize: "11px", fontWeight: "bold", color: tooltipLabelColor }}
                        cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                        formatter={(value: any) => [formatCurrency(value, currency), t('statistics.profit')]}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Symbols */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{t('statistics.topSymbols')}</CardTitle>
                  <CardDescription className="text-xs">{t('statistics.topSymbolsDesc')}</CardDescription>
                </div>
                <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                  <BarChart3 size={18} className="text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-card rounded-lg p-4 border border-border/20">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={symbolData} layout="vertical" margin={{ left: 20 }} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number"
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: 'hsl(var(--border))' }} 
                      tick={{ fill: axisTickColor }} 
                    />
                    <YAxis 
                      dataKey="symbol" 
                      type="category" 
                      width={80}
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: 'hsl(var(--border))' }} 
                      tick={{ fill: axisTickColor }} 
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        padding: "12px",
                      }}
                      itemStyle={{ fontSize: "12px", fontWeight: "600", color: tooltipItemColor }}
                      labelStyle={{ fontSize: "11px", fontWeight: "bold", color: tooltipLabelColor }}
                      cursor={false}
                      formatter={(value: any) => [String(value), 'Trades']}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {symbolData.map((_, i) => (
                        <Cell
                          key={i}
                          fill="#6366f1"
                          fillOpacity={Math.max(0.3, 1 - i * 0.07)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
