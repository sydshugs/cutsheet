// CompetitorResult.tsx — Full comparison result display (winner / loser / tied layouts)

import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Minus,
  Check,
  CheckCircle,
  XCircle,
  Zap,
  ChevronDown,
  ChevronLeft,
  Target,
  TrendingDown,
  TrendingUp,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  Swords,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useThumbnail } from "../hooks/useThumbnail";
import { getBenchmark } from "../lib/platformBenchmarks";
import type { CompetitorResult as CResult, GapAnalysis } from "../services/competitorService";
import { ScoreCard } from "./ScoreCard";

// ─── OUTCOME (scores are source of truth for which page to show) ───────────

export type CompetitorOutcome = "winning" | "losing" | "tied";

/** Which results layout to show: your overall vs competitor overall. */
export function getCompetitorOutcome(result: CResult): CompetitorOutcome {
  const y = result.your.scores?.overall ?? 0;
  const c = result.competitor.scores?.overall ?? 0;
  if (y > c) return "winning";
  if (y < c) return "losing";
  return "tied";
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "..." : s;
}

function diffColor(diff: number) {
  if (diff > 0) return "var(--success)";
  if (diff < 0) return "var(--error)";
  return "var(--ink-muted)";
}

function diffLabel(diff: number) {
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

const IMPACT_COLORS = { high: "#10b981", medium: "#f59e0b", low: "#71717a" } as const;
const EFFORT_LABELS = { quick: "Quick win", medium: "Medium effort", heavy: "Heavy lift" } as const;

// ─── SHARED SECTIONS ───────────────────────────────────────────────────────

function ScoreComparisonTable({
  yourScores,
  compScores,
  yourFileName,
  competitorFileName,
}: {
  yourScores: NonNullable<CResult["your"]["scores"]>;
  compScores: NonNullable<CResult["competitor"]["scores"]>;
  yourFileName: string;
  competitorFileName: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]"
    >
      <div
        className="grid border-b border-[color:var(--border)] bg-[color:var(--surface-el)] px-4 py-2.5"
        style={{ gridTemplateColumns: "1fr 60px 30px 60px 50px" }}
      >
        <span className="text-[11px] uppercase text-[color:var(--ink-muted)]">Metric</span>
        <span className="text-center text-[11px] text-[color:var(--ink-muted)]">{truncate(yourFileName, 12)}</span>
        <span />
        <span className="text-center text-[11px] text-[color:var(--ink-muted)]">{truncate(competitorFileName, 12)}</span>
        <span className="text-right text-[11px] text-[color:var(--ink-muted)]">Diff</span>
      </div>
      {(["overall", "hook", "clarity", "cta", "production"] as const).map((key) => {
        const labels: Record<string, string> = {
          overall: "Overall",
          hook: "Hook",
          clarity: "Clarity",
          cta: "CTA",
          production: "Production",
        };
        const yours = yourScores[key];
        const theirs = compScores[key];
        const diff = yours - theirs;
        return (
          <div
            key={key}
            className="grid items-center border-b border-[color:var(--border)] px-4 py-2 last:border-b-0"
            style={{ gridTemplateColumns: "1fr 60px 30px 60px 50px" }}
          >
            <span
              className={cn(
                "text-[13px]",
                key === "overall" ? "font-semibold text-[color:var(--ink)]" : "text-[color:var(--ink-secondary)]",
              )}
            >
              {labels[key]}
            </span>
            <span
              className="text-center text-[14px] font-semibold"
              style={{ fontFamily: "var(--mono)", color: diffColor(diff) }}
            >
              {yours}
            </span>
            <span className="text-center text-[11px] text-[color:var(--ink-muted)]">vs</span>
            <span
              className="text-center text-[14px] font-semibold"
              style={{ fontFamily: "var(--mono)", color: diffColor(-diff) }}
            >
              {theirs}
            </span>
            <span
              className="text-right text-[12px] font-medium"
              style={{ fontFamily: "var(--mono)", color: diffColor(diff) }}
            >
              {diff !== 0 ? diffLabel(diff) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StrengthsSection({ strengths }: { strengths: GapAnalysis["strengths"] }) {
  if (strengths.length === 0) return null;
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5">
        <CheckCircle className="h-4 w-4 shrink-0 text-[color:var(--success)]" aria-hidden />
        <span className="text-sm font-semibold text-[color:var(--success)]">Where you&apos;re winning</span>
      </div>
      <div className="flex flex-col gap-2">
        {strengths.map((s, i) => (
          <div
            key={i}
            className="rounded-[10px] border-l-2 border-[color:var(--success)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-3.5 py-2.5"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-0.5 text-[11px] text-[color:var(--accent-light)]">
                {s.metric}
              </span>
              <span className="text-xs text-[color:var(--ink-muted)]">
                {s.yourScore} vs {s.competitorScore}
              </span>
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-[color:var(--ink-secondary)]">{s.insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeaknessesSection({ weaknesses }: { weaknesses: GapAnalysis["weaknesses"] }) {
  if (weaknesses.length === 0) return null;
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5">
        <XCircle className="h-4 w-4 shrink-0 text-[color:var(--error)]" aria-hidden />
        <span className="text-sm font-semibold text-[color:var(--error)]">Where they&apos;re beating you</span>
      </div>
      <div className="flex flex-col gap-2">
        {weaknesses.map((w, i) => (
          <div
            key={i}
            className="rounded-[10px] border-l-2 border-[color:var(--error)] bg-[color-mix(in_srgb,var(--error)_8%,transparent)] px-3.5 py-2.5"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-0.5 text-[11px] text-[color:var(--accent-light)]">
                {w.metric}
              </span>
              <span className="text-xs text-[color:var(--ink-muted)]">
                {w.yourScore} vs {w.competitorScore}
              </span>
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-[color:var(--ink-secondary)]">{w.insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionPlanSection({
  actionPlan,
  heading,
}: {
  actionPlan: GapAnalysis["actionPlan"];
  heading: string;
}) {
  if (actionPlan.length === 0) return null;
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5">
        <Zap className="h-4 w-4 shrink-0 text-[color:var(--ink)]" aria-hidden />
        <span className="text-sm font-semibold text-[color:var(--ink)]">{heading}</span>
      </div>
      <div className="flex flex-col gap-2">
        {actionPlan.map((a, i) => {
          const priorityColors = { 1: "#6366f1", 2: "#f59e0b", 3: "#71717a" };
          const pColor = priorityColors[a.priority] ?? "#71717a";
          return (
            <div
              key={i}
              className={cn(
                "rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-3",
                a.priority === 1 && "border-[color:var(--accent-border)]",
                a.priority === 3 && "opacity-80",
              )}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ color: pColor, background: `${pColor}15` }}
                >
                  P{a.priority}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px]"
                  style={{ color: IMPACT_COLORS[a.impact], background: `${IMPACT_COLORS[a.impact]}15` }}
                >
                  {a.impact === "high" ? "High impact" : a.impact === "medium" ? "Medium" : "Low"}
                </span>
                <span className="rounded-full bg-[color:var(--surface-el)] px-2 py-0.5 text-[10px] text-[color:var(--ink-muted)]">
                  {EFFORT_LABELS[a.effort] ?? a.effort}
                </span>
                <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-0.5 text-[10px] text-[color:var(--accent-light)]">
                  {a.metric}
                </span>
              </div>
              <p
                className={cn(
                  "m-0 leading-relaxed text-[color:var(--ink)]",
                  a.priority === 1 ? "text-sm font-semibold" : "text-[13px] font-normal",
                )}
              >
                {a.action}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollapsibleDualScorecards({
  result,
  yourExpanded,
  setYourExpanded,
  compExpanded,
  setCompExpanded,
}: {
  result: CResult;
  yourExpanded: boolean;
  setYourExpanded: (v: boolean) => void;
  compExpanded: boolean;
  setCompExpanded: (v: boolean) => void;
}) {
  return (
    <>
      {[
        { label: "Your Ad", expanded: yourExpanded, toggle: () => setYourExpanded(!yourExpanded), data: result.your },
        {
          label: "Competitor Ad",
          expanded: compExpanded,
          toggle: () => setCompExpanded(!compExpanded),
          data: result.competitor,
        },
      ].map(({ label, expanded, toggle, data }) => (
        <div key={label}>
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2.5 text-[13px] font-medium text-[color:var(--ink-secondary)] transition-[border-radius,background-color] duration-150",
              "hover:bg-[color:var(--surface-el)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)]",
              expanded ? "rounded-t-xl border-b-0" : "rounded-xl",
            )}
          >
            {label} — Full Scorecard
            <ChevronDown
              className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", expanded && "rotate-180")}
              aria-hidden
            />
          </button>
          <AnimatePresence>
            {expanded && data.scores && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-b-xl border border-t-0 border-[color:var(--border)]"
              >
                <ScoreCard
                  scores={data.scores}
                  improvements={data.improvements}
                  budget={data.budget}
                  hashtags={data.hashtags}
                  fileName={data.fileName}
                  isDark
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </>
  );
}

function WinProbabilityPill({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-1 text-xs text-[color:var(--accent-light)]">
      {value}% modeled win probability
    </span>
  );
}

// ─── RESULTS PAGE HEADER — Figma 263-1702 (shared) ───────────────────────────

function CompetitorResultsPageHeader({ onStartOver }: { onStartOver?: () => void }) {
  return (
    <header className="mb-6 flex flex-col gap-3 md:mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-[38px] shrink-0 items-center justify-center rounded-[23px] border border-[color:var(--decon-accent-border)] bg-[color:var(--decon-accent-soft)]"
            style={{ boxShadow: "0 0 19px color-mix(in srgb, var(--accent) 20%, transparent)" }}
          >
            <Swords className="size-[17px] text-[color:var(--decon-accent-light)]" strokeWidth={1.75} aria-hidden />
          </div>
          <h1 className="m-0 min-w-0 text-[21px] font-bold leading-tight tracking-[-0.025em] text-[color:var(--ink)] md:text-[23px]">
            Competitor Analysis
          </h1>
        </div>
        <div
          className="flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-3 py-1.5"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <span
            className="size-1.5 shrink-0 rounded-full bg-[color:var(--success)]"
            style={{ boxShadow: "0 0 8px var(--success)" }}
            aria-hidden
          />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[color:var(--decon-markdown-muted)]">
            Analysis complete
          </span>
        </div>
      </div>
      {onStartOver ? (
        <button
          type="button"
          onClick={onStartOver}
          className={cn(
            "flex w-fit items-center gap-1 border-none bg-transparent p-0 text-[12px] text-[color:var(--ink-muted)]",
            "cursor-pointer transition-[color,opacity] duration-150 hover:text-[color:var(--ink)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]",
            "active:opacity-80",
          )}
        >
          <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
          Compare another
        </button>
      ) : null}
    </header>
  );
}

// ─── LOSING — Figma 263-1702 ───────────────────────────────────────────────

function fmtScoreOne(n: number) {
  return n.toFixed(1);
}

function LoserWinProbabilityPill({ value }: { value: number }) {
  return (
    <div className="relative flex items-center justify-center gap-2 overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--error)_22%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,var(--surface))] px-5 py-2 shadow-[0_0_20px_color-mix(in_srgb,var(--error)_16%,transparent)]">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--error)] shadow-[0_0_10px_var(--error)]"
        aria-hidden
      />
      <span className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--competitor-losing-win-prob-text)]">
        {value}% win probability
      </span>
    </div>
  );
}

function WinnerWinProbabilityPill({ value }: { value: number }) {
  return (
    <div className="relative flex items-center justify-center gap-2 overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--success)_28%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,var(--surface))] px-5 py-2 shadow-[0_0_20px_color-mix(in_srgb,var(--success)_18%,transparent)]">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--success)] shadow-[0_0_10px_var(--success)]"
        aria-hidden
      />
      <span className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--competitor-winning-win-prob-text)]">
        {value}% win probability
      </span>
    </div>
  );
}

function formatPredictedCtrBand(overall: number, hook: number) {
  const bench = getBenchmark("meta");
  const mult = 0.5 + (overall / 10) * 0.38 + (hook / 10) * 0.28;
  const low = Math.max(0.12, bench.ctrAvg * mult * 0.72);
  const high = Math.max(low + 0.08, bench.ctrAvg * mult * 1.28);
  return {
    band: `${low.toFixed(1)}% — ${high.toFixed(1)}%`,
    avgLabel: `~${bench.ctrAvg}%`,
  };
}

function budgetTargetsFromResult(
  budget: CResult["your"]["budget"],
  overall: number,
): { target: string; daily: string } {
  const dailyStr = budget?.daily ?? "";
  const matches = dailyStr.match(/\$[\d,]+/g);
  if (matches && matches.length >= 2) {
    return { target: matches[0]!, daily: matches[matches.length - 1]! };
  }
  if (matches && matches.length === 1) {
    return { target: matches[0]!, daily: matches[0]! };
  }
  const base = 120 + Math.round(overall * 38);
  return { target: `$${Math.round(base * 0.42)}`, daily: `$${base}` };
}

function fatigueResistanceCopy(hookScore: number): string {
  const days = hookScore >= 9 ? "14+" : hookScore >= 7 ? "10–14" : hookScore >= 5 ? "7–10" : "5–7";
  if (hookScore >= 8) {
    return `Your hook dominance gives this creative strong fatigue resistance — estimated ${days} days before performance drop.`;
  }
  return `Your hook strength gives this creative solid fatigue resistance — estimated ${days} days before meaningful performance decay.`;
}

type MetricBarTone = "muted" | "ahead-yours" | "ahead-theirs";

function MetricBarRow({
  label,
  value,
  valueColorVar,
  tone,
}: {
  label: string;
  value: number;
  valueColorVar: string;
  tone: MetricBarTone;
}) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  const fill =
    tone === "muted"
      ? "var(--competitor-metric-bar-muted-fill)"
      : tone === "ahead-yours"
        ? "var(--competitor-metric-bar-yours-ahead-fill)"
        : "var(--competitor-metric-bar-theirs-ahead-fill)";
  const barShadow =
    tone === "ahead-yours"
      ? "var(--competitor-metric-bar-yours-ahead-glow)"
      : tone === "ahead-theirs"
        ? "var(--competitor-metric-bar-theirs-ahead-glow)"
        : "none";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[color:var(--ink-muted)]">{label}</span>
        <span className="font-mono text-[15px] leading-none" style={{ color: valueColorVar }}>
          {fmtScoreOne(value)}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--competitor-metric-bar-track)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: fill,
            boxShadow: barShadow,
          }}
        />
      </div>
    </div>
  );
}

function MatchupMetricCard({
  label,
  yours,
  theirs,
}: {
  label: string;
  yours: number;
  theirs: number;
}) {
  const diff = yours - theirs;
  const diffStr = (diff > 0 ? "+" : "") + fmtScoreOne(diff);
  const diffPositive = diff > 0;
  const youLead = yours >= theirs;
  const theyLead = theirs > yours;

  const yoursValueColor = theyLead ? "var(--ink-muted)" : "var(--ink)";
  const theirsValueColor = youLead ? "var(--ink-muted)" : "var(--ink)";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[15px] border shadow-[var(--shadow-sm)]",
        diffPositive
          ? "border-[color:var(--competitor-metric-card-positive-border)] bg-[color:var(--competitor-metric-card-positive-bg)]"
          : "border-[color-mix(in_srgb,var(--ink)_4%,var(--border))] bg-[color:var(--card)]",
      )}
    >
      {diffPositive ? (
        <div
          className="pointer-events-none absolute right-0 top-0 size-28 translate-x-1/3 -translate-y-1/3 rounded-full bg-[color:var(--competitor-metric-card-positive-glow)] blur-3xl"
          aria-hidden
        />
      ) : null}
      {diff < 0 ? (
        <div
          className="pointer-events-none absolute right-0 top-0 size-28 translate-x-1/3 -translate-y-1/3 rounded-full bg-[color:var(--competitor-metric-card-negative-glow)] blur-3xl"
          aria-hidden
        />
      ) : null}
      <div className="relative flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--ink-secondary)]">{label}</h4>
          <span
            className={cn(
              "shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] font-bold",
              diffPositive
                ? "border-[color-mix(in_srgb,var(--success)_20%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[color:var(--success)]"
                : diff === 0
                  ? "border-[color:var(--border)] bg-[color:var(--surface-el)] text-[color:var(--ink-muted)]"
                  : "border-[color-mix(in_srgb,var(--error)_20%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] text-[color:var(--competitor-losing-win-prob-text)]",
            )}
          >
            {diff === 0 ? "—" : diffStr}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <MetricBarRow
            label="Yours"
            value={yours}
            valueColorVar={yoursValueColor}
            tone={youLead ? "ahead-yours" : "muted"}
          />
          <MetricBarRow
            label="Theirs"
            value={theirs}
            valueColorVar={theirsValueColor}
            tone={theyLead ? "ahead-theirs" : "muted"}
          />
        </div>
      </div>
    </div>
  );
}

function MatchupMetricGrid({
  yourScores,
  compScores,
}: {
  yourScores: NonNullable<CResult["your"]["scores"]>;
  compScores: NonNullable<CResult["competitor"]["scores"]>;
}) {
  const rows: { key: keyof NonNullable<CResult["your"]["scores"]>; label: string }[] = [
    { key: "overall", label: "Overall" },
    { key: "hook", label: "Hook" },
    { key: "clarity", label: "Clarity" },
    { key: "cta", label: "CTA" },
    { key: "production", label: "Production" },
  ];
  return (
    <section className="flex flex-col gap-3" aria-labelledby="competitor-matchup-metrics-heading">
      <div id="competitor-matchup-metrics-heading" className="flex items-center gap-2 pl-1">
        <BarChart3 className="h-4 w-4 text-[color:var(--ink-muted)]" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">
          Score comparison
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map(({ key, label }) => (
          <MatchupMetricCard key={key} label={label} yours={yourScores[key]} theirs={compScores[key]} />
        ))}
      </div>
    </section>
  );
}

function CreativePreviewCard({
  src,
  matchup,
  side,
  badge,
  roleLine,
  score,
  scoreColorVar,
  roleLineColorVar = "var(--ink-muted)",
}: {
  src: string | null;
  matchup: "winning" | "losing";
  side: "your" | "competitor";
  badge: ReactNode;
  roleLine: string;
  score: number;
  scoreColorVar: string;
  roleLineColorVar?: string;
}) {
  const isLosingYour = matchup === "losing" && side === "your";
  const isLosingComp = matchup === "losing" && side === "competitor";
  const isWinningYour = matchup === "winning" && side === "your";
  const isWinningComp = matchup === "winning" && side === "competitor";
  const showWinnerGlow = isLosingComp || isWinningYour;
  const winnerBadgeCorner = isLosingComp || isWinningYour;
  const targetFrame = isLosingYour || isWinningComp;
  const winnerFrame = isLosingComp || isWinningYour;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden",
        targetFrame &&
          "min-h-[260px] md:min-h-[300px] lg:h-[346px] rounded-[15px] border border-white/[0.1] opacity-70 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)]",
        winnerFrame &&
          "min-h-[280px] md:min-h-[320px] lg:h-[385px] rounded-[15px] border border-[color:var(--competitor-losing-competitor-card-border)] shadow-[var(--competitor-losing-competitor-card-shadow)] opacity-100",
      )}
    >
      {src ? (
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[color:var(--surface-el)]" aria-hidden />
      )}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] to-transparent",
          targetFrame ? "via-[rgba(0,0,0,0.4)]" : "via-[rgba(0,0,0,0.2)]",
        )}
        aria-hidden
      />
      {showWinnerGlow ? (
        <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--success)_10%,transparent)]" aria-hidden />
      ) : null}
      <div
        className={cn("absolute top-3 z-[1]", winnerBadgeCorner ? "right-3 left-auto" : "left-3")}
      >
        {badge}
      </div>
      <div className="relative z-[1] mt-auto flex flex-col gap-1 px-4 pb-5 pt-20">
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: roleLineColorVar }}
        >
          {roleLine}
        </p>
        <p
          className={cn(
            "font-mono font-bold leading-none",
            isLosingComp || isWinningYour
              ? "text-[clamp(1.85rem,5.5vw,2.9rem)]"
              : "text-[clamp(1.1rem,3vw,2.2rem)]",
          )}
          style={{ color: scoreColorVar }}
        >
          {fmtScoreOne(score)}
        </p>
      </div>
    </div>
  );
}

function CompetitorLosingHero({
  yourScore,
  compScore,
  summary,
  winProbability,
  heroYourSrc,
  heroCompetitorSrc,
}: {
  yourScore: number;
  compScore: number;
  summary: string;
  winProbability: number;
  heroYourSrc: string | null;
  heroCompetitorSrc: string | null;
}) {
  const targetBadge = (
    <span className="rounded border border-white/20 bg-black/40 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[color:var(--decon-markdown-muted)]">
      Target
    </span>
  );
  const winnerBadge = (
    <span className="rounded bg-[color:var(--success)] px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-[color:var(--bg)] shadow-[0_0_14px_color-mix(in_srgb,var(--success)_40%,transparent)]">
      Winner
    </span>
  );

  const yourCard = (
    <CreativePreviewCard
      src={heroYourSrc}
      matchup="losing"
      side="your"
      badge={targetBadge}
      roleLine="Your Ad"
      roleLineColorVar="var(--decon-markdown-muted)"
      score={yourScore}
      scoreColorVar="var(--warn)"
    />
  );
  const competitorCard = (
    <CreativePreviewCard
      src={heroCompetitorSrc}
      matchup="losing"
      side="competitor"
      badge={winnerBadge}
      roleLine="Competitor"
      roleLineColorVar="var(--success)"
      score={compScore}
      scoreColorVar="var(--success)"
    />
  );

  const center = (
    <div className="flex flex-col items-center text-center">
      <div className="flex justify-center">
        <div className="rotate-3">
          <div className="flex size-[77px] items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--error)_22%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] shadow-[0_0_40px_color-mix(in_srgb,var(--error)_18%,transparent)]">
            <TrendingDown className="size-8 text-[color:var(--error)]" strokeWidth={2} aria-hidden />
          </div>
        </div>
      </div>
      <h2
        className="mt-6 max-w-lg text-balance text-[clamp(1.75rem,4.5vw,3.125rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[color:var(--ink)] md:leading-[1.08]"
        style={{ textShadow: "var(--competitor-losing-headline-shadow)" }}
      >
        You are losing
        <br />
        this matchup.
      </h2>
      <div className="mt-5">
        <LoserWinProbabilityPill value={winProbability} />
      </div>
      <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-[color:var(--decon-markdown-muted)]">{summary}</p>
    </div>
  );

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-2 py-8 md:px-4 md:py-10"
      style={{ backgroundImage: "var(--competitor-losing-hero-glow)" }}
      aria-labelledby="competitor-losing-hero-title"
    >
      <h2 id="competitor-losing-hero-title" className="sr-only">
        Matchup summary: you are behind on overall score
      </h2>
      <div className="flex flex-col gap-8 lg:hidden">
        {center}
        <div className="grid grid-cols-2 gap-3">{yourCard}{competitorCard}</div>
      </div>
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,260px)_1fr_minmax(0,260px)] lg:items-start lg:gap-6">
        <div className="min-w-0 lg:pt-6">{yourCard}</div>
        <div className="flex min-w-0 items-center justify-center py-4">{center}</div>
        <div className="min-w-0">{competitorCard}</div>
      </div>
    </section>
  );
}

function CompetitorWinningHero({
  yourScore,
  compScore,
  summary,
  winProbability,
  heroYourSrc,
  heroCompetitorSrc,
}: {
  yourScore: number;
  compScore: number;
  summary: string;
  winProbability: number;
  heroYourSrc: string | null;
  heroCompetitorSrc: string | null;
}) {
  const winnerBadge = (
    <span className="rounded bg-[color:var(--success)] px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-[color:var(--bg)] shadow-[0_0_14px_color-mix(in_srgb,var(--success)_40%,transparent)]">
      Winner
    </span>
  );
  const targetBadge = (
    <span className="rounded border border-white/20 bg-black/40 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[color:var(--decon-markdown-muted)]">
      Target
    </span>
  );

  const yourCard = (
    <CreativePreviewCard
      src={heroYourSrc}
      matchup="winning"
      side="your"
      badge={winnerBadge}
      roleLine="Your Ad"
      roleLineColorVar="var(--success)"
      score={yourScore}
      scoreColorVar="var(--ink)"
    />
  );
  const competitorCard = (
    <CreativePreviewCard
      src={heroCompetitorSrc}
      matchup="winning"
      side="competitor"
      badge={targetBadge}
      roleLine="Competitor"
      roleLineColorVar="var(--decon-markdown-muted)"
      score={compScore}
      scoreColorVar="var(--decon-body-muted)"
    />
  );

  const center = (
    <div className="flex flex-col items-center text-center">
      <div className="flex justify-center">
        <div className="rotate-3">
          <div className="flex size-[77px] items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--success)_28%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] shadow-[0_0_40px_color-mix(in_srgb,var(--success)_22%,transparent)]">
            <TrendingUp className="size-8 text-[color:var(--success)]" strokeWidth={2} aria-hidden />
          </div>
        </div>
      </div>
      <h2
        className="mt-6 max-w-lg text-balance text-[clamp(1.75rem,4.5vw,3.125rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[color:var(--ink)] md:leading-[1.08]"
        style={{ textShadow: "var(--competitor-losing-headline-shadow)" }}
      >
        You are winning
        <br />
        this matchup.
      </h2>
      <div className="mt-5">
        <WinnerWinProbabilityPill value={winProbability} />
      </div>
      <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-[color:var(--decon-markdown-muted)]">{summary}</p>
    </div>
  );

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-2 py-8 md:px-4 md:py-10"
      style={{ backgroundImage: "var(--competitor-winning-hero-glow)" }}
      aria-labelledby="competitor-winning-hero-title"
    >
      <h2 id="competitor-winning-hero-title" className="sr-only">
        Matchup summary: you are ahead on overall score
      </h2>
      <div className="flex flex-col gap-8 lg:hidden">
        {center}
        <div className="grid grid-cols-2 gap-3">
          {yourCard}
          {competitorCard}
        </div>
      </div>
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,260px)_1fr_minmax(0,260px)] lg:items-start lg:gap-6">
        <div className="min-w-0">{yourCard}</div>
        <div className="flex min-w-0 items-center justify-center py-4">{center}</div>
        <div className="min-w-0 lg:pt-6">{competitorCard}</div>
      </div>
    </section>
  );
}

function WinnerScaleSection({
  result,
  gap,
  onReanalyze,
}: {
  result: CResult;
  gap: GapAnalysis;
  onReanalyze?: () => void;
}) {
  const yourScores = result.your.scores!;
  const ctr = formatPredictedCtrBand(yourScores.overall, yourScores.hook);
  const budgets = budgetTargetsFromResult(result.your.budget, yourScores.overall);
  const strongEdge = gap.winProbability >= 58;

  const ctrParts = ctr.band.split(/\s*[—–-]\s*/);

  return (
    <section
      className="relative overflow-hidden rounded-[15px] border border-[color:var(--competitor-winning-scale-shell-border)] px-4 pb-6 pt-5 md:px-8 md:pb-8 md:pt-6"
      style={{
        backgroundColor: "var(--competitor-winning-scale-shell-bg)",
        boxShadow: "var(--competitor-winning-scale-shell-shadow)",
      }}
      aria-labelledby="competitor-winning-scale-heading"
    >
      <div
        className="absolute left-0 right-0 top-0 z-20 h-1 bg-[color:var(--success)]"
        style={{ boxShadow: "var(--competitor-winning-scale-top-glow)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "var(--competitor-winning-scale-inner-wash), var(--competitor-winning-scale-ambient)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-2 pt-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full bg-[color:var(--success)] opacity-95"
            style={{ boxShadow: "0 0 8px var(--success)" }}
            aria-hidden
          />
          <span
            id="competitor-winning-scale-heading"
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--success)]"
          >
            High confidence — ready to scale
          </span>
        </div>
        <h3 className="m-0 max-w-[52rem] text-pretty text-center text-[clamp(1.35rem,3.5vw,2.4rem)] font-semibold leading-snug tracking-[-0.025em] text-[color:var(--ink)]">
          Your creative is outperforming the benchmark.
          <br className="hidden sm:block" />
          <span className="sm:ml-1">Time to push budget.</span>
        </h3>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        <div
          className="rounded-[15px] border border-[color:var(--border)] p-5"
          style={{ backgroundColor: "color-mix(in srgb, var(--surface) 98%, transparent)" }}
        >
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
            Win probability
          </p>
          <p className="mt-3 text-center font-mono text-[clamp(2rem,5vw,2.4rem)] font-bold leading-none text-[color:var(--ink)]">
            {gap.winProbability}%
          </p>
          {strongEdge ? (
            <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11.5px] font-medium text-[color:var(--success)]">
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
              Strong edge
            </p>
          ) : (
            <p className="mt-2 h-[17px]" aria-hidden />
          )}
        </div>

        <div
          className="rounded-[15px] border border-[color:var(--border)] p-5"
          style={{ backgroundColor: "color-mix(in srgb, var(--surface) 98%, transparent)" }}
        >
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
            Predicted CTR
          </p>
          <p className="mt-3 text-center font-mono text-[clamp(1.5rem,4vw,2.4rem)] font-bold leading-tight text-[color:var(--ink)]">
            {ctrParts.length >= 2 ? (
              <>
                <span>{ctrParts[0]?.trim()}</span>
                <span className="text-[color:var(--ink-muted)]"> — </span>
                <span>{ctrParts[1]?.trim()}</span>
              </>
            ) : (
              ctr.band
            )}
          </p>
          <p className="mt-2 text-center text-[11.5px] text-[color:var(--decon-markdown-muted)]">
            vs platform avg {ctr.avgLabel.replace(/^~/, "")}
          </p>
        </div>

        <div
          className="rounded-[15px] border border-[color:var(--competitor-winning-budget-card-border)] p-5"
          style={{
            backgroundColor: "var(--competitor-winning-budget-card-bg)",
            boxShadow: "var(--competitor-winning-budget-card-shadow)",
          }}
        >
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--success)]">
            Target budget
          </p>
          <p className="mt-3 text-center font-mono text-[clamp(1.5rem,4vw,2.4rem)] font-bold leading-tight text-[color:var(--success)]">
            <span>{budgets.target}</span>
            <span className="text-[color:var(--competitor-winning-budget-dash)]"> — </span>
            <span>{budgets.daily}</span>
          </p>
          <p
            className="mt-2 text-center text-[11.5px]"
            style={{ color: "var(--competitor-winning-budget-sublabel)" }}
          >
            Daily starting point
          </p>
        </div>
      </div>

      <div
        className="relative z-10 mt-5 flex gap-3 rounded-[15px] border border-[color:var(--border)] px-4 py-3.5 md:px-5 md:py-4"
        style={{ backgroundColor: "color-mix(in srgb, var(--surface) 98%, transparent)" }}
      >
        <Check className="mt-0.5 size-[17px] shrink-0 text-[color:var(--success)]" strokeWidth={2.5} aria-hidden />
        <p className="m-0 text-[13px] leading-relaxed">
          <span className="font-medium text-[color:var(--ink)]">Fatigue resistance: </span>
          <span className="text-[color:var(--decon-body-muted)]">{fatigueResistanceCopy(yourScores.hook)}</span>
        </p>
      </div>

      <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/app/paid"
          className="inline-flex h-[38px] min-w-[200px] items-center justify-center rounded-[10px] bg-[color:var(--accent)] px-8 text-[12.5px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[color:var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.99]"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          Generate Creative Brief
        </Link>
        {onReanalyze ? (
          <button
            type="button"
            onClick={onReanalyze}
            className="inline-flex h-[38px] min-w-[114px] items-center justify-center rounded-[10px] border border-[color:var(--border)] bg-transparent px-6 text-[12.5px] font-medium text-[color:var(--decon-markdown-muted)] transition-[border-color,color,transform] duration-150 hover:border-[color:var(--border-hover)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.99]"
          >
            Re-analyze
          </button>
        ) : null}
      </div>
    </section>
  );
}

function LoserInsightCardFigma({
  variant,
  title,
  yourScore,
  competitorScore,
  body,
}: {
  variant: "ahead" | "behind";
  title: string;
  yourScore: number;
  competitorScore: number;
  body: string;
}) {
  const ahead = variant === "ahead";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] shadow-[0_10px_14px_-3px_rgba(0,0,0,0.12)]">
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1",
          ahead
            ? "bg-[color:var(--success)] shadow-[0_0_20px_color-mix(in_srgb,var(--success)_55%,transparent)]"
            : "bg-[color:var(--error)] shadow-[0_0_20px_color-mix(in_srgb,var(--error)_55%,transparent)]",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent",
          ahead ? "from-[color-mix(in_srgb,var(--success)_4%,transparent)]" : "from-[color-mix(in_srgb,var(--error)_4%,transparent)]",
        )}
        aria-hidden
      />
      <div className="relative px-5 py-5 pl-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-[15px] font-medium tracking-tight text-[color:var(--ink)]">{title}</h4>
          <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[rgba(0,0,0,0.35)] px-2.5 py-1">
            <span
              className={cn(
                "font-mono text-sm",
                ahead ? "text-[color:var(--success)]" : "text-[color:var(--warn)]",
              )}
            >
              {fmtScoreOne(yourScore)}
            </span>
            <span className="text-[11px] text-[color:var(--ink-muted)]">vs</span>
            <span className="font-mono text-sm text-[color:var(--success)]">{fmtScoreOne(competitorScore)}</span>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--ink-secondary)]">{body}</p>
      </div>
    </div>
  );
}

function GapTwoColumnFigma({ gap }: { gap: GapAnalysis }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
      <div>
        <div className="mb-3 flex items-center gap-2 pl-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--success)_22%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)]">
            <CheckCircle className="h-3.5 w-3.5 text-[color:var(--success)]" aria-hidden />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--success)]">
            Where you&apos;re winning
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {gap.strengths.length === 0 ? (
            <p className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4 text-sm text-[color:var(--ink-muted)]">
              No dimension where you lead on score — prioritize the action plan below.
            </p>
          ) : (
            gap.strengths.map((s, i) => (
              <LoserInsightCardFigma
                key={i}
                variant="ahead"
                title={s.metric}
                yourScore={s.yourScore}
                competitorScore={s.competitorScore}
                body={s.insight}
              />
            ))
          )}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center gap-2 pl-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--error)_22%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)]">
            <Target className="h-3.5 w-3.5 text-[color:var(--error)]" aria-hidden />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--error)]">
            Where they&apos;re beating you
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {gap.weaknesses.length === 0 ? (
            <p className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4 text-sm text-[color:var(--ink-muted)]">
              No gap breakdown returned — see score comparison above.
            </p>
          ) : (
            gap.weaknesses.map((w, i) => (
              <LoserInsightCardFigma
                key={i}
                variant="behind"
                title={w.metric}
                yourScore={w.yourScore}
                competitorScore={w.competitorScore}
                body={w.insight}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function splitActionTitleBody(action: string): { title: string; body: string } {
  const idx = action.indexOf(".");
  if (idx > 0 && idx < action.length - 2) {
    return { title: action.slice(0, idx + 1).trim(), body: action.slice(idx + 1).trim() };
  }
  return { title: action.trim(), body: "" };
}

function LoserActionPlanFigma({ actionPlan }: { actionPlan: GapAnalysis["actionPlan"] }) {
  if (actionPlan.length === 0) return null;

  const primary = actionPlan.find((a) => a.priority === 1) ?? actionPlan[0]!;
  const others = actionPlan.filter((a) => a !== primary);
  const { title: pTitle, body: pBody } = splitActionTitleBody(primary.action);
  const showCriticalFix = primary.priority === 1;

  return (
    <section className="flex flex-col gap-6" aria-labelledby="competitor-loser-action-heading">
      <div className="flex items-center justify-center gap-3 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[color-mix(in_srgb,var(--accent)_32%,transparent)]" />
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_32%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-[var(--competitor-loser-action-p1-glow)]"
          aria-hidden
        >
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-light)]" />
        </div>
        <h3
          id="competitor-loser-action-heading"
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--ink)]"
        >
          Action Plan To Win
        </h3>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[color-mix(in_srgb,var(--accent)_32%,transparent)]" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] shadow-[var(--competitor-loser-action-p1-glow)]">
          <div
            className="absolute left-0 top-0 h-full w-1 bg-[color:var(--accent)] shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_55%,transparent)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 120% 80% at 0% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative px-6 py-6 pl-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-[color:var(--accent)] px-2.5 py-1 text-[11px] font-bold text-white">
                P{primary.priority}
              </span>
              {showCriticalFix ? (
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent-light)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-light)] shadow-[0_0_8px_var(--accent-light)]" />
                  Critical Fix
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-xl font-semibold tracking-tight text-[color:var(--ink)] md:text-2xl">{pTitle}</p>
            {pBody ? (
              <p className="mt-3 text-sm leading-relaxed text-[color-mix(in_srgb,var(--accent-light)_70%,var(--ink-secondary))]">
                {pBody}
              </p>
            ) : null}
          </div>
        </div>

        {others.map((a, i) => {
          const { title, body } = splitActionTitleBody(a.action);
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)]"
            >
              <div className="flex flex-col gap-2 px-5 py-5 pl-6">
                <span className="w-fit rounded-xl bg-[color:var(--surface-el)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--ink-muted)]">
                  P{a.priority}
                </span>
                <p className="text-lg font-medium tracking-tight text-[color:var(--ink-secondary)]">{title}</p>
                {body ? <p className="text-[13px] leading-relaxed text-[color:var(--ink-muted)]">{body}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── LAYOUTS (winner vs loser vs tied) ───────────────────────────────────────

function CompetitorWinnerLayout({
  result,
  gap,
  yourExpanded,
  setYourExpanded,
  compExpanded,
  setCompExpanded,
  heroYourSrc,
  heroCompetitorSrc,
  onReanalyze,
}: {
  result: CResult;
  gap: GapAnalysis;
  yourExpanded: boolean;
  setYourExpanded: (v: boolean) => void;
  compExpanded: boolean;
  setCompExpanded: (v: boolean) => void;
  heroYourSrc: string | null;
  heroCompetitorSrc: string | null;
  onReanalyze?: () => void;
}) {
  const yourScores = result.your.scores!;
  const compScores = result.competitor.scores!;

  return (
    <div className="flex flex-col gap-8 md:gap-10" data-competitor-outcome="winning">
      <CompetitorWinningHero
        yourScore={yourScores.overall}
        compScore={compScores.overall}
        summary={gap.summary}
        winProbability={gap.winProbability}
        heroYourSrc={heroYourSrc}
        heroCompetitorSrc={heroCompetitorSrc}
      />
      <MatchupMetricGrid yourScores={yourScores} compScores={compScores} />
      <GapTwoColumnFigma gap={gap} />
      <WinnerScaleSection result={result} gap={gap} onReanalyze={onReanalyze} />
      <CollapsibleDualScorecards
        result={result}
        yourExpanded={yourExpanded}
        setYourExpanded={setYourExpanded}
        compExpanded={compExpanded}
        setCompExpanded={setCompExpanded}
      />
    </div>
  );
}

function CompetitorLoserLayout({
  result,
  gap,
  yourExpanded,
  setYourExpanded,
  compExpanded,
  setCompExpanded,
  heroYourSrc,
  heroCompetitorSrc,
}: {
  result: CResult;
  gap: GapAnalysis;
  yourExpanded: boolean;
  setYourExpanded: (v: boolean) => void;
  compExpanded: boolean;
  setCompExpanded: (v: boolean) => void;
  heroYourSrc: string | null;
  heroCompetitorSrc: string | null;
}) {
  const yourScores = result.your.scores!;
  const compScores = result.competitor.scores!;

  return (
    <div className="flex flex-col gap-8 md:gap-10" data-competitor-outcome="losing">
      <CompetitorLosingHero
        yourScore={yourScores.overall}
        compScore={compScores.overall}
        summary={gap.summary}
        winProbability={gap.winProbability}
        heroYourSrc={heroYourSrc}
        heroCompetitorSrc={heroCompetitorSrc}
      />
      <MatchupMetricGrid yourScores={yourScores} compScores={compScores} />
      <GapTwoColumnFigma gap={gap} />
      <LoserActionPlanFigma actionPlan={gap.actionPlan} />
      <CollapsibleDualScorecards
        result={result}
        yourExpanded={yourExpanded}
        setYourExpanded={setYourExpanded}
        compExpanded={compExpanded}
        setCompExpanded={setCompExpanded}
      />
    </div>
  );
}

function CompetitorTiedLayout({
  result,
  gap,
  yourFileName,
  competitorFileName,
  yourExpanded,
  setYourExpanded,
  compExpanded,
  setCompExpanded,
}: {
  result: CResult;
  gap: GapAnalysis;
  yourFileName: string;
  competitorFileName: string;
  yourExpanded: boolean;
  setYourExpanded: (v: boolean) => void;
  compExpanded: boolean;
  setCompExpanded: (v: boolean) => void;
}) {
  const yourScores = result.your.scores!;
  const compScores = result.competitor.scores!;

  return (
    <div className="flex flex-col gap-4" data-competitor-outcome="tied">
      <section
        className="rounded-xl border border-[color-mix(in_srgb,var(--warn)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warn)_8%,var(--surface))] p-5"
        aria-labelledby="competitor-tied-heading"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--warn)_40%,transparent)] bg-[color-mix(in_srgb,var(--warn)_12%,transparent)]"
            aria-hidden
          >
            <Minus className="h-5 w-5 text-[color:var(--warn)]" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="competitor-tied-heading" className="text-lg font-semibold tracking-tight text-[color:var(--warn)]">
              Evenly matched on overall score
            </h2>
            <p className="mt-1 text-sm text-[color:var(--ink-secondary)]">
              The winner will come down to hook, clarity, and CTA — see where each ad leads.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <WinProbabilityPill value={gap.winProbability} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink-secondary)]">{gap.summary}</p>
      </section>

      <ScoreComparisonTable
        yourScores={yourScores}
        compScores={compScores}
        yourFileName={yourFileName}
        competitorFileName={competitorFileName}
      />
      <StrengthsSection strengths={gap.strengths} />
      <WeaknessesSection weaknesses={gap.weaknesses} />
      <ActionPlanSection actionPlan={gap.actionPlan} heading="Action plan to win" />
      <CollapsibleDualScorecards
        result={result}
        yourExpanded={yourExpanded}
        setYourExpanded={setYourExpanded}
        compExpanded={compExpanded}
        setCompExpanded={setCompExpanded}
      />
    </div>
  );
}

// ─── PUBLIC PANEL ───────────────────────────────────────────────────────────

export function CompetitorResultPanel({
  result,
  yourFileName,
  competitorFileName,
  yourFile,
  competitorFile,
  onReanalyze,
  onStartOver,
}: {
  result: CResult;
  yourFileName: string;
  competitorFileName: string;
  /** Optional: hero thumbnails on winning / losing layouts */
  yourFile?: File | null;
  competitorFile?: File | null;
  /** Winning layout: secondary CTA to run another comparison */
  onReanalyze?: () => void;
  /** Back to upload / new comparison (Figma header secondary action) */
  onStartOver?: () => void;
}) {
  const { gap } = result;
  const [yourExpanded, setYourExpanded] = useState(false);
  const [compExpanded, setCompExpanded] = useState(false);

  const yourThumb = useThumbnail(yourFile ?? null);
  const compThumb = useThumbnail(competitorFile ?? null);
  const heroYourSrc = yourThumb ?? result.your.thumbnailDataUrl ?? null;
  const heroCompetitorSrc = compThumb ?? result.competitor.thumbnailDataUrl ?? null;

  const outcome = getCompetitorOutcome(result);

  const common = {
    result,
    gap,
    yourFileName,
    competitorFileName,
    yourExpanded,
    setYourExpanded,
    compExpanded,
    setCompExpanded,
  };

  if (outcome === "winning") {
    return (
      <>
        <CompetitorResultsPageHeader onStartOver={onStartOver} />
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(1800px,300vh)]"
            style={{ backgroundImage: "var(--competitor-winning-page-ambient)" }}
            aria-hidden
          />
          <div className="relative z-[1]">
            <CompetitorWinnerLayout
              {...common}
              heroYourSrc={heroYourSrc}
              heroCompetitorSrc={heroCompetitorSrc}
              onReanalyze={onReanalyze}
            />
          </div>
        </div>
      </>
    );
  }
  if (outcome === "losing") {
    return (
      <>
        <CompetitorResultsPageHeader onStartOver={onStartOver} />
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(1800px,300vh)]"
            style={{ backgroundImage: "var(--competitor-losing-page-ambient)" }}
            aria-hidden
          />
          <div className="relative z-[1]">
            <CompetitorLoserLayout
              {...common}
              heroYourSrc={heroYourSrc}
              heroCompetitorSrc={heroCompetitorSrc}
            />
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <CompetitorResultsPageHeader onStartOver={onStartOver} />
      <CompetitorTiedLayout {...common} />
    </>
  );
}
