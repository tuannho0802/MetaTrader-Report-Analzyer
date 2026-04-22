# File Structure - MT4 EA Profit Filter

This document outlines the organization of the codebase, describing the purpose of each directory and how files interact to provide the core functionality.

## Core Directories

### `/app`
Contains the Next.js App Router structure.
- `layout.tsx`: Root layout providing the `SidebarProvider`, shared navigation, and persistence providers. Integrates `StoreHydrator` to block rendering until the `IndexedDB` is loaded.
- `page.tsx`: The primary Dashboard workspace (Analysis & Filtering).
- `/compare`: Dedicated route for `EAComparator`.
- `/explore`, `/history`, `/settings`: Standardized routes following the global menu layout.

### `/components`
Modular UI components grouped by functional domain.
- `/analysis`: Components for the primary report dashboard (e.g., `KpiCards.tsx`).
- `/compare`: Unified comparison system (`EAComparator.tsx`, `SameReportConfig.tsx`, `ComparisonChart.tsx`).
- `/layout`: App shell components like `AppSidebar.tsx` and `Header.tsx`.
- `/ui`: Low-level design system primitives (Buttons, Inputs, Selects) based on **Base UI**.
- **Base Components**: `FileUploader.tsx`, `FilterForm.tsx`, and `ResultsTable.tsx` are the core building blocks of the report analysis view.

### `/lib`
The "brain" of the application, containing logic, state, and database interactions.
- `/store`: `useAnalysisStore.ts` (Zustand) manages multi-session data, filtering state, and UI navigation.
- `/db`: `index.ts` handles persistent storage using Dexie (IndexedDB) for large datasets and localStorage for metadata.
- `parser.ts`: The complex extraction logic for MT4 HTML statements.
- `comparison.ts`: Mathematical utilities for calculating equity series and performance metrics.
- `types.ts`: Central source of truth for all data interfaces (Trade, Session, Filter).
- `i18n.tsx`: Central translation engine providing the `useTranslation` hook and bilingual dictionary.
- `mt5Parser/`: Specialized module for parsing MT5 CSV exports.
- `store/useSettingsStore.ts`: Persistent store for application-wide settings (Language, Theme).

## Key File Interactions

### 1. Data Pipeline: Upload to View
1. `FileUploader` reads a file → Calls `store.processStatement`.
2. `parser.ts` extracts raw trades → Returns `ParseResult`.
3. `useAnalysisStore` saves raw data to `IndexedDB` and creates a session in `localStorage`.
4. `page.tsx` re-renders, displaying analysis tabs and the `ResultsTable`.

### 2. Comparison Logic
1. `EAComparator` (Same Mode) picks a session → Extracts `eaId` list from `session.allTrades`.
2. Patterns are matched via `parser.ts` helpers.
3. `comparison.ts` converts filtered trades into a shared time-series array.
4. `ComparisonChart` renders multiple `Line` components from a single data source.

### 3. Navigation & Filtering
- `AppSidebar` handles app-wide navigation using true Next.js `<Link>` components tied to specific routes.
- `FilterForm` updates the active session's filter parameters, triggering a data recalculation in the store.
- `AnalysisTabs` coordinates the switching between multiple independent report instances.

## Design Philosophy: "Smart Store, Stateless UI"
Wherever possible, logic is moved into the **Zustand Store** or **Utility Functions** (`lib/`). Components should ideally be "dumb" observers of the store state, ensuring that persistence and calculation logic are centralized and easy to test.
