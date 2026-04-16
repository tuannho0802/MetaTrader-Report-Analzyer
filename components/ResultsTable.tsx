"use client";

import React, { useState } from "react";
import { ParseResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResultsTableProps {
  result: ParseResult | null;
}

export default function ResultsTable({ result }: ResultsTableProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  if (!result) return null;

  const { trades } = result;
  
  const totalPages = Math.ceil(trades.length / itemsPerPage);
  const currentTrades = trades.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const exportCSV = () => {
    if (trades.length === 0) return;
    
    const headers = ["Ticket", "Open Time", "Type", "Size", "Symbol", "Close Time", "Profit", "Comment", "Match %"];
    const csvContent = [
      headers.join(","),
      ...trades.map(t => 
        `"${t.ticket}","${t.openTime}","${t.type}","${t.size}","${t.item}","${t.closeTime}","${t.profit.toFixed(2)}","${t.comment}","${t.similarity.toFixed(1)}%"`
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

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Matched Operations
          </CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={trades.length === 0} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Ticket</TableHead>
                <TableHead>Open Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Close Time</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead className="text-right">Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTrades.length > 0 ? (
                currentTrades.map((t) => (
                  <TableRow key={t.ticket} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">{t.ticket}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {t.openTime}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={t.type.toLowerCase().includes("buy") 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none" 
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none"
                        }
                      >
                        {t.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{t.size}</TableCell>
                    <TableCell className="font-bold uppercase tracking-wider text-xs">{t.item}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {t.closeTime}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${t.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {t.profit > 0 ? "+" : ""}{t.profit.toFixed(2)}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate italic text-muted-foreground text-xs" title={t.comment}>
                      {t.comment || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                        {t.similarity.toFixed(0)}%
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground h-40">
                    No transactions matched your filtering criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(page - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-foreground">{Math.min(page * itemsPerPage, trades.length)}</span> of <span className="font-medium text-foreground">{trades.length}</span> results
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
                Page {page} of {totalPages}
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
