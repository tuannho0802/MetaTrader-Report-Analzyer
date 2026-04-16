# Workflows - User & System Pipeline

This document maps the end-to-end user journey and the underlying data pipeline for analyzing MetaTrader statements.

## User Workflow (Traders Perspective)

1. **Extraction**: The user exports their "Account History" from MetaTrader 4 as a "Detailed Report" (`.htm` file).
2. **Selection**: The user launches the web app and drags the `.htm` file onto the drop zone.
3. **Configuration**:
   - The user enters a specific EA identifier (e.g., "BBS41").
   - Adjusts the **Similarity Threshold** (typically 80%) to catch minor comment variations.
   - Selects a specific **date range** to analyze performance for a week, month, or customized period.
4. **Execution**: Clicks the "Analyze" button.
5. **Review**: Analyzes the generated dashboard showing **Total Profit**, **Win/Loss Counts**, and the full list of matched trades.
6. **Export**: Optionally clicks "Export CSV" to move the filtered data to Excel or Google Sheets for advanced charting.

## Internal Data Pipeline (Technical Sequence)

### 1. File Access
The system uses the `FileReader` API in `readAsText(file, "utf-8")` mode to ingest the raw HTML string without any server-side upload, ensuring 100% privacy.

### 2. Table Localization
The `DOMParser` instantiation converts the string into a navigable document. The parser iterates through `<table>` elements searching for specific anchor text: "Closed Transactions:".

### 3. Trade Extraction Loop
The loop traverses `<tr>` nodes. For each valid trade row:
- It extracts the primary data (Price, Profit, Time).
- It looks ahead at the next row for EA Metadata.
- If a comment row is found, it extracts the last non-empty cell.

### 4. Filtering & Aggregation
A filtering pass is performed on the array of extracted trades:
- **Date Check**: Comparison against the selected inclusive range.
- **Match Check**: Pattern matching using bigram-based Dice Coefficients.
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
