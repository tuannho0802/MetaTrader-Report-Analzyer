"use client"

import React from "react"
import { useTranslation } from "@/lib/i18n"
import { useSettingsStore } from "@/lib/store/useSettingsStore"

interface ReportDateRangeProps {
  startDate: string | null
  endDate: string | null
}

export function ReportDateRange({ startDate, endDate }: ReportDateRangeProps) {
  const { t } = useTranslation()
  const { language } = useSettingsStore()

  if (!startDate || !endDate) return null

  const formatDate = (dateStr: string) => {
    try {
      // Input can be "YYYY-MM-DD HH:mm" or "YYYY-MM-DD"
      // We normalize to "YYYY-MM-DD" for simple date display if it's too complex,
      // but new Date() handles many formats.
      const date = new Date(dateStr.replace(/-/g, '/')) // Replace - with / for better cross-browser Date parsing
      
      return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: language === 'vi' ? 'long' : 'short',
        day: 'numeric',
      }).format(date)
    } catch (e) {
      return dateStr
    }
  }

  const formattedStart = formatDate(startDate)
  const formattedEnd = formatDate(endDate)

  return (
    <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-300">
      {t('dashboard.reportDateRange')
        .replace('{start}', formattedStart)
        .replace('{end}', formattedEnd)}
    </p>
  )
}
