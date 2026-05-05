'use client';

import { useState, useMemo } from 'react';
import { useAnalysisStore } from '@/lib/store/useAnalysisStore';
import { useTranslation } from '@/lib/i18n';
import { useMonteCarlo } from '@/lib/hooks/useMonteCarlo';
import { formatCurrency } from '@/lib/formatCurrency';
import { DistributionChart } from '@/components/montecarlo/DistributionChart';
import { StatisticsCards } from '@/components/montecarlo/StatisticsCards';
import { MonteCarloGuide } from '@/components/montecarlo/MonteCarloGuide';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dices,
  Play,
  StopCircle,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Settings2,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Inline Progress Bar ───────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-150"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ── Inline Toggle Switch ──────────────────────────────────────────────────────
function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MonteCarloPage() {
  const { t } = useTranslation();
  const { sessions, activeSessionId, setActiveSession } = useAnalysisStore();
  const activeSessions = useMemo(() => {
    return sessions.filter(s => 
      !s.archived && s.allTrades && s.allTrades.length > 0
    );
  }, [sessions]);
  const currentSession = activeSessions.find((s) => s.id === activeSessionId) || activeSessions[0] || null;

  // ── Config state ─────────────────────────────────────────────────────────
  const [selectedEaId, setSelectedEaId] = useState<string>('all');
  const [numSimulations, setNumSimulations] = useState<number>(1000);
  const [sampleSize, setSampleSize] = useState<string>(''); // empty = use all trades
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [accountBalance, setAccountBalance] = useState<number>(10000);

  const { run, cancel, isLoading, progress, results, error } = useMonteCarlo();

  // ── Derived data ──────────────────────────────────────────────────────────
  const allTrades = currentSession?.allTrades || currentSession?.currentResult?.trades || [];

  const uniqueEas = useMemo(() => {
    const map = new Map<string, number>();
    allTrades.forEach((t) => {
      const id = t.eaId || t.comment || 'unknown';
      if (id) map.set(id, (map.get(id) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  }, [allTrades]);

  const filteredTrades = useMemo(() => {
    if (selectedEaId === 'all') return allTrades;
    return allTrades.filter((t) => (t.eaId || t.comment || 'unknown') === selectedEaId);
  }, [allTrades, selectedEaId]);

  const effectiveSampleSize = sampleSize
    ? Math.min(parseInt(sampleSize, 10) || filteredTrades.length, filteredTrades.length)
    : filteredTrades.length;

  const canRun = filteredTrades.length > 0 && !isLoading;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!canRun) return;
    try {
      await run({
        trades: filteredTrades.map((t) => ({ profit: t.profit })),
        numSimulations: Math.min(Math.max(numSimulations, 10), 10000),
        sampleSize: effectiveSampleSize,
        shuffle,
      });
    } catch {
      // error is surfaced via `error` state from the hook
    }
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (activeSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in zoom-in duration-500">
        <div className="p-5 bg-muted/30 rounded-full">
          <Dices size={40} className="text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold">{t('monteCarlo.noSession')}</h3>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Dices className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{t('monteCarlo.title')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t('monteCarlo.description')}</p>
          </div>
        </div>
      </div>

      {/* ── Session + EA selectors ── */}
      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('monteCarlo.selectSession')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session select */}
            <div className="space-y-1.5">
              <Label htmlFor="mc-session">{t('monteCarlo.selectSession')}</Label>
              <Select
                value={currentSession?.id || ''}
                onValueChange={(id) => { if (id) { setActiveSession(id); setSelectedEaId('all'); } }}
              >
                <SelectTrigger id="mc-session">
                  {currentSession ? (
                    <span className="truncate">
                      {currentSession.name || currentSession.fileName || 'Unnamed'} ({filteredTrades.length} {t('dashboard.trades')})
                    </span>
                  ) : (
                    <SelectValue placeholder={t('monteCarlo.selectSession')} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {activeSessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name || s.fileName} ({s.allTrades?.length || s.currentResult?.trades.length || 0}{' '}
                      {t('dashboard.trades')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EA filter */}
            <div className="space-y-1.5">
              <Label htmlFor="mc-ea">{t('monteCarlo.selectEa')}</Label>
              <Select value={selectedEaId} onValueChange={(v) => { if (v) setSelectedEaId(v); }}>
                <SelectTrigger id="mc-ea">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('monteCarlo.allTrades')} ({allTrades.length})
                  </SelectItem>
                  {uniqueEas.map((ea) => (
                    <SelectItem key={ea.id} value={ea.id}>
                      {ea.id} ({ea.count} {t('dashboard.trades')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trade count badge */}
          {filteredTrades.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
              <ChevronRight className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {t('monteCarlo.selectedTrades')}: <strong>{filteredTrades.length}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Simulation settings ── */}
      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            {t('monteCarlo.settings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Num simulations */}
            <div className="space-y-1.5">
              <Label htmlFor="mc-num-sims">{t('monteCarlo.numSimulations')}</Label>
              <Input
                id="mc-num-sims"
                type="number"
                min={10}
                max={10000}
                step={100}
                value={numSimulations}
                onChange={(e) => setNumSimulations(Number(e.target.value))}
                disabled={isLoading}
              />
              <p className="text-[10px] text-muted-foreground">10 – 10 000</p>
            </div>

            {/* Sample size */}
            <div className="space-y-1.5">
              <Label htmlFor="mc-sample">{t('monteCarlo.sampleSize')}</Label>
              <Input
                id="mc-sample"
                type="number"
                min={1}
                max={filteredTrades.length}
                placeholder={String(filteredTrades.length)}
                value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[10px] text-muted-foreground">
                {t('monteCarlo.sampleSizeHint')} (max {filteredTrades.length})
              </p>
              <p className="text-[9px] text-amber-500 leading-tight italic mt-1">
                {t('monteCarlo.sampleSizeNote')}
              </p>
            </div>

            {/* Account balance */}
            <div className="space-y-1.5">
              <Label htmlFor="mc-balance">{t('monteCarlo.accountBalance')}</Label>
              <Input
                id="mc-balance"
                type="number"
                min={1}
                step={100}
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value))}
                disabled={isLoading}
              />
              <p className="text-[10px] text-muted-foreground">{currentSession?.currency || 'USD'}</p>
            </div>
          </div>

          {/* Shuffle toggle */}
          <div className="flex items-center gap-3">
            <Toggle id="mc-shuffle" checked={shuffle} onChange={setShuffle} />
            <div className="space-y-0.5">
              <Label htmlFor="mc-shuffle" className="cursor-pointer select-none">
                {t('monteCarlo.shuffle')}
              </Label>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {t('monteCarlo.shuffleHint')}
              </p>
            </div>
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              id="mc-run-btn"
              onClick={handleRun}
              disabled={!canRun}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isLoading ? t('monteCarlo.running') : t('monteCarlo.run')}
            </Button>

            {isLoading && (
              <Button variant="outline" onClick={cancel} className="gap-2 text-rose-500 border-rose-500/30 hover:bg-rose-500/10">
                <StopCircle className="h-4 w-4" />
                {t('monteCarlo.cancel')}
              </Button>
            )}
          </div>

          {/* Progress */}
          {isLoading && (
            <div className="space-y-1.5">
              <ProgressBar value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                {Math.round(progress)}% — {Math.round((numSimulations * progress) / 100)} / {numSimulations}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Results ── */}
      {results && (
        <>
          {(() => {
            const isSequential = Math.min(...results.profits) === Math.max(...results.profits);
            const netProfit = results.profits[0];
            const maxDrawdown = results.drawdowns[0];
            const winRate = (filteredTrades.filter(t => t.profit > 0).length / filteredTrades.length) * 100;

            return (
              <>
                {isSequential && (
                  <Card className="border-border/50 shadow-lg overflow-hidden bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <History className="h-5 w-5" />
                        <CardTitle className="text-lg">{t('monteCarlo.sequentialTitle')}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        {t('monteCarlo.sequentialNote')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('dashboard.netProfit')}</p>
                          <p className={cn("text-lg font-black", netProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {formatCurrency(netProfit, currentSession?.currency || 'USD')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('dashboard.maxDrawdown')}</p>
                          <p className="text-lg font-black text-rose-500">
                            {formatCurrency(maxDrawdown, currentSession?.currency || 'USD')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('dashboard.trades')}</p>
                          <p className="text-lg font-black">{filteredTrades.length}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('dashboard.winRate')}</p>
                          <p className="text-lg font-black">{winRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <StatisticsCards
                  results={results}
                  currency={currentSession?.currency || 'USD'}
                  accountBalance={accountBalance}
                  isSequential={isSequential}
                />

                {!isSequential && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DistributionChart
                      data={results.profits}
                      title={t('monteCarlo.profitDistribution')}
                      description={t('monteCarlo.profitDistributionDesc')}
                      variant="profit"
                      currency={currentSession?.currency || 'USD'}
                    />
                    <DistributionChart
                      data={results.drawdowns}
                      title={t('monteCarlo.drawdownDistribution')}
                      description={t('monteCarlo.drawdownDistributionDesc')}
                      variant="drawdown"
                      currency={currentSession?.currency || 'USD'}
                    />
                  </div>
                )}

                <MonteCarloGuide />
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
