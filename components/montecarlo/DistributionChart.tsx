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
}

// Sturges' rule: k = ceil(1 + 3.322 * log10(n))
function buildBins(data: number[], numBins: number): BinEntry[] {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const binWidth = range / numBins;

  const bins: BinEntry[] = Array.from({ length: numBins }, (_, i) => ({
    label: '',
    count: 0,
    rangeStart: min + i * binWidth,
  }));

  data.forEach((value) => {
    const idx = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
    bins[idx].count++;
  });

  // Build compact labels (show start of range only)
  bins.forEach((bin) => {
    bin.label = formatCurrency(bin.rangeStart, 'USD')
      .replace(/[^0-9\-.,kKmM$€£]/g, '')
      .slice(0, 9);
  });

  return bins;
}

export function DistributionChart({ data, title, description, variant = 'profit', currency }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const tooltipLabelColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipItemColor = isDark ? '#f1f5f9' : '#0f172a';
  const axisTickColor = isDark ? '#cbd5e1' : '#475569';

  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    const numBins = Math.max(5, Math.ceil(1 + 3.322 * Math.log10(data.length)));
    return buildBins(data, numBins);
  }, [data]);

  // Decide fill colors per bar
  const getBarColor = (entry: BinEntry) => {
    if (variant === 'drawdown') return '#f43f5e'; // rose-500
    return entry.rangeStart >= 0 ? '#10b981' : '#f43f5e'; // emerald / rose
  };

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="bg-card rounded-lg p-4 border border-border/20">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
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
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px',
                }}
                itemStyle={{ fontSize: '12px', fontWeight: '600', color: tooltipItemColor }}
                labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: tooltipLabelColor }}
                cursor={false}
                formatter={(value: any) => [value, '']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={getBarColor(entry)} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
