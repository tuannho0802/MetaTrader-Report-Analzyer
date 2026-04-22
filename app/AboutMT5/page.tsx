import Link from "next/link";
import {
  Download,
  FileText,
  Info,
  ListOrdered,
  Terminal,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Code2,
} from "lucide-react";

const COLUMNS = [
  "Ticket",
  "Magic Number",
  "Open Time",
  "Close Time",
  "Duration (Hours)",
  "Type",
  "Volume",
  "Symbol",
  "Open Price",
  "Close Price",
  "S/L",
  "T/P",
  "Points",
  "Profit",
  "Swap",
  "Commission",
  "Net Profit",
  "Net Profit %",
  "Comment",
  "Entry ID",
  "Exit ID",
];

const STEPS = [
  {
    title: "Download & Install Script",
    body: (
      <>
        Download the <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">MT5_Export_Script.ex5</code> file
        using the button below. Place it inside the{" "}
        <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">MQL5/Scripts</code> folder of your MT5 terminal
        (e.g.{" "}
        <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">
          %AppData%\MetaQuotes\Terminal\...\MQL5\Scripts
        </code>
        ), then restart MT5 or right-click the Navigator and select <strong>Refresh</strong>.
      </>
    ),
  },
  {
    title: "Open the Navigator",
    body: (
      <>
        In MT5, press <kbd className="px-1.5 py-0.5 rounded border text-xs font-mono">Ctrl + N</kbd> to open the
        Navigator panel. Expand the <strong>Scripts</strong> section and locate{" "}
        <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">MT5_Export_Script</code>.
      </>
    ),
  },
  {
    title: "Drag the Script onto a Chart",
    body: "Drag the script onto any open chart (the symbol does not matter). The script will immediately begin scanning your full trade history.",
  },
  {
    title: "Save the CSV File",
    body: "A save dialog will appear. Choose your desired location and save the file as a .csv file.",
  },
  {
    title: "Upload to This App",
    body: (
      <>
        Return to the{" "}
        <Link href="/" className="text-primary underline underline-offset-2 hover:opacity-80">
          Dashboard
        </Link>{" "}
        and click <strong>Analyze Transactions</strong>. Select the generated <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">.csv</code>{" "}
        file and press <strong>Analyze</strong>.
      </>
    ),
  },
];

export default function AboutMT5Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ── */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-4xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                About MetaTrader 5 Report
              </h1>
              <p className="mt-2 text-muted-foreground text-base max-w-2xl">
                This tool supports a specific CSV format exported from MT5 using our custom script.
                Follow the instructions below to generate a compatible file.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* ── Required CSV Format ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ListOrdered className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Required CSV Format</h2>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              The CSV file must contain <strong>all 21 columns</strong> in the exact order shown below.
              The script generates this automatically — do not rename or rearrange columns manually.
            </p>

            <div className="flex flex-wrap gap-2">
              {COLUMNS.map((col, i) => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs font-mono text-foreground border"
                >
                  <span className="text-primary/60 select-none">{i + 1}.</span>
                  {col}
                </span>
              ))}
            </div>

            <div className="rounded-lg border border-dashed bg-muted/40 p-4 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Required Section Headers
              </p>
              <p className="text-sm text-muted-foreground">
                The file must also begin with the following section headers (generated automatically by the script):
              </p>
              <div className="space-y-1 font-mono text-sm">
                <div className="text-primary">{"=== ACCOUNT INFORMATION ==="}</div>
                <div className="text-primary">{"=== EXPORT INFORMATION ==="}</div>
                <div className="text-primary">{"=== TRADING HISTORY ==="}</div>
                <div className="text-primary">{"=== EXPORT SUMMARY ==="}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Download Script ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Download Export Script</h2>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Download the compiled <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">.ex5</code> script
              and place it in your MT5 terminal's <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">MQL5/Scripts</code> folder.
            </p>

            <a
              href="/script-for-mt5/MT5_Report_Script.ex5"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download MT5 Report Script (.ex5)
            </a>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs">
                After placing the file, restart MT5 <strong>or</strong> right-click the Navigator panel and choose{" "}
                <strong>Refresh</strong> to make the script appear.
              </p>
            </div>
          </div>
        </section>

        {/* ── Step-by-step guide ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">How to Generate the Report</h2>
          </div>

          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-4 rounded-xl border bg-card p-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {i + 1}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Public Source Code ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Public Source Code (MQL5)</h2>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              We also provide the full MQL5 source code for transparency. You can download it below to inspect the logic or make your own modifications.
            </p>

            <a
              href="/script-for-mt5/MT5_Report_Script.mq5"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download MQL5 Source Code (.mq5)
            </a>
          </div>
        </section>

        {/* ── Important Note ── */}
        <section>
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Magic Number Preserved</p>
              <p className="text-sm text-muted-foreground">
                The <strong>Magic Number</strong> is preserved during export, allowing you to filter by specific
                Expert Advisors (EA) in the analysis. Use the <strong>Filter by ID</strong> mode and enter the
                magic number in the pattern field to isolate a single EA's performance.
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <div className="flex justify-center pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border bg-card hover:bg-muted text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
