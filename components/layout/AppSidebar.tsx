"use client"

import React, { useState } from "react"
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
} from "@/components/ui/sidebar"
import { LayoutDashboard, BarChart3, Settings, Calculator, HelpCircle, Layers } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"
import { db, getSetting, saveSetting } from "@/lib/db"

export function AppSidebar() {
  const [patterns, setPatterns] = React.useState("")
  const { file, processMultiEa, isProcessing, allTrades } = useAnalysisStore()

  // Load saved patterns on mount
  React.useEffect(() => {
    getSetting("favorite_patterns", "").then(val => {
      if (val) setPatterns(val)
    })
  }, [])

  const handleCompare = async () => {
    if (!file || !patterns.trim()) return
    
    // Save to persistence
    await saveSetting("favorite_patterns", patterns)
    
    const patternList = patterns.split(",").map(p => p.trim()).filter(Boolean)
    
    // For now we use the existing filters or default values for multi-EA
    // In a real app we'd pull threshold and dates from somewhere
    processMultiEa(
      patternList,
      80, // Default threshold
      new Date(0), // Far past
      new Date(2100, 0, 1) // Far future
    )
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="h-16 border-b flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            MT
          </div>
          <span className="font-semibold text-lg">Analyzer</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive tooltip="Dashboard">
                  <a href="#">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Performance">
                  <a href="#">
                    <BarChart3 className="h-4 w-4" />
                    <span>Performance</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="EA Comparison">
                  <a href="#">
                    <Layers className="h-4 w-4" />
                    <span>EA Comparison</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Multi-EA Analysis</SidebarGroupLabel>
          <SidebarGroupContent className="px-4 py-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ea-patterns" className="text-xs text-muted-foreground">
                Enter EA comments (comma separated)
              </Label>
              <Textarea
                id="ea-patterns"
                placeholder="e.g. 111, BBS41, DCA"
                className="min-h-[100px] resize-none text-xs"
                value={patterns}
                onChange={(e) => setPatterns(e.target.value)}
              />
            </div>
            <Button 
              className="w-full h-8 text-xs gap-2" 
              onClick={handleCompare}
              disabled={!file || !patterns.trim() || isProcessing || allTrades.length === 0}
            >
              <Calculator className="h-3 w-3" />
              Analyze & Compare
            </Button>
            {allTrades.length === 0 && file && (
              <p className="text-[10px] text-muted-foreground text-center italic">
                Wait for initial parse to be complete...
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help & Support">
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
