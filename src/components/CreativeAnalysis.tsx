// CreativeAnalysis — combined Creative Verdict + Design Review
// Cleaner card-based layout with minimal visual noise

import { useState, useMemo } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

const STATE_COLORS = {
  not_ready: { 
    bannerBg: 'rgba(239,68,68,0.04)', 
    border: 'rgba(239,68,68,0.12)', 
    chipBg: 'rgba(239,68,68,0.1)', 
    color: '#ef4444', 
    label: 'Not ready' 
  },
  needs_work: { 
    bannerBg: 'rgba(245,158,11,0.04)', 
    border: 'rgba(245,158,11,0.12)', 
    chipBg: 'rgba(245,158,11,0.1)', 
    color: '#f59e0b', 
    label: 'Needs work' 
  },
  ready: { 
    bannerBg: 'rgba(16,185,129,0.04)', 
    border: 'rgba(16,185,129,0.12)', 
    chipBg: 'rgba(16,185,129,0.1)', 
    color: '#10b981', 
    label: 'Ready' 
  },
} as const;

const CATEGORY_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  hierarchy: { bg: 'rgba(129,140,248,0.08)', color: '#a5b4fc', dot: '#818cf8' },
  typography: { bg: 'rgba(251,191,36,0.08)', color: '#fcd34d', dot: '#fbbf24' },
  layout: { bg: 'rgba(16,185,129,0.08)', color: '#6ee7b7', dot: '#10b981' },
  contrast: { bg: 'rgba(239,68,68,0.08)', color: '#fca5a5', dot: '#ef4444' },
};

const SEVERITY_DOT: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: 'rgba(161,161,170,0.3)',
};

interface Fix {
  fix: string;
  category: string;
  severity: string;
}

interface CreativeAnalysisProps {
  verdictState: 'not_ready' | 'needs_work' | 'ready';
  verdictOneLiner: string;
  score: number;
  topIssue?: { fix: string; category: string };
  fixes: Fix[];
  overallNote?: string;
}

export function CreativeAnalysis({
  verdictState,
  verdictOneLiner,
  score,
  topIssue,
  fixes,
  overallNote,
}: CreativeAnalysisProps) {
  const stateStyle = STATE_COLORS[verdictState];
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: fixes.length };
    for (const f of fixes) counts[f.category] = (counts[f.category] ?? 0) + 1;
    return counts;
  }, [fixes]);

  const categories = useMemo(() => {
    const cats = [{ key: 'all', label: `All ${fixes.length}` }];
    for (const cat of ['hierarchy', 'typography', 'layout', 'contrast']) {
      if (categoryCounts[cat]) cats.push({ key: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) });
    }
    return cats;
  }, [categoryCounts, fixes.length]);

  const filteredFixes = activeFilter === 'all' ? fixes : fixes.filter(f => f.category === activeFilter);

  return (
    <div className="rounded-2xl overflow-hidden mt-4 border border-white/[0.06] bg-white/[0.01]">
      {/* Header — cleaner, more spacious */}
      <div
        className="px-5 py-4"
        style={{
          background: stateStyle.bannerBg,
          borderBottom: `1px solid ${stateStyle.border}`,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          {/* Status indicator dot */}
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: stateStyle.color }}
          />
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: stateStyle.color }}
          >
            {stateStyle.label}
          </span>
        </div>
        <p className="text-[15px] font-medium text-zinc-100 leading-relaxed">
          {verdictOneLiner}
        </p>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Top issue — prominent card */}
        {topIssue && (
          <div className="flex items-start gap-3 rounded-xl mb-4 p-4 bg-red-500/[0.06] border border-red-500/10">
            <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertCircle size={14} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Priority fix</span>
              <p className="text-sm font-medium text-zinc-200 mt-1 leading-relaxed">{topIssue.fix}</p>
            </div>
          </div>
        )}

        {/* Category filters — cleaner pill style */}
        {categories.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {categories.map(cat => {
              const isActive = activeFilter === cat.key;
              const catStyle = CATEGORY_STYLES[cat.key];
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  aria-label={`Filter by ${cat.label}`}
                  aria-pressed={isActive}
                  className="flex items-center gap-1.5 cursor-pointer transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    color: isActive ? '#e4e4e7' : '#71717a',
                    border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                  }}
                >
                  {cat.key !== 'all' && catStyle && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: catStyle.dot }} />
                  )}
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Fix list — cleaner row style */}
        <div className="flex flex-col gap-2">
          {filteredFixes.map((fix, i) => {
            const catStyle = CATEGORY_STYLES[fix.category] ?? { bg: 'rgba(161,161,170,0.08)', color: '#a1a1aa', dot: '#71717a' };
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.035] transition-colors"
              >
                {/* Category dot */}
                <span 
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" 
                  style={{ background: catStyle.dot }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 mb-1 block">
                    {fix.category}
                  </span>
                  <span className="text-[13px] font-medium text-zinc-300 leading-relaxed">{fix.fix}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall note */}
        {overallNote && (
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <p className="text-xs text-zinc-500 leading-relaxed">{overallNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
