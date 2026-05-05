"use client";

import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";
import { useTranslation } from "@/lib/i18n";

export default function PerformancePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t("analysis.performance")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aggregate performance across all your uploaded sessions
          </p>
        </div>
      </div>
      <PerformanceDashboard />
    </div>
  );
}
