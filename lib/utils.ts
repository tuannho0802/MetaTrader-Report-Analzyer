import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Trade, AnalysisSession } from "./types"
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

/**
 * Generates a unique key for an EA series based on sessionId and eaId
 */
export const generateSeriesKey = (sessionId: string, eaId: string) => {
  return `${sessionId}::${eaId}`;
};

/**
 * Generates a consistent and unique display name for an EA series.
 * Format: EA #112 (ReportName #1, 2026-03-15)
 */
export const generateDisplayName = (
  session: AnalysisSession | undefined,
  eaId: string,
  allSessions: AnalysisSession[]
): string => {
  const cleanEaId = eaId === "Unknown" ? "Unknown EA" : (isNaN(Number(eaId)) ? eaId : `EA #${eaId}`);
  
  if (!session) return cleanEaId;

  const reportName = session.name || session.fileName || 'Unknown Session';
  
  // Group sessions by report name to identify duplicates
  const sameReportSessions = allSessions.filter(
    s => (s.name || s.fileName || 'Unknown Session') === reportName
  );
  
  // Sort by creation time to assign stable indices
  const sortedSessions = [...sameReportSessions].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const index = sortedSessions.findIndex(s => s.id === session.id);
  
  // Format the date part (use startDate if available)
  let dateStr = "";
  if (session.startDate) {
    // Assuming startDate is "YYYY.MM.DD" or similar
    dateStr = session.startDate.split(" ")[0].replace(/\./g, "-");
  }

  // Construct the session label part
  let sessionLabel = reportName;
  if (sameReportSessions.length > 1 && index !== -1) {
    sessionLabel += ` #${index + 1}`;
  }
  
  if (dateStr) {
    return `${cleanEaId} (${sessionLabel}, ${dateStr})`;
  }
  
  return `${cleanEaId} (${sessionLabel})`;
};
