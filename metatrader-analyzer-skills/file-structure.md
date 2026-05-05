# File Structure - MetaTrader Report Analyzer

This document outlines the organization of the codebase, describing the purpose of each directory and how files interact to provide the core functionality.

## Core Directories

### `/app`
Contains the Next.js App Router structure.
- `layout.tsx`: Root layout providing the `ThemeProvider`, `SidebarProvider`, and shared navigation. Integrates `StoreHydrator` to block rendering until the `IndexedDB` is fully hydrated.
- `page.tsx`: The primary Dashboard workspace (Analysis & Filtering).
- `AboutMT5/page.tsx`: Static instruction page for MT5 script installation and CSV format guide.
- `compare/page.tsx`: Dedicated route for multi-EA performance comparison (Same/Cross report modes).
- `explore/page.tsx`: Trade Explorer dashboard featuring hourly, daily, and monthly profit distribution charts.
- `statistics/page.tsx`: Global statistics featuring EA Leaderboard, equity trends, top symbols, and commission/swap analysis.
- `history/page.tsx`: Session management interface for active, archived, and soft-deleted sessions.
- `settings/page.tsx`: Application configuration (Language, Theme, Tab limits, Backup/Restore).

### `/components`
Modular UI components grouped by functional domain.
- `/analysis`: Components for the primary report dashboard (e.g., `KpiCards.tsx`, `ReportDateCard.tsx`).
- `/compare`: Unified comparison system:
  - `EAComparator.tsx`: Main entry for comparison features.
  - `SameReportConfig.tsx` & `CrossReportConfig.tsx`: Mode-specific configurations.
  - `ComparisonHistogram.tsx`: Visualizes trade profit distribution for multiple EAs.
  - `ComparisonDrawdownChart.tsx`: Tracks relative account drawdown over time.
  - `MonthlyReturnsTable.tsx`: Displays a heatmapped table of monthly performance.
  - `ComparisonResults.tsx`: High-performance metrics table with highlight logic for 16+ key performance indicators.
- `/layout`: App shell components like `AppSidebar.tsx`, `Header.tsx`, and `ClientLayout.tsx`.
- `/shared`: Common reusable components like `SessionSelector.tsx`, `ChartTooltip.tsx`.
- `/ui`: Low-level design system primitives (Buttons, Inputs, Selects) based on **Base UI** and **Shadcn UI**.
- **Base Components**: `FileUploader.tsx`, `FilterForm.tsx`, and `ResultsTable.tsx` are the core building blocks of the report analysis view.

### `/lib`
The "brain" of the application, containing logic, state, and database interactions.
- `/store`: 
  - `useAnalysisStore.ts` (Zustand): Manages multi-session data (UUID-based), trade extraction, and history (Undo/Redo).
  - `useSettingsStore.ts`: Persistent store for application-wide settings (Language, Theme, maxTabs) using `localStorage`.
- `/db`: 
  - `index.ts`: Handles the primary `MT4AnalyzerDB` for sessions and metadata.
  - `archivedTradesDb.ts`: Manages the secondary `MT4Analyzer_ArchivedTrades` database, storing offloaded trade data for archived sessions.
- `/mt5Parser/`: Specialized module for parsing MT5 CSV exports (`parser.ts`, `adapter.ts`, `types.ts`).
- `parser.ts`: The complex extraction logic for MT4 HTML statements.
- `comparison.ts`: Mathematical utilities for calculating equity series and 16+ performance metrics (Sharpe Ratio, Recovery Factor, Profit per Day, etc.).
- `types.ts`: Central source of truth for all data interfaces (Trade, Session, Filter, MetricsRow).
- `i18n.tsx`: Central translation engine providing the `useTranslation` hook and bilingual dictionary (EN/VI).
- `formatCurrency.ts`: Dynamic currency formatting utility supporting custom codes like "USC".
- `exportComparison.ts`: Logic for generating and downloading comparison CSV reports.
- `constants.ts`: Global application constants including `BASE_PATH` for static deployment.

## Key File Interactions

### 1. Data Pipeline: Upload to View
1. `FileUploader` reads a file → Detects format (HTM/CSV) → Calls `store.processStatement`.
2. `parser.ts` (MT4) or `mt5Parser/` (MT5) extracts raw trades → Returns `ParseResult`.
3. `useAnalysisStore` saves raw data to `IndexedDB` and creates a metadata session in `localStorage`.
4. Dashboard re-renders, displaying analysis cards, charts, and the `ResultsTable`.
5. **Archive Lifecycle**: If a session is archived, trades are moved to `archivedTradesDb.ts` and cleared from the active store to save RAM. They are re-hydrated only when restored.

### 2. Comparison Logic (P0-P5)
1. `EAComparator` selects comparison mode and data sources.
2. `comparison.ts` calculates extended metrics: Profit Factor, Max Drawdown, Sharpe Ratio, Expectancy, etc.
3. Trades are converted into a shared time-series array for `ComparisonChart` and `ComparisonDrawdownChart`.
4. `ComparisonHistogram` calculates frequency bins for profit distribution analysis.
5. `ComparisonResults` displays the multi-column metrics table with color-coded performance highlights.

### 3. Session & Navigation
- `AppSidebar` handles navigation between Dashboard, Explore, Statistics, History, and Settings.
- `SessionSelector` allows switching the active report context across all pages.
- `FilterForm` updates the active session's parameters, triggering re-calculations in the store.

## Design Philosophy: "Smart Store, Stateless UI"
Wherever possible, logic is moved into the **Zustand Store** or **Utility Functions** (`lib/`). Components should ideally be "dumb" observers of the store state, ensuring that persistence and calculation logic are centralized and easy to maintain across the static export architecture.
