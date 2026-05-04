"use client";

import React from "react";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  History as HistoryIcon, 
  Archive, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  FileText,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";

export default function HistoryPage() {
  const { sessions, restoreSession, archiveSession, removeSession, permanentDeleteSession } = useAnalysisStore();
  const { t } = useTranslation();

  const activeSessions = sessions.filter(s => !s.deleted && !s.archived);
  const archivedSessions = sessions.filter(s => s.archived && !s.deleted);
  const deletedSessions = sessions.filter(s => s.deleted);

  const SessionTable = ({ title, description, items, type }: { 
    title: string; 
    description: string; 
    items: any[]; 
    type: 'active' | 'archived' | 'deleted' 
  }) => (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {items.length}
          </span>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm italic">
            {t('common.noResults')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">{t('comparison.report')}</th>
                  <th className="px-4 py-3">{t('explore.kpiNetProfit')}</th>
                  <th className="px-4 py-3">{t('explore.kpiTotalTrades')}</th>
                  <th className="px-4 py-3">Date Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map(s => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{s.name || s.fileName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{s.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className={cn(
                        "font-bold",
                        (s.currentResult?.totalProfit || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {formatCurrency(s.currentResult?.totalProfit || 0, s.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {s.currentResult?.trades.length || 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(s.createdAt, 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {type === 'active' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10" onClick={() => archiveSession(s.id)} title="Archive">
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10" onClick={() => removeSession(s.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {type === 'archived' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" onClick={() => restoreSession(s.id)} title="Restore">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10" onClick={() => removeSession(s.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {type === 'deleted' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" onClick={() => restoreSession(s.id)} title="Restore">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-600/10" onClick={() => permanentDeleteSession(s.id)} title="Permanent Delete">
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
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <HistoryIcon className="h-8 w-8 text-primary" />
            {t('common.history')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your trading sessions and workspaces</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <SessionTable 
          title="Active Sessions" 
          description="Reports currently available in the Dashboard and Compare tabs."
          items={activeSessions} 
          type="active"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SessionTable 
            title="Archived" 
            description="Stored reports hidden from the main workspace to reduce clutter."
            items={archivedSessions} 
            type="archived"
          />
          <SessionTable 
            title="Recycle Bin" 
            description="Recently deleted reports. Can be restored or permanently removed."
            items={deletedSessions} 
            type="deleted"
          />
        </div>
      </div>
    </div>
  );
}
