# Workflows - User & System Pipeline

This document maps the end-to-end user journey and the underlying data pipeline for analyzing MetaTrader statements.

## User Workflow (Traders Perspective)

1. **Extraction**:
   - **MT4**: Export "Account History" as a "Detailed Report" (`.htm`).
   - **MT5**: Run the custom `MT5_Report_Script.ex5` to export a standardized 21-column `.csv`.
2. **Selection**: Drag and drop the file onto the Dashboard. The app automatically detects the format (MT4 HTM vs MT5 CSV).
3. **Configuration**:
   - **Language**: Select English or Vietnamese in the header.
   - **Filter**: Enter EA identifiers (Patterns) and choose the filter mode.
   - **Date Range**: Select specific start and end dates for the report period.
4. **Execution**: Click "Analyze" to generate the performance dashboard.
5. **Deep Exploration**:
   - Visit the **Explore** page to see hourly, daily, and monthly profit distributions for the active session.
   - Visit the **Statistics** page to view the global EA Leaderboard and aggregated equity trends across all uploaded reports.
6. **Comparison**: Use the **Compare** tab to benchmark multiple EA strategies side-by-side or analyze performance across different reports.
7. **Session Management**: Use the **History** page to restore old sessions, archive completed ones (to save browser memory), or permanently delete data.
8. **Review & Export**: 
   - Analyze **KPI Cards**, **Equity/Drawdown Curves**, and **Monthly Returns**.
   - Download comparative results as **CSV**.

---

## Internal Data Pipeline (Technical Sequence)

### 1. Ingestion & Sniffing
The system uses the `FileReader` API. A "sniffer" logic determines the file type and dispatches to the correct parser module.

### 2. Multi-Version Extraction
- **MT4**: Parses DOM nodes, extracting EA IDs from ticket titles and paired comment rows.
- **MT5**: Section-based string parsing, extracting Magic Numbers and Net Profit directly.
- **Currency**: Extracts the native currency (USD, EUR, USC, etc.) for dynamic formatting.

### 3. Unified Persistence
- Metadata is saved to **localStorage**.
- Large trade datasets are stored in **IndexedDB** using unique session UUIDs.
- **Memory Optimization (True Archive)**: When a user archives a session, the trade data is moved from the active store to a secondary database, freeing RAM while keeping metadata accessible in History.

### 4. Recalculation Engine
When filters change or a session is switched:
- **Match Check**: Fuzzy matching (Dice Coefficient) or exact EA ID matching.
- **16+ Deep Metrics**: Sharpe Ratio, Profit Factor, Max Drawdown, Expectancy, and Recovery Factor are recalculated on the fly.
- **Aggregation**: Data is converted into time-series for charts and frequency bins for distributions.

---

## UI Development Patterns

### 1. Theme-Aware Visualizations
Charts use `resolvedTheme` from `next-themes` to inject hex-based colors into SVG elements (Tooltips, Axes, Cells). This bypasses CSS variable resolution issues in SVG contexts.

### 2. Recharts Optimization
- **isAnimationActive={false}**: Disabled for interactive charts to prevent re-triggering animations on hover.
- **Cursor Management**: BarCharts use `cursor={false}` to eliminate default gray rectangle artifacts.

### 3. Base UI Integration
- Use the `render` prop instead of `asChild`.
- Use `@base-ui/react/merge-props` to combine internal trigger props with custom refs and classes.

---

## Deployment & Build Workflow

### 1. Static Export (Next.js)
The app uses `output: 'export'`.
- **Base Path**: The `BASE_PATH` in `lib/constants.ts` ensures assets work correctly on GitHub Pages subdirectories.

### 2. Automated Deployment
- GitHub Actions build the production bundle, inject `.nojekyll`, and deploy to the `gh-pages` branch.

---

## i18n Development Workflow

1. **Key Registration**: Add the key path to `lib/i18n.tsx` for both `en` and `vi`.
2. **Hook Consumption**: Call `const { t } = useTranslation()` in the component.
3. **Persistence**: Language settings are managed by `useSettingsStore`.
