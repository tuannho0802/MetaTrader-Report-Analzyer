"use client";

import React, { useState } from "react";
import { ParseResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, BarChart3, Copy, Check, History, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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
import { formatCurrency } from "@/lib/formatCurrency";
import { useTableState, SortableColumn } from "@/hooks/useTableState";
import { TableToolbar } from "./TableToolbar";
import { SmartPagination } from "./SmartPagination";

interface ResultsTableProps {
  result: ParseResult | null;
}

export default function ResultsTable({ result }: ResultsTableProps) {
  const { t, language } = useTranslation();
  const [copied, setCopied] = useState(false);

  const {
    paginatedTrades,
    totalTrades,
    totalPages,
    sortColumn,
    sortDirection,
    handleSort,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = useTableState(result?.trades || []);

  if (!result) return null;

  const exportCSV = () => {
    if (result.trades.length === 0) return;
    
    const headers = ["Ticket", "EA ID", "Open Time", "Type", "Size", "Symbol", "Close Time", "Profit", "Comment", "Match %"];
    const csvContent = [
      headers.join(","),
      ...result.trades.map(t => 
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

  const copyToClipboard = () => {
    if (result.trades.length === 0) return;
    
    const headers = ["Ticket", "EA ID", "Open Time", "Type", "Size", "Symbol", "Close Time", "Profit", "Comment", "Match %"];
    const rows = result.trades.map(t => 
      [t.ticket, t.eaId || '', t.openTime, t.type, t.size, t.item, t.closeTime, t.profit.toFixed(2), t.comment, `${t.similarity.toFixed(1)}%`].join("\t")
    );
    
    const text = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-30 ml-1 inline" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1 inline" />;
    }
    return <ArrowDown className="h-3 w-3 ml-1 inline" />;
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
          <div className="p-2 bg-primary/10 text-primary rounded-lg hidden sm:block">
            <History size={18} />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyToClipboard} 
            disabled={result.trades.length === 0} 
            className="gap-2 rounded-lg font-semibold text-xs h-8"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? t('common.copied') : t('common.copy')}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        
        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onExport={exportCSV}
          totalResults={totalTrades}
          totalTrades={result.trades.length}
        />

        {/* Warning for missing EA IDs */}
        {useAnalysisStore.getState().sessions.find(s => s.id === useAnalysisStore.getState().activeSessionId)?.filter.filterMode === 'id' && 
         useAnalysisStore.getState().sessions.find(s => s.id === useAnalysisStore.getState().activeSessionId)?.filter.commentPattern &&
         result.trades.length === 0 && 
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
                  <TableHead className="w-[100px] h-10 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('ticket')}>
                    <div className="flex items-center whitespace-nowrap">TICKET {getSortIcon('ticket')}</div>
                  </TableHead>
                  <TableHead className="w-[80px] h-10 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('eaId')}>
                    <div className="flex items-center whitespace-nowrap">EA ID {getSortIcon('eaId')}</div>
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('openTime')}>
                    <div className="flex items-center whitespace-nowrap">{t('filter.startDate').toUpperCase()} {getSortIcon('openTime')}</div>
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('type')}>
                    <div className="flex items-center whitespace-nowrap">TYPE {getSortIcon('type')}</div>
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('size')}>
                    <div className="flex items-center justify-center whitespace-nowrap">SIZE {getSortIcon('size')}</div>
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('item')}>
                    <div className="flex items-center whitespace-nowrap">SYMBOL {getSortIcon('item')}</div>
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('closeTime')}>
                    <div className="flex items-center whitespace-nowrap">{t('filter.endDate').toUpperCase()} {getSortIcon('closeTime')}</div>
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('profit')}>
                    <div className="flex items-center justify-end whitespace-nowrap">{t('analysis.netProfit').toUpperCase()} {getSortIcon('profit')}</div>
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('comment')}>
                    <div className="flex items-center whitespace-nowrap">COMMENT {getSortIcon('comment')}</div>
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('similarity')}>
                    <div className="flex items-center justify-end whitespace-nowrap">MATCH {getSortIcon('similarity')}</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrades.length > 0 ? (
                  paginatedTrades.map((t) => (
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
                        {formatCurrency(t.profit, result.currency)}
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
                        <p>{searchQuery || dateFilter ? 'Không tìm thấy kết quả phù hợp' : t('filter.noPresets')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <SmartPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalTrades}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </CardContent>
    </Card>
  );
}
