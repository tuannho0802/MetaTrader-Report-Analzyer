"use client"

import React from "react"
import { Calendar } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useSettingsStore } from "@/lib/store/useSettingsStore"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ReportDateCard({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { filteredTrades } = useAnalysisStore()
  const { language } = useSettingsStore()

  if (!filteredTrades || filteredTrades.length === 0) return null

  // ============ LOGIC: LẤY TỪ FILTERED TRADES ============
  
  // Sắp xếp trades theo openTime (sớm → muộn)
  const sortedByOpen = [...filteredTrades].sort((a, b) => {
    const dateA = new Date(a.openTime.replace(/\./g, '/')).getTime()
    const dateB = new Date(b.openTime.replace(/\./g, '/')).getTime()
    return dateA - dateB
  })
  
  // Sắp xếp trades theo closeTime (sớm → muộn)
  const sortedByClose = [...filteredTrades].sort((a, b) => {
    const dateA = new Date(a.closeTime.replace(/\./g, '/')).getTime()
    const dateB = new Date(b.closeTime.replace(/\./g, '/')).getTime()
    return dateA - dateB
  })
  
  // Ngày EA bắt đầu vào lệnh = openTime của trade đầu tiên
  const displayStartDate = sortedByOpen[0].openTime

  // ============ LOGIC CŨ CHO END-DATE ============
  const { sessions, activeSessionId } = useAnalysisStore()
  const activeSession = sessions.find(s => s.id === activeSessionId)
  
  let displayEndDateObj = new Date()
  if (activeSession) {
    const filterEndDate = activeSession.filter.endDate
    const fileEndDateStr = activeSession.endDate
    
    displayEndDateObj = filterEndDate ? new Date(filterEndDate) : (fileEndDateStr ? new Date(fileEndDateStr.replace(/-/g, '/')) : new Date())
    
    // Clamp to file max end date
    if (fileEndDateStr) {
      const maxEndDate = new Date(fileEndDateStr.replace(/-/g, '/'))
      if (displayEndDateObj > maxEndDate) {
        displayEndDateObj = maxEndDate
      }
    }
  }
  
  // ============ FORMAT NGÀY ============
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
  
  const formatOptions: Intl.DateTimeFormatOptions = 
    language === 'vi' 
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' }

  // Helper function to safely create Date objects
  const parseDate = (d: string) => new Date(d.replace(/\./g, '/'))

  const startFormatted = parseDate(displayStartDate).toLocaleDateString(locale, formatOptions)
  const endFormatted = displayEndDateObj.toLocaleDateString(locale, formatOptions)

  return (
    <Card className={cn("overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-border", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {language === 'vi' ? 'Phạm vi báo cáo' : 'Report Range'}
          </CardTitle>
        </div>
        <div className="p-2 rounded-lg bg-blue-400/10">
          <Calendar className="h-4 w-4 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-2xl font-bold tracking-tight text-blue-400">
          {startFormatted} – {endFormatted}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 font-medium">
          {language === 'vi' ? 'Khoảng thời gian đang được lọc' : 'Currently filtered date range'}
        </p>
      </CardContent>
    </Card>
  )
}
