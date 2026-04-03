// PreFlightResultsView — A/B test results (Figma 263-1070)

import { useMemo } from "react";
import {
  ChevronLeft,
  FileText,
  Trophy,
  Check,
  Zap,
  RotateCcw,
  Bookmark,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { AnalysisResult } from "../services/analyzerService";
import type { ComparisonResult, RankedVariant, TestType, VariantInput } from "../types/preflight";

type ScoreBand = "good" | "mid" | "low";

function bandForScore(n: number): ScoreBand {
  if (n >= 8) return "good";
  if (n >= 5) return "mid";
  return "low";
}

const BAND_TEXT: Record<ScoreBand, string> = {
  good: "text-[color:var(--success)]",
  mid: "text-[color:var(--score-average)]",
  low: "text-[color:var(--error)]",
};

const BAND_BAR: Record<ScoreBand, string> = {
  good: "bg-[color:var(--success)]",
  mid: "bg-[color:var(--score-average)]",
  low: "bg-[color:var(--error)]",
};

function shortVariantLabel(label: string): string {
  const m = label.match(/variant\s+([a-z0-9]+)/i);
  if (m) return m[1].toUpperCase();
  const t = label.trim();
  return t.length <= 3 ? t.toUpperCase() : t.slice(0, 3).toUpperCase();
}

function visualScore(s: NonNullable<AnalysisResult["scores"]>): number {
  return Math.round((s.hook + s.clarity + s.cta + s.production) / 4);
}

type DimKey = "hook" | "clarity" | "cta" | "production" | "visual";

const DIMENSION_ROWS: { key: DimKey; label: string }[] = [
  { key: "hook", label: "Hook" },
  { key: "clarity", label: "Message" },
  { key: "cta", label: "CTA" },
  { key: "production", label: "Production" },
  { key: "visual", label: "Visual" },
];

function dimValue(scores: AnalysisResult["scores"], key: DimKey): number | null {
  if (!scores) return null;
  if (key === "visual") return visualScore(scores);
  return scores[key];
}

interface HeroThumbProps {
  rv: RankedVariant;
  url: string | null;
  v: VariantInput | undefined;
  isWinner: boolean;
}

function HeroThumb({ rv, url, v, isWinner }: HeroThumbProps) {
  const isVideo = v?.file?.type.startsWith("video/") ?? false;

  const media = url ? (
    isVideo ? (
      <video src={url} className="h-full w-full object-cover" muted playsInline />
    ) : (
      <img src={url} alt="" className="h-full w-full object-cover" />
    )
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[color:var(--surface-el)]">
      <span className="font-mono text-xs text-[color:var(--ink-muted)]">{rv.label}</span>
    </div>
  );

  if (!isWinner) {
    const b = bandForScore(rv.overallScore);
    return (
      <div className="flex w-[38%] max-w-[220px] flex-col items-center sm:w-[42%]">
        <div className="relative w-full overflow-hidden rounded-2xl border border-[color:var(--border)] opacity-90">
          <div className={cn(isVideo ? "aspect-video" : "aspect-[4/5] min-h-[160px] sm:aspect-square sm:min-h-0")}>{media}</div>
        </div>
        <p className="mt-3 text-center text-[11.5px] font-medium text-[color:var(--ink-muted)]">{rv.label}</p>
        <p className="mt-1 text-center">
          <span className={cn("font-mono text-[1.65rem] font-bold leading-none tracking-tight", BAND_TEXT[b])}>
            {rv.overallScore.toFixed(1)}
          </span>
          <span className="ml-0.5 font-mono text-sm font-normal text-[color:var(--ab-variant-label)]">/10</span>
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex w-[58%] max-w-[308px] flex-col items-center sm:w-[55%]">
      <div
        className="pointer-events-none absolute left-1/2 top-[20%] h-[420px] w-[280px] -translate-x-1/2 rounded-full opacity-90 blur-[80px]"
        style={{ background: "var(--ab-results-hero-winner-glow)" }}
        aria-hidden
      />
      <div
        className="relative z-[2] mb-3 flex items-center gap-2 rounded-full border px-3 py-1.5"
        style={{
          background: "var(--ab-results-winner-pill-bg)",
          borderColor: "var(--ab-results-winner-pill-border)",
          boxShadow: "0 0 19px rgba(16,185,129,0.3)",
        }}
      >
        <Trophy className="h-3.5 w-3.5 text-[color:var(--ab-results-winner-pill-text)]" aria-hidden />
        <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--ab-results-winner-pill-text)]">
          Winner
        </span>
      </div>
      <div
        className="relative z-[1] w-full overflow-hidden rounded-2xl border-2"
        style={{
          borderColor: "var(--ab-results-hero-winner-border)",
          boxShadow: "var(--ab-results-hero-winner-shadow)",
        }}
      >
        <div className={cn("relative", isVideo ? "aspect-video" : "aspect-[4/5] min-h-[200px] sm:aspect-square sm:min-h-0")}>
          {media}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(9,9,11,0.85)] via-transparent to-transparent opacity-90"
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pt-8">
            <span
              className="font-bold tracking-tight text-[color:var(--success)]"
              style={{
                fontSize: "clamp(2.5rem, 8vw, 3.75rem)",
                lineHeight: 1,
                textShadow: "0 0 38px rgba(16,185,129,0.4)",
              }}
            >
              {rv.overallScore.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      <p className="relative z-[2] mt-4 text-center text-2xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-[2.4rem]">
        {rv.label}
      </p>
    </div>
  );
}

interface MetricsRowProps {
  label: string;
  leftScore: number | null;
  rightScore: number | null;
  leftShort: string;
  rightShort: string;
  showBiggestGapOnLeft: boolean;
  showBiggestGapOnRight: boolean;
}

function MetricsRow({
  label,
  leftScore,
  rightScore,
  leftShort,
  rightShort,
  showBiggestGapOnLeft,
  showBiggestGapOnRight,
}: MetricsRowProps) {
  const l = leftScore ?? 0;
  const r = rightScore ?? 0;
  const leftWins = l > r;
  const rightWins = r > l;
  const leftPct = (l / 10) * 100;
  const rightPct = (r / 10) * 100;
  const lb = leftScore != null ? bandForScore(l) : "mid";
  const rb = rightScore != null ? bandForScore(r) : "mid";

  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
      {/* Left track + score */}
      <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center justify-end gap-2">
          {showBiggestGapOnLeft && (
            <span
              className="hidden shrink-0 rounded border px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.08em] text-[color:var(--decon-momentum-text)] sm:inline-block"
              style={{
                background: "var(--decon-momentum-bg)",
                borderColor: "var(--decon-momentum-border)",
              }}
            >
              Biggest gap
            </span>
          )}
          {leftScore != null ? (
            <span className={cn("shrink-0 font-mono text-base font-bold tabular-nums sm:text-lg", BAND_TEXT[lb])}>
              {leftScore.toFixed(1)}
            </span>
          ) : (
            <span className="text-[color:var(--ink-muted)]">—</span>
          )}
        </div>
        <div className="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-[color:var(--surface-raised)] sm:max-w-[250px]">
          <div className="flex h-full justify-end">
            {leftScore != null && (
              <div
                className={cn("h-full rounded-full transition-[width] duration-500 ease-out", BAND_BAR[lb])}
                style={{ width: `${leftPct}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="flex w-[100px] shrink-0 flex-col items-center gap-1 text-center sm:w-[120px]">
        <span className="text-[13px] font-medium text-[color:var(--ink)]">{label}</span>
        {leftWins && (
          <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--success)]">
            {leftShort} wins
          </span>
        )}
        {rightWins && (
          <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--decon-accent-light)]">
            {rightShort} wins
          </span>
        )}
        {!leftWins && !rightWins && leftScore != null && rightScore != null && (
          <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-muted)]">Tie</span>
        )}
      </div>

      {/* Right track + score */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-[color:var(--surface-raised)] sm:max-w-[250px]">
          <div className="flex h-full justify-start">
            {rightScore != null && (
              <div
                className={cn("h-full rounded-full transition-[width] duration-500 ease-out", BAND_BAR[rb])}
                style={{ width: `${rightPct}%` }}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rightScore != null ? (
            <span className={cn("shrink-0 font-mono text-base font-bold tabular-nums sm:text-lg", BAND_TEXT[rb])}>
              {rightScore.toFixed(1)}
            </span>
          ) : (
            <span className="text-[color:var(--ink-muted)]">—</span>
          )}
          {showBiggestGapOnRight && (
            <span
              className="hidden shrink-0 rounded border px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.08em] text-[color:var(--decon-momentum-text)] sm:inline-block"
              style={{
                background: "var(--decon-momentum-bg)",
                borderColor: "var(--decon-momentum-border)",
              }}
            >
              Biggest gap
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export interface PreFlightResultsViewProps {
  comparison: ComparisonResult;
  analyses: AnalysisResult[];
  analysisLabels: string[];
  variants: VariantInput[];
  variantThumbnailUrls: (string | null)[];
  testType: TestType;
  onBack: () => void;
  onExportPdf: () => void;
  onRunAnotherTest: () => void;
  onSaveWinnerToLibrary: () => void;
}

export function PreFlightResultsView({
  comparison,
  analyses,
  analysisLabels,
  variants,
  variantThumbnailUrls,
  testType,
  onBack,
  onExportPdf,
  onRunAnotherTest,
  onSaveWinnerToLibrary,
}: PreFlightResultsViewProps) {
  const analysisByLabel = useMemo(() => {
    const m = new Map<string, AnalysisResult>();
    analysisLabels.forEach((lab, i) => {
      if (analyses[i]) m.set(lab, analyses[i]!);
    });
    return m;
  }, [analysisLabels, analyses]);

  const sortedByRank = useMemo(
    () => [...comparison.rankings].sort((a, b) => a.rank - b.rank),
    [comparison.rankings]
  );
  const rvWinner = sortedByRank[0];
  const rvRunner = sortedByRank[1];

  const labelToVariant = useMemo(() => {
    const m = new Map<string, VariantInput>();
    variants.forEach((v) => m.set(v.label, v));
    return m;
  }, [variants]);

  const labelToUrl = useMemo(() => {
    const m = new Map<string, string | null>();
    variants.forEach((v, i) => m.set(v.label, variantThumbnailUrls[i]));
    return m;
  }, [variants, variantThumbnailUrls]);

  const metricsLeft = rvWinner;
  const metricsRight = rvRunner ?? rvWinner;

  const scoresLeft = analysisByLabel.get(metricsLeft.label)?.scores ?? null;
  const scoresRight = analysisByLabel.get(metricsRight.label)?.scores ?? null;

  const biggestGapKey = useMemo(() => {
    let best: DimKey = "hook";
    let bestGap = -1;
    for (const { key } of DIMENSION_ROWS) {
      const a = dimValue(scoresLeft, key);
      const b = dimValue(scoresRight, key);
      if (a == null || b == null) continue;
      const g = Math.abs(a - b);
      if (g > bestGap) {
        bestGap = g;
        best = key;
      }
    }
    return best;
  }, [scoresLeft, scoresRight]);

  const testTypeLabel =
    testType === "full" ? "Full Creative" : testType === "hook" ? "Hook Battle" : "CTA Showdown";
  const subtitle = `${testTypeLabel} • ${comparison.rankings.length} Variants`;

  const leftShort = shortVariantLabel(metricsLeft.label);
  const rightShort = shortVariantLabel(metricsRight.label);

  return (
    <div
      className="relative flex min-h-[calc(100vh-56px)] w-full flex-col overflow-x-hidden bg-[color:var(--bg)]"
      style={{
        backgroundImage: "var(--ab-ambient-gradient)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 60%",
      }}
    >
      <div className="relative z-[1] mx-auto flex w-full max-w-[960px] flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-secondary)] transition-[color,border-color,transform] duration-150 hover:border-[color:var(--border-hover)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.98]"
              aria-label="Back to A/B test"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-2xl">Test Results</h1>
              <p className="mt-1 text-[12.5px] text-[color:var(--ab-run-disabled-text)]">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExportPdf}
            className="flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-[10px] border border-[color:var(--border)] px-4 text-[12.5px] font-medium text-[color:var(--ab-test-type-inactive-text)] transition-[color,border-color,background-color] duration-150 hover:border-[color:var(--border-hover)] hover:bg-[color:var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.99] sm:self-auto"
          >
            <FileText className="h-4 w-4" aria-hidden />
            Export PDF
          </button>
        </header>

        {/* Hero */}
        {rvRunner && rvWinner && (
          <section className="mb-12 flex w-full flex-col items-center justify-center gap-6 sm:mb-16 sm:flex-row sm:items-end sm:gap-4 md:gap-10">
            <HeroThumb
              rv={rvRunner}
              url={labelToUrl.get(rvRunner.label) ?? null}
              v={labelToVariant.get(rvRunner.label)}
              isWinner={false}
            />
            <HeroThumb
              rv={rvWinner}
              url={labelToUrl.get(rvWinner.label) ?? null}
              v={labelToVariant.get(rvWinner.label)}
              isWinner
            />
          </section>
        )}

        {/* Head-to-head metrics */}
        <section className="mb-10 sm:mb-12">
          <h2 className="mb-8 text-center text-lg font-semibold text-[color:var(--ink)] sm:text-xl">Head-to-head metrics</h2>
          <div className="mx-auto flex max-w-[800px] flex-col gap-5 sm:gap-6">
            {DIMENSION_ROWS.map(({ key, label }) => {
              const ls = dimValue(scoresLeft, key);
              const rs = dimValue(scoresRight, key);
              const isBig = key === biggestGapKey && ls != null && rs != null && Math.abs(ls - rs) >= 0.5;
              const leftWinsDim = ls != null && rs != null && ls > rs;
              const rightWinsDim = ls != null && rs != null && rs > ls;
              return (
                <MetricsRow
                  key={key}
                  label={label}
                  leftScore={ls}
                  rightScore={rs}
                  leftShort={leftShort}
                  rightShort={rightShort}
                  showBiggestGapOnLeft={isBig && leftWinsDim}
                  showBiggestGapOnRight={isBig && rightWinsDim}
                />
              );
            })}
          </div>
        </section>

        {/* Insight cards */}
        <section
          className={cn(
            "mb-10 grid grid-cols-1 gap-4 sm:mb-12 sm:gap-5",
            comparison.hybridNote ? "sm:grid-cols-2" : "sm:max-w-xl",
          )}
        >
          <div
            className="relative overflow-hidden rounded-2xl border pl-1 sm:pl-1"
            style={{
              background: "var(--ab-results-rec-card-bg)",
              borderColor: "var(--ab-results-rec-card-border)",
            }}
          >
            <div
              className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl"
              style={{
                background: "var(--ab-results-rec-accent-bar)",
                boxShadow: "0 0 19px rgba(16,185,129,0.35)",
              }}
              aria-hidden
            />
            <div className="px-5 py-6 pl-6 sm:px-7 sm:py-7">
              <div className="mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-[color:var(--ab-results-winner-pill-text)]" strokeWidth={2.5} aria-hidden />
                <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[color:var(--ab-results-winner-pill-text)]">
                  Recommendation
                </span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-[color:var(--ink)] sm:text-xl">
                {comparison.winner.headline}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--ab-test-type-inactive-text)]">
                {comparison.recommendation}
              </p>
            </div>
          </div>

          {comparison.hybridNote ? (
            <div
              className="relative overflow-hidden rounded-2xl border pl-1 sm:pl-1"
              style={{
                background: "var(--ab-results-hybrid-card-bg)",
                borderColor: "var(--ab-results-hybrid-card-border)",
              }}
            >
              <div
                className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl"
                style={{
                  background: "var(--ab-results-hybrid-accent-bar)",
                  boxShadow: "0 0 19px rgba(99,102,241,0.35)",
                }}
                aria-hidden
              />
              <div className="px-5 py-6 pl-6 sm:px-7 sm:py-7">
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[color:var(--decon-accent-light)]" aria-hidden />
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[color:var(--decon-accent-light)]">
                    Hybrid Opportunity
                  </span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-[color:var(--ink)] sm:text-xl">Create Version C</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--ab-test-type-inactive-text)]">
                  {comparison.hybridNote}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {/* Footer actions */}
        <footer className="mt-auto flex flex-col-reverse gap-3 border-t border-[color:var(--border)] pt-6 sm:flex-row sm:justify-end sm:gap-4">
          <button
            type="button"
            onClick={onRunAnotherTest}
            className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[color:var(--border)] px-5 text-[12.5px] font-medium text-[color:var(--ab-test-type-inactive-text)] transition-[color,border-color,background-color,transform] duration-150 hover:border-[color:var(--border-hover)] hover:bg-[color:var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.99]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Run Another Test
          </button>
          <button
            type="button"
            onClick={onSaveWinnerToLibrary}
            className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[color:var(--accent)] px-5 text-[12.5px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[color:var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.99]"
            style={{ boxShadow: "var(--ab-results-primary-btn-shadow)" }}
          >
            <Bookmark className="h-4 w-4" aria-hidden />
            Save Winner to Library
          </button>
        </footer>
      </div>
    </div>
  );
}
