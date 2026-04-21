"use client"

import React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ComparisonResult } from "@/lib/types"
import { ArrowLeft, BarChart3, Table as TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComparisonViewProps {
  results: ComparisonResult
  onBack: () => void
}

export function ComparisonView({ results, onBack }: ComparisonViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft size={16} />
          Back to Analysis
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
          <BarChart3 size={16} />
          {results.mode === 'same' ? 'Same Report Comparison' : 'Cross-Report Comparison'}
        </div>
      </div>

      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Comparative Equity Curve</CardTitle>
          <CardDescription>
            Cumulative profit comparison over time
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[450px] pt-6 pr-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
              <XAxis 
                dataKey="date" 
                hide={true} 
              />
              <YAxis 
                tick={{ fontSize: 11, fontWeight: 500 }} 
                tickFormatter={(val) => `$${val}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              {results.series.map((s) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey="equity"
                  data={s.data}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TableIcon size={20} className="text-primary" />
              Comparative Metrics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-3 text-xs font-bold uppercase">EA Identifier</TableHead>
                <TableHead className="px-6 py-3 text-xs font-bold uppercase text-right">Net Profit</TableHead>
                <TableHead className="px-6 py-3 text-xs font-bold uppercase text-right">Win Rate</TableHead>
                <TableHead className="px-6 py-3 text-xs font-bold uppercase text-right">Trades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.metrics.map((row) => (
                <TableRow key={row.name} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="px-6 py-4 font-bold text-sm">{row.name}</TableCell>
                  <TableCell className={cn(
                    "px-6 py-4 text-right font-bold font-mono",
                    row.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {row.totalProfit > 0 ? "+" : ""}{row.totalProfit.toFixed(2)} USD
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right font-medium">
                    {row.winRate}%
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-muted-foreground mr-4">
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
