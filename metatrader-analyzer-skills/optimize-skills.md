# Optimization Skills - Performance & Scalability

Handling financial statements that can span several years and contain thousands of rows requires careful performance management to ensure the browser remains responsive.

## Large File Management (30MB+)

The primary bottleneck in browser-side parsing is the memory and CPU overhead of `DOMParser`.

### 1. Asynchronous Execution Pattern
To prevent the main UI thread from freezing during heavy parsing, the application uses an asynchronous loop pattern (simulating a background worker):
- **Current Method**: The `runParserWorker` utilizes the `FileReader` API and wraps the parsing logic in a `Promise`.
- **UI Responsiveness**: By utilizing `setTimeout(..., 50)` between the "reading" and "parsing" phases, the browser's event loop can yield to UI animations and loading spinners.
- **Progress Tracking**: A callback mechanism updates the UI state (e.g., "Analyzing file...") before the heavy computation begins.

### 2. Native DOMParser vs. Cheerio
- **Choice**: Native `DOMParser` is used instead of libraries like `Cheerio`.
- **Justification**: native tools avoid unnecessary bundle size increases and utilize highly optimized browser engines for tree traversal. In a client-side environment, `DOMParser` out-performs JS-native implementations for memory management.

## Potential Bottlenecks

1. **Fuzzy Matching Overhead**: Iterating over 1,000+ trades and performing Bigram-based Dice Coefficients is computationally expensive ($O(N \cdot M)$ where $N$ is trade count and $M$ is string length).
2. **React State Updates**: Attempting to render a table with 5,000+ rows simultaneously will cause significant layout thrashing and input lag.

## Implemented & Recommended Optimizations

| Technique | Status | Description |
| :--- | :--- | :--- |
| **Pagination** | Implemented | The `ResultsTable` restricts the UI to 50 rows per page to minimize DOM nodes. |
| **Substring Shortcut** | Implemented | The fuzzy match algorithm exits early with 100% if an exact substring match is found. |
| **Virtualization** | Recommended | Future use of `react-window` or `tanstack-virtual` would allow handling 10,000+ rows with constant memory usage. |
| **Memoization** | Implemented | Filter parameters are validated using Zod before re-triggering the parse promise. |

## Strategy for MT5 Compatibility
MT5 statements are often larger due to More granular data (e.g., separate Deal vs Position tables).
- **Optimization Strategy**: For MT5, we recommend a "Stream-like" approach where the file is read in chunks or only the "Deal" section of the HTML string is passed to the `DOMParser` using regex boundary detection.

## IndexedDB Multi-Tab Persistence

### Problem Summary
Only the first analysis tab's data survived a page reload; additional tabs lost their data. Empty tabs ("Analysis 1", "Analysis 2") were created automatically before any report was uploaded. There was no limit on the number of tabs, leading to potential performance degradation.

### Root Cause
The Zustand store used a static, hardcoded key (`'latest'`) for all IndexedDB transactions. As a result, every new file upload simply overwrote the previously saved trades in the local database. Tab creation was triggered by any state change rather than specifically upon successful report parsing with valid trade data.

### Solution
- **Unique Session UUIDs**: Each successful analysis session is now assigned a unique UUID.
- **Hybrid Storage Strategy**:
  - **Metadata**: Session properties (ID, file name, filters, timestamp) are stored in `localStorage` for high-frequency access and fast tab rendering.
  - **Trade Data**: Large datasets (thousands of trade records) are stored in **IndexedDB** using the UUID as the primary key.
- **Session Restoration Logic**: On initial page load, the application iterates through all sessions stored in `localStorage`. For each session, it performs an asynchronous fetch from IndexedDB using the ID to restore the exact trade data associated with that tab.
- **Tab Management**:
  - Tabs are created **only** when a report is successfully parsed and contains at least one trade.
  - Tab labels are dynamically set to the uploaded file name (with the `.htm` extension removed).
  - A maximum limit of **5 active tabs** is enforced. If a user attempts to upload a 6th file, a toast error is displayed, protecting browser memory limits.

### Code References
- `lib/store/useAnalysisStore.ts`: Optimized session management and persistence lifecycle logic.
- `lib/db/index.ts`: Updated Dexie schema to support multi-entry storage and UUID keys.
- `components/analysis/AnalysisTabs.tsx`: Improved tab rendering and deletion handling.

### Verification
- Multiple reports can be uploaded and switched between seamlessly.
- Page reload successfully restores all tabs with their specific data and names.
- The 5-tab limit correctly prevents excessive resource consumption.
