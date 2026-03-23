import { cn } from "@/src/lib/utils";
import { ChevronRight } from "lucide-react";
import type { StructuredImprovement } from "@/src/services/analyzerService";

const PRIORITY_COLORS = {
  high: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  medium: { bg: 'rgba(251,191,36,0.12)', color: '#d97706', border: 'rgba(251,191,36,0.2)' },
  low: { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'rgba(99,102,241,0.2)' },
} as const;

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  cta: { bg: 'rgba(239,68,68,0.08)', color: '#f87171' },
  visual: { bg: 'rgba(99,102,241,0.08)', color: '#a5b4fc' },
  hook: { bg: 'rgba(251,191,36,0.08)', color: '#fbbf24' },
  layout: { bg: 'rgba(16,185,129,0.08)', color: '#6ee7b7' },
  trust: { bg: 'rgba(168,85,247,0.08)', color: '#c4b5fd' },
  copy: { bg: 'rgba(56,189,248,0.08)', color: '#7dd3fc' },
};

const IMPACT_LABELS = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
} as const;

interface PriorityFixCardProps {
  index: number;
  improvement: StructuredImprovement;
  className?: string;
}

export function PriorityFixCard({ index, improvement, className }: PriorityFixCardProps) {
  const priorityStyle = PRIORITY_COLORS[improvement.priority];
  const categoryStyle = CATEGORY_COLORS[improvement.category] ?? { bg: 'rgba(161,161,170,0.08)', color: '#a1a1aa' };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[10px] border border-white/5 bg-zinc-900/50 px-3.5 py-2.5",
        className
      )}
    >
      {/* Number circle */}
      <div
        className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-medium"
        style={{ background: priorityStyle.bg, color: priorityStyle.color, border: `0.5px solid ${priorityStyle.border}` }}
      >
        {index + 1}
      </div>

      {/* Fix text */}
      <p className="flex-1 min-w-0 text-[13px] font-medium text-zinc-200 leading-snug truncate">
        {improvement.text}
      </p>

      {/* Right side: category + impact + arrow */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="text-[9px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5"
          style={{ background: categoryStyle.bg, color: categoryStyle.color }}
        >
          {improvement.category}
        </span>
        <span className="text-[9px] text-zinc-600">
          {IMPACT_LABELS[improvement.priority]}
        </span>
        <ChevronRight size={11} className="text-zinc-600" />
      </div>
    </div>
  );
}
