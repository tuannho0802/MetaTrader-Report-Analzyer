"use client";

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
import { useTranslation } from "@/lib/i18n";
import { BASE_PATH, GITHUB_RAW_BASE } from "@/lib/constants";


export default function AboutMT5Page() {
  const { t } = useTranslation();
  const steps = t('aboutMT5.steps') as any[];
  const columns = t('aboutMT5.columns') as string[];

  const getDownloadUrl = (path: string) => {
    // In production, we use the raw github link as a fallback if the self-hosted link fails
    // But for now, we'll try to use the self-hosted link as primary and provide a way to switch or just use github raw
    const isProd = process.env.NODE_ENV === 'production';
    return isProd ? `${GITHUB_RAW_BASE}${path}` : `${BASE_PATH}${path}`;
  };

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
            {t('aboutMT5.back')}
          </Link>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {t('aboutMT5.title')}
              </h1>
              <p className="mt-2 text-muted-foreground text-base max-w-2xl">
                {t('aboutMT5.intro')}
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
            <h2 className="text-xl font-bold tracking-tight">{t('aboutMT5.requiredFormat')}</h2>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('aboutMT5.columnsNote')}
            </p>

            <div className="flex flex-wrap gap-2">
              {columns.map((col, i) => (
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
                {t('aboutMT5.sectionHeaders')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('aboutMT5.headersNote')}
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
            <h2 className="text-xl font-bold tracking-tight">{t('aboutMT5.downloadScript')}</h2>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('aboutMT5.downloadNote')}
            </p>

            <a
              href={getDownloadUrl('/script-for-mt5/MT5_Report_Script.ex5')}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              {t('aboutMT5.downloadButton')}
            </a>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs">
                {t('aboutMT5.refreshNote')}
              </p>
            </div>
          </div>
        </section>

        {/* ── Step-by-step guide ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('aboutMT5.howToGenerate')}</h2>
          </div>

          <ol className="space-y-4">
            {steps.map((step, i) => (
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
            <h2 className="text-xl font-bold tracking-tight">{t('aboutMT5.publicSource')}</h2>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('aboutMT5.sourceNote')}
            </p>

            <a
              href={getDownloadUrl('/script-for-mt5/MT5_Report_Script.mq5')}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              {t('aboutMT5.sourceButton')}
            </a>
          </div>
        </section>

        {/* ── Important Note ── */}
        <section>
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{t('aboutMT5.magicNoteTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('aboutMT5.magicNoteBody')}
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
            {t('common.dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
