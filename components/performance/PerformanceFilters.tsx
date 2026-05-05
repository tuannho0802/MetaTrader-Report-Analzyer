"use client";

import React from "react";
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
import { X, Filter, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  selectedSessions: string[];
  startDate: string;
  endDate: string;
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
  const toggleSession = (id: string) => {
    const next = filters.selectedSessions.includes(id)
      ? filters.selectedSessions.filter((s) => s !== id)
      : [...filters.selectedSessions, id];
    onChange({ ...filters, selectedSessions: next });
  };

  const hasActiveFilters =
    filters.selectedSessions.length > 0 ||
    filters.startDate ||
    filters.endDate ||
    filters.selectedEA !== "all";

  const handleReset = () =>
    onChange({ selectedSessions: [], startDate: "", endDate: "", selectedEA: "all" });

  return (
    <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-start">
          {/* Filter icon */}
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground self-center shrink-0">
            <Filter size={14} />
            Filters
          </div>

          {/* Session toggle chips */}
          <div className="flex flex-wrap gap-2 flex-1">
            {sessions.map((s) => {
              const active = filters.selectedSessions.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggleSession(s.value)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-border/60 self-center" />

          {/* Date range */}
          <div className="flex items-center gap-2">
            <CalendarRange size={14} className="text-muted-foreground shrink-0" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
              className="text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
              className="text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* EA dropdown */}
          <Select
            value={filters.selectedEA}
            onValueChange={(v) => onChange({ ...filters, selectedEA: v ?? "all" })}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All EAs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All EAs</SelectItem>
              {eaOptions.map((ea) => (
                <SelectItem key={ea.value} value={ea.value}>
                  {ea.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X size={12} />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
