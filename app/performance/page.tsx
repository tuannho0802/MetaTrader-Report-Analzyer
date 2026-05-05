"use client";

import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";
import { useTranslation } from "@/lib/i18n";

export default function PerformancePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">
          {t("performance.title")}
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          {t("performance.subtitle")}
        </p>
      </div>
      <PerformanceDashboard />
    </div>
  );
}
