import { cn } from "@/src/lib/utils";
import type { Verdict } from "@/src/services/analyzerService";

const VERDICT_STYLES = {
  not_ready: { label: 'Not ready to run', bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  needs_work: { label: 'Needs work', bg: 'rgba(251,191,36,0.12)', color: '#d97706' },
  ready: { label: 'Ready to run', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
} as const;

interface VerdictBannerProps {
  verdict: Verdict;
  platform?: string;
  format?: 'video' | 'static';
  niche?: string;
  className?: string;
}

export function VerdictBanner({ verdict, platform, format, niche, className }: VerdictBannerProps) {
  const style = VERDICT_STYLES[verdict.state];
  const tags = [platform, format === 'static' ? 'Static' : format === 'video' ? 'Video' : null, niche].filter(Boolean);

  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3.5 mb-2",
        className
      )}
    >
      {/* Top row: verdict chip + tags */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className="text-[10px] font-medium rounded-full px-2.5 py-0.5 leading-4 shrink-0"
          style={{ background: style.bg, color: style.color }}
        >
          {style.label}
        </span>
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-zinc-500 bg-white/5 rounded-full px-2 py-0.5 leading-4"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Headline */}
      <p className="text-[15px] font-medium text-zinc-100 leading-snug">
        {verdict.headline}
      </p>

      {/* Sub */}
      {verdict.sub && (
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          {verdict.sub}
        </p>
      )}
    </div>
  );
}
