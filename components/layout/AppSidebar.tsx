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
  Bookmark,
  BarChart,
  GitCompareArrows,
  Info,
} from "lucide-react"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { translations } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const { language } = useAnalysisStore()
  const t = translations[language]


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
                <SidebarMenuButton asChild isActive={pathname === '/compare'} tooltip={t.eaComparison}>
                  <Link href="/compare" className="flex items-center gap-3 w-full">
                    <GitCompareArrows className={cn("h-4 w-4 shrink-0", pathname === '/compare' ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground opacity-100">{t.eaComparison}</span>
                  </Link>
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
            <SidebarMenuButton asChild isActive={pathname === "/AboutMT5"} tooltip="About MT5 Format">
              <Link href="/AboutMT5" className="flex items-center gap-3 w-full">
                <Info className={cn("h-4 w-4", pathname === "/AboutMT5" ? "text-primary" : "text-muted-foreground")} />
                <span className="font-medium text-foreground">About MT5</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className="flex items-center gap-3 w-full">
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
