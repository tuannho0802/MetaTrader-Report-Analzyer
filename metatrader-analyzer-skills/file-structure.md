# File Structure - MetaTrader Report Analyzer

This document outlines the organization of the codebase, describing the purpose of each directory and how files interact to provide the core functionality.

## Core Directories

### `/app`
Contains the Next.js App Router structure.
- `layout.tsx`: Root layout providing the `SidebarProvider`, shared navigation, and persistence providers. Integrates `StoreHydrator` to block rendering until the `IndexedDB` is loaded.
- `page.tsx`: The primary Dashboard workspace (Analysis & Filtering).
- `AboutMT5/page.tsx`: Static instruction page for MT5 script installation and CSV format guide.
- `/compare`: Dedicated route for `EAComparator`.
- `/explore`, `/history`, `/settings`: Standardized routes following the global menu layout.

### `/components`
Modular UI components grouped by functional domain.
- `/analysis`: Components for the primary report dashboard (e.g., `KpiCards.tsx`, `ReportDateCard.tsx`).
- `/compare`: Unified comparison system:
  - `EAComparator.tsx`: Main entry for comparison features.
  - `ComparisonHistogram.tsx`: Visualizes trade profit distribution for multiple EAs.
  - `ComparisonDrawdownChart.tsx`: Tracks relative account drawdown over time.
  - `MonthlyReturnsTable.tsx`: Displays a heatmapped table of monthly performance.
  - `ComparisonResults.tsx`: High-performance metrics table with highlight logic for best/worst performers.
- `/layout`: App shell components like `AppSidebar.tsx`, `Header.tsx`, and `ClientLayout.tsx`.
- `/ui`: Low-level design system primitives (Buttons, Inputs, Selects) based on **Base UI**.
- **Base Components**: `FileUploader.tsx`, `FilterForm.tsx`, and `ResultsTable.tsx` are the core building blocks of the report analysis view.

### `/lib`
The "brain" of the application, containing logic, state, and database interactions.
- `/store`: 
  - `useAnalysisStore.ts` (Zustand): Manages multi-session data (UUID-based), filtering state, and UI navigation.
  - `useSettingsStore.ts`: Persistent store for application-wide settings (Language, Theme) using `localStorage`.
- `/db`: `index.ts` handles persistent storage using Dexie (IndexedDB) for large datasets (Trade records).
- `/mt5Parser/`: Specialized module for parsing MT5 CSV exports (`parser.ts`, `adapter.ts`, `types.ts`).
- `parser.ts`: The complex extraction logic for MT4 HTML statements.
- `comparison.ts`: Mathematical utilities for calculating equity series, performance metrics (P0-P5), and statistics.
- `types.ts`: Central source of truth for all data interfaces (Trade, Session, Filter, MetricsRow).
- `i18n.tsx`: Central translation engine providing the `useTranslation` hook and bilingual dictionary.
- `formatCurrency.ts`: Dynamic currency formatting utility using `Intl.NumberFormat`.
- `exportComparison.ts`: Logic for generating and downloading comparison CSV reports.
- `constants.ts`: Global application constants including `BASE_PATH` for deployment.

## Key File Interactions

### 1. Data Pipeline: Upload to View
1. `FileUploader` reads a file → Detects format (HTM/CSV) → Calls `store.processStatement`.
2. `parser.ts` (MT4) or `mt5Parser/` (MT5) extracts raw trades → Returns `ParseResult`.
3. `useAnalysisStore` saves raw data to `IndexedDB` and creates a metadata session in `localStorage`.
4. `page.tsx` re-renders, displaying analysis tabs, `KpiCards`, and the `ResultsTable`.

### 2. Comparison Logic (P0-P5)
1. `EAComparator` (Same/Cross Mode) selects data sources.
2. `comparison.ts` calculates extended metrics: Profit Factor, Max Drawdown, Sharpe Ratio, etc.
3. Trades are converted into a shared time-series array for `ComparisonChart` and `ComparisonDrawdownChart`.
4. `ComparisonHistogram` calculates frequency bins for profit distribution.
5. `ComparisonResults` displays the multi-column metrics table with CSV export capability.

### 3. Navigation & Filtering
- `AppSidebar` handles app-wide navigation using Next.js `<Link>` components.
- `FilterForm` updates the active session's filter parameters (including date ranges), triggering a data recalculation in the store.
- `AnalysisTabs` coordinates the switching between multiple independent report sessions stored in IndexedDB.

## Design Philosophy: "Smart Store, Stateless UI"
Wherever possible, logic is moved into the **Zustand Store** or **Utility Functions** (`lib/`). Components should ideally be "dumb" observers of the store state, ensuring that persistence and calculation logic are centralized and easy to maintain.
