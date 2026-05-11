"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { SessionView } from "@/components/analysis/SessionView";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import {
  FileSearch,
  Sparkles,
  X,
  LayoutGrid,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { fetchExchangeRates } from "@/lib/exchangeRates";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function Home() {
  const {
    sessions,
    activeSessionId,
    archiveSession,
    setActiveSession,
    isLoading,
  } = useAnalysisStore();

  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = React.useState(false);
  const [sessionToArchive, setSessionToArchive] = React.useState<string | null>(null);

  const activeSessions = React.useMemo(() => {
    return sessions.filter(
      (s) => !s.archived && s.allTrades && s.allTrades.length > 0
    );
  }, [sessions]);

  const { t } = useTranslation();
  const {
    autoConvertCurrency,
    baseCurrency,
    setExchangeRates,
    exchangeRates,
  } = useSettingsStore();

  // Fetch exchange rates once when auto-convert is enabled
  React.useEffect(() => {
    if (autoConvertCurrency && !exchangeRates) {
      fetchExchangeRates(baseCurrency).then(setExchangeRates).catch(console.error);
    }
  }, [autoConvertCurrency, baseCurrency, exchangeRates, setExchangeRates]);

  const activeSession = activeSessions.find((s) => s.id === activeSessionId);
  const hasData = activeSessions.length > 0;

  return (
    <>
      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="h-10 bg-muted rounded-md w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-xl w-full" />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-2xl">
              <FileSearch size={64} strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-3 max-w-lg">
            <h2 className="text-3xl font-extrabold tracking-tight">
              {t("dashboard.noReport")}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {t("dashboard.ready")} <br />
              {t("dashboard.uploadHint")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 border border-border/50 px-6 py-3 rounded-2xl">
              <Sparkles size={16} className="text-amber-500" />
              <span>{t("dashboard.privacy")}</span>
            </div>
          </div>
        </div>
      ) : activeSession ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-6">
            <Tabs
              value={activeSessionId || undefined}
              onValueChange={setActiveSession}
              className="w-full"
            >
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <TabsList className="h-10 bg-muted/50 p-1 gap-1">
                  {activeSessions.map((session) => (
                    <TabsTrigger
                      key={session.id}
                      value={session.id}
                      className="h-8 gap-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <LayoutGrid size={14} className="opacity-50" />
                      <span className="max-w-[150px] truncate">
                        {session.name}
                      </span>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToArchive(session.id);
                          setIsArchiveConfirmOpen(true);
                        }}
                        className="ml-1 p-0.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-rose-500"
                      >
                        <X size={12} />
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {activeSessions.map((session) => (
                <TabsContent
                  key={session.id}
                  value={session.id}
                  className="mt-6 space-y-8 outline-none animate-in fade-in slide-in-from-left-2 duration-300"
                >
                  <SessionView
                    session={session}
                    autoConvertCurrency={autoConvertCurrency}
                    exchangeRates={exchangeRates}
                    baseCurrency={baseCurrency}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={isArchiveConfirmOpen}
        onOpenChange={setIsArchiveConfirmOpen}
        title={t('history.confirmArchiveTitle')}
        description={t('history.confirmArchiveDesc')}
        confirmLabel={t('history.actions.archive')}
        onConfirm={async () => {
          if (sessionToArchive) {
            try {
              await archiveSession(sessionToArchive);
            } catch (error) {
              console.error("Archive failed:", error);
            } finally {
              setSessionToArchive(null);
            }
          }
        }}
      />
    </>
  );
}
