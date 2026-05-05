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

## Real-Time Calculation & Rendering

| Technique | Status | Description |
| :--- | :--- | :--- |
| **Pagination** | Implemented | The `ResultsTable` restricts the UI to 50 rows per page to minimize DOM nodes. |
| **Substring Shortcut** | Implemented | The fuzzy match algorithm exits early with 100% if an exact substring match is found. |
| **Memoization** | Implemented | `useMemo` is used extensively in charts and tables to prevent redundant calculations on theme or language changes. |
| **IndexedDB Storage** | Implemented | Trade data is moved out of RAM and into IndexedDB, keeping the Zustand store lightweight. |

### Visualization Optimizations (Recharts)
To ensure smooth interaction even with large datasets in the EA Comparator:
- **`isAnimationActive={false}`**: Recharts animations are disabled for interactive charts. This prevents the browser from recalculating entire SVG paths on every mouse hover, which is a major source of lag in equity curves.
- **`isAnimationActive` Cells**: Individual bar cells in distributions use pre-calculated hex colors instead of CSS variables to avoid SVG paint performance issues in some browsers.
- **Adaptive Axis Rendering**: Tick count is limited and intervals are managed to prevent overlapping text and excessive layout recalculation.

## Multi-Session Management

### Hybrid Storage Strategy
- **Metadata**: Session properties (ID, file name, filters, timestamp, currency) are stored in the primary store.
- **Trade Data**: Thousands of trade records are stored in **IndexedDB** using unique UUIDs.
- **Memory Optimization (True Archive)**: To handle 50+ sessions without slowing down the browser, archived sessions move their `allTrades` data to a secondary database and clear it from RAM.
- **Hydration Guard**: The `StoreHydrator` component blocks UI rendering until all active session data is restored from IndexedDB, preventing "empty state" flickering.

### Resource Limits
- **Max Tabs**: A configurable limit (default 5) prevents excessive RAM consumption from accumulated active session data.
- **True Archive**: Encourages users to archive inactive sessions, which reduces the active memory footprint by ~99% per report.
- **Cleanup**: Deleting a session in the UI automatically triggers a `permanent delete` in both the primary and archived IndexedDB stores to free up disk space.

## Future Scalability
- **Worker-Thread Parsing**: Moving the `DOMParser` logic to a dedicated Web Worker to completely eliminate UI blocking on extremely large reports.
- **Trade Virtualization**: Implementing `react-window` for the trade table to support seamless scrolling through tens of thousands of records.
