"use client";

import React from "react";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History as HistoryIcon, 
  Archive, 
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  Star,
  Layers,
  Inbox
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";

export default function HistoryPage() {
  const { 
    sessions, 
    restoreSession, 
    archiveSession, 
    removeSession, 
    permanentDeleteSession,
    toggleFavorite 
  } = useAnalysisStore();
  const { t } = useTranslation();

  const favoriteSessions = sessions.filter(s => s.favorite && !s.deleted && !s.archived);
  const activeSessions = sessions.filter(s => !s.deleted && !s.archived);
  const archivedSessions = sessions.filter(s => s.archived && !s.deleted);
  const deletedSessions = sessions.filter(s => s.deleted);

  const SessionList = ({ items, type, emptyKey }: { 
    items: any[]; 
    type: 'favorite' | 'active' | 'archived' | 'deleted';
    emptyKey: string;
  }) => (
    <div className="space-y-4">
      {items.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Inbox className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm font-medium">{t(emptyKey)}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-bold text-[10px] uppercase tracking-widest border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4">{t('comparison.report')}</th>
                    <th className="px-6 py-4 text-right">{t('explore.kpiNetProfit')}</th>
                    <th className="px-6 py-4 text-center">{t('explore.kpiTotalTrades')}</th>
                    <th className="px-6 py-4">Uploaded</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleFavorite(s.id)}
                            className={cn(
                              "transition-all duration-200 hover:scale-110",
                              s.favorite ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-400/50"
                            )}
                          >
                            <Star size={18} fill={s.favorite ? "currentColor" : "none"} />
                          </button>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate max-w-[200px]">{s.name || s.fileName || 'Unnamed'}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{s.fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        <span className={cn(
                          "font-bold",
                          (s.currentResult?.totalProfit || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {formatCurrency(s.currentResult?.totalProfit || 0, s.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-muted-foreground">
                        {s.currentResult?.trades.length || 0}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-[11px] font-medium">
                        {format(s.createdAt, 'MMM dd, yyyy')}
                        <div className="text-[10px] opacity-60">{format(s.createdAt, 'HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(type === 'active' || type === 'favorite') && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10" 
                                onClick={() => archiveSession(s.id)} 
                                title={t('history.actions.archive')}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" 
                                onClick={() => removeSession(s.id)} 
                                title={t('history.actions.delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {type === 'archived' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" 
                                onClick={() => restoreSession(s.id)} 
                                title={t('history.actions.restore')}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" 
                                onClick={() => removeSession(s.id)} 
                                title={t('history.actions.delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {type === 'deleted' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" 
                                onClick={() => restoreSession(s.id)} 
                                title={t('history.actions.restore')}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-600/10" 
                                onClick={() => permanentDeleteSession(s.id)} 
                                title={t('history.actions.permanentDelete')}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <HistoryIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{t('common.history')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage your trading sessions and data archives</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          <TabsList className="h-10 bg-muted/50 p-1 gap-1 w-full sm:w-auto">
            <TabsTrigger value="favorites" className="gap-2 px-4 py-1.5 data-[state=active]:bg-background">
              <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
              <span className="font-bold text-xs">{t('history.filterFavorites')}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-black">
                {favoriteSessions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2 px-4 py-1.5 data-[state=active]:bg-background">
              <Layers className="h-3.5 w-3.5" />
              <span className="font-bold text-xs">{t('history.filterActive')}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-black">
                {activeSessions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2 px-4 py-1.5 data-[state=active]:bg-background">
              <Archive className="h-3.5 w-3.5" />
              <span className="font-bold text-xs">{t('history.filterArchived')}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-black">
                {archivedSessions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="deleted" className="gap-2 px-4 py-1.5 data-[state=active]:bg-background">
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              <span className="font-bold text-xs">{t('history.filterRecycleBin')}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-black">
                {deletedSessions.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="favorites" className="mt-0 outline-none">
          <SessionList items={favoriteSessions} type="favorite" emptyKey="history.noFavorites" />
        </TabsContent>
        <TabsContent value="active" className="mt-0 outline-none">
          <SessionList items={activeSessions} type="active" emptyKey="history.noActive" />
        </TabsContent>
        <TabsContent value="archived" className="mt-0 outline-none">
          <SessionList items={archivedSessions} type="archived" emptyKey="history.noArchived" />
        </TabsContent>
        <TabsContent value="deleted" className="mt-0 outline-none">
          <SessionList items={deletedSessions} type="deleted" emptyKey="history.noDeleted" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
