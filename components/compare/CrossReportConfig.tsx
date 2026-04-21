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
import { AnalysisSession, ComparisonResult, Trade } from "@/lib/types"
import { compareCrossReport } from "@/lib/comparison"
import { Play } from "lucide-react"

interface CrossReportConfigProps {
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

export function CrossReportConfig({ sessions, onAnalyze }: CrossReportConfigProps) {
  const [sessionAId, setSessionAId] = useState(sessions[0]?.id || "")
  const [eaA, setEaA] = useState("")
  const [sessionBId, setSessionBId] = useState(sessions[1]?.id || sessions[0]?.id || "")
  const [eaB, setEaB] = useState("")

  const sessionA = useMemo(() => sessions.find((s) => s.id === sessionAId), [sessions, sessionAId])
  const sessionB = useMemo(() => sessions.find((s) => s.id === sessionBId), [sessions, sessionBId])

  const easA = useMemo(() => getUniqueEaIds(sessionA?.allTrades), [sessionA])
  const easB = useMemo(() => getUniqueEaIds(sessionB?.allTrades), [sessionB])

  const handleAnalyze = () => {
    if (!sessionA || !sessionB || !eaA || !eaB) return
    const result = compareCrossReport(
      { trades: sessionA.allTrades || [], eaId: eaA, name: sessionA.name },
      { trades: sessionB.allTrades || [], eaId: eaB, name: sessionB.name }
    )
    onAnalyze(result)
  }

  const canRun = !!sessionA && !!sessionB && !!eaA && !!eaB

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Report A */}
      <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-muted/20">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Report A</p>

        <div className="space-y-2">
          <Label className="text-xs">Select Report</Label>
          <Select
            value={sessionAId}
            onValueChange={(v) => {
              setSessionAId(v ?? "")
              setEaA("")
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select report A…">
                {sessionA?.name}
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

        {sessionA && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label className="text-xs">EA Identifier in A</Label>
            {easA.length > 0 ? (
              <Select value={eaA} onValueChange={(v) => setEaA(v ?? "")}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select EA…" />
                </SelectTrigger>
                <SelectContent>
                  {easA.map((ea) => (
                    <SelectItem key={ea} value={ea}>
                      {ea}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No EA IDs detected in this report.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Report B */}
      <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-muted/20">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Report B</p>

        <div className="space-y-2">
          <Label className="text-xs">Select Report</Label>
          <Select
            value={sessionBId}
            onValueChange={(v) => {
              setSessionBId(v ?? "")
              setEaB("")
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select report B…">
                {sessionB?.name}
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

        {sessionB && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label className="text-xs">EA Identifier in B</Label>
            {easB.length > 0 ? (
              <Select value={eaB} onValueChange={(v) => setEaB(v ?? "")}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select EA…" />
                </SelectTrigger>
                <SelectContent>
                  {easB.map((ea) => (
                    <SelectItem key={ea} value={ea}>
                      {ea}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No EA IDs detected in this report.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Run button spanning both columns */}
      <div className="md:col-span-2">
        <Button
          className="w-full gap-2 font-bold shadow-md shadow-primary/20"
          disabled={!canRun}
          onClick={handleAnalyze}
        >
          <Play size={14} />
          Run Cross-Report Comparison
        </Button>
        {sessions.length < 2 && (
          <p className="text-xs text-amber-500 text-center mt-2 italic">
            Upload at least 2 reports to use cross-report mode.
          </p>
        )}
      </div>
    </div>
  )
}
