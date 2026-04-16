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

### Fuzzy Matching & Filtering
To provide flexibility for variations in EA comments (e.g., `111 BUY` vs `BUY - 111`), the system uses a dual-matching strategy:
- **Substring Match**: If the user's pattern is found exactly within the comment, it counts as a 100% match.
- **Dice Coefficient**: A similarity algorithm that breaks strings into bigrams to calculate an overlap percentage (0-100%).
- **Date Matching**: Converts MT4 date strings (`YYYY.MM.DD HH:MM:SS`) to JS Date objects and performs inclusive range comparison.

## Future MetaTrader 5 (MT5) Handling
MetaTrader 5 statements differ significantly:
- **Table IDs**: MT5 often uses specific IDs rather than text headers.
- **Single-Row Comments**: Many MT5 formats include the comment as a column within the single trade row rather than a separate row.
- **Architecture**: The `parseHTMLStatement` function is designed to be split into sub-modules based on an initial "Format Detection" phase.
