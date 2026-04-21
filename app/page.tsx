"use client";

import React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { KpiCards } from "@/components/analysis/KpiCards";
import { MultiEaChart } from "@/components/analysis/MultiEaChart";
import ResultsTable from "@/components/ResultsTable";
import { ComparisonView } from "@/components/ComparisonView";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { 
  SidebarInset, 
  SidebarProvider 
} from "@/components/ui/sidebar";
import { 
  FileSearch, 
  Sparkles, 
  Trash2, 
  History, 
  Plus, 
  X, 
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

import { translations } from "@/lib/i18n";

export default function Home() {
  const { 
    sessions,
    activeSessionId,
    allTrades, 
    cachedStatementInfo, 
    loadCachedStatement, 
    clearCache,
    addSession,
    removeSession,
    setActiveSession,
    comparisonResult,
    setComparisonResults,
    language
  } = useAnalysisStore();

  React.useEffect(() => {
    loadCachedStatement();
  }, [loadCachedStatement]);

  const hasData = allTrades.length > 0;
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const t = translations[language];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
          <Header />
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
            {cachedStatementInfo && !hasData && (
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border border-border/50 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <History size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.loadedPrevious} <span className="text-primary">{cachedStatementInfo.fileName}</span></p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(cachedStatementInfo.uploadedAt).toLocaleString()} • {cachedStatementInfo.totalTrades} trades
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCache}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-2"
                >
                  <Trash2 size={14} />
                  {t.clearCache}
                </Button>
              </div>
            )}

            {!hasData ? (
              <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-2xl">
                    <FileSearch size={64} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="space-y-3 max-w-lg">
                  <h2 className="text-3xl font-extrabold tracking-tight">{t.noReportUploaded}</h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {t.readyToAnalyze} <br />
                    {language === 'en' ? 'Upload an' : 'Tải lên'} <strong>MT4 Detailed Report (.htm)</strong> {language === 'en' ? 'to get started' : 'để bắt đầu'}.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 border border-border/50 px-6 py-3 rounded-2xl">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>{t.privacyFirst}</span>
                  </div>
                </div>
              </div>
            ) : comparisonResult ? (
              <ComparisonView 
                results={comparisonResult} 
                onBack={() => setComparisonResults(null)} 
              />
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Session Tabs */}
                <div className="flex items-center gap-4">
                  <Tabs value={activeSessionId} onValueChange={setActiveSession} className="w-full">
                    <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2 scrollbar-none">
                      <TabsList className="h-10 bg-muted/50 p-1 gap-1">
                        {sessions.map((session) => (
                          <TabsTrigger 
                            key={session.id} 
                            value={session.id}
                            className="h-8 gap-2 px-4 rounded-md data-active:shadow-sm"
                          >
                            <LayoutGrid size={14} className="opacity-50" />
                            {session.name}
                            {sessions.length > 1 && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSession(session.id);
                                }}
                                className="ml-1 p-0.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-rose-500"
                              >
                                <X size={12} />
                              </div>
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg border-dashed border-2 hover:border-primary hover:text-primary transition-all"
                        onClick={() => addSession()}
                      >
                        <Plus size={18} />
                      </Button>
                    </div>

                    {sessions.map((session) => (
                      <TabsContent 
                        key={session.id} 
                        value={session.id} 
                        className="mt-6 space-y-8 outline-none animate-in fade-in slide-in-from-left-2 duration-300"
                      >
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
                              <h2 className="text-lg font-semibold">{t.transactionDetails}</h2>
                              <p className="text-xs text-muted-foreground">
                                {t.breakdownOf} <span className="text-primary font-medium">{session.name}</span>
                              </p>
                            </div>
                          </div>
                          <ResultsTable result={session.currentResult} />
                        </section>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
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
