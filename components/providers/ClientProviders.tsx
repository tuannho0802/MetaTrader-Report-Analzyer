"use client";

import { TranslationProvider } from "@/lib/i18n";
import { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <TranslationProvider>
      {children}
    </TranslationProvider>
  );
}
