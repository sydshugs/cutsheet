// CreativeAnalysis — combined Creative Verdict + Design Review
// Cleaner card-based layout with minimal visual noise

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";

// Subdued color palette
const STATE_COLORS = {
  not_ready: { 
    bannerBg: 'rgba(252,165,165,0.03)', 
    border: 'rgba(252,165,165,0.08)', 
    chipBg: 'rgba(252,165,165,0.08)', 
    color: '#fca5a5', 
    label: 'Not ready' 
  },
  needs_work: { 
    bannerBg: 'rgba(252,211,77,0.03)', 
    border: 'rgba(252,211,77,0.08)', 
    chipBg: 'rgba(252,211,77,0.08)', 
    color: '#fcd34d', 
    label: 'Needs work' 
  },
  ready: { 
    bannerBg: 'rgba(110,231,183,0.03)', 
    border: 'rgba(110,231,183,0.08)', 
    chipBg: 'rgba(110,231,183,0.08)', 
    color: '#6ee7b7', 
    label: 'Ready' 
  },
} as const;

const CATEGORY_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  hierarchy: { bg: 'rgba(165,180,252,0.06)', color: '#a5b4fc', dot: '#a5b4fc' },
  typography: { bg: 'rgba(252,211,77,0.06)', color: '#fcd34d', dot: '#fcd34d' },
  layout: { bg: 'rgba(110,231,183,0.06)', color: '#6ee7b7', dot: '#6ee7b7' },
  contrast: { bg: 'rgba(252,165,165,0.06)', color: '#fca5a5', dot: '#fca5a5' },
};

const SEVERITY_DOT: Record<string, string> = {
  high: '#fca5a5',
  medium: '#fcd34d',
  low: 'rgba(161,161,170,0.25)',
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
    <div className="rounded-xl overflow-hidden mt-4 border border-white/[0.05] bg-white/[0.015] backdrop-blur-sm">
      {/* Header — minimal */}
      <div
        className="px-4 py-3"
        style={{
          background: stateStyle.bannerBg,
          borderBottom: `1px solid ${stateStyle.border}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: stateStyle.color }}
          />
          <span
            className="text-[10px] font-medium uppercase tracking-wide"
            style={{ color: stateStyle.color }}
          >
            {stateStyle.label}
          </span>
        </div>
        <p className="text-[13px] font-medium text-zinc-200 leading-relaxed">
          {verdictOneLiner}
        </p>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Top issue */}
        {topIssue && (
          <div className="flex items-start gap-2 rounded-lg mb-3 p-2.5 bg-white/[0.02] border border-white/[0.04]">
            <AlertCircle size={12} style={{ color: '#fca5a5' }} className="shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">{topIssue.fix}</p>
          </div>
        )}

        {/* Category filters — minimal */}
        {categories.length > 1 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {categories.map(cat => {
              const isActive = activeFilter === cat.key;
              const catStyle = CATEGORY_STYLES[cat.key];
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  aria-label={`Filter by ${cat.label}`}
                  aria-pressed={isActive}
                  className="flex items-center gap-1 cursor-pointer transition-all text-[10px] font-medium px-2 py-1 rounded-md"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: isActive ? '#d4d4d8' : '#52525b',
                  }}
                >
                  {cat.key !== 'all' && catStyle && (
                    <span className="w-1 h-1 rounded-full" style={{ background: catStyle.dot }} />
                  )}
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Fix list — minimal */}
        <div className="flex flex-col gap-1.5">
          {filteredFixes.slice(0, 4).map((fix, i) => {
            const catStyle = CATEGORY_STYLES[fix.category] ?? { bg: 'rgba(161,161,170,0.06)', color: '#a1a1aa', dot: '#71717a' };
            return (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04]"
              >
                <span 
                  className="w-1 h-1 rounded-full mt-1.5 shrink-0" 
                  style={{ background: catStyle.dot }}
                />
                <p className="text-[11px] text-zinc-400 leading-relaxed">{fix.fix}</p>
              </div>
            );
          })}
        </div>

        {/* Overall note */}
        {overallNote && (
          <p className="mt-3 text-[10px] text-zinc-500 leading-relaxed">{overallNote}</p>
        )}
      </div>
    </div>
  );
}
