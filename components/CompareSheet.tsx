"use client"

import React, { useState, useMemo } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { compareSameReport, compareCrossReport } from "@/lib/comparison"
import { Badge } from "@/components/ui/badge"


interface CompareSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompareSheet({ open, onOpenChange }: CompareSheetProps) {
  const { sessions, setComparisonResults } = useAnalysisStore()
  
  // State for Same Report
  const [sameSessionId, setSameSessionId] = useState<string>("")
  const [selectedEas, setSelectedEas] = useState<string[]>([])
  
  // State for Cross Report
  const [sessionA, setSessionA] = useState<string>("")
  const [eaA, setEaA] = useState<string>("")
  const [sessionB, setSessionB] = useState<string>("")
  const [eaB, setEaB] = useState<string>("")

  const activeSameSession = useMemo(() => sessions.find(s => s.id === sameSessionId), [sessions, sameSessionId])
  const activeSessionA = useMemo(() => sessions.find(s => s.id === sessionA), [sessions, sessionA])
  const activeSessionB = useMemo(() => sessions.find(s => s.id === sessionB), [sessions, sessionB])

  const getUniqueEas = (trades?: any[]) => {
    if (!trades) return []
    const eas = new Set<string>()
    trades.forEach(t => {
      if (t.eaId) eas.add(t.eaId)
    })
    return Array.from(eas).sort()
  }

  const handleCompareSame = () => {
    if (!activeSameSession || selectedEas.length === 0) return
    const result = compareSameReport(activeSameSession.allTrades || [], selectedEas)
    setComparisonResults(result)
    onOpenChange(false)
  }

  const handleCompareCross = () => {
    if (!activeSessionA || !activeSessionB || !eaA || !eaB) return
    const result = compareCrossReport(
      { trades: activeSessionA.allTrades || [], eaId: eaA, name: activeSessionA.name },
      { trades: activeSessionB.allTrades || [], eaId: eaB, name: activeSessionB.name }
    )
    setComparisonResults(result)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Compare EAs</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="same-report" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="same-report">Same Report</TabsTrigger>
            <TabsTrigger value="cross-report">Cross Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="same-report" className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Select Report</Label>
              <Select value={sameSessionId} onValueChange={(v) => setSameSessionId(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Chose a report..." />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.fileName || "No file"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeSameSession && (
              <div className="space-y-3">
                <Label>Select EAs to Compare</Label>
                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-1">
                  {getUniqueEas(activeSameSession.allTrades).map(ea => (
                    <Badge 
                      key={ea}
                      variant={selectedEas.includes(ea) ? "default" : "outline"}
                      className="cursor-pointer py-1 px-3"
                      onClick={() => {
                        setSelectedEas(prev => 
                          prev.includes(ea) ? prev.filter(e => e !== ea) : [...prev, ea]
                        )
                      }}
                    >
                      {ea}
                    </Badge>
                  ))}
                </div>
                {selectedEas.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Select at least one EA from the list above.</p>
                )}
              </div>
            )}

            <Button 
              className="w-full" 
              disabled={!sameSessionId || selectedEas.length < 2}
              onClick={handleCompareSame}
            >
              Compare {selectedEas.length > 0 ? `(${selectedEas.length})` : ""}
            </Button>
          </TabsContent>
          
          <TabsContent value="cross-report" className="space-y-8 pt-4">
            <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Report A</Label>
                <Select value={sessionA} onValueChange={(v) => setSessionA(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Report A" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeSessionA && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-xs">EA Identifier in A</Label>
                  <Select value={eaA} onValueChange={(v) => setEaA(v || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select EA..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueEas(activeSessionA.allTrades).map(ea => (
                        <SelectItem key={ea} value={ea}>{ea}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Report B</Label>
                <Select value={sessionB} onValueChange={(v) => setSessionB(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Report B" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeSessionB && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-xs">EA Identifier in B</Label>
                  <Select value={eaB} onValueChange={(v) => setEaB(v || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select EA..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueEas(activeSessionB.allTrades).map(ea => (
                        <SelectItem key={ea} value={ea}>{ea}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button 
              className="w-full" 
              disabled={!eaA || !eaB}
              onClick={handleCompareCross}
            >
              Run Cross-Report Comparison
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
