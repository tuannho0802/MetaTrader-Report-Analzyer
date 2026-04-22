"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComparisonResult } from "@/lib/types"
import { ComparisonChart } from "./ComparisonChart"
import { Table as TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface ComparisonResultsProps {
  data: ComparisonResult
}

export function ComparisonResults({ data }: ComparisonResultsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ComparisonChart series={data.series} height={380} />

      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TableIcon size={18} className="text-primary" />
            {t('comparison.metrics')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-3 text-xs font-bold uppercase">
                  {t('comparison.eaIdentifier')}
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-bold uppercase text-right">
                  {t('analysis.netProfit')}
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-bold uppercase text-right">
                  {t('analysis.winRate')}
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-bold uppercase text-right">
                  {t('analysis.totalTrades')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.metrics.map((row) => (
                <TableRow key={row.name} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="px-6 py-4 font-bold text-sm">{row.name}</TableCell>
                  <TableCell
                    className={cn(
                      "px-6 py-4 text-right font-bold font-mono",
                      row.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {row.totalProfit > 0 ? "+" : ""}
                    {row.totalProfit.toFixed(2)} USD
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right font-medium">
                    {row.winRate}%
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-muted-foreground">
                    {row.tradeCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
