import { Trade, FilterParams, ParseResult, FilterMode } from "./types";

export function parseMT4Date(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const match = dateStr.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, min, sec] = match.map(Number);
  return new Date(year, month - 1, day, hour, min, sec);
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

export function recalculateResult(allTrades: Trade[], params: FilterParams): ParseResult {
  const { filtered, totalProfit } = filterTrades(allTrades, params);
  return {
    totalProfit,
    trades: filtered,
    totalFound: allTrades.length,
    currency: params.currency || 'USD',
    startDate: (params as any).reportStartDate || null,
    endDate: (params as any).reportEndDate || null
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
  // Pattern: "Period: 2024.01.01 00:00 - 2024.04.24 12:00"
  const periodMatch = allText.match(/Period:\s*(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})\s*-\s*(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})/i);
  if (periodMatch) {
    startDate = periodMatch[1].replace(/\./g, '-');
    endDate = periodMatch[2].replace(/\./g, '-');
  } else {
    // Try another pattern: "From: ... To: ..."
    const fromToMatch = allText.match(/From:\s*(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})\s*To:\s*(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})/i);
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
  let totalFound = 0;

  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    const tds = tr.querySelectorAll("td");

    if (tr.textContent?.includes("Closed Transactions:")) continue;
    
    if (tds.length >= 14 && tds.length <= 15) {
      const ticketText = tds[0].textContent?.trim() || "";
      if (!/^\d+$/.test(ticketText)) continue;

      const type = tds[2].textContent?.trim().toLowerCase() || "";
      if (type === "balance" || type === "credit") continue;

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
      const commission = tds[10].textContent?.trim() || "";
      const swap = tds[12].textContent?.trim() || "";
      const profitStr = tds[13].textContent?.replace(/[^\d.-]/g, "") || "0";
      const profit = parseFloat(profitStr);

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
        commission,
        swap,
        profit,
        comment,
        similarity: 0
      });
    }
  }

  const { filtered, totalProfit } = filterTrades(allExtractedTrades, params);

  return {
    totalProfit,
    trades: filtered,
    totalFound,
    currency,
    startDate,
    endDate
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
