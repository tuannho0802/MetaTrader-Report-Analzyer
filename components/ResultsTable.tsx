"use client";

import React, { useState } from "react";
import { ParseResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
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

  const { trades, totalProfit, totalFound } = result;
  
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
    link.setAttribute("download", "mt4_profit_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-medium">Tổng Profit Khớp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalProfit > 0 ? "+" : ""}{totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-medium">Số Lệnh Khớp / Tổng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {trades.length} <span className="text-lg text-slate-400 font-normal">/ {totalFound}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách giao dịch khớp</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={trades.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Xuất CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Open Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Close Time</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="text-right">Match%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTrades.length > 0 ? (
                  currentTrades.map((t) => (
                    <TableRow key={t.ticket}>
                      <TableCell className="font-medium">{t.ticket}</TableCell>
                      <TableCell className="whitespace-nowrap">{t.openTime}</TableCell>
                      <TableCell>
                        <Badge variant={t.type.toLowerCase().includes("buy") ? "default" : "destructive"}>
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.size}</TableCell>
                      <TableCell>{t.item}</TableCell>
                      <TableCell className="whitespace-nowrap">{t.closeTime}</TableCell>
                      <TableCell className={`text-right font-medium ${t.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {t.profit > 0 ? "+" : ""}{t.profit.toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={t.comment}>
                        {t.comment || "-"}
                      </TableCell>
                      <TableCell className="text-right text-slate-500">
                        {t.similarity.toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-slate-500">
                      Không tìm thấy giao dịch nào khớp với điều kiện lọc.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-slate-500">
                Hiển thị {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, trades.length)} trong số {trades.length}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
