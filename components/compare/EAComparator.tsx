"use client"

import React, { useState } from "react"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { ComparisonResult } from "@/lib/types"
import { SameReportConfig } from "./SameReportConfig"
import { CrossReportConfig } from "./CrossReportConfig"
import { ComparisonResults } from "./ComparisonResults"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileSearch, GitCompareArrows, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

type Mode = "same" | "cross"

export function EAComparator() {
  const { sessions, setView } = useAnalysisStore()
  const [mode, setMode] = useState<Mode>("same")
  const [results, setResults] = useState<ComparisonResult | null>(null)

  // Reset results when mode changes
  const handleModeChange = (m: Mode) => {
    setMode(m)
    setResults(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView("dashboard")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
          <GitCompareArrows size={14} />
          EA Comparator
        </div>
      </div>

      {/* Mode Segmented Control */}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Comparison Mode
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
            Within Report
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
            Across Reports
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
            <h3 className="text-xl font-bold">No Reports Uploaded</h3>
            <p className="text-muted-foreground text-sm">
              Upload at least one MT4 report to start comparing EAs.
            </p>
          </div>
          <Button variant="outline" onClick={() => setView("dashboard")} className="gap-2">
            <ArrowLeft size={14} />
            Go to Dashboard
          </Button>
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
                  ? "Enter EA patterns above and click Compare to see results."
                  : "Select two reports and their EAs, then click Run Comparison."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
