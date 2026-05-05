"use client"

import React from "react"
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
  HelpCircle,
  Compass,
  History,
  BarChart,
  GitCompareArrows,
  Info,
  Dices,
} from "lucide-react"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()


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
          <SidebarGroupLabel className="px-2 text-foreground/60 font-bold uppercase tracking-wider text-[10px]">{t('common.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip={t('common.dashboard')}>
                  <Link href="/" className="flex items-center gap-3 w-full">
                    <LayoutDashboard className={cn("h-4 w-4 shrink-0", pathname === "/" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t('common.dashboard')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/performance"} tooltip={t('analysis.performance')}>
                  <Link href="/performance" className="flex items-center gap-3 w-full">
                    <BarChart3 className={cn("h-4 w-4 shrink-0", pathname === "/performance" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t('analysis.performance')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/compare'} tooltip={t('analysis.comparison')}>
                  <Link href="/compare" className="flex items-center gap-3 w-full">
                    <GitCompareArrows className={cn("h-4 w-4 shrink-0", pathname === '/compare' ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t('analysis.comparison')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-foreground/60 font-bold uppercase tracking-wider text-[10px]">{t('common.verificationTests')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/explore"} tooltip={t('common.explore')}>
                  <Link href="/explore" className="flex items-center gap-3 w-full">
                    <Compass className={cn("h-4 w-4 shrink-0", pathname === "/explore" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t('common.explore')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/statistics"} tooltip={t('common.statistics')}>
                  <Link href="/statistics" className="flex items-center gap-3 w-full">
                    <BarChart className={cn("h-4 w-4 shrink-0", pathname === "/statistics" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t('common.statistics')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/montecarlo"} tooltip={t('monteCarlo.title')}>
                  <Link href="/montecarlo" className="flex items-center gap-3 w-full">
                    <Dices className={cn("h-4 w-4 shrink-0", pathname === "/montecarlo" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t('monteCarlo.title')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/history"} tooltip={t('common.history')}>
                  <Link href="/history" className="flex items-center gap-3 w-full">
                    <History className={cn("h-4 w-4 shrink-0", pathname === "/history" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t('common.history')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('common.help')} className="flex items-center gap-3 w-full">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{t('common.help')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/AboutMT5"} tooltip={t('uploader.aboutMt5')}>
              <Link href="/AboutMT5" className="flex items-center gap-3 w-full">
                <Info className={cn("h-4 w-4", pathname === "/AboutMT5" ? "text-primary" : "text-muted-foreground")} />
                <span className="font-medium text-foreground">{t('common.aboutMT5')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t('common.settings')} className="flex items-center gap-3 w-full">
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{t('common.settings')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
