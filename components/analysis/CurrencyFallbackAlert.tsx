"use client";

import React, { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useTranslation } from "@/lib/i18n";
import { AlertTriangle, X, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating toast that appears when the app is using hardcoded
 * (offline) fallback exchange rates. It auto-dismisses after 8 s
 * and the user can also close it manually.
 */
export function CurrencyFallbackAlert() {
  const { isUsingFallbackRates, autoConvertCurrency, baseCurrency } =
    useSettingsStore();
  const { language } = useTranslation();

  const [visible, setVisible] = useState(false);

  // Show the toast whenever fallback becomes active
  useEffect(() => {
    if (isUsingFallbackRates && autoConvertCurrency) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isUsingFallbackRates, autoConvertCurrency]);

  if (!visible) return null;

  const title =
    language === "vi"
      ? "Đang dùng tỉ giá dự phòng"
      : "Using fallback exchange rates";

  const message =
    language === "vi"
      ? `Không thể kết nối internet. Tỉ giá cho ${baseCurrency} là tỉ giá ước tính, có thể không chính xác tuyệt đối.`
      : `Unable to reach exchange rate servers. Approximate rates are being used for ${baseCurrency}. Numbers may differ slightly from live values.`;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 max-w-sm w-full",
        "bg-amber-50 dark:bg-amber-950/80 border border-amber-400/50",
        "rounded-xl shadow-2xl backdrop-blur-sm p-4",
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 bg-amber-400/20 rounded-lg shrink-0">
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {title}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
            {message}
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-amber-600 dark:text-amber-400 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-0.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full animate-[shrink_8s_linear_forwards]"
          style={{
            animation: "shrink 8s linear forwards",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
