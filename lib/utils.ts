import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Trade } from "./types"
import { parseMT4Date } from "./parser"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDrawdown(trades: Trade[], initialBalance = 10000) {
  if (!trades || trades.length === 0) return { percent: 0, amount: 0 };

  // 1. Sort trades by close time
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = parseMT4Date(a.closeTime)?.getTime() || 0;
    const timeB = parseMT4Date(b.closeTime)?.getTime() || 0;
    return timeA - timeB;
  });

  let currentEquity = initialBalance;
  let peakEquity = initialBalance;
  let maxDD_USD = 0;
  let maxDD_Percent = 0;

  for (const trade of sortedTrades) {
    currentEquity += trade.profit;
    
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    } else {
      const currentDD_USD = peakEquity - currentEquity;
      if (currentDD_USD > maxDD_USD) {
        maxDD_USD = currentDD_USD;
      }
      
      const currentDD_Percent = (currentDD_USD / peakEquity) * 100;
      if (currentDD_Percent > maxDD_Percent) {
        maxDD_Percent = currentDD_Percent;
      }
    }
  }

  return {
    percent: maxDD_Percent,
    amount: maxDD_USD
  };
}
