"use client";

import React, { useState } from "react";
import { ParseResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronLeft, ChevronRight, Hash, BarChart3, Copy, Check, History } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";

interface ResultsTableProps {
  result: ParseResult | null;
}

export default function ResultsTable({ result }: ResultsTableProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;
  const { t, language } = useTranslation();

  if (!result) return null;

  const { trades } = result;
  
  const totalPages = Math.ceil(trades.length / itemsPerPage);
  const currentTrades = trades.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const exportCSV = () => {
    if (trades.length === 0) return;
    
    // CSV headers also translated or kept standard? Let's keep keys standard for data processing compatibility
    const headers = ["Ticket", "EA ID", "Open Time", "Type", "Size", "Symbol", "Close Time", "Profit", "Comment", "Match %"];
    const csvContent = [
      headers.join(","),
      ...trades.map(t => 
        `"${t.ticket}","${t.eaId || ''}","${t.openTime}","${t.type}","${t.size}","${t.item}","${t.closeTime}","${t.profit.toFixed(2)}","${t.comment}","${t.similarity.toFixed(1)}%"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `mt4_profit_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    if (trades.length === 0) return;
    
    const headers = ["Ticket", "EA ID", "Open Time", "Type", "Size", "Symbol", "Close Time", "Profit", "Comment", "Match %"];
    const rows = trades.map(t => 
      [t.ticket, t.eaId || '', t.openTime, t.type, t.size, t.item, t.closeTime, t.profit.toFixed(2), t.comment, `${t.similarity.toFixed(1)}%`].join("\t")
    );
    
    const text = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            {t('analysis.transactionDetails')}
          </CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <History size={18} />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyToClipboard} 
            disabled={trades.length === 0} 
            className="gap-2 rounded-lg font-semibold text-xs h-8"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? t('common.copied') : t('common.copy')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportCSV} 
            disabled={trades.length === 0} 
            className="gap-2 rounded-lg font-semibold text-xs h-8"
          >
            <Download className="w-3 h-3" /> CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {/* Warning for missing EA IDs */}
        {useAnalysisStore.getState().sessions.find(s => s.id === useAnalysisStore.getState().activeSessionId)?.filter.filterMode === 'id' && 
         useAnalysisStore.getState().sessions.find(s => s.id === useAnalysisStore.getState().activeSessionId)?.filter.commentPattern &&
         trades.length === 0 && 
         useAnalysisStore.getState().allTrades.every(t => !t.eaId) && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-amber-600 dark:text-amber-400 text-xs font-medium animate-in fade-in slide-in-from-top-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {t('filter.errors.noEaIds')}
          </div>
        )}
        <div className="rounded-xl border bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b">
                <TableRow>
                  <TableHead className="w-[100px] h-10 px-4 text-xs font-bold uppercase tracking-wider">TICKET</TableHead>
                  <TableHead className="w-[80px] h-10 px-4 text-xs font-bold uppercase tracking-wider">EA ID</TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider">{t('filter.startDate').toUpperCase()}</TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider">TYPE</TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-center">SIZE</TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider">SYMBOL</TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider">{t('filter.endDate').toUpperCase()}</TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-right">{t('analysis.netProfit').toUpperCase()}</TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider">COMMENT</TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-right">MATCH</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTrades.length > 0 ? (
                  currentTrades.map((t) => (
                    <TableRow key={t.ticket} className="hover:bg-muted/40 transition-colors even:bg-muted/15 border-b last:border-0">
                      <TableCell className="font-mono text-[10px] px-4 py-2.5 text-muted-foreground">{t.ticket}</TableCell>
                      <TableCell className="font-mono text-[10px] px-4 py-2.5 text-primary font-bold">{t.eaId || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs px-4 py-2.5">
                        {t.openTime}
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "px-1.5 py-0 text-[10px] uppercase font-bold border-none",
                            t.type.toLowerCase().includes("buy") 
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {t.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-center text-xs px-4 py-2.5">{t.size}</TableCell>
                      <TableCell className="font-bold uppercase tracking-wider text-sm px-4 py-2.5">{t.item}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground px-4 py-2.5">
                        {t.closeTime}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold text-sm px-4 py-2.5 tabular-nums",
                        t.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {t.profit > 0 ? "+" : ""}{t.profit.toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate italic text-muted-foreground text-xs px-4 py-2.5" title={t.comment}>
                        {t.comment || "-"}
                      </TableCell>
                      <TableCell className="text-right px-4 py-2.5">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                          {t.similarity.toFixed(0)}%
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-20 text-muted-foreground h-40">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <BarChart3 className="size-8 opacity-20" />
                        <p>{t('filter.noPresets')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <span className="text-xs text-muted-foreground">
              {t('common.showing')} <span className="font-medium text-foreground">{(page - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-foreground">{Math.min(page * itemsPerPage, trades.length)}</span> {t('common.of')} <span className="font-medium text-foreground">{trades.length}</span> {t('common.results')}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <div className="flex items-center text-xs font-medium px-2">
                {t('common.page')} {page} {t('common.of')} {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
