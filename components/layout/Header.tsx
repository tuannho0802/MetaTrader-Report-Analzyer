"use client"

import React from "react"
import { ThemeToggle } from "./ThemeToggle"
import { Button } from "@/components/ui/button"
import { UploadCloud, Sidebar as SidebarIcon } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import FileUploader from "@/components/FileUploader"
import FilterForm from "@/components/FilterForm"
import { useAnalysisStore } from "@/lib/store/useAnalysisStore"

export function Header() {
  const { toggleSidebar } = useSidebar()
  const { setFile, processStatement, file, isProcessing } = useAnalysisStore()

  const handleFilterSubmit = async (data: any) => {
    if (!file) return
    
    // We need to read the file content as it's not stored in the store as a string
    const reader = new FileReader()
    reader.onload = (e) => {
      const html = e.target?.result as string
      processStatement(html, {
        commentPattern: data.commentPattern,
        threshold: data.threshold,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      })
    }
    reader.readAsText(file)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            <SidebarIcon className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              MT4 Profit Filter <span className="text-xs font-normal text-muted-foreground ml-2">v2.0</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="default" className="gap-2 shadow-sm">
                  <UploadCloud className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload & Analyze</span>
                </Button>
              }
            />
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>Analyze Account Statement</SheetTitle>
                <SheetDescription>
                  Upload your MT4 HTML report and configure the analysis filters.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-4">
                <FileUploader onFileSelect={setFile} />
                <div className="separator border-t border-muted my-6" />
                <FilterForm 
                  onSubmit={handleFilterSubmit}
                  isLoading={isProcessing}
                  disabled={!file}
                />
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="h-6 w-px bg-border mx-1" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
