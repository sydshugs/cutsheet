// DemoScorecardDeepDive.tsx — Sequence 2: Phased scorecard reveal (4s loop)

import { motion } from "framer-motion";
import { useTimeline } from "./useTimeline";
import { DemoShell } from "./DemoShell";
import {
  MOCK_SCORES,
  MOCK_IMPROVEMENTS,
  MOCK_BUDGET,
  MOCK_HASHTAGS,
} from "./mockData";
import { getScoreColorByValue } from "@/src/components/ScoreCard";

const DURATION = 8000;

const SCORE_LABELS: Record<string, string> = {
  hook: "Hook Strength",
  clarity: "Message Clarity",
  cta: "CTA Effectiveness",
  production: "Production Quality",
};

const scoreKeys = ["hook", "clarity", "cta", "production"] as const;

function getScoreBadgeClasses(score: number): string {
  if (score >= 9) return "bg-emerald-500/15 text-emerald-400";
  if (score >= 7) return "bg-indigo-500/15 text-indigo-400";
  if (score >= 5) return "bg-amber-500/15 text-amber-400";
  return "bg-red-500/15 text-red-400";
}

function getOverallLabel(score: number): string {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Average";
  return "Weak";
}

const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

interface Props {
  playing?: boolean;
}

export function DemoScorecardDeepDive({ playing = true }: Props) {
  const { elapsed, loopCount } = useTimeline({ duration: DURATION, playing });

  const showGauge = elapsed >= 0;
  const showImprovements = elapsed >= 2000;
  const showBudget = elapsed >= 4000;
  const showHashtags = elapsed >= 6000;

  const overallColor = getScoreColorByValue(MOCK_SCORES.overall);
  const badgeClasses = getScoreBadgeClasses(MOCK_SCORES.overall);
  const overallLabel = getOverallLabel(MOCK_SCORES.overall);

  // Arc gauge fill progress (animate over first 1600ms)
  const gaugeProgress = Math.min(1, elapsed / 1600);
  const dashLen = gaugeProgress * (MOCK_SCORES.overall / 10) * 157;

  return (
    <DemoShell>
      <div className="flex items-start justify-center w-full h-full p-6 overflow-y-auto">
        <div
          key={loopCount}
          className="scorecard w-[340px] flex flex-col rounded-2xl border border-white/10 bg-white/[0.03]"
        >
          {/* ── Gauge Phase ── */}
          {showGauge && (
            <div>
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Score Overview</span>
                <span className="text-xs text-zinc-600 font-mono">Gemini 2.5 Flash</span>
              </div>

              {/* Arc gauge */}
              <div className="px-5 pt-5 flex flex-col items-center">
                <div className="relative w-40 h-24 flex-shrink-0">
                  <svg viewBox="0 0 120 70" className="w-full h-full">
                    <path
                      d="M 10 60 A 50 50 0 0 1 110 60"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 60 A 50 50 0 0 1 110 60"
                      fill="none"
                      stroke={overallColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${dashLen} 157`}
                      style={{ filter: `drop-shadow(0 0 4px ${overallColor}60)` }}
                    />
                  </svg>
                </div>

                <div className="flex items-baseline gap-1 -mt-4">
                  <span className="text-4xl font-bold font-mono text-white leading-none">
                    {MOCK_SCORES.overall}
                  </span>
                  <span className="text-zinc-500 font-mono">/10</span>
                </div>

                <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold font-mono ${badgeClasses}`}>
                  {overallLabel}
                </div>
              </div>

              {/* Metric bars with stagger */}
              <div className="px-5 py-4 flex flex-col gap-2">
                {scoreKeys.map((key, i) => {
                  const value = MOCK_SCORES[key];
                  const pct = value <= 0 ? 2 : Math.min(100, (value / 10) * 100);
                  const barColor = getScoreColorByValue(value);
                  // Stagger bars: each starts 200ms after previous
                  const barDelay = 400 + i * 300;
                  const barProgress = Math.max(0, Math.min(1, (elapsed - barDelay) / 1200));
                  const barWidth = barProgress * pct;

                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">{SCORE_LABELS[key]}</span>
                        <span className="font-mono text-white">{value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${barWidth}%`,
                            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                            boxShadow: `0 0 6px ${barColor}40`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Improvements Phase ── */}
          {showImprovements && (
            <motion.div {...slideUp} className="px-5 border-t border-white/5 mt-4 pt-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Improve This Ad
              </p>
              <ul className="flex flex-col gap-1">
                {MOCK_IMPROVEMENTS.map((item, i) => {
                  const itemDelay = 2000 + i * 400;
                  if (elapsed < itemDelay) return null;
                  return (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-2 items-start py-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                      <span className="text-xs text-zinc-400 leading-relaxed">{item}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          )}

          {/* ── Budget Phase ── */}
          {showBudget && (
            <motion.div {...slideUp} className="px-5 border-t border-white/5 mt-4 pt-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Budget Recommendation
              </p>

              <motion.div
                className="mb-3"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-emerald-500/15 text-emerald-400">
                  {MOCK_BUDGET.verdict}
                </span>
              </motion.div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Platform</span>
                  <p className="text-xs text-zinc-300 font-mono mt-0.5">{MOCK_BUDGET.platform}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Daily</span>
                  <p className="text-xs text-zinc-300 font-mono mt-0.5">{MOCK_BUDGET.daily}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Duration</span>
                  <p className="text-xs text-zinc-300 font-mono mt-0.5">{MOCK_BUDGET.duration}</p>
                </div>
              </div>

              <p className="text-xs text-zinc-500 italic leading-relaxed">{MOCK_BUDGET.reason}</p>
            </motion.div>
          )}

          {/* ── Hashtags Phase ── */}
          {showHashtags && (
            <motion.div {...slideUp} className="px-5 border-t border-white/5 mt-4 pt-4 pb-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Recommended Hashtags
              </p>
              {(
                [
                  ["TikTok", MOCK_HASHTAGS.tiktok],
                  ["Meta", MOCK_HASHTAGS.meta],
                  ["Instagram", MOCK_HASHTAGS.instagram],
                ] as const
              ).map(([platform, tags], rowIdx) => (
                <div key={platform} className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-xs text-zinc-500 w-16 flex-shrink-0">{platform}</span>
                  {tags.map((tag, tagIdx) => {
                    const tagDelay = 6000 + rowIdx * 240 + tagIdx * 120;
                    if (elapsed < tagDelay) return null;
                    return (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-md font-mono"
                      >
                        #{tag}
                      </motion.span>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </DemoShell>
  );
}
