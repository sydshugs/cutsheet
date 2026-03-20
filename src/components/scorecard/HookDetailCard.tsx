// HookDetailCard — unified Hook Analysis card
// Shows: Hook Type pill + Hook Verdict pill, First Glance, Hook Strength, Scroll-Stop Factor, Hook Fix

import type { HookDetail } from "../../services/analyzerService";

interface HookDetailCardProps {
  hookDetail: HookDetail;
  format: "video" | "static";
}

const VERDICT_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  "Scroll-Stopper": { bg: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.2)" },
  "Needs Work":     { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" },
};
const DEFAULT_VERDICT = { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.2)" };

export function HookDetailCard({ hookDetail }: HookDetailCardProps) {
  const vs = VERDICT_STYLES[hookDetail.verdict] ?? DEFAULT_VERDICT;

  return (
    <div className="px-5 py-3 border-t border-white/5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        Hook Analysis
      </p>

      {/* Top row: Hook Type pill + Hook Verdict pill */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span
          className="text-[10px] font-mono rounded-md px-1.5 py-0.5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa" }}
        >
          {hookDetail.hookType}
        </span>
        <span
          className="text-[10px] font-medium rounded-full px-2 py-0.5"
          style={{ background: vs.bg, color: vs.color, border: `1px solid ${vs.border}` }}
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
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", color: "#f59e0b" }}
        >
          💡 {hookDetail.hookFix}
        </div>
      )}
    </div>
  );
}
