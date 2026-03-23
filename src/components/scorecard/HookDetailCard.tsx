// HookDetailCard — unified Hook Analysis card
// Shows: Hook Type pill + Hook Verdict pill, First Glance, Hook Strength, Scroll-Stop Factor, Hook Fix

import type { HookDetail } from "../../services/analyzerService";
import { getScoreColor, getScoreBg, getScoreBorder } from "../../lib/scoreColors";

interface HookDetailCardProps {
  hookDetail: HookDetail;
  format: "video" | "static";
}

const VERDICT_SCORE: Record<string, number> = {
  "Scroll-Stopper": 9,
  "Needs Work":     5,
};
const DEFAULT_VERDICT_SCORE = 3;

export function HookDetailCard({ hookDetail }: HookDetailCardProps) {
  const score = VERDICT_SCORE[hookDetail.verdict] ?? DEFAULT_VERDICT_SCORE;

  return (
    <div className="px-5 py-3 border-t border-white/5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        Hook Analysis
      </p>

      {/* Top row: Hook Type pill + Hook Verdict pill */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span
          className="text-[10px] font-mono rounded-md px-1.5 py-0.5"
          style={{ background: "var(--border-subtle)", border: "1px solid var(--border)", color: "var(--ink-muted)" }}
        >
          {hookDetail.hookType}
        </span>
        <span
          className="text-[10px] font-medium rounded-full px-2 py-0.5"
          style={{ background: getScoreBg(score), color: getScoreColor(score), border: `1px solid ${getScoreBorder(score)}` }}
        >
          {hookDetail.verdict}
        </span>
      </div>

      {/* First Glance */}
      <div className="mb-2">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">First Glance</span>
        <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
          {hookDetail.firstImpression}
        </p>
      </div>

      {/* Hook Strength */}
      {(hookDetail as Record<string, unknown>).hookStrength && (
        <div className="mb-2">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Hook Strength</span>
          <p className="text-xs text-zinc-300 font-medium mt-0.5">{(hookDetail as Record<string, unknown>).hookStrength as string}</p>
        </div>
      )}

      {/* Scroll-Stop Factor */}
      {(hookDetail as Record<string, unknown>).scrollStopFactor && (
        <div className="mb-2">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Scroll-Stop Factor</span>
          <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{(hookDetail as Record<string, unknown>).scrollStopFactor as string}</p>
        </div>
      )}

      {/* Hook Fix — only if needed */}
      {hookDetail.hookFix && (
        <div
          className="text-[11px] leading-relaxed rounded-lg px-2.5 py-1.5 mt-2"
          style={{ background: "var(--score-average-bg)", border: "1px solid var(--score-average-border)", color: "var(--warn)" }}
        >
          💡 {hookDetail.hookFix}
        </div>
      )}
    </div>
  );
}
