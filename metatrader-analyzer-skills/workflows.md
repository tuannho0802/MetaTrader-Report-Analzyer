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
5. **Comparison**: Use the **Compare** tab (EA Comparator) to analyze multiple strategies or benchmark different reports side-by-side.
6. **Review & Export**: 
   - Analyze **KPI Cards**, **Equity/Drawdown Curves**, and **Monthly Returns**.
   - Download results as **CSV** or copy to **Clipboard**.

---

## Internal Data Pipeline (Technical Sequence)

### 1. Ingestion &Sniffing
The system uses the `FileReader` API. A "sniffer" logic determines the file type and dispatches to the correct parser module.

### 2. Multi-Version Extraction
- **MT4**: Parses DOM nodes, extracting EA IDs from ticket titles and paired comment rows.
- **MT5**: Section-based string parsing, extracting Magic Numbers and Net Profit directly.
- **Currency**: Extracts the native currency (USD, EUR, USC, etc.) for dynamic formatting.

### 3. Unified Persistence
- Metadata is saved to **localStorage**.
- Large trade datasets are stored in **IndexedDB** using unique session UUIDs.

### 4. Recalculation Engine
When filters change:
- **Match Check**: Fuzzy matching (Dice Coefficient) or exact EA ID matching.
- **Extended Metrics (P0-P5)**: Sharpe Ratio, Profit Factor, Max Drawdown, and Win Rate are recalculated on the fly.
- **Visualization**: Data is aggregated into time-series for charts and frequency bins for the histogram.

---

## UI Development Patterns

### 1. Base UI & `asChild` Compatibility
When using **Base UI** for shadcn/ui primitives, follow this pattern for components that need to render as different elements (like Next.js `Link`):
- Use the `render` prop instead of `asChild`.
- Use `@base-ui/react/merge-props` to combine internal trigger props with custom refs and classes.

### 2. Custom Component Strategy
If a common UI primitive is missing from dependencies:
1. **Context for Nesting**: Use React Context to manage state across nested sub-components.
2. **ARIA Roles**: Explicitly define `role` and `aria-*` attributes to maintain accessibility.

---

## Deployment & Build Workflow

### 1. Static Export (Next.js)
The app uses `output: 'export'`.
- **Base Path**: The `BASE_PATH` in `lib/constants.ts` ensures assets work correctly on GitHub Pages subdirectories.

### 2. GitHub Actions
The `.github/workflows/nextjs.yml` workflow:
- Builds the production bundle.
- Injects `.nojekyll` to the output.
- Deploys to the `gh-pages` branch.

---

## i18n Development Workflow

1. **Key Registration**: Add the key path to `lib/i18n.tsx` for both `en` and `vi`.
2. **Hook Consumption**: Call `const { t } = useTranslation()` in the component.
3. **Persistence**: Ensure language settings are managed by `useSettingsStore`.
