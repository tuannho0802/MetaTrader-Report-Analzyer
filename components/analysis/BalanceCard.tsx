"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatCurrency"
import { Wallet, TrendingUp, ArrowRight } from "lucide-react"

interface BalanceCardProps {
  initialBalance: number;
  netProfit: number;
  currency: string;
}

export function BalanceCard({ initialBalance, netProfit, currency }: BalanceCardProps) {
  const finalBalance = initialBalance + netProfit;
  
  return (
    <Card className="mb-4 border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-2 p-4 bg-muted/20">
        <Wallet className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg font-bold tracking-tight">Balance Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Initial Balance */}
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Initial Balance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight break-all leading-tight">
                {formatCurrency(initialBalance, currency)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
              Starting account balance from report
            </p>
          </div>
          
          {/* Final Balance */}
          <div className="flex flex-col relative">
            {/* Connection Arrow for Desktop */}
            <div className="hidden md:block absolute -left-8 top-1/2 -translate-y-1/2">
              <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
            </div>
            
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              Final Balance
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                Current
              </span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary break-all leading-tight">
                {formatCurrency(finalBalance, currency)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
              Initial Balance + Net Profit ({formatCurrency(netProfit, currency)})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
