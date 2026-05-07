"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, Filter, Calendar as CalendarIcon, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { RefreshCw } from "lucide-react";

export interface FilterState {
  selectedSessions: string[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  selectedEA: string;
}

interface SessionOption {
  value: string;
  label: string;
}

interface EAOption {
  value: string;
  label: string;
}

interface PerformanceFiltersProps {
  sessions: SessionOption[];
  eaOptions: EAOption[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function PerformanceFilters({
  sessions,
  eaOptions,
  filters,
  onChange,
}: PerformanceFiltersProps) {
  const { t } = useTranslation();
  const { autoConvertCurrency, setAutoConvertCurrency, baseCurrency } = useSettingsStore();

  console.log('Toggle state:', autoConvertCurrency);

  // Local state for debouncing
  const [localEA, setLocalEA] = useState(filters.selectedEA);
  const [localStart, setLocalStart] = useState<Date | undefined>(filters.startDate);
  const [localEnd, setLocalEnd] = useState<Date | undefined>(filters.endDate);

  // Sync local state when external filters change (e.g. on reset)
  useEffect(() => {
    setLocalEA(filters.selectedEA);
    setLocalStart(filters.startDate);
    setLocalEnd(filters.endDate);
  }, [filters.selectedEA, filters.startDate, filters.endDate]);

  // Debounce effect for EA and Dates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        localEA !== filters.selectedEA ||
        localStart !== filters.startDate ||
        localEnd !== filters.endDate
      ) {
        onChange({
          ...filters,
          selectedEA: localEA,
          startDate: localStart,
          endDate: localEnd,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localEA, localStart, localEnd, filters, onChange]);

  const toggleSession = (id: string) => {
    const next = filters.selectedSessions.includes(id)
      ? filters.selectedSessions.filter((s) => s !== id)
      : [...filters.selectedSessions, id];
    onChange({ ...filters, selectedSessions: next });
  };

  const isAllSessions = filters.selectedSessions.length === 0;

  const handleReset = () => {
    onChange({
      selectedSessions: [],
      startDate: undefined,
      endDate: undefined,
      selectedEA: "all",
    });
  };

  const hasActiveFilters =
    filters.selectedSessions.length > 0 ||
    localStart !== undefined ||
    localEnd !== undefined ||
    localEA !== "all";

  return (
    <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <CardContent className="p-4 flex flex-col gap-4">
        {/* Session Chips */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Filter size={10} />
            {t("performance.filters.sessions")}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onChange({ ...filters, selectedSessions: [] })}
              className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200",
                isAllSessions
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {isAllSessions && <Check size={12} className="mr-1.5" />}
              {t("performance.filters.allSessions")}
            </button>
            {sessions.map((s) => {
              const active = filters.selectedSessions.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggleSession(s.value)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {active && <Check size={12} className="mr-1.5" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Date range with Popover/Calendar */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon size={10} />
              {t("performance.filters.dateRange")}
            </label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 px-3 text-xs font-medium bg-background border-border hover:bg-muted/50 transition-all",
                      !localStart && "text-muted-foreground"
                    )}
                  >
                    {localStart ? format(localStart, "PPP") : t("performance.filters.startDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localStart}
                    onSelect={setLocalStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs">–</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 px-3 text-xs font-medium bg-background border-border hover:bg-muted/50 transition-all",
                      !localEnd && "text-muted-foreground"
                    )}
                  >
                    {localEnd ? format(localEnd, "PPP") : t("performance.filters.endDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localEnd}
                    onSelect={setLocalEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(localStart || localEnd) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setLocalStart(undefined);
                    setLocalEnd(undefined);
                  }}
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          </div>

          {/* EA dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Check size={10} />
              {t("performance.filters.ea")}
            </label>
            <Select value={localEA} onValueChange={(val) => setLocalEA(val ?? "all")}>
              <SelectTrigger className="w-[200px] h-9 text-xs bg-background border-border hover:bg-muted/50 transition-all">
                <SelectValue placeholder={t("performance.filters.allEa")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("performance.filters.allEa")}</SelectItem>
                {eaOptions.map((ea) => (
                  <SelectItem key={ea.value} value={ea.value}>
                    {ea.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto Convert Toggle */}
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <RefreshCw size={10} />
              {t("performance.filters.currencyMode") || "Currency Mode"}
            </label>
            <div className="flex items-center space-x-2 h-9 bg-background border border-border px-3 rounded-md">
              <Switch 
                id="auto-convert" 
                checked={autoConvertCurrency} 
                onCheckedChange={(val) => {
                  console.log('Toggle state changed:', val);
                  setAutoConvertCurrency(val);
                }}
              />
              <Label htmlFor="auto-convert" className="text-xs cursor-pointer select-none">
                {autoConvertCurrency 
                  ? `Auto-convert to ${baseCurrency}` 
                  : "Show original currency"}
              </Label>
            </div>
          </div>

          {/* Reset */}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 gap-1.5 transition-all font-semibold"
            >
              <RotateCcw size={14} />
              {t("performance.filters.reset")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
