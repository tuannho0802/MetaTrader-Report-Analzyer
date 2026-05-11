import React, { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trade, EquitySeries, AnalysisSession } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"
import { formatCurrency } from "@/lib/formatCurrency"
import { cn, generateDisplayName } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthlyReturnsTableProps {
  series: EquitySeries[];
  tradesByEa: Record<string, Trade[]>;
  currency: string;
  sessionsCount?: number;
  displayMode?: 'ea' | 'session' | 'detail';
  allSessions?: AnalysisSession[];
  pageSize?: number;
  hideZeroEA?: boolean;
}

const getCellClass = (val: number) => {
  if (val > 0) return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium";
  if (val < 0) return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-medium";
  return "text-muted-foreground";
};

const MonthlyReturnsDesktop = React.memo(({ 
  matrix, 
  months, 
  currency, 
  series, 
  allSessions 
}: { 
  matrix: any[], 
  months: string[], 
  currency: string,
  series: EquitySeries[],
  allSessions: AnalysisSession[]
}) => {
  const { t } = useTranslation();
  
  return (
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
            const s = series.find(ser => ser.id === row.compositeId);
            const rawName = s?.name || row.compositeId;
            
            let mainLabel = rawName;
            let subLabel = "";

            if (row.compositeId.includes('::')) {
              const [sessionId, eaId] = row.compositeId.split('::');
              const session = allSessions.find(sess => sess.id === sessionId);
              const fullName = generateDisplayName(session, eaId, allSessions);
              
              mainLabel = eaId === "Unknown" ? "Unknown EA" : (isNaN(Number(eaId)) ? eaId : `EA #${eaId}`);
              const match = fullName.match(/\((.*)\)$/);
              subLabel = match ? match[1] : "";
            }
            return (
              <TableRow key={row.compositeId} className="hover:bg-muted/30 transition-colors">
                <TableCell className="px-4 py-4 font-bold text-sm whitespace-nowrap sticky left-0 bg-background z-10 shadow-[1px_0_0_0_hsl(var(--border))]">
                  <div className="flex flex-col">
                    <span className="truncate max-w-[150px]">{mainLabel}</span>
                    {subLabel && (
                      <span className="text-[10px] text-muted-foreground font-normal mt-0.5 italic truncate max-w-[180px]">
                        ({subLabel})
                      </span>
                    )}
                  </div>
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
  );
});

const MonthlyReturnsMobile = React.memo(({ 
  matrix, 
  months, 
  currency, 
  series, 
  allSessions 
}: { 
  matrix: any[], 
  months: string[], 
  currency: string,
  series: EquitySeries[],
  allSessions: AnalysisSession[]
}) => {
  return (
    <div className="md:hidden flex flex-col space-y-4 p-4">
      {matrix.map((row) => {
        const s = series.find(ser => ser.id === row.compositeId);
        const rawName = s?.name || row.compositeId;
        
        let mainLabel = rawName;
        let subLabel = "";

        if (row.compositeId.includes('::')) {
          const [sessionId, eaId] = row.compositeId.split('::');
          const session = allSessions.find(sess => sess.id === sessionId);
          const fullName = generateDisplayName(session, eaId, allSessions);
          
          mainLabel = eaId === "Unknown" ? "Unknown EA" : (isNaN(Number(eaId)) ? eaId : `EA #${eaId}`);
          const match = fullName.match(/\((.*)\)$/);
          subLabel = match ? match[1] : "";
        }

        return (
          <div key={row.compositeId} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm truncate">{mainLabel}</span>
                {subLabel && <span className="text-[10px] text-muted-foreground italic truncate">({subLabel})</span>}
              </div>
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
        )
      })}
    </div>
  );
});

export function MonthlyReturnsTable({ 
  series, 
  tradesByEa, 
  currency, 
  sessionsCount = 0,
  displayMode = 'detail',
  allSessions = [],
  pageSize = 15,
  hideZeroEA = true
}: MonthlyReturnsTableProps) {
  const { t } = useTranslation()
  const [showAllEA, setShowAllEA] = useState(!hideZeroEA);
  const [currentPage, setCurrentPage] = useState(0);

  const { months, fullMatrix } = useMemo(() => {
    if (!tradesByEa || Object.keys(tradesByEa).length === 0) {
      return { months: [], fullMatrix: [] };
    }

    const monthSet = new Set<string>();

    Object.values(tradesByEa).forEach(eaTrades => {
      eaTrades.forEach(trade => {
        const parts = trade.closeTime.split(" ")[0].split(".");
        if (parts.length >= 2) {
          const yearMonth = `${parts[0]}-${parts[1]}`;
          monthSet.add(yearMonth);
        }
      });
    });

    const sortedMonths = Array.from(monthSet).sort();
    const resultMatrix: any[] = [];

    Object.entries(tradesByEa).forEach(([compositeId, eaTrades]) => {
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

    return { months: sortedMonths, fullMatrix: resultMatrix };
  }, [tradesByEa]);

  const filteredMatrix = useMemo(() => {
    if (showAllEA) return fullMatrix;
    return fullMatrix.filter(row => row.Total !== 0);
  }, [fullMatrix, showAllEA]);

  const paginatedMatrix = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredMatrix.slice(start, start + pageSize);
  }, [filteredMatrix, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredMatrix.length / pageSize);

  if (months.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-lg mt-6">
      <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-bold">{t('performance.monthlyReturns.title')}</CardTitle>
          <CardDescription>{t('performance.monthlyReturns.description')}</CardDescription>
        </div>
        
        {/* Only show toggle if there are actually EAs with zero trades to hide */}
        {fullMatrix.some(row => row.Total === 0) && (
          <div className="flex items-center space-x-2 bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
            <Switch 
              id="show-all-ea" 
              checked={showAllEA} 
              onCheckedChange={(checked) => {
                setShowAllEA(checked);
                setCurrentPage(0);
              }} 
            />
            <Label htmlFor="show-all-ea" className="text-xs font-medium cursor-pointer">
              {t('performance.monthlyReturns.showAllEA')}
            </Label>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        
        <MonthlyReturnsDesktop 
          matrix={paginatedMatrix} 
          months={months} 
          currency={currency} 
          series={series} 
          allSessions={allSessions} 
        />

        <MonthlyReturnsMobile 
          matrix={paginatedMatrix} 
          months={months} 
          currency={currency} 
          series={series} 
          allSessions={allSessions} 
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border/40 bg-muted/10">
            <div className="text-xs text-muted-foreground font-medium">
              {t('performance.monthlyReturns.pageInfo', { 
                current: currentPage + 1, 
                total: totalPages, 
                count: filteredMatrix.length 
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-8 px-2 text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('performance.monthlyReturns.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="h-8 px-2 text-xs"
              >
                {t('performance.monthlyReturns.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-muted-foreground italic border-t border-border/40 pt-3 px-4 pb-4 leading-relaxed">
          {t('performance.monthlyReturns.note')}
        </p>
      </CardContent>
    </Card>
  )
}
