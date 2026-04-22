import { MT5Report, MT5AccountInfo, MT5ExportInfo, MT5Trade, MT5Summary } from './types';

// ─── Section Headers ─────────────────────────────────────────────
const SECTION_ACCOUNT = '=== ACCOUNT INFORMATION ===';
const SECTION_EXPORT  = '=== EXPORT INFORMATION ===';
const SECTION_HISTORY = '=== TRADING HISTORY ===';
const SECTION_SUMMARY = '=== EXPORT SUMMARY ===';

// Expected column names from the CSV header row
const EXPECTED_COLUMNS = [
  'Ticket', 'Magic Number', 'Open Time', 'Close Time',
  'Duration (Hours)', 'Type', 'Volume', 'Symbol',
  'Open Price', 'Close Price', 'S/L', 'T/P',
  'Points', 'Profit', 'Swap', 'Commission',
  'Net Profit', 'Net Profit %', 'Comment', 'Entry ID', 'Exit ID',
];

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Parses a "Key,Value" line into its parts.
 * Handles values that may themselves contain commas (e.g. file paths).
 */
function parseKeyValue(line: string): { key: string; value: string } {
  const idx = line.indexOf(',');
  if (idx === -1) return { key: line.trim(), value: '' };
  return {
    key: line.slice(0, idx).trim(),
    value: line.slice(idx + 1).trim(),
  };
}

/**
 * Parses a CSV data row respecting quoted fields.
 * Simple implementation sufficient for MT5 CSV (no embedded newlines in fields).
 */
function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Strips common MT5 symbol suffixes (.s, .raw, .ecn, etc.)
 * while keeping the raw value available if needed.
 * Exported so callers can opt-in.
 */
export function normalizeSymbol(symbol: string): string {
  return symbol.replace(/\.[a-z]+$/i, '');
}

// ─── Section Parsers ─────────────────────────────────────────────

function parseAccountInfo(lines: string[]): MT5AccountInfo {
  const info: Partial<MT5AccountInfo> = {};

  for (const line of lines) {
    if (!line || line.startsWith('===')) break;
    const { key, value } = parseKeyValue(line);
    switch (key) {
      case 'Account Name':     info.accountName      = value; break;
      case 'Account Number':   info.accountNumber    = value; break;
      case 'Broker':           info.broker           = value; break;
      case 'Server':           info.server           = value; break;
      case 'Account Currency': info.accountCurrency  = value; break;
      case 'Leverage':         info.leverage         = value; break;
      case 'Current Balance':  info.currentBalance   = parseFloat(value) || 0; break;
      case 'Current Equity':   info.currentEquity    = parseFloat(value) || 0; break;
    }
  }

  return {
    accountName:      info.accountName      ?? '',
    accountNumber:    info.accountNumber    ?? '',
    broker:           info.broker           ?? '',
    server:           info.server           ?? '',
    accountCurrency:  info.accountCurrency  ?? '',
    leverage:         info.leverage         ?? '',
    currentBalance:   info.currentBalance   ?? 0,
    currentEquity:    info.currentEquity    ?? 0,
  };
}

function parseExportInfo(lines: string[]): MT5ExportInfo {
  const info: Partial<MT5ExportInfo> = {};

  for (const line of lines) {
    if (!line || line.startsWith('===')) break;
    const { key, value } = parseKeyValue(line);
    switch (key) {
      case 'Export Date/Time': info.exportDateTime  = value; break;
      case 'Date Range From':  info.dateRangeFrom   = value; break;
      case 'Date Range To':    info.dateRangeTo     = value; break;
      case 'Terminal':         info.terminal        = value; break;
      case 'Terminal Build':   info.terminalBuild   = parseInt(value, 10) || 0; break;
      case 'Terminal Company': info.terminalCompany = value; break;
      case 'Export Path':      info.exportPath      = value; break;
    }
  }

  return {
    exportDateTime:  info.exportDateTime  ?? '',
    dateRangeFrom:   info.dateRangeFrom   ?? '',
    dateRangeTo:     info.dateRangeTo     ?? '',
    terminal:        info.terminal        ?? '',
    terminalBuild:   info.terminalBuild   ?? 0,
    terminalCompany: info.terminalCompany ?? '',
    exportPath:      info.exportPath      ?? '',
  };
}

function parseTrades(lines: string[]): MT5Trade[] {
  const trades: MT5Trade[] = [];

  // First non-empty line after the section header must be the column header row
  let headerLine = '';
  let headerIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) {
      headerLine = lines[i];
      headerIdx = i;
      break;
    }
  }

  if (!headerLine) return trades;

  // Validate columns
  const cols = parseCsvRow(headerLine);
  for (const expected of EXPECTED_COLUMNS) {
    if (!cols.includes(expected)) {
      throw new Error(
        `Invalid MT5 CSV format: Missing required column "${expected}". ` +
        `Found columns: ${cols.join(', ')}`
      );
    }
  }

  // Build index map for resilient column lookup
  const idx: Record<string, number> = {};
  cols.forEach((col, i) => { idx[col] = i; });

  // Parse data rows
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('===')) break;

    const cells = parseCsvRow(line);
    if (cells.length < EXPECTED_COLUMNS.length) continue; // skip partial rows

    const ticket = cells[idx['Ticket']] ?? '';
    if (!ticket || !/^\d+$/.test(ticket)) continue; // skip non-trade rows

    const trade: MT5Trade = {
      // Core fields
      ticket,
      eaId:             cells[idx['Magic Number']]  ?? '',
      openTime:         cells[idx['Open Time']]     ?? '',
      closeTime:        cells[idx['Close Time']]    ?? '',
      type:             (cells[idx['Type']] ?? '').toLowerCase(),
      size:             cells[idx['Volume']]        ?? '0',
      item:             cells[idx['Symbol']]        ?? '',
      openPrice:        cells[idx['Open Price']]    ?? '0',
      closePrice:       cells[idx['Close Price']]   ?? '0',
      swap:             cells[idx['Swap']]          ?? '0',
      commission:       cells[idx['Commission']]    ?? '0',
      profit:           parseFloat(cells[idx['Net Profit']] ?? '0') || 0,
      comment:          cells[idx['Comment']]       ?? '',

      // Extended MT5-only fields
      durationHours:    parseFloat(cells[idx['Duration (Hours)']] ?? '0') || 0,
      stopLoss:         cells[idx['S/L']]           ?? '0',
      takeProfit:       cells[idx['T/P']]           ?? '0',
      points:           parseFloat(cells[idx['Points']] ?? '0') || 0,
      grossProfit:      parseFloat(cells[idx['Profit']] ?? '0') || 0,
      netProfitPercent: parseFloat(cells[idx['Net Profit %']] ?? '0') || 0,
      entryId:          cells[idx['Entry ID']]      ?? '',
      exitId:           cells[idx['Exit ID']]       ?? '',
    };

    trades.push(trade);
  }

  return trades;
}

function parseSummary(lines: string[]): MT5Summary {
  const s: Partial<MT5Summary> = {};

  for (const line of lines) {
    if (!line || line.startsWith('===')) break;
    const { key, value } = parseKeyValue(line);
    switch (key) {
      case 'Total Positions Exported': s.totalPositionsExported = parseInt(value, 10) || 0; break;
      case 'Total Gross Profit':       s.totalGrossProfit       = parseFloat(value) || 0; break;
      case 'Total Commission':         s.totalCommission        = parseFloat(value) || 0; break;
      case 'Total Swap':               s.totalSwap              = parseFloat(value) || 0; break;
      case 'Total Net Profit':         s.totalNetProfit         = parseFloat(value) || 0; break;
    }
  }

  return {
    totalPositionsExported: s.totalPositionsExported ?? 0,
    totalGrossProfit:       s.totalGrossProfit       ?? 0,
    totalCommission:        s.totalCommission        ?? 0,
    totalSwap:              s.totalSwap              ?? 0,
    totalNetProfit:         s.totalNetProfit         ?? 0,
  };
}

// ─── Main Parser ─────────────────────────────────────────────────

/**
 * Parses an MT5 exported CSV file and returns a structured MT5Report.
 *
 * The MT5 CSV format has four distinct sections separated by
 * "=== SECTION NAME ===" headers. Each section is parsed independently,
 * making the parser resilient to missing optional sections.
 *
 * @param fileContent - Raw CSV string (UTF-8)
 * @returns MT5Report with accountInfo, exportInfo, trades, and summary
 * @throws Error if the file is not a valid MT5 CSV
 */
export function parseMT5Csv(fileContent: string): MT5Report {
  // Normalize line endings and split
  const lines = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Validate this is an MT5 CSV at all
  const hasHistory = lines.some(l => l.trim().startsWith(SECTION_HISTORY));
  if (!hasHistory) {
    throw new Error(
      'Invalid MT5 CSV format: Missing "=== TRADING HISTORY ===" section. ' +
      'Please export the file from MT5 using the full history export.'
    );
  }

  // Build section start index map
  const sectionStart: Record<string, number> = {};
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t === SECTION_ACCOUNT) sectionStart[SECTION_ACCOUNT] = i + 1;
    if (t === SECTION_EXPORT)  sectionStart[SECTION_EXPORT]  = i + 1;
    if (t === SECTION_HISTORY) sectionStart[SECTION_HISTORY] = i + 1;
    if (t === SECTION_SUMMARY) sectionStart[SECTION_SUMMARY] = i + 1;
  });

  // Slice out section content (lines after the header until EOF or next section)
  function sectionLines(key: string): string[] {
    const start = sectionStart[key];
    if (start === undefined) return [];
    const result: string[] = [];
    for (let i = start; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t.startsWith('===') && t.endsWith('===') && t !== key) break;
      result.push(t);
    }
    return result;
  }

  const accountInfo = parseAccountInfo(sectionLines(SECTION_ACCOUNT));
  const exportInfo  = parseExportInfo(sectionLines(SECTION_EXPORT));
  const trades      = parseTrades(sectionLines(SECTION_HISTORY));
  const summary     = parseSummary(sectionLines(SECTION_SUMMARY));

  return { accountInfo, exportInfo, trades, summary };
}
