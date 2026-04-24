"use client";

import React from "react";
import { TranslationProvider } from "@/lib/i18n";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}
