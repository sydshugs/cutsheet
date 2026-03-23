// CreativeAnalysis — combined Creative Verdict + Design Review
// Amber-tinted banner with verdict + filterable fix cards

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";

const STATE_COLORS = {
  not_ready: { bannerBg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', chipBg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Not ready' },
  needs_work: { bannerBg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.25)', chipBg: 'rgba(217,119,6,0.12)', color: '#d97706', label: 'Needs work' },
  ready: { bannerBg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', chipBg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Ready' },
} as const;

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  hierarchy: { bg: 'rgba(129,140,248,0.1)', color: '#818cf8' },
  typography: { bg: 'rgba(251,191,36,0.1)', color: '#d97706' },
  layout: { bg: 'rgba(16,185,129,0.08)', color: '#10b981' },
  contrast: { bg: 'rgba(239,68,68,0.08)', color: '#ef4444' },
};

const SEVERITY_DOT: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: 'rgba(161,161,170,0.2)',
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

  // Count fixes per category
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
    <div
      className="rounded-xl overflow-hidden mt-3"
      style={{ border: `0.5px solid ${stateStyle.border}` }}
    >
      {/* Banner */}
      <div
        style={{
          background: stateStyle.bannerBg,
          borderBottom: `0.5px solid ${stateStyle.border}`,
          padding: '16px 18px',
        }}
      >
        {/* Row 1: chip + score */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.04em] rounded-full"
            style={{ padding: '2px 9px', background: stateStyle.chipBg, color: stateStyle.color }}
          >
            {stateStyle.label}
          </span>
          <span className="text-[11px] font-medium font-mono" style={{ color: stateStyle.color }}>
            {score} / 10
          </span>
        </div>
        {/* Row 2: verdict sentence */}
        <p className="text-[15px] font-medium text-zinc-100 leading-[1.4]">
          {verdictOneLiner}
        </p>
      </div>

      {/* Body */}
      <div style={{ background: 'var(--surface, rgba(255,255,255,0.02))', padding: '14px 16px' }}>
        {/* Top issue block */}
        {topIssue && (
          <div
            className="flex items-start gap-2.5 rounded-[9px] mb-2.5"
            style={{ background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.15)', padding: '10px 12px' }}
          >
            <AlertCircle size={13} className="text-red-400 shrink-0 mt-px" />
            <div>
              <span className="text-[10px] font-medium text-red-400 block">Top issue</span>
              <p className="text-xs font-medium text-zinc-200 mt-0.5">{topIssue.fix}</p>
            </div>
          </div>
        )}

        {/* Category filter pills */}
        {categories.length > 1 && (
          <div className="flex gap-[5px] flex-wrap mb-2.5">
            {categories.map(cat => {
              const isActive = activeFilter === cat.key;
              const catStyle = CATEGORY_STYLES[cat.key];
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  className="flex items-center gap-1 cursor-pointer transition-all"
                  style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                    background: cat.key === 'all' ? 'rgba(255,255,255,0.04)' : (catStyle?.bg ?? 'rgba(255,255,255,0.04)'),
                    color: cat.key === 'all' ? (isActive ? '#e4e4e7' : '#71717a') : (catStyle?.color ?? '#71717a'),
                    border: isActive ? `0.5px solid ${catStyle?.color ?? 'rgba(255,255,255,0.15)'}` : '0.5px solid transparent',
                  }}
                >
                  {cat.key !== 'all' && (
                    <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: catStyle?.color }} />
                  )}
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Fix cards */}
        <div className="flex flex-col gap-[5px]">
          {filteredFixes.map((fix, i) => {
            const catStyle = CATEGORY_STYLES[fix.category] ?? { bg: 'rgba(161,161,170,0.08)', color: '#a1a1aa' };
            const dotColor = SEVERITY_DOT[fix.severity] ?? SEVERITY_DOT.low;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px' }}
              >
                <span
                  className="text-[9px] font-medium uppercase tracking-wider rounded-full shrink-0"
                  style={{ padding: '1px 6px', background: catStyle.bg, color: catStyle.color }}
                >
                  {fix.category}
                </span>
                <span className="text-xs font-medium text-zinc-200 flex-1">{fix.fix}</span>
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: dotColor }} />
              </div>
            );
          })}
        </div>

        {/* Overall note */}
        {overallNote && (
          <div className="mt-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', padding: '9px 12px' }}>
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.05em] block mb-1">Overall</span>
            <p className="text-xs text-zinc-400 leading-relaxed">{overallNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
