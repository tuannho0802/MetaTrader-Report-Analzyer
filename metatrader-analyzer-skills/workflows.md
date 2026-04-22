# Workflows - User & System Pipeline

This document maps the end-to-end user journey and the underlying data pipeline for analyzing MetaTrader statements.

## User Workflow (Traders Perspective)

1. **Extraction**: The user exports their "Account History" from MetaTrader 4 as a "Detailed Report" (`.htm` file).
2. **Selection**: The user launches the web app and drags the `.htm` file onto the drop zone.
3. **Configuration**:
   - The user enters a specific EA identifier (e.g., "BBS41").
   - Selects the **Filter Mode** (EA ID, Comment, or Both).
   - Adjusts the **Similarity Threshold** (typically 80%) to catch minor comment variations.
   - Selects a specific **date range** for performance analysis.
4. **Execution**: Clicks the "Analyze" button.
5. **Review**: Analyzes the generated dashboard showing **Total Profit**, **Win/Loss Counts**, and the full list of matched trades.
6. **Export**: 
   - **CSV**: Download data for Excel/Google Sheets.
   - **Clipboard**: Copy data in TSV format for instant pasting into spreadsheets.

## Internal Data Pipeline (Technical Sequence)

### 1. File Access
The system uses the `FileReader` API in `readAsText(file, "utf-8")` mode to ingest the raw HTML string without any server-side upload, ensuring 100% privacy.

### 2. Table Localization
The `DOMParser` instantiation converts the string into a navigable document. The parser iterates through `<table>` elements searching for specific anchor text: "Closed Transactions:".

### 3. Trade Extraction Loop
The loop traverses `<tr>` nodes. For each valid trade row:
- It extracts the primary data (Price, Profit, Time).
- It reads the `title` attribute from the Ticket cell to extract the **EA ID**.
- It looks ahead at the next row for **Comment** row metadata.
- If a comment row is found, it extracts the last non-empty cell.

### 4. Filtering & Aggregation
A filtering pass is performed based on the selected **Filter Mode**:
- **Date Check**: Comparison against the selected inclusive range.
- **Match Check**: 
  - IDs are checked for substring/prefix existence.
  - Comments are checked using bigram-based Dice Coefficients.
- **Aggregation**: Total profit is summed globally from the filtered result set.

### 5. UI Reconciliation
React state is updated with a `ParseResult` object. The `ResultsTable` component triggers a re-render, calculating pagination and displaying the final list.

## Scalability to MT5
The internal pipeline is built on a **Pipeline Pattern** that allows swapping the "Extraction Loop" (Step 3) while keeping Steps 1, 4, and 5 identical. 
- **Future Integration**: A `StatementSniffer` service will determine the file format and dispatch the correct version of the extractor before the filtering logic begins.

## UI Refactoring: Base UI & asChild Compatibility

When using **Base UI** (instead of Radix UI) for shadcn/ui primitives, the traditional `asChild` prop is not natively supported. We follow this refactoring pattern:

1. **Primitive Trigger Mapping**: Instead of passing `asChild` directly to the primitive, use the `render` prop.
2. **Prop Merging**: Use the `mergeProps` utility from `@base-ui/react/merge-props` to combine Base UI's internal `triggerProps` with any custom `ref` or `className`.
3. **TypeScript Safety**: Define a custom `TriggerProps` interface that extends the primitive props to include `asChild?: boolean`.

**Standard Pattern:**
```tsx
const Trigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Primitive.Trigger
          {...props}
          render={(triggerProps) => React.cloneElement(
            children as React.ReactElement,
            mergeProps(triggerProps, { ref })
          )}
        />
      );
    }
    return <Primitive.Trigger ref={ref} {...props}>{children}</Primitive.Trigger>;
  }
);
```

## Custom Component vs. Dependency Strategy

When a common UI primitive (like Radix `RadioGroup`) is missing from the project dependencies and cannot be easily installed, follow the **Custom Implementation Strategy**:

1. **Self-Contained Logic**: Implement the component using standard React `useState` or `useContext` for state management and Tailwind for styling.
2. **Context for Nesting**: Specifically for groups (like Radio Groups), use **React Context** to allow nesting items inside sub-layouts (e.g., within `div` wrappers or cards) without breaking the link between the group root and its items.
3. **Accessibility**: Ensure the custom component maintains ARIA roles (`role="radiogroup"`, `role="radio"`, `aria-checked`) to simulate the missing primitive's behavior accurately.
4. **Consistency**: Match the styling exactly with the project's existing design system to ensure a seamless "premium" feel.

## MT5 Report Generation Workflow

MT5 reports require a custom script because the default HTML export lacks specific metadata (like Magic Numbers in the ticket title) needed for granular analysis.

1. **Script Activation**: Drag the `MT5_Report_Script.ex5` from the Navigator onto a chart.
2. **Data Extraction**: The script iterates through the `HistoryDeals` and `HistoryOrders` collections.
3. **Column Mapping**: It maps 21 specific fields into a standardized CSV structure.
4. **Local Save**: The user saves the file locally via the standard Windows/macOS file dialog.
5. **Ingestion**: The app's `mt5Parser` module identifies the CSV headers and maps them to the `Trade` interface.

## i18n Development Workflow

To add or update UI text, follow this reactive pipeline:

1. **Key Registration**: Add the new key to `lib/i18n.tsx` in both `en` and `vi` sections.
2. **Hook Consumption**: In your component, call `const { t } = useTranslation()`.
3. **UI Implementation**: Use `{t('your.key.path')}` in the JSX.
4. **Persistence Verification**: Change the language in the UI settings; verify the setting persists after a page reload via `useSettingsStore`.


