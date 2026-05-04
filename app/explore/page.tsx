"use client";

import React, { useState, useEffect } from "react";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/formatCurrency";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { BarChart2, Clock, Calendar, CalendarDays, TrendingUp, TrendingDown, PieChart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const { sessions, activeSessionId } = useAnalysisStore();
  const { t, language } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const tooltipLabelColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 / slate-500
  const tooltipItemColor  = isDark ? '#f1f5f9' : '#0f172a'; // slate-100 / slate-900
  const axisTickColor     = isDark ? '#cbd5e1' : '#475569'; // slate-300 / slate-600

  const activeSessions = sessions.filter(s => !(s as any).deleted && !(s as any).archived);

  const [selectedId, setSelectedId] = useState<string>(activeSessionId || "");

  useEffect(() => {
    if (!selectedId && activeSessions.length > 0) {
      setSelectedId(activeSessions[0].id);
    }
  }, [activeSessions, selectedId]);

  if (activeSessions.length === 0) {
    return (
      <Card className="border-border/50 shadow-lg animate-in fade-in zoom-in duration-500">
        <CardContent className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="p-4 bg-muted/30 rounded-full">
            <BarChart2 size={32} className="text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">{t('explore.noSession')}</h3>
          <p className="text-muted-foreground text-sm">{t('explore.noSessionDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  const session = activeSessions.find(s => s.id === selectedId) || activeSessions[0];
  const trades = session?.currentResult?.trades || [];
  const currency = session?.currency || 'USD';

  // KPIs
  const totalProfit = trades.reduce((s, t) => s + t.profit, 0);
  const wins = trades.filter(t => t.profit > 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgProfit = trades.length > 0 ? totalProfit / trades.length : 0;

  // Chart 1: Profit by Hour
  const hourData = Array.from({ length: 24 }, (_, i) => {
    const profit = trades
      .filter(t => {
        const d = new Date((t.openTime || "").replace(/\./g, '/'));
        return !isNaN(d.getTime()) && d.getHours() === i;
      })
      .reduce((s, t) => s + t.profit, 0);
    return { name: `${i}h`, profit: Number(profit.toFixed(2)) };
  });

  // Chart 2: Profit by Day of Week
  const dowLabels = language === 'vi'
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const dowData = [1, 2, 3, 4, 5, 6, 0].map(i => ({
    name: dowLabels[i],
    profit: Number(
      trades
        .filter(t => {
          const d = new Date((t.closeTime || "").replace(/\./g, '/'));
          return !isNaN(d.getTime()) && d.getDay() === i;
        })
        .reduce((s, t) => s + t.profit, 0)
        .toFixed(2)
    )
  }));

  // Chart 3: Profit by Month
  const monthMap = new Map<string, number>();
  trades.forEach(t => {
    const d = new Date((t.closeTime || "").replace(/\./g, '/'));
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) || 0) + t.profit);
  });
  const monthData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, profit]) => {
      const [year, month] = key.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1);
      return {
        name: d.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', year: '2-digit' }),
        profit: Number(profit.toFixed(2))
      };
    });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header + Session Selector */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('explore.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('explore.subtitle')}</p>
        </div>
        <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={t('explore.selectSession')} />
          </SelectTrigger>
          <SelectContent>
            {activeSessions.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name || s.fileName} ({s.currentResult?.trades.length || 0} {t('dashboard.trades')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('explore.kpiNetProfit')}</CardTitle>
            <div className={cn("p-2 rounded-lg bg-muted/30", totalProfit >= 0 ? "bg-emerald-400/10" : "bg-rose-400/10")}>
              {totalProfit >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
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
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('explore.kpiTotalTrades')}</CardTitle>
            <div className="p-2 rounded-lg bg-muted/30 bg-amber-400/10">
              <Activity className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-bold tracking-tight">
              {trades.length}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('explore.kpiWinRate')}</CardTitle>
            <div className="p-2 rounded-lg bg-muted/30 bg-blue-400/10">
              <PieChart className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-bold tracking-tight">
              {winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('explore.kpiAvgProfit')}</CardTitle>
            <div className={cn("p-2 rounded-lg bg-muted/30", avgProfit >= 0 ? "bg-emerald-400/10" : "bg-rose-400/10")}>
              {avgProfit >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className={cn("text-3xl font-bold tracking-tight", avgProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {formatCurrency(avgProfit, currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit by Hour */}
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t('explore.profitByHour')}</CardTitle>
                <CardDescription className="text-xs">{t('explore.profitByHourDesc')}</CardDescription>
              </div>
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Clock size={18} className="text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-card rounded-lg p-4 border border-border/20">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="20%" barGap={4}>
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
                    cursor={false}
                    formatter={(value: any) => [formatCurrency(value, currency), '']}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {hourData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.profit >= 0 ? '#10b981' : '#ef4444'}
                        opacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit by DOW */}
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t('explore.profitByDOW')}</CardTitle>
                <CardDescription className="text-xs">{t('explore.profitByDOWDesc')}</CardDescription>
              </div>
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Calendar size={18} className="text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-card rounded-lg p-4 border border-border/20">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="20%" barGap={4}>
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
                    cursor={false}
                    formatter={(value: any) => [formatCurrency(value, currency), '']}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {dowData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.profit >= 0 ? '#10b981' : '#ef4444'}
                        opacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit by Month (Full Width) */}
        <Card className="col-span-1 lg:col-span-2 border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t('explore.profitByMonth')}</CardTitle>
                <CardDescription className="text-xs">{t('explore.profitByMonthDesc')}</CardDescription>
              </div>
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                <CalendarDays size={18} className="text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-card rounded-lg p-4 border border-border/20">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="20%" barGap={4}>
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
                    cursor={false}
                    formatter={(value: any) => [formatCurrency(value, currency), '']}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {monthData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.profit >= 0 ? '#10b981' : '#ef4444'}
                        opacity={0.9}
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
  );
}
