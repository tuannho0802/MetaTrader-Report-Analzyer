'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@/lib/i18n';
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Percent, 
  Target,
  Sigma,
  Minus,
  Skull
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MonteCarloGuide() {
  const { t } = useTranslation();

  const guideItems = [
    { 
      label: t('monteCarlo.meanProfit'), 
      explain: t('monteCarlo.guide.explainMeanProfit' as any),
      icon: TrendingUp,
      color: 'text-emerald-500'
    },
    { 
      label: t('monteCarlo.medianProfit'), 
      explain: t('monteCarlo.guide.explainMedianProfit' as any),
      icon: Activity,
      color: 'text-emerald-400'
    },
    { 
      label: t('monteCarlo.stdDev'), 
      explain: t('monteCarlo.guide.explainStdDev' as any),
      icon: Sigma,
      color: 'text-blue-500'
    },
    { 
      label: t('monteCarlo.worstProfit'), 
      explain: t('monteCarlo.guide.explainWorstProfit' as any),
      icon: TrendingDown,
      color: 'text-rose-500'
    },
    { 
      label: t('monteCarlo.bestProfit'), 
      explain: t('monteCarlo.guide.explainBestProfit' as any),
      icon: Target,
      color: 'text-emerald-500'
    },
    { 
      label: t('monteCarlo.confidence95'), 
      explain: t('monteCarlo.guide.explainConfidence95' as any),
      icon: ShieldCheck,
      color: 'text-amber-500'
    },
    { 
      label: t('monteCarlo.meanDrawdown'), 
      explain: t('monteCarlo.guide.explainMeanDrawdown' as any),
      icon: Minus,
      color: 'text-rose-400'
    },
    { 
      label: t('monteCarlo.worstDrawdown'), 
      explain: t('monteCarlo.guide.explainWorstDrawdown' as any),
      icon: AlertTriangle,
      color: 'text-rose-600'
    },
    { 
      label: t('monteCarlo.probProfit'), 
      explain: t('monteCarlo.guide.explainProbProfit' as any),
      icon: Percent,
      color: 'text-emerald-500'
    },
    { 
      label: t('monteCarlo.riskOfRuin'), 
      explain: t('monteCarlo.guide.explainRiskOfRuin' as any),
      icon: Skull,
      color: 'text-rose-700'
    },
  ];

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="h-5 w-5" />
          <CardTitle className="text-xl font-bold">{t('monteCarlo.guide.title' as any)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-xl border border-border/40 overflow-x-auto bg-card/30 backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[220px] font-black text-foreground uppercase text-[10px] tracking-widest">
                  {t('monteCarlo.guide.metric' as any)}
                </TableHead>
                <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">
                  {t('monteCarlo.guide.explanation' as any)}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guideItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <TableRow 
                    key={i} 
                    className={cn(
                      "hover:bg-muted/30 transition-colors border-border/20",
                      i % 2 === 1 && "bg-muted/10"
                    )}
                  >
                    <TableCell className="font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4 shrink-0", item.color)} />
                        <span className="text-foreground">{item.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground leading-relaxed py-4">
                      {item.explain}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
