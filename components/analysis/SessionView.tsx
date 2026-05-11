"use client";

import React, { useMemo } from "react";
import { KpiCards } from "@/components/analysis/KpiCards";
import ResultsTable from "@/components/ResultsTable";
import { MultiEaChart } from "@/components/analysis/MultiEaChart";
import { Activity } from "lucide-react";
import { AnalysisSession, ParseResult } from "@/lib/types";
import { convertTrade, convertCurrency } from "@/lib/exchangeRates";
import { useTranslation } from "@/lib/i18n";

interface SessionViewProps {
  session: AnalysisSession;
  autoConvertCurrency: boolean;
  exchangeRates: Record<string, number> | null;
  baseCurrency: string;
}

/**
 * Isolated component for a single session's KPIs and table.
 * All useMemo calls are at the top-level of THIS component,
 * which satisfies React's Rules of Hooks even when rendered inside a list.
 */
export function SessionView({
  session,
  autoConvertCurrency,
  exchangeRates,
  baseCurrency,
}: SessionViewProps) {
  const { t, language } = useTranslation();

  const shouldConvert =
    autoConvertCurrency &&
    !!exchangeRates &&
    session.currency !== baseCurrency;

  const convertedTrades = useMemo(() => {
    if (!shouldConvert) return session.currentResult?.trades || [];
    return (session.currentResult?.trades || []).map((trade) =>
      convertTrade(trade, session.currency, baseCurrency, exchangeRates!)
    );
  }, [session, shouldConvert, baseCurrency, exchangeRates]);

  const displayCurrency = autoConvertCurrency ? baseCurrency : session.currency;

  const initialBalance = useMemo(() => {
    let balance = session.initialBalance;
    if (balance === undefined || balance === null || balance === 0) {
      console.warn(`[BalanceOverview] Missing initialBalance for session ${session.id}`);
      balance = 0;
    }
    if (!shouldConvert) return balance;
    return convertCurrency(
      balance,
      session.currency,
      baseCurrency,
      exchangeRates!
    );
  }, [session, shouldConvert, baseCurrency, exchangeRates]);

  const finalBalance = useMemo(() => {
    if (!shouldConvert) return session.finalBalance || 0;
    return convertCurrency(
      session.finalBalance || 0,
      session.currency,
      baseCurrency,
      exchangeRates!
    );
  }, [session, shouldConvert, baseCurrency, exchangeRates]);

  const convertedResult = useMemo<ParseResult | null>(() => {
    if (!shouldConvert) return session.currentResult;
    if (!session.currentResult) return null;
    return {
      ...session.currentResult,
      trades: convertedTrades,
      currency: baseCurrency,
      totalProfit: convertedTrades.reduce((sum, t) => sum + t.profit, 0),
    };
  }, [session, shouldConvert, convertedTrades, baseCurrency]);

  if (!session.currentResult || session.currentResult.trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card border-dashed">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <Activity className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {t("common.noResults")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {language === "vi"
            ? "Vui lòng điều chỉnh lại khoảng thời gian hoặc điều kiện lọc để xem kết quả."
            : "Please adjust your date range or filter criteria to see results."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 1. Statistics Cards */}
      <section>
        <KpiCards
          trades={convertedTrades}
          currency={displayCurrency}
          initialBalance={initialBalance}
          finalBalance={finalBalance}
        />
      </section>

      {/* 2. Comparative Analysis Chart */}
      <section>
        <MultiEaChart />
      </section>

      {/* 3. Detailed Data Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {t("analysis.transactionDetails")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("analysis.breakdown")}{" "}
              <span className="text-primary font-medium">{session.name}</span>
            </p>
          </div>
        </div>
        <ResultsTable result={convertedResult} />
      </section>
    </>
  );
}
