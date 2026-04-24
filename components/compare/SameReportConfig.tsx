"use client"

import React, { useState, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AnalysisSession, ComparisonResult, Trade } from "@/lib/types"
import { compareSameReport } from "@/lib/comparison"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { isCommentMatch, parseMT4Date } from "@/lib/parser"
import { Play, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface SameReportConfigProps {
  sessions: AnalysisSession[]
  onAnalyze: (result: ComparisonResult) => void
}

function getUniqueEaIds(trades: Trade[] = []): string[] {
  const ids = new Set<string>()
  trades.forEach((t) => {
    if (t.eaId) ids.add(t.eaId)
  })
  return Array.from(ids).sort()
}

export function SameReportConfig({ sessions, onAnalyze }: SameReportConfigProps) {
  const { activeSessionId } = useAnalysisStore()
  const [selectedSessionId, setSelectedSessionId] = useState(activeSessionId || sessions[0]?.id || "")
  const [patterns, setPatterns] = useState("")
  const { t } = useTranslation()

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId]
  )
  const uniqueEas = useMemo(() => getUniqueEaIds(selectedSession?.allTrades), [selectedSession])

  const handleBadgeClick = (ea: string) => {
    const current = patterns
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
    if (!current.includes(ea)) {
      setPatterns(current.length === 0 ? ea : `${patterns.trimEnd()}, ${ea}`)
    }
  }

  const handleAnalyze = () => {
    if (!selectedSession || !patterns.trim()) return

    const patternList = patterns
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)

    const filter = selectedSession.filter
    const st = new Date(filter.startDate)
    st.setHours(0, 0, 0, 0)
    const en = new Date(filter.endDate)
    en.setHours(23, 59, 59, 999)

    // Filter trades by date first, then pass to compareSameReport
    const dateFilteredTrades = (selectedSession.allTrades || []).filter((t) => {
      const tDate = parseMT4Date(t.closeTime) || parseMT4Date(t.openTime)
      return !tDate || (tDate >= st && tDate <= en)
    })

    // Use the same matching strategy as processMultiEa
    const matchedTrades: Trade[][] = patternList.map((pattern) => {
      return dateFilteredTrades.filter((t) => {
        const mode = filter.filterMode || "comment"
        if (mode === "id") {
          return (t.eaId || "").toLowerCase().includes(pattern.toLowerCase())
        } else if (mode === "comment") {
          return isCommentMatch(pattern, t.comment || "", filter.threshold)
        } else {
          return (
            (t.eaId || "").toLowerCase().includes(pattern.toLowerCase()) &&
            isCommentMatch(pattern, t.comment || "", filter.threshold)
          )
        }
      })
    })

    const result = compareSameReport(selectedSession.allTrades || [], patternList, selectedSession.currency || 'USD')
    onAnalyze(result)
  }

  const patternList = patterns
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  const canRun = !!selectedSession && patternList.length >= 1

  return (
    <div className="space-y-5">
      {/* Session Picker */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
          {t('comparison.report')}
        </Label>
        <Select value={selectedSessionId} onValueChange={(v) => setSelectedSessionId(v ?? "")}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('comparison.selectReport')}>
              {sessions.find((s) => s.id === selectedSessionId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auto-discovered EA Badges */}
      {uniqueEas.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            {t('comparison.detectedEas')}
          </Label>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
            {uniqueEas.map((ea) => {
              const active = patternList.includes(ea)
              return (
                <Badge
                  key={ea}
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer py-0.5 px-2.5 text-xs hover:bg-primary/10 transition-colors"
                  onClick={() => handleBadgeClick(ea)}
                >
                  {ea}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Pattern Textarea */}
      <div className="space-y-2">
        <Label htmlFor="comp-patterns" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
          {t('comparison.patterns')}
        </Label>
        <Textarea
          id="comp-patterns"
          placeholder={t('filter.patternPlaceholder')}
          className="min-h-[72px] resize-none text-xs bg-muted/40 border-border/50 focus:bg-background transition-colors"
          value={patterns}
          onChange={(e) => setPatterns(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground italic">
          {t('comparison.modeHint')} ({selectedSession?.filter.filterMode || "comment"}) {t('common.of').toLowerCase()} {t('filter.mode').toLowerCase()}. {t('comparison.thresholdHint')}: {selectedSession?.filter.threshold ?? 80}%.
        </p>
      </div>

      <Button
        className="w-full gap-2 font-bold shadow-md shadow-primary/20"
        disabled={!canRun}
        onClick={handleAnalyze}
      >
        <Play size={14} />
        {t('comparison.compare')} {patternList.length > 0 ? `(${patternList.length} EAs)` : ""}
      </Button>
    </div>
  )
}
