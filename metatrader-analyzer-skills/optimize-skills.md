# Optimization Skills - Performance & Scalability

Handling financial statements that can span several years and contain thousands of rows requires careful performance management to ensure the browser remains responsive.

## Large File Management (30MB+)

The primary bottleneck in browser-side parsing is the memory and CPU overhead of `DOMParser`.

### 1. Asynchronous Execution Pattern
To prevent the main UI thread from freezing during heavy parsing, the application uses an asynchronous loop pattern:
- **Current Method**: The `runParserWorker` utilizes the `FileReader` API and wraps the parsing logic in a `Promise`.
- **UI Responsiveness**: By utilizing `setTimeout` intervals or yielding the event loop, the browser can maintain UI animations and loading spinners during analysis.
- **Progress Tracking**: A callback mechanism updates the UI state (e.g., "Analyzing file...") before the heavy computation begins.

### 2. Native DOMParser vs. Cheerio
- **Choice**: Native `DOMParser` is used instead of libraries like `Cheerio`.
- **Justification**: Native tools avoid unnecessary bundle size increases and utilize highly optimized browser engines for tree traversal. In a client-side environment, `DOMParser` out-performs JS-native implementations for memory management.

## Potential Bottlenecks

1. **Fuzzy Matching Overhead**: Iterating over 1,000+ trades and performing Bigram-based Dice Coefficients is computationally expensive ($O(N \cdot M)$).
2. **React State Updates**: Attempting to render a table with 5,000+ rows simultaneously can cause significant layout thrashing.

## Implemented & Recommended Optimizations

| Technique | Status | Description |
| :--- | :--- | :--- |
| **Pagination** | Implemented | The `ResultsTable` restricts the UI to 50 rows per page to minimize DOM nodes. |
| **Substring Shortcut** | Implemented | The fuzzy match algorithm exits early with 100% if an exact substring match is found. |
| **Virtualization** | Recommended | Future use of `react-window` would allow handling 10,000+ rows with constant memory usage. |
| **Memoization** | Implemented | `useMemo` is used extensively in charts and tables to prevent redundant calculations on theme or language changes. |
| **IndexedDB Storage** | Implemented | Trade data is moved out of RAM and into IndexedDB, keeping the Zustand store lightweight. |

## MT5 Compatibility Strategy
MT5 statements are handled via a dedicated CSV parser module (`lib/mt5Parser/`).
- **Parsing Logic**: String-based CSV parsing is significantly faster than HTML DOM parsing, allowing the app to handle extremely large MT5 history files without memory strain.
- **Header Boundaries**: The parser identifies distinct sections within the CSV (Account Info, History, Summary) to isolate trade data efficiently.

## IndexedDB Multi-Tab Persistence

### Problem Summary
Previously, only one session's data survived page reloads. Empty tabs were created prematurely, and there was no limit on resource consumption.

### Root Cause
A hardcoded database key caused new uploads to overwrite previous ones. Tab management was not strictly tied to valid data parsing.

### Solution
- **Unique Session UUIDs**: Each successful analysis session is assigned a unique UUID.
- **Hybrid Storage Strategy**:
  - **Metadata**: Session properties (ID, file name, filters, timestamp, currency) are stored in `localStorage` for instant UI initialization.
  - **Trade Data**: Thousands of trade records are stored in **IndexedDB** using the UUID as the primary key.
- **Session Restoration Logic**: On initial load, `StoreHydrator` iterates through sessions and restores trade data from IndexedDB asynchronously.
- **Tab Management**:
  - Tabs are created **only** for reports containing at least one valid trade.
  - A maximum limit of **5 active sessions** is enforced to protect browser memory limits.

### Code References
- `lib/store/useAnalysisStore.ts`: Optimized session management and persistence lifecycle logic.
- `lib/db/index.ts`: Updated Dexie schema to support multi-entry storage and UUID keys.
- `components/layout/StoreHydrator.tsx`: Ensures data is loaded before components attempt to render.
- `components/analysis/AnalysisTabs.tsx`: Handles dynamic tab labels and session cleanup.
