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
import { translations } from "@/lib/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"

export function Header() {
  const { toggleSidebar } = useSidebar()
  const { 
    setFile, 
    processStatement, 
    file, 
    isProcessing,
    language,
    setLanguage 
  } = useAnalysisStore()
  
  const t = translations[language]

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
      <div className="container flex h-16 items-center justify-between py-4 px-6 md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            <SidebarIcon className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center">
              MT4 Profit Filter <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2 uppercase tracking-wide">v2.0</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                <Languages className="h-4 w-4" />
                <span className="sr-only">Switch language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-accent" : ""}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("vi")} className={language === "vi" ? "bg-accent" : ""}>
                Tiếng Việt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="default" className="gap-2 shadow-sm rounded-lg font-bold text-xs h-9 px-4">
                <UploadCloud className="h-4 w-4" />
                <span className="hidden sm:inline">{t.analyzeTransactions}</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>{t.savePreset}</SheetTitle>
                <SheetDescription>
                  {t.uploadMt4}
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
