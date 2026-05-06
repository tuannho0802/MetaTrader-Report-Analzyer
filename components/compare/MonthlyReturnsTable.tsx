"use client"

import React, { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trade } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"
import { formatCurrency } from "@/lib/formatCurrency"
import { cn } from "@/lib/utils"

interface MonthlyReturnsTableProps {
  tradesByEa: Record<string, Trade[]>;
  currency: string;
}

export function MonthlyReturnsTable({ tradesByEa, currency }: MonthlyReturnsTableProps) {
  const { t } = useTranslation()

  const { months, matrix, totals } = useMemo(() => {
    if (!tradesByEa || Object.keys(tradesByEa).length === 0) {
      return { months: [], matrix: [], totals: {} };
    }

    const monthSet = new Set<string>();

    // First pass: collect all months across all EAs
    Object.values(tradesByEa).forEach(eaTrades => {
      eaTrades.forEach(trade => {
        // Date format might be "2026.04.13 09:21:00" or similar
        // Convert "2026.04.13" to "2026-04"
        const parts = trade.closeTime.split(" ")[0].split(".");
        if (parts.length >= 2) {
          const yearMonth = `${parts[0]}-${parts[1]}`;
          monthSet.add(yearMonth);
        }
      });
    });

    const sortedMonths = Array.from(monthSet).sort();

    const resultMatrix: any[] = [];
    const totals: Record<string, number> = {};

    Object.entries(tradesByEa).forEach(([compositeId, eaTrades]) => {
      const [sessionId, eaId] = compositeId.split('::');
      // For display, we can just use the eaId or a descriptive name if available
      // but the key for row mapping must be the compositeId
      const eaData: Record<string, any> = { compositeId };
      let eaTotal = 0;

      sortedMonths.forEach(m => {
        eaData[m] = 0;
      });

      eaTrades.forEach(trade => {
        const parts = trade.closeTime.split(" ")[0].split(".");
        if (parts.length >= 2) {
          const yearMonth = `${parts[0]}-${parts[1]}`;
          eaData[yearMonth] += trade.profit;
          eaTotal += trade.profit;
        }
      });

      eaData['Total'] = eaTotal;
      resultMatrix.push(eaData);
    });

    return { months: sortedMonths, matrix: resultMatrix, totals };
  }, [tradesByEa]);

  if (months.length === 0) return null;

  const getCellClass = (val: number) => {
    if (val > 0) return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium";
    if (val < 0) return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-medium";
    return "text-muted-foreground";
  };

  return (
    <Card className="border-border/50 shadow-lg mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold">{t('comparison.monthlyReturns')}</CardTitle>
        <CardDescription>{t('comparison.monthlyReturnsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        
        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase whitespace-nowrap sticky left-0 bg-muted/50 z-10 w-[200px] shadow-[1px_0_0_0_hsl(var(--border))]">
                  {t('comparison.eaIdentifier')}
                </TableHead>
                {months.map(m => (
                  <TableHead key={m} className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap min-w-[120px]">
                    {m}
                  </TableHead>
                ))}
                <TableHead className="px-4 py-3 text-xs font-bold uppercase text-right whitespace-nowrap min-w-[120px] bg-muted/20">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.map((row) => {
                const displayName = row.compositeId.includes('::') 
                  ? row.compositeId.split('::')[1] 
                  : row.compositeId;
                
                return (
                  <TableRow key={row.compositeId} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-4 py-4 font-bold text-sm whitespace-nowrap sticky left-0 bg-background z-10 shadow-[1px_0_0_0_hsl(var(--border))]">
                      {displayName}
                    </TableCell>
                  {months.map(m => (
                    <TableCell key={m} className={cn("px-4 py-4 text-right font-mono whitespace-nowrap", getCellClass(row[m]))}>
                      {row[m] > 0 ? "+" : ""}{formatCurrency(row[m], currency)}
                    </TableCell>
                  ))}
                  <TableCell className={cn("px-4 py-4 text-right font-mono font-bold whitespace-nowrap bg-muted/10", getCellClass(row.Total))}>
                    {row.Total > 0 ? "+" : ""}{formatCurrency(row.Total, currency)}
                  </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: List */}
        <div className="md:hidden flex flex-col space-y-4 p-4">
          {matrix.map((row) => {
            const displayName = row.compositeId.includes('::') 
              ? row.compositeId.split('::')[1] 
              : row.compositeId;

            return (
              <div key={row.compositeId} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="font-bold text-sm">{displayName}</span>
                <span className={cn("font-bold font-mono text-sm", getCellClass(row.Total))}>
                  {row.Total > 0 ? "+" : ""}{formatCurrency(row.Total, currency)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {months.map(m => (
                  <div key={m} className="flex flex-col justify-between p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground font-semibold mb-1">{m}</span>
                    <span className={cn("text-xs font-mono", getCellClass(row[m]))}>
                      {row[m] > 0 ? "+" : ""}{formatCurrency(row[m], currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )})}
        </div>

        <p className="mt-4 text-xs text-muted-foreground italic border-t border-border/40 pt-2 px-4 pb-4">
          {t('comparison.monthlyReturnsNote')}
        </p>
      </CardContent>
    </Card>
  )
}
