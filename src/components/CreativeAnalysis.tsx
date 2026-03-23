// CreativeAnalysis — combined Creative Verdict + Design Review
// Amber-tinted banner with verdict + filterable fix cards

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";

const STATE_COLORS = {
  not_ready: { bannerBg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', chipBg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Not ready' },
  needs_work: { bannerBg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.25)', chipBg: 'rgba(217,119,6,0.12)', color: '#d97706', label: 'Needs work' },
  ready: { bannerBg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', chipBg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Ready' },
} as const;

const CATEGORY_STYLES: Record<string, { bg: string; color: string; hoverBg: string; hoverColor: string; activeBg: string }> = {
  hierarchy: { bg: 'rgba(129,140,248,0.15)', color: '#a5b4fc', hoverBg: 'rgba(129,140,248,0.22)', hoverColor: '#c4b5fd', activeBg: 'rgba(129,140,248,0.25)' },
  typography: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', hoverBg: 'rgba(251,191,36,0.22)', hoverColor: '#fcd34d', activeBg: 'rgba(251,191,36,0.25)' },
  layout: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', hoverBg: 'rgba(16,185,129,0.22)', hoverColor: '#6ee7b7', activeBg: 'rgba(16,185,129,0.25)' },
  contrast: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', hoverBg: 'rgba(239,68,68,0.22)', hoverColor: '#fca5a5', activeBg: 'rgba(239,68,68,0.25)' },
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
      {/* Banner — Option 3 spacing: 18px 20px */}
      <div
        style={{
          background: stateStyle.bannerBg,
          borderBottom: `0.5px solid ${stateStyle.border}`,
          padding: '18px 20px',
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
          {/* Score removed per design review */}
        </div>
        {/* Row 2: verdict sentence — 16px */}
        <p className="text-base font-medium text-zinc-100 leading-[1.4]">
          {verdictOneLiner}
        </p>
      </div>

      {/* Body — Option 3 spacing: 18px 20px */}
      <div style={{ background: 'var(--surface, rgba(255,255,255,0.02))', padding: '18px 20px' }}>
        {/* Top issue block — fix text 14px */}
        {topIssue && (
          <div
            className="flex items-start gap-2.5 rounded-[9px] mb-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.15)', padding: '12px 14px' }}
          >
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-px" />
            <div>
              <span className="text-[10px] font-medium text-red-400 block">Top issue</span>
              <p className="text-sm font-medium text-zinc-200 mt-0.5">{topIssue.fix}</p>
            </div>
          </div>
        )}

        {/* Category filter pills — Option D sizing + hover/active states */}
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {categories.map(cat => {
              const isActive = activeFilter === cat.key;
              const catStyle = CATEGORY_STYLES[cat.key];
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  className="flex items-center gap-1.5 cursor-pointer"
                  style={{
                    fontSize: 12, fontWeight: 500, padding: '6px 16px', borderRadius: 99,
                    transition: 'all 0.15s ease',
                    background: cat.key === 'all'
                      ? (isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)')
                      : (isActive ? (catStyle?.activeBg ?? catStyle?.bg ?? 'rgba(255,255,255,0.04)') : (catStyle?.bg ?? 'rgba(255,255,255,0.04)')),
                    color: cat.key === 'all'
                      ? (isActive ? '#e4e4e7' : '#71717a')
                      : (isActive ? (catStyle?.hoverColor ?? catStyle?.color ?? '#71717a') : (catStyle?.color ?? '#71717a')),
                    border: isActive ? `0.5px solid ${catStyle?.color ?? 'rgba(255,255,255,0.15)'}` : '0.5px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      if (cat.key === 'all') {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      } else if (catStyle) {
                        e.currentTarget.style.background = catStyle.hoverBg;
                        e.currentTarget.style.color = catStyle.hoverColor;
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = cat.key === 'all' ? 'rgba(255,255,255,0.04)' : (catStyle?.bg ?? 'rgba(255,255,255,0.04)');
                      e.currentTarget.style.color = cat.key === 'all' ? '#71717a' : (catStyle?.color ?? '#71717a');
                      e.currentTarget.style.borderColor = 'transparent';
                    }
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

        {/* Fix cards — Option 3: 12px 14px padding, column layout, 6px gap */}
        <div className="flex flex-col gap-1.5">
          {filteredFixes.map((fix, i) => {
            const catStyle = CATEGORY_STYLES[fix.category] ?? { bg: 'rgba(161,161,170,0.08)', color: '#a1a1aa' };
            const dotColor = SEVERITY_DOT[fix.severity] ?? SEVERITY_DOT.low;
            return (
              <div
                key={i}
                className="flex flex-col gap-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px' }}
              >
                {/* Top row: category tag */}
                <div className="flex items-center">
                  <span
                    className="text-[11px] font-semibold uppercase rounded-full shrink-0"
                    style={{ padding: '4px 10px', letterSpacing: '0.03em', background: catStyle.bg, color: catStyle.color }}
                  >
                    {fix.category}
                  </span>
                </div>
                {/* Fix text below — 14px 500 */}
                <span className="text-sm font-medium text-zinc-200 leading-normal">{fix.fix}</span>
              </div>
            );
          })}
        </div>

        {/* Overall note — Option 3: 12px 14px padding */}
        {overallNote && (
          <div className="mt-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px' }}>
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.05em] block mb-1">Overall</span>
            <p className="text-xs text-zinc-400 leading-relaxed">{overallNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
