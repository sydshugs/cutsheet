// ScoreCard.tsx — Visual translation from #screen-results (prototype)

import { useEffect, useState } from "react";
import { Copy, CheckCircle } from "lucide-react";
import type { BudgetRecommendation, Hashtags, Scene } from "../services/analyzerService";
import SceneBreakdown from "./SceneBreakdown";

interface Scores {
  hook: number;
  clarity: number;
  cta: number;
  production: number;
  overall: number;
}

interface ScoreCardProps {
  scores: Scores;
  improvements?: string[];
  budget?: BudgetRecommendation | null;
  hashtags?: Hashtags;
  fileName?: string;
  onShare?: () => void;
  isDark?: boolean;
  winner?: boolean;
  analysisTime?: Date;
  modelName?: string;
  onGenerateBrief?: () => void;
  onAddToSwipeFile?: () => void;
  onCTARewrite?: () => void;
  ctaRewrites?: string[] | null;
  ctaLoading?: boolean;
  scenes?: Scene[];
}

const SCORE_LABELS: Record<keyof Scores, string> = {
  hook: "Hook Strength",
  clarity: "Message Clarity",
  cta: "CTA Effectiveness",
  production: "Production Quality",
  overall: "Overall Ad Strength",
};

/** Score band color for chips/overlays: 9-10 green, 7-8 indigo, 5-6 amber, 1-4 red (scores 0-10). */
export function getScoreColorByValue(score: number): string {
  if (score >= 9) return "#10B981";
  if (score >= 7) return "#6366F1";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number, isCTA?: boolean): { label: string; color: string } {
  if (isCTA && score === 0) return { label: "No CTA Detected", color: "#EF4444" };
  if (score >= 9) return { label: "Excellent", color: "#10B981" };
  if (score >= 7) return { label: "Good", color: "#6366F1" };
  if (score >= 5) return { label: "Average", color: "#F59E0B" };
  return { label: "Weak", color: "#EF4444" };
}

function getScoreBadgeClasses(score: number, isCTA?: boolean): string {
  if (isCTA && score === 0) return "bg-red-500/15 text-red-400";
  if (score >= 9) return "bg-emerald-500/15 text-emerald-400";
  if (score >= 7) return "bg-indigo-500/15 text-indigo-400";
  if (score >= 5) return "bg-amber-500/15 text-amber-400";
  return "bg-red-500/15 text-red-400";
}

function formatFileName(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ");
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

const scoreKeys = ["hook", "clarity", "cta", "production"] as const;

export function ScoreCard({
  scores,
  improvements,
  budget,
  hashtags,
  fileName,
  onShare,
  isDark = true,
  winner,
  analysisTime,
  modelName = "Gemini + Claude",
  onGenerateBrief,
  onAddToSwipeFile,
  onCTARewrite,
  ctaRewrites,
  ctaLoading,
  scenes,
}: ScoreCardProps) {
  const { label: overallLabel } = getScoreLabel(scores.overall);
  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!analysisTime) return;
    setRelativeTime(formatRelativeTime(analysisTime));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(analysisTime));
    }, 30000);
    return () => clearInterval(interval);
  }, [analysisTime]);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines: string[] = [];
    lines.push(`--- CUTSHEET ANALYSIS — ${fileName || "Ad Creative"} ---`);
    lines.push(`Overall Score: ${scores.overall}/10 ⭐`);
    lines.push("");
    lines.push(`Hook Strength: ${scores.hook}/10`);
    lines.push(`Message Clarity: ${scores.clarity}/10`);
    lines.push(`CTA Effectiveness: ${scores.cta}/10`);
    lines.push(`Production: ${scores.production}/10`);

    if (improvements && improvements.length > 0) {
      lines.push("");
      lines.push("IMPROVEMENTS:");
      improvements.forEach((imp) => lines.push(`• ${imp}`));
    }

    if (ctaRewrites && ctaRewrites.length > 0) {
      lines.push("");
      lines.push(`CTA REWRITE: "${ctaRewrites[0]}"`);
    }

    if (budget) {
      lines.push("");
      lines.push(`BUDGET: ${budget.verdict} — ${budget.daily}/day on ${budget.platform} for ${budget.duration}`);
    }

    lines.push("");
    lines.push("Scored by Cutsheet — cutsheet.xyz");
    lines.push("---");

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const overallColor = getScoreColorByValue(scores.overall);
  const badgeClasses = getScoreBadgeClasses(scores.overall);

  return (
    <div className="scorecard flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white">Score Overview</span>
          {analysisTime && (
            <span className="text-xs text-zinc-600">{relativeTime}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 font-mono">{modelName}</span>
          <button
            onClick={handleCopy}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer",
              color: copied ? "#10b981" : "#a1a1aa",
              borderColor: copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                (e.currentTarget as HTMLButtonElement).style.color = "#f4f4f5";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.16)";
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
              }
            }}
          >
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy results"}
          </button>
        </div>
      </div>

      {/* Arc gauge */}
      <div className="px-5 pt-5 flex flex-col items-center">
        <div className="relative w-40 h-24 flex-shrink-0">
          <svg viewBox="0 0 120 70" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={overallColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${mounted ? (scores.overall / 10) * 157 : 0} 157`}
              style={{
                transition: "stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                filter: `drop-shadow(0 0 4px ${overallColor}60)`,
              }}
            />
          </svg>
        </div>

        {/* Score number */}
        <div className="flex items-baseline gap-1 -mt-4">
          <span className="text-4xl font-bold font-mono text-white leading-none">
            {scores.overall}
          </span>
          <span className="text-zinc-500 font-mono">/10</span>
        </div>

        {/* Status badge */}
        <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold font-mono ${badgeClasses}`}>
          {overallLabel}
        </div>

        {/* Winner badge */}
        {winner && (
          <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
            ★ Winner
          </div>
        )}
      </div>

      {/* Metric bars */}
      <div className="px-5 py-4 flex flex-col gap-2">
        {scoreKeys.map((key) => {
          const value = scores[key];
          const pct = value <= 0 ? 2 : Math.min(100, (value / 10) * 100);
          const barColor = getScoreColorByValue(value);
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
                    "--bar-width": `${pct}%`,
                    width: mounted ? `${pct}%` : "0%",
                    background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                    animation: mounted ? "barFill 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                    boxShadow: `0 0 6px ${barColor}40`,
                  } as React.CSSProperties}
                />
              </div>
              {/* CTA rewrite button — only when CTA score ≤ 5 */}
              {key === "cta" && value <= 5 && onCTARewrite && (
                <div className="mt-1.5">
                  {!ctaRewrites ? (
                    <button
                      onClick={onCTARewrite}
                      disabled={ctaLoading}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-colors disabled:opacity-50"
                    >
                      {ctaLoading ? "Rewriting..." : "✦ Rewrite CTA"}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1 mt-1">
                      {ctaRewrites.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 bg-indigo-500/5 rounded-lg px-2.5 py-1.5">
                          <span className="text-[10px] text-indigo-400 font-mono">{i + 1}.</span>
                          <span className="text-xs text-zinc-300">{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Improve This Ad */}
      {improvements && improvements.length > 0 && (
        <div className="px-5 border-t border-white/5 mt-4 pt-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Improve This Ad
          </p>
          <ul className="flex flex-col gap-1">
            {improvements.map((item, i) => (
              <li key={i} className="flex gap-2 items-start py-1.5">
                <span className="w-1 h-1 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                <span className="text-xs text-zinc-400 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scene Breakdown */}
      {scenes && scenes.length > 0 && (
        <div className="px-5">
          <SceneBreakdown scenes={scenes} />
        </div>
      )}

      {/* Budget Recommendation */}
      {budget && (
        <div className="px-5 border-t border-white/5 mt-4 pt-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Budget Recommendation
          </p>

          {/* Verdict badge */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono ${
                budget.verdict === "Boost It"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : budget.verdict === "Test It"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {budget.verdict === "Boost It" && "🚀"}
              {budget.verdict === "Test It" && "🧪"}
              {budget.verdict === "Fix First" && "🔧"}
              {budget.verdict}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">Platform</span>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">{budget.platform}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">Daily</span>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">{budget.daily}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">Duration</span>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">{budget.duration}</p>
            </div>
          </div>

          {/* Reason */}
          {budget.reason && (
            <p className="text-xs text-zinc-500 italic leading-relaxed">{budget.reason}</p>
          )}
        </div>
      )}

      {/* Recommended Hashtags */}
      {hashtags && (hashtags.tiktok.length > 0 || hashtags.meta.length > 0 || hashtags.instagram.length > 0) && (
        <div className="px-5 border-t border-white/5 mt-4 pt-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Recommended Hashtags
          </p>
          {([["TikTok", hashtags.tiktok], ["Meta", hashtags.meta], ["Instagram", hashtags.instagram]] as const).map(
            ([platform, tags]) =>
              tags.length > 0 && (
                <div key={platform} className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-xs text-zinc-500 w-16 flex-shrink-0">{platform}</span>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-md font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )
          )}
        </div>
      )}

      {/* File name */}
      {fileName && (
        <div className="px-5 pb-2 text-xs font-mono text-zinc-600 truncate">
          {formatFileName(fileName)}
        </div>
      )}

      {/* Share button (backward compat) */}
      {onShare && (
        <div className="px-5 pb-2" data-html2canvas-ignore="true">
          <button
            type="button"
            onClick={onShare}
            className="w-full py-2 px-3 bg-transparent border border-white/10 rounded-lg text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-150 cursor-pointer"
          >
            Copy Scorecard
          </button>
        </div>
      )}

      {/* Quick actions */}
      {(onGenerateBrief || onAddToSwipeFile) && (
        <div className="mt-auto p-5 border-t border-white/5 flex flex-col gap-2">
          {onGenerateBrief && (
            <button
              type="button"
              onClick={onGenerateBrief}
              className="bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl w-full py-2.5 text-center transition-colors duration-150 cursor-pointer"
            >
              Generate Brief
            </button>
          )}
          {onAddToSwipeFile && (
            <button
              type="button"
              onClick={onAddToSwipeFile}
              className="bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl w-full py-2.5 text-center transition-colors duration-150 cursor-pointer"
            >
              Add to Swipe File
            </button>
          )}
        </div>
      )}
    </div>
  );
}
