"use client";

import React, { useState } from "react";
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
  Inbox,
  Loader2,
  ArchiveRestore
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function HistoryPage() {
  const { 
    sessions,
    restoreSession, 
    archiveSession, 
    deleteSession,
    toggleFavorite 
  } = useAnalysisStore();
  const { t } = useTranslation();

  const favoriteSessions = sessions.filter(s => s.favorite);
  const activeSessionsList = sessions.filter(s => !s.archived);
  const archivedSessionsList = sessions.filter(s => s.archived);
  const [archiving, setArchiving] = useState<string | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'destructive' | 'default';
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "",
    variant: 'default',
    onConfirm: () => {}
  });

  const openConfirm = (config: Omit<typeof confirmConfig, 'open'>) => {
    setConfirmConfig({ ...config, open: true });
  };

  const deletedSessionsList: any[] = []; 

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
                    <th className="px-6 py-4 text-right">Performance Metrics</th>
                    <th className="px-6 py-4">Uploaded</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.map(s => {
                    const isArchived = s.archived;
                    const metadata = s.metadata;
                    const currency = s.currency || 'USD';

                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-foreground truncate max-w-[200px]">{s.name || s.fileName || 'Unnamed'}</span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{s.fileName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            {isArchived && s.archivedMetadata ? (
                              <>
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Trades:</span>{' '}
                                  <span className="font-bold">{s.archivedMetadata.tradesCount}</span>
                                </div>
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Net Profit:</span>{' '}
                                  <span className={cn(
                                    "font-bold",
                                    s.archivedMetadata.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                                  )}>
                                    {formatCurrency(s.archivedMetadata.totalProfit, s.currency || 'USD')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground italic">
                                  Archived: {format(new Date(s.archivedMetadata.archivedAt), 'MMM dd, HH:mm')}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Trades:</span>{' '}
                                  <span className="font-bold">{s.allTrades?.length || 0}</span>
                                </div>
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Net Profit:</span>{' '}
                                  <span className={cn(
                                    "font-bold",
                                    (s.currentResult?.totalProfit || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                                  )}>
                                    {formatCurrency(s.currentResult?.totalProfit || 0, s.currency || 'USD')}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-[11px] font-medium">
                          {format(s.createdAt, 'MMM dd, yyyy')}
                          <div className="text-[10px] opacity-60">{format(s.createdAt, 'HH:mm')}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(
                                "h-8 w-8 rounded-lg", 
                                s.favorite 
                                  ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10" 
                                  : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                              )}
                              onClick={() => toggleFavorite(s.id)}
                              title={s.favorite ? t('history.actions.unfavorite') : t('history.actions.favorite')}
                            >
                              <Star className={cn("h-4 w-4", s.favorite && "fill-current")} />
                            </Button>
                            {!isArchived ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10" 
                                  disabled={archiving === s.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openConfirm({
                                      title: t('history.confirmArchiveTitle'),
                                      description: t('history.confirmArchiveDesc'),
                                      confirmLabel: t('history.actions.archive'),
                                      variant: 'default',
                                      onConfirm: async () => {
                                        setArchiving(s.id);
                                        try {
                                          await archiveSession(s.id);
                                        } catch (error) {
                                          console.error('Archive failed:', error);
                                        } finally {
                                          setArchiving(null);
                                        }
                                      }
                                    });
                                  }} 
                                  title={t('history.actions.archive')}
                                >
                                  {archiving === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" 
                                  disabled={archiving === s.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openConfirm({
                                      title: t('history.confirmDeleteTitle'),
                                      description: t('history.confirmDeleteDesc'),
                                      confirmLabel: t('history.actions.delete'),
                                      variant: 'destructive',
                                      onConfirm: async () => {
                                        try {
                                          await deleteSession(s.id);
                                        } catch (error) {
                                          console.error('Delete failed:', error);
                                        }
                                      }
                                    });
                                  }} 
                                  title={t('history.actions.delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" 
                                  disabled={archiving === s.id}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setArchiving(s.id);
                                    try {
                                      await restoreSession(s.id);
                                    } catch (error) {
                                      console.error('Restore operation failed:', error);
                                      alert(`Failed to unarchive session`);
                                    } finally {
                                      setArchiving(null);
                                    }
                                  }} 
                                  title={t('history.actions.restore')}
                                >
                                  {archiving === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" 
                                  disabled={archiving === s.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openConfirm({
                                      title: t('history.confirmDeletePermanentTitle'),
                                      description: t('history.confirmDeletePermanentDesc'),
                                      confirmLabel: t('history.actions.delete'),
                                      variant: 'destructive',
                                      onConfirm: async () => {
                                        try {
                                          await deleteSession(s.id);
                                        } catch (error) {
                                          console.error('Delete failed:', error);
                                        }
                                      }
                                    });
                                  }} 
                                  title={t('history.actions.delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <HistoryIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{t('common.history')}</h1>
            <p className="text-muted-foreground text-sm">Manage and restore your trading reports</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-6 gap-1">
          <TabsTrigger value="favorites" className="gap-2 px-6">
            <Star size={14} className="text-amber-500" />
            {t('history.filterFavorites')}
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
              {favoriteSessions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2 px-6">
            <Layers size={14} className="text-primary" />
            {t('history.filterActive')}
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              {activeSessionsList.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2 px-6">
            <Archive size={14} className="text-amber-500" />
            {t('history.filterArchived')}
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
              {archivedSessionsList.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="deleted" className="gap-2 px-6 opacity-50">
            <Trash2 size={14} className="text-rose-500" />
            {t('history.filterRecycleBin')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites">
          <SessionList items={favoriteSessions} type="favorite" emptyKey="history.noFavorites" />
        </TabsContent>
        <TabsContent value="active">
          <SessionList items={activeSessionsList} type="active" emptyKey="history.noActive" />
        </TabsContent>
        <TabsContent value="archived">
          <SessionList items={archivedSessionsList} type="archived" emptyKey="history.noArchived" />
        </TabsContent>
        <TabsContent value="deleted">
          <SessionList items={deletedSessionsList} type="deleted" emptyKey="history.noDeleted" />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmConfig.open}
        onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
}
