"use client";

import { useTranslation } from "@/lib/i18n";
import React from "react";

interface TranslatedTextProps {
  tKey: string;
  className?: string;
  as?: 'span' | 'div' | 'p';
}

export function TranslatedText({ 
  tKey, 
  className, 
  as: Component = 'span' 
}: TranslatedTextProps) {
  const { t } = useTranslation();
  
  return (
    <Component className={className} suppressHydrationWarning>
      {t(tKey)}
    </Component>
  );
}
