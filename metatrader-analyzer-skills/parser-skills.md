# Parser Skills - MetaTrader Account Statement

This document details the core logic used to parse and extract trade information from MetaTrader 4 (MT4) HTML statements.

## MT4 HTML Structure

MetaTrader 4 exports trading history in a complex table format. The primary data is located in the **"Closed Transactions"** table.

### 1. The Two-Row Structure
Most EA-managed trades in MT4 statements are represented by two consecutive rows:
1. **Trade Row**: Contains transaction details (ticket, time, symbol, price, profit).
2. **Comment Row**: Contains metadata including the EA's comment.

#### HTML Example (Simplified)
```html
<!-- Row 1: Trade Detail -->
<tr align=right>
  <td>12236531</td>              <!-- Ticket -->
  <td class=msdate>2026.04.13</td> <!-- Open Time -->
  <td>buy</td>                    <!-- Type -->
  <td>0.01</td>                   <!-- Size -->
  <td>xauusd</td>                 <!-- Symbol -->
  ...
  <td class=mspt>-2.30</td>      <!-- Profit -->
</tr>

<!-- Row 2: Comment (Follow-up) -->
<tr align=right>
  <td colspan=9>&nbsp;</td>      <!-- Spacer -->
  <td>20250414</td>              <!-- Magic Number/ID -->
  <td colspan=3>BBS41[sl/gap]</td> <!-- Actual Comment -->
</tr>
```

### 2. The Ticket Title Attribute (EA ID)
MT4 statements often hide a shorter EA identifier within the `title` attribute of the Ticket cell. 

**HTML Example:**
```html
<td title="#BBS41 scalp">12265899</td>
```
- **Attribute**: `title="#BBS41 scalp"`
- **Pattern**: `#(\S+)` matches the ID after the hash.
- **Extracted EA ID**: `BBS41`

## Parsing Algorithm

### Identifying a Trade Row
The parser identifies a valid trade row by the following criteria:
- **Column Count**: The row must contain between 14 and 15 `<td>` elements.
- **Ticket ID**: The first cell (`tds[0]`) must contain a purely numeric value.
- **Exclusion**: Rows with type "balance" or "credit" (index 2) are skipped as they represent deposits/withdrawals, not trades.

### Comment Extraction Logic (Look-ahead)
When a trade row is detected, the parser looks at the **immediate next row**:
1. It checks if the first cell of the following row has a `colspan >= 7`. This is the standard "spacer" for MetaTrader's comment layout.
2. If confirmed, it skips purely technical numeric cells (like the Magic Number) and extracts text from the **last `<td>`** of that row.
3. If no such row follows, the comment is treated as an empty string.

### Filtering Mode Logic
The system supports three distinct filtering modes to accommodate different MetaTrader statement styles:

1.  **EA ID Only (Recommended)**: Matches the `eaId` extracted from the Ticket cell's `title` attribute. Highly reliable as it targets the specific identifier set by the EA.
2.  **Comment (Fuzzy Match)**: Uses the lookup-ahead strategy to find the comment row. Employs a **Dice Coefficient** similarity algorithm (bigram-based overlap) to catch variations.
3.  **Both (AND Logic)**: Requires both the EA ID and the Comment to match the pattern.

### Defensive Parsing & Backward Compatibility
To prevent errors when loading cached data (e.g., from IndexDB) that may not contain the newer `eaId` field, the parser and store must:
- Default `eaId` and `comment` to empty strings if missing.
- Perform null checks before calling methods like `.toLowerCase()` or `.trim()`.
- Re-hydrate older trade objects during the state initialization phase.

### Extraction Implementation Reference:
```typescript
const ticketCell = tds[0];
const titleAttr = ticketCell.getAttribute('title') || '';
const idMatch = titleAttr.match(/^#(\S+)/);
const eaId = idMatch ? idMatch[1] : '';
```

### Date Matching
Converts MT4 date strings (`YYYY.MM.DD HH:MM:SS`) to JS Date objects and performs inclusive range comparison.

## Future MetaTrader 5 (MT5) Handling
MetaTrader 5 statements differ significantly:
- **Table IDs**: MT5 often uses specific IDs rather than text headers.
- **Single-Row Comments**: Many MT5 formats include the comment as a column within the single trade row rather than a separate row.
- **Architecture**: The `parseHTMLStatement` function is designed to be split into sub-modules based on an initial "Format Detection" phase.
