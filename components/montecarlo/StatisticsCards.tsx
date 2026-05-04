'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatCurrency';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Activity,
  Target,
  Sigma,
  Percent,
  HelpCircle,
} from 'lucide-react';

interface Props {
  results: {
    profits: number[];
    drawdowns: number[];
  };
  currency: string;
  accountBalance: number;
  isSequential?: boolean;
}

interface MetricCard {
  label: string;
  value: string;
  sentiment: 'good' | 'bad' | 'neutral';
  icon: React.ElementType;
  isSequentialOnly?: boolean;
  helpKey?: string;
}

export function StatisticsCards({ results, currency, accountBalance, isSequential }: Props) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const { profits, drawdowns } = results;
    const n = profits.length;

    const sortedProfits = [...profits].sort((a, b) => a - b);
    const sortedDrawdowns = [...drawdowns].sort((a, b) => a - b);

    const meanProfit = profits.reduce((s, v) => s + v, 0) / n;
    const meanDrawdown = drawdowns.reduce((s, v) => s + v, 0) / n;

    const medianProfit = sortedProfits[Math.floor(n / 2)];

    const variance = profits.reduce((s, v) => s + Math.pow(v - meanProfit, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const worstProfit = sortedProfits[0];
    const bestProfit = sortedProfits[n - 1];
    const worstDrawdown = sortedDrawdowns[n - 1];

    const ci95Lower = sortedProfits[Math.floor(n * 0.025)];
    const ci95Upper = sortedProfits[Math.floor(n * 0.975)];

    const probProfit = (profits.filter((p) => p > 0).length / n) * 100;
    const riskOfRuin = (drawdowns.filter((d) => d >= accountBalance).length / n) * 100;

    return {
      meanProfit,
      medianProfit,
      stdDev,
      worstProfit,
      bestProfit,
      ci95Lower,
      ci95Upper,
      meanDrawdown,
      worstDrawdown,
      probProfit,
      riskOfRuin,
    };
  }, [results, accountBalance]);

  const allMetrics: MetricCard[] = [
    {
      label: isSequential ? t('dashboard.netProfit') : t('monteCarlo.meanProfit'),
      value: formatCurrency(stats.meanProfit, currency),
      sentiment: stats.meanProfit >= 0 ? 'good' : 'bad',
      icon: TrendingUp,
      isSequentialOnly: true,
      helpKey: 'monteCarlo.helpMeanProfit',
    },
    {
      label: t('monteCarlo.medianProfit'),
      value: formatCurrency(stats.medianProfit, currency),
      sentiment: stats.medianProfit >= 0 ? 'good' : 'bad',
      icon: Activity,
      helpKey: 'monteCarlo.helpMedianProfit',
    },
    {
      label: t('monteCarlo.stdDev'),
      value: formatCurrency(stats.stdDev, currency),
      sentiment: 'neutral',
      icon: Sigma,
      helpKey: 'monteCarlo.helpStdDev',
    },
    {
      label: t('monteCarlo.worstProfit'),
      value: formatCurrency(stats.worstProfit, currency),
      sentiment: stats.worstProfit >= 0 ? 'good' : 'bad',
      icon: TrendingDown,
      isSequentialOnly: true,
      helpKey: 'monteCarlo.helpWorstProfit',
    },
    {
      label: t('monteCarlo.bestProfit'),
      value: formatCurrency(stats.bestProfit, currency),
      sentiment: 'good',
      icon: Target,
      isSequentialOnly: true,
      helpKey: 'monteCarlo.helpBestProfit',
    },
    {
      label: t('monteCarlo.confidence95'),
      value: `${formatCurrency(stats.ci95Lower, currency)} — ${formatCurrency(stats.ci95Upper, currency)}`,
      sentiment: 'neutral',
      icon: BarChart3,
      helpKey: 'monteCarlo.helpConfidence95',
    },
    {
      label: isSequential ? t('dashboard.maxDrawdown') : t('monteCarlo.meanDrawdown'),
      value: formatCurrency(stats.meanDrawdown, currency),
      sentiment: 'bad',
      icon: Minus,
      isSequentialOnly: true,
      helpKey: 'monteCarlo.helpMeanDrawdown',
    },
    {
      label: t('monteCarlo.worstDrawdown'),
      value: formatCurrency(stats.worstDrawdown, currency),
      sentiment: 'bad',
      icon: AlertTriangle,
      isSequentialOnly: true,
      helpKey: 'monteCarlo.helpWorstDrawdown',
    },
    {
      label: t('monteCarlo.probProfit'),
      value: `${stats.probProfit.toFixed(1)}%`,
      sentiment: stats.probProfit >= 50 ? 'good' : 'bad',
      icon: Percent,
      helpKey: 'monteCarlo.helpProbProfit',
    },
    {
      label: t('monteCarlo.riskOfRuin'),
      value: `${stats.riskOfRuin.toFixed(2)}%`,
      sentiment: stats.riskOfRuin < 5 ? 'good' : stats.riskOfRuin < 20 ? 'neutral' : 'bad',
      icon: ShieldCheck,
      helpKey: 'monteCarlo.helpRiskOfRuin',
    },
  ];

  const metrics = isSequential ? allMetrics.filter(m => m.isSequentialOnly) : allMetrics;

  const sentimentClass = (s: MetricCard['sentiment']) => {
    if (s === 'good') return 'text-emerald-500';
    if (s === 'bad') return 'text-rose-500';
    return 'text-foreground';
  };

  const sentimentBg = (s: MetricCard['sentiment']) => {
    if (s === 'good') return 'bg-emerald-400/10';
    if (s === 'bad') return 'bg-rose-400/10';
    return 'bg-muted/30';
  };

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{t('monteCarlo.statistics')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'rounded-xl p-4 border border-border/40 transition-all hover:shadow-md hover:border-border cursor-help',
                        'flex flex-col gap-2 bg-card/50 backdrop-blur-sm'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
                          {m.label}
                        </p>
                        <div className={cn('p-1.5 rounded-lg', sentimentBg(m.sentiment))}>
                          <Icon className={cn('h-3 w-3', sentimentClass(m.sentiment))} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className={cn('text-sm font-bold tabular-nums leading-snug', sentimentClass(m.sentiment))}>
                          {m.value}
                        </p>
                        <HelpCircle className="h-2 w-2 text-muted-foreground/40" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-[10px] leading-relaxed p-2" side="bottom">
                    {m.helpKey ? t(m.helpKey as any) : m.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {isSequential && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t('monteCarlo.statsUnavailable')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
