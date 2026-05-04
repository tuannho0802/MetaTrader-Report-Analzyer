'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatCurrency';
import { useTranslation } from '@/lib/i18n';
import { Info } from 'lucide-react';

interface Props {
  data: number[];
  title: string;
  description?: string;
  /** 'profit' → green cells, 'drawdown' → red cells */
  variant?: 'profit' | 'drawdown';
  currency: string;
}

interface BinEntry {
  label: string;
  count: number;
  rangeStart: number;
  rangeEnd: number;
}

// Sturges' rule: k = ceil(1 + 3.322 * log10(n))
function buildBins(data: number[], numBins: number, currency: string): BinEntry[] {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const binWidth = range / numBins;

  const bins: BinEntry[] = Array.from({ length: numBins }, (_, i) => ({
    label: '',
    count: 0,
    rangeStart: min + i * binWidth,
    rangeEnd: min + (i + 1) * binWidth,
  }));

  data.forEach((value) => {
    const idx = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
    bins[idx].count++;
  });

  // Build compact labels
  bins.forEach((bin) => {
    bin.label = formatCurrency(bin.rangeStart, currency)
      .replace(/[^0-9\-.,kKmM$€£]/g, '')
      .slice(0, 9);
  });

  return bins;
}

const CustomTooltip = ({ active, payload, total, t, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as BinEntry;
    const count = data.count;
    const percent = ((count / total) * 100).toFixed(1);

    return (
      <div className="bg-card border border-border p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wider">
          {t('monteCarlo.tooltipRange')}
        </p>
        <p className="text-xs font-bold mb-2">
          {formatCurrency(data.rangeStart, currency)} – {formatCurrency(data.rangeEnd, currency)}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-muted-foreground">{t('monteCarlo.tooltipFrequency')}</span>
            <span className="text-xs font-mono font-bold">{count}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-muted-foreground">{t('monteCarlo.tooltipPercent')}</span>
            <span className="text-xs font-mono font-bold text-primary">{percent}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function DistributionChart({ data, title, description, variant = 'profit', currency }: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const axisTickColor = isDark ? '#cbd5e1' : '#475569';

  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    const numBins = Math.max(8, Math.ceil(1 + 3.322 * Math.log10(data.length)));
    return buildBins(data, numBins, currency);
  }, [data, currency]);

  const getBarColor = (entry: BinEntry) => {
    if (variant === 'drawdown') return '#f43f5e';
    return entry.rangeStart >= 0 ? '#10b981' : '#f43f5e';
  };

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col">
        <div className="bg-card rounded-xl p-4 border border-border/20 flex-1">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
              barCategoryGap="10%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="label"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: axisTickColor }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: axisTickColor }}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip total={data.length} t={t} currency={currency} />}
                cursor={{ fill: 'hsl(var(--primary))', opacity: 0.05 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={getBarColor(entry)} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-start gap-2 p-3 bg-muted/20 rounded-lg border border-border/10">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            {variant === 'profit' ? t('monteCarlo.chartNoteProfit') : t('monteCarlo.chartNoteDrawdown')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
