"use client";

import React, { useEffect } from "react";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const { isHydrated, loadCachedSessions } = useAnalysisStore();

  useEffect(() => {
    loadCachedSessions();
  }, [loadCachedSessions]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
