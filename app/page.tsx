"use client";

import React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { KpiCards } from "@/components/analysis/KpiCards";
import { MultiEaChart } from "@/components/analysis/MultiEaChart";
import ResultsTable from "@/components/ResultsTable";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { 
  SidebarInset, 
  SidebarProvider 
} from "@/components/ui/sidebar";
import { FileSearch, Sparkles } from "lucide-react";

export default function Home() {
  const { currentResult, file, isProcessing } = useAnalysisStore();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
          <Header />
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
            {!file ? (
              <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-2xl">
                    <FileSearch size={64} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="space-y-3 max-w-lg">
                  <h2 className="text-3xl font-extrabold tracking-tight">No Report Uploaded</h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Ready to analyze your trading performance? <br />
                    Upload an <strong>MT4 Detailed Report (.htm)</strong> to get started.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 border border-border/50 px-6 py-3 rounded-2xl">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>Privacy-First: Analysis happens entirely in your browser</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. Statistics Cards */}
                <section>
                  <KpiCards />
                </section>

                {/* 2. Comparative Analysis Chart */}
                <section>
                  <MultiEaChart />
                </section>

                {/* 3. Detailed Data Table */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Transaction Details</h2>
                      <p className="text-xs text-muted-foreground">Detailed breakdown of matched trade operations</p>
                    </div>
                  </div>
                  <ResultsTable result={currentResult} />
                </section>
              </div>
            )}
          </main>

          <footer className="border-t py-6 px-8 text-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} MT4 EA Profit Filter Dashboard. All rights reserved.</p>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
