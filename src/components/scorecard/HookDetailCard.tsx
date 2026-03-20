// HookDetailCard — hook verdict, type, first impression, and suggested fix

import type { HookDetail } from "../../services/analyzerService";

interface HookDetailCardProps {
  hookDetail: HookDetail;
  format: "video" | "static";
}

export function HookDetailCard({ hookDetail, format }: HookDetailCardProps) {
  const verdictStyle = (() => {
    if (hookDetail.verdict === "Scroll-Stopper") {
      return {
        bg: "rgba(16,185,129,0.1)",
        color: "#10b981",
        border: "rgba(16,185,129,0.2)",
      };
    }
    if (hookDetail.verdict === "Needs Work") {
      return {
        bg: "rgba(245,158,11,0.1)",
        color: "#f59e0b",
        border: "rgba(245,158,11,0.2)",
      };
    }
    return {
      bg: "rgba(239,68,68,0.1)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.2)",
    };
  })();

  return (
    <div className="px-5 py-3 border-t border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {format === "video" ? "🪝 Hook — First 3s" : "🪝 Hook — First Glance"}
        </span>
        <span
          className="text-[10px] font-medium rounded-full px-2 py-0.5"
          style={{
            background: verdictStyle.bg,
            color: verdictStyle.color,
            border: `1px solid ${verdictStyle.border}`,
          }}
        >
          {hookDetail.verdict}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="text-[10px] font-mono rounded-md px-1.5 py-0.5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa" }}
        >
          {hookDetail.hookType}
        </span>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed mb-1">
        {hookDetail.firstImpression}
      </p>
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
