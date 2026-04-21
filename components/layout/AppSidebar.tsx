"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Calculator, 
  HelpCircle, 
  Layers, 
  LayoutGrid,
  Compass,
  History,
  Bookmark,
  BarChart
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { db, getSetting, saveSetting } from "@/lib/db"
import { translations } from "@/lib/i18n"
import { CompareSheet } from "@/components/CompareSheet"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const [patterns, setPatterns] = React.useState("")
  const { 
    sessions, 
    activeSessionId, 
    processMultiEa, 
    isProcessing, 
    allTrades,
    language
  } = useAnalysisStore()
  const [compareSheetOpen, setCompareSheetOpen] = useState(false)

  const activeSession = sessions.find(s => s.id === activeSessionId)
  const t = translations[language]

  // Load saved patterns on mount
  React.useEffect(() => {
    getSetting("favorite_patterns", "").then(val => {
      if (val) setPatterns(val)
    })
  }, [])

  const handleCompare = async () => {
    if (!patterns.trim() || !activeSession) return
    
    // Save to persistence
    await saveSetting("favorite_patterns", patterns)
    
    const patternList = patterns.split(",").map(p => p.trim()).filter(Boolean)
    
    processMultiEa(
      patternList,
      activeSession.filter.threshold,
      activeSession.filter.startDate,
      activeSession.filter.endDate
    )
  }

  const canAnalyze = allTrades.length > 0 && patterns.trim().length > 0

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-16 border-b flex flex-row items-center justify-between px-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden overflow-hidden">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg">
            MT
          </div>
          <span className="font-bold text-lg text-foreground truncate">Analyzer</span>
        </div>
        <SidebarTrigger className="h-8 w-8" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-foreground/60 font-bold uppercase tracking-wider text-[10px]">{t.dashboard}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip={t.dashboard}>
                  <Link href="/" className="flex items-center gap-3 w-full">
                    <LayoutDashboard className={cn("h-4 w-4 shrink-0", pathname === "/" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t.dashboard}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/performance"} tooltip={t.performance}>
                  <Link href="/performance" className="flex items-center gap-3 w-full">
                    <BarChart3 className={cn("h-4 w-4 shrink-0", pathname === "/performance" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t.performance}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip={t.eaComparison}
                  onClick={() => setCompareSheetOpen(true)}
                  className="flex items-center gap-3 w-full"
                >
                  <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-semibold text-foreground opacity-100">{t.eaComparison}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-foreground/60 font-bold uppercase tracking-wider text-[10px]">Verification Tests</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/explore"} tooltip="Explore">
                  <Link href="/explore" className="flex items-center gap-3 w-full">
                    <Compass className={cn("h-4 w-4 shrink-0", pathname === "/explore" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">Explore</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/statistics"} tooltip="Statistics">
                  <Link href="/statistics" className="flex items-center gap-3 w-full">
                    <BarChart className={cn("h-4 w-4 shrink-0", pathname === "/statistics" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">Statistics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/history"} tooltip="History">
                  <Link href="/history" className="flex items-center gap-3 w-full">
                    <History className={cn("h-4 w-4 shrink-0", pathname === "/history" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/bookmarks"} tooltip="Bookmarks">
                  <Link href="/bookmarks" className="flex items-center gap-3 w-full">
                    <Bookmark className={cn("h-4 w-4 shrink-0", pathname === "/bookmarks" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">Bookmarks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="px-2 text-foreground/60 font-bold uppercase tracking-wider text-[10px]">{t.multiEaAnalysis}</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 py-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ea-patterns" className="text-[10px] uppercase font-bold text-foreground/40 px-1">
                {t.enterEaComments}
              </Label>
              <Textarea
                id="ea-patterns"
                placeholder="e.g. 111, BBS41, DCA"
                className="min-h-[100px] resize-none text-xs bg-muted/40 border-border/50 focus:bg-background transition-colors"
                value={patterns}
                onChange={(e) => setPatterns(e.target.value)}
              />
            </div>
            <Button 
              className="w-full h-9 text-xs gap-2 font-bold shadow-md shadow-primary/20" 
              onClick={handleCompare}
              disabled={!canAnalyze || isProcessing}
            >
              <Calculator className="h-3.5 w-3.5" />
              {t.analyzeCompare}
            </Button>
            {allTrades.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center italic opacity-60">
                {t.uploadToEnable}
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help & Support" className="flex items-center gap-3 w-full">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" className="flex items-center gap-3 w-full">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <CompareSheet open={compareSheetOpen} onOpenChange={setCompareSheetOpen} />
    </Sidebar>
  )
}
