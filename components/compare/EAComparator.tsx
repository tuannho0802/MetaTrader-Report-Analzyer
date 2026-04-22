"use client"

import React, { useState } from "react"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { ComparisonResult } from "@/lib/types"
import { SameReportConfig } from "./SameReportConfig"
import { CrossReportConfig } from "./CrossReportConfig"
import { ComparisonResults } from "./ComparisonResults"
import { Button } from "@/components/ui/button"
import { FileSearch, GitCompareArrows, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

type Mode = "same" | "cross"

export function EAComparator() {
  const { sessions } = useAnalysisStore()
  const [mode, setMode] = useState<Mode>("same")
  const [results, setResults] = useState<ComparisonResult | null>(null)
  const { t } = useTranslation()

  // Reset results when mode changes
  const handleModeChange = (m: Mode) => {
    setMode(m)
    setResults(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">{t('comparison.title')}</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
          <GitCompareArrows size={14} />
          {t('comparison.title')}
        </div>
      </div>

      {/* Mode Segmented Control */}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          {t('comparison.mode')}
        </p>
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border/50 w-fit">
          <button
            onClick={() => handleModeChange("same")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              mode === "same"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers size={14} />
            {t('comparison.withinReport')}
          </button>
          <button
            onClick={() => handleModeChange("cross")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              mode === "cross"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GitCompareArrows size={14} />
            {t('comparison.acrossReports')}
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-5 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-xl">
              <FileSearch size={48} strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-bold">{t('comparison.noReports')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('comparison.uploadPrompt')}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Configuration Panel */}
          <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm">
            {mode === "same" ? (
              <SameReportConfig
                sessions={sessions}
                onAnalyze={(r) => setResults(r)}
              />
            ) : (
              <CrossReportConfig
                sessions={sessions}
                onAnalyze={(r) => setResults(r)}
              />
            )}
          </div>

          {/* Results */}
          {results ? (
            <ComparisonResults data={results} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[28vh] text-center space-y-3 text-muted-foreground animate-in fade-in duration-300">
              <GitCompareArrows size={40} strokeWidth={1} className="opacity-30" />
              <p className="text-sm font-medium">
                {mode === "same"
                  ? t('comparison.enterPatterns')
                  : t('comparison.selectReports')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
