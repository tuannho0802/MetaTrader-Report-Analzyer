import { Trade, FilterParams, ParseResult, FilterMode } from "./types";

export function parseMT4Date(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const match = dateStr.trim().match(/^(\d{4})[./](\d{2})[./](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const [, year, month, day, hour, min, sec] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), sec ? Number(sec) : 0);
}

export function diceCoefficient(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;
  const bigrams1 = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.slice(i, i + 2);
    bigrams1.set(bg, (bigrams1.get(bg) ?? 0) + 1);
  }
  let intersect = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.slice(i, i + 2);
    const count = bigrams1.get(bg) ?? 0;
    if (count > 0) {
      intersect++;
      bigrams1.set(bg, count - 1);
    }
  }
  return (2 * intersect) / (s1.length - 1 + (s2.length - 1));
}

export function isCommentMatch(pattern: string, comment: string, threshold: number): boolean {
  if (!comment) return false;
  const p = pattern.toLowerCase().trim();
  const c = comment.toLowerCase().trim();
  if (c.includes(p)) return true;
  return diceCoefficient(p, c) * 100 >= threshold;
}

function matchesTrade(trade: Trade, params: FilterParams): { matched: boolean, similarity: number } {
  const pattern = params.commentPattern.toLowerCase().trim();
  if (!pattern) return { matched: true, similarity: 0 };

  const mode = params.filterMode;
  const threshold = params.threshold;
  const comment = (trade.comment || "").toLowerCase().trim();
  const eaId = (trade.eaId || "").toLowerCase().trim();

  let idMatched = eaId.includes(pattern);
  
  let commentMatched = false;
  let similarity = 0;
  if (isCommentMatch(params.commentPattern, trade.comment, threshold)) {
    commentMatched = true;
    if (comment.includes(pattern)) {
      similarity = 100;
    } else {
      similarity = diceCoefficient(pattern, comment) * 100;
    }
  }

  switch (mode) {
    case 'id':
      return { matched: idMatched, similarity: idMatched ? 100 : 0 };
    case 'comment':
      return { matched: commentMatched, similarity };
    case 'both':
      return { matched: idMatched && commentMatched, similarity };
    default:
      return { matched: false, similarity: 0 };
  }
}

export function filterTrades(trades: Trade[], params: FilterParams): { filtered: Trade[], totalProfit: number } {
  const filtered: Trade[] = [];
  let totalProfit = 0;

  const st = params.startDate ? new Date(params.startDate) : null;
  const en = params.endDate ? new Date(params.endDate) : null;
  
  if (st) st.setHours(0, 0, 0, 0);
  if (en) en.setHours(23, 59, 59, 999);

  trades.forEach(t => {
    // 1. Filter by Date
    const tradeDate = parseMT4Date(t.closeTime) || parseMT4Date(t.openTime);
    let isDateMatch = true;
    if (tradeDate && st && en) {
       isDateMatch = tradeDate >= st && tradeDate <= en;
    }

    // 2. Filter by Mode (ID, Comment, Both)
    const { matched, similarity } = matchesTrade(t, params);

    if (isDateMatch && matched) {
      filtered.push({ ...t, similarity });
      totalProfit += t.profit;
    }
  });

  return { filtered, totalProfit };
}

export function recalculateResult(allTrades: Trade[], params: FilterParams, initialBalance?: number, finalBalance?: number): ParseResult {
  const { filtered, totalProfit } = filterTrades(allTrades, params);
  if (initialBalance !== undefined) {
    console.log(`[Recalculate] initialBalance preserved: ${initialBalance}`);
  }
  return {
    totalProfit,
    trades: filtered,
    totalFound: allTrades.length,
    currency: params.currency || 'USD',
    startDate: (params as any).reportStartDate || null,
    endDate: (params as any).reportEndDate || null,
    initialBalance,
    finalBalance
  };
}

export function parseHTMLStatement(html: string, params: FilterParams & { currency?: string }): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  // Extract Currency from Account Info
  let currency = 'USD';
  const bTags = doc.querySelectorAll('b');
  for (const b of Array.from(bTags)) {
    if (b.textContent?.includes('Currency:')) {
      const parentText = b.parentElement?.textContent || '';
      const match = parentText.match(/Currency:\s*(\w+)/i);
      if (match) {
        currency = match[1].toUpperCase();
        break;
      }
    }
  }

  // Extract Date Range from header info
  let startDate: string | null = null;
  let endDate: string | null = null;
  
  const allText = doc.body.textContent || "";
  const periodMatch = allText.match(/Period:\s*(?:Custom\s*)?\(?(\d{4}\.\d{2}\.\d{2})(?:\s+\d{2}:\d{2})?\s*-\s*(\d{4}\.\d{2}\.\d{2})(?:\s+\d{2}:\d{2})?\)?/i);
  if (periodMatch) {
    startDate = periodMatch[1].replace(/\./g, '-');
    endDate = periodMatch[2].replace(/\./g, '-');
  } else {
    // Attempt to find another pattern like "From: 2024.01.01 To: 2024.04.24"
    const fromToMatch = allText.match(/From:\s*(\d{4}\.\d{2}\.\d{2})(?:\s+\d{2}:\d{2})?\s*To:\s*(\d{4}\.\d{2}\.\d{2})(?:\s+\d{2}:\d{2})?/i);
    if (fromToMatch) {
      startDate = fromToMatch[1].replace(/\./g, '-');
      endDate = fromToMatch[2].replace(/\./g, '-');
    }
  }

  const allTables = doc.querySelectorAll("table");
  let targetTable = null;

  for (let i = 0; i < allTables.length; i++) {
    const table = allTables[i];
    if (table.textContent?.includes("Closed Transactions:")) {
      targetTable = table;
      break;
    }
  }

  if (!targetTable) {
    for (let i = 0; i < allTables.length; i++) {
      const table = allTables[i];
      if (table.textContent?.includes("Ticket") && table.textContent?.includes("Item")) {
        targetTable = table;
        break;
      }
    }
  }

  if (!targetTable) {
    throw new Error("Không tìm thấy bảng giao dịch trong file. Vui lòng kiểm tra file.");
  }

  const rows = targetTable.querySelectorAll("tr");
  const allExtractedTrades: Trade[] = [];
  const balanceOperations: number[] = [];
  let totalFound = 0;
  let initialBalance = 0;

  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    const tds = tr.querySelectorAll("td");

    if (tr.textContent?.includes("Closed Transactions:")) continue;

    const type = tds[2]?.textContent?.trim().toLowerCase() || "";
    
    // Check for Balance/Credit row
    if (type === "balance" || type === "credit") {
      // Find comment text — look for a td with colspan="10" first,
      // then fall back to the second-to-last cell (common in some MT4 variants).
      let commentText = "";
      const tdArray = Array.from(tds);
      const commentTd = tdArray.find(td => td.getAttribute("colspan") === "10");
      if (commentTd) {
        commentText = (commentTd.textContent || "").trim().toLowerCase();
      } else if (tdArray.length >= 2) {
        commentText = (tdArray[tdArray.length - 2]?.textContent || "").trim().toLowerCase();
      }

      // Parse balance value — handle non-breaking spaces (\u00a0) and thousands separators
      const valueCell = tdArray[tdArray.length - 1];
      const rawValue = (valueCell?.textContent || "").replace(/[\u00a0\s,]/g, "");
      const value = parseFloat(rawValue.replace(/[^\d.-]/g, "") || "0");

      const isInitialBalance =
        commentText.includes("initial balance") ||
        commentText.includes("initial deposit") ||
        commentText.includes("starting balance") ||
        commentText.includes("balance initial");

      if (isInitialBalance && initialBalance === 0) {
        initialBalance = value;
        console.log(`[Parser] Found initial balance: ${value} (comment: "${commentText}")`);
      } else {
        balanceOperations.push(value);
      }
      continue;
    }

    if (tds.length >= 14 && tds.length <= 15) {
      const ticketText = tds[0].textContent?.trim() || "";
      if (!/^\d+$/.test(ticketText)) continue;

      totalFound++;

      const ticket = ticketText;
      const ticketCell = tds[0];
      const titleAttr = ticketCell.getAttribute('title') || '';
      const idMatch = titleAttr.match(/^#(\S+)/);
      const eaId = idMatch ? idMatch[1] : '';

      const openTime = tds[1].textContent?.trim() || "";
      const size = tds[3].textContent?.trim() || "";
      const item = tds[4].textContent?.trim() || "";
      const openPrice = tds[5].textContent?.trim() || "";
      const closeTime = tds[8].textContent?.trim() || "";
      const closePrice = tds[9].textContent?.trim() || "";
      const commissionStr = tds[10].textContent?.replace(/[^\d.-]/g, "") || "0";
      const commission = parseFloat(commissionStr);
      const swapStr = tds[12].textContent?.replace(/[^\d.-]/g, "") || "0";
      const swap = parseFloat(swapStr);
      const profitStr = tds[13].textContent?.replace(/[^\d.-]/g, "") || "0";
      const profit = parseFloat(profitStr);
      
      let balance: number | undefined = undefined;
      if (tds.length >= 15) {
        const balanceStr = tds[14].textContent?.replace(/[^\d.-]/g, "");
        if (balanceStr) {
          balance = parseFloat(balanceStr);
        }
      }

      let comment = "";

      if (i + 1 < rows.length) {
        const nextTr = rows[i + 1];
        const nextTds = nextTr.querySelectorAll("td");
        let isCommentRow = false;
        if (nextTds.length > 0 && nextTds.length <= 6) {
          const firstTdColspan = parseInt(nextTds[0].getAttribute("colspan") || "1", 10);
          if (firstTdColspan >= 7) isCommentRow = true;
        }

        if (isCommentRow) {
          const lastTd = nextTds[nextTds.length - 1];
          comment = lastTd.textContent?.trim() || "";
          if (comment === "\u00a0") comment = "";
          i++; 
        }
      }

      allExtractedTrades.push({
        ticket,
        eaId,
        openTime,
        type: tds[2].textContent?.trim() || "",
        size,
        item,
        openPrice,
        closeTime,
        closePrice,
        commission: commissionStr,
        swap: swapStr,
        profit,
        balance,
        comment,
        similarity: 0
      });
    }
  }

  // Fallback 1: derive initialBalance from Deposit/Withdrawal
  if (initialBalance === 0) {
    const allTds = doc.querySelectorAll("td");
    for (let i = 0; i < allTds.length; i++) {
      if (allTds[i].textContent?.includes("Deposit/Withdrawal:")) {
        const nextTd = allTds[i].nextElementSibling;
        if (nextTd) {
          const rawValue = (nextTd.textContent || "").replace(/[\u00a0\s,]/g, "");
          const value = parseFloat(rawValue.replace(/[^\d.-]/g, "") || "0");
          if (!isNaN(value) && value !== 0) {
            initialBalance = value;
            console.log(`[Parser] Found initial balance from Deposit: ${value}`);
            break;
          }
        }
      }
    }
  }

  // Fallback 2: derive initialBalance from the balance column of the first trade
  if (initialBalance === 0 && allExtractedTrades.length > 0) {
    const firstTrade = allExtractedTrades[0];
    if (firstTrade.balance !== undefined && !isNaN(firstTrade.balance)) {
      initialBalance = firstTrade.balance - (firstTrade.profit || 0);
      console.log(`[Parser] Fallback initial balance from first trade: ${initialBalance}`);
    }
  }

  // Calculate finalBalance = initialBalance + all balance operations + all trade PnL
  let finalBalance = initialBalance;
  balanceOperations.forEach(val => {
    finalBalance += val;
  });
  allExtractedTrades.forEach(t => {
    const p = t.profit || 0;
    const c = parseFloat(t.commission?.replace(/[^\d.-]/g, "") || "0");
    const s = parseFloat(t.swap?.replace(/[^\d.-]/g, "") || "0");
    finalBalance += (p + c + s);
  });

  // Fallback: If startDate or endDate is null, derive from trades
  if ((!startDate || !endDate) && allExtractedTrades.length > 0) {
    let minTime = new Date('2100-01-01').getTime();
    let maxTime = new Date('1970-01-01').getTime();
    
    for (const trade of allExtractedTrades) {
      if (!trade.closeTime) continue;
      // Convert "YYYY.MM.DD HH:mm:ss" to "YYYY/MM/DD HH:mm:ss" for robust cross-browser parsing (Safari doesn't like "-")
      const timeStr = trade.closeTime.replace(/\./g, '/');
      const timeVal = new Date(timeStr).getTime();
      if (!isNaN(timeVal)) {
        if (timeVal < minTime) minTime = timeVal;
        if (timeVal > maxTime) maxTime = timeVal;
      }
    }
    
    if (minTime <= maxTime && minTime !== new Date('2100-01-01').getTime()) {
      const minDate = new Date(minTime);
      const maxDate = new Date(maxTime);
      
      const formatFallback = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      if (!startDate) startDate = formatFallback(minDate);
      if (!endDate) endDate = formatFallback(maxDate);
    }
  }

  const { filtered, totalProfit } = filterTrades(allExtractedTrades, params);

  console.log("MT4 PARSER DATES:", { startDate, endDate });

  return {
    totalProfit,
    trades: filtered,
    totalFound,
    currency,
    startDate,
    endDate,
    initialBalance,
    finalBalance
  };
}

export function runParserWorker(
  file: File,
  params: FilterParams,
  onProgress: (msg: string) => void
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    if (file.size > 30 * 1024 * 1024) {
      reject(new Error("File quá lớn. Vui lòng dùng file dưới 30MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const html = e.target?.result as string;
      try {
        onProgress("Đang phân tích file...");
        setTimeout(() => {
          try {
            const result = parseHTMLStatement(html, params);
            resolve(result);
          } catch(err) {
            reject(err);
          }
        }, 50);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Không đọc được file"));
    reader.readAsText(file, "utf-8");
  });
}
