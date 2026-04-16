import { Trade, FilterParams, ParseResult } from "./types";

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

export function parseHTMLStatement(html: string, params: FilterParams): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

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
  const trades: Trade[] = [];
  let totalFound = 0;
  let totalProfit = 0;

  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    const tds = tr.querySelectorAll("td");

    if (tr.textContent?.includes("Closed Transactions:")) continue;
    if (tds.length === 1 && tr.getAttribute("colspan")) continue;

    if (tds.length >= 14) {
      const ticketText = tds[0].textContent?.trim() || "";
      if (!/^\d+$/.test(ticketText)) continue;

      totalFound++;

      const ticket = ticketText;
      const openTime = tds[1].textContent?.trim() || "";
      const type = tds[2].textContent?.trim() || "";
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
        let commentTd = null;
        if (nextTds.length > 0 && nextTds.length < 5) {
          for (let j = 0; j < nextTds.length; j++) {
            const colSpan = nextTds[j].getAttribute("colspan");
            if (colSpan && parseInt(colSpan, 10) >= 7) {
              isCommentRow = true;
              commentTd = nextTds[j];
              break;
            }
          }
        }

        if (isCommentRow && commentTd) {
          comment = commentTd.textContent?.trim() || "";
          i++; 
        }
      }

      const tradeDate = parseMT4Date(closeTime) || parseMT4Date(openTime);

      let isDateMatch = true;
      if (tradeDate && params.startDate && params.endDate) {
         const st = new Date(params.startDate);
         st.setHours(0, 0, 0, 0);
         const en = new Date(params.endDate);
         en.setHours(23, 59, 59, 999);
         isDateMatch = tradeDate >= st && tradeDate <= en;
      }

      let similarity = 0;
      let matched = false;
      const p = params.commentPattern.toLowerCase().trim();
      const c = comment.toLowerCase().trim();

      if (c.includes(p)) {
        matched = true;
        similarity = 100;
      } else {
        similarity = diceCoefficient(p, c) * 100;
        matched = similarity >= params.threshold;
      }

      if (isDateMatch && matched) {
        trades.push({
          ticket,
          openTime,
          type,
          size,
          item,
          openPrice,
          closeTime,
          closePrice,
          commission,
          swap,
          profit,
          comment,
          similarity
        });
        totalProfit += profit;
      }
    }
  }

  if (trades.length === 0 && totalFound > 0) {
     const st = new Date();
     // If we had no match because of strict conditions, it will naturally return empty
  }

  return {
    totalProfit,
    trades,
    totalFound
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
