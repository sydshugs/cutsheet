// CreativeAnalysis — combined Creative Verdict + Design Review
// Enhanced visual hierarchy with clear fix identification and actionable suggestions
// Design improvements: severity indicators, priority ordering, category badges, better spacing

import { useState, useMemo } from "react";
import { AlertCircle, ChevronRight, Zap, Type, Layout, Contrast, Layers, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Brand guide colors with enhanced visual hierarchy
const STATE_COLORS = {
  not_ready: { 
    bannerBg: 'rgba(239,68,68,0.06)', 
    border: 'rgba(239,68,68,0.15)', 
    chipBg: 'rgba(239,68,68,0.12)', 
    color: '#ef4444', 
    label: 'Not Ready',
    icon: AlertCircle,
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)'
  },
  needs_work: { 
    bannerBg: 'rgba(245,158,11,0.06)', 
    border: 'rgba(245,158,11,0.15)', 
    chipBg: 'rgba(245,158,11,0.12)', 
    color: '#f59e0b', 
    label: 'Needs Work',
    icon: Zap,
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)'
  },
  ready: { 
    bannerBg: 'rgba(16,185,129,0.06)', 
    border: 'rgba(16,185,129,0.15)', 
    chipBg: 'rgba(16,185,129,0.12)', 
    color: '#10b981', 
    label: 'Ready to Run',
    icon: CheckCircle2,
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)'
  },
} as const;

// Enhanced category styles with icons and improved visual distinction
const CATEGORY_STYLES: Record<string, { bg: string; bgActive: string; color: string; dot: string; icon: typeof Layout; label: string }> = {
  hierarchy: { 
    bg: 'rgba(129,140,248,0.06)', 
    bgActive: 'rgba(129,140,248,0.12)', 
    color: '#818cf8', 
    dot: '#818cf8', 
    icon: Layers,
    label: 'Hierarchy'
  },
  typography: { 
    bg: 'rgba(245,158,11,0.06)', 
    bgActive: 'rgba(245,158,11,0.12)', 
    color: '#f59e0b', 
    dot: '#f59e0b', 
    icon: Type,
    label: 'Typography'
  },
  layout: { 
    bg: 'rgba(16,185,129,0.06)', 
    bgActive: 'rgba(16,185,129,0.12)', 
    color: '#10b981', 
    dot: '#10b981', 
    icon: Layout,
    label: 'Layout'
  },
  contrast: { 
    bg: 'rgba(239,68,68,0.06)', 
    bgActive: 'rgba(239,68,68,0.12)', 
    color: '#ef4444', 
    dot: '#ef4444', 
    icon: Contrast,
    label: 'Contrast'
  },
};

// Severity styling for visual priority indication
const SEVERITY_STYLES: Record<string, { color: string; bg: string; label: string; priority: number }> = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'High Priority', priority: 1 },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Medium', priority: 2 },
  low: { color: '#71717a', bg: 'rgba(113,113,122,0.1)', label: 'Optional', priority: 3 },
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
  const StateIcon = stateStyle.icon;
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedFix, setExpandedFix] = useState<number | null>(null);

  // Sort fixes by severity priority
  const sortedFixes = useMemo(() => {
    return [...fixes].sort((a, b) => {
      const aPriority = SEVERITY_STYLES[a.severity]?.priority ?? 3;
      const bPriority = SEVERITY_STYLES[b.severity]?.priority ?? 3;
      return aPriority - bPriority;
    });
  }, [fixes]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: fixes.length };
    for (const f of fixes) counts[f.category] = (counts[f.category] ?? 0) + 1;
    return counts;
  }, [fixes]);

  const categories = useMemo(() => {
    const cats = [{ key: 'all', label: `All ${fixes.length}`, icon: null }];
    for (const cat of ['hierarchy', 'typography', 'layout', 'contrast']) {
      if (categoryCounts[cat]) {
        const style = CATEGORY_STYLES[cat];
        cats.push({ key: cat, label: style.label, icon: style.icon });
      }
    }
    return cats;
  }, [categoryCounts, fixes.length]);

  const filteredFixes = activeFilter === 'all' 
    ? sortedFixes 
    : sortedFixes.filter(f => f.category === activeFilter);

  // Count high severity issues
  const highSeverityCount = fixes.filter(f => f.severity === 'high').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-xl overflow-hidden mt-4 border bg-white/[0.015] backdrop-blur-sm"
      style={{ borderColor: stateStyle.border }}
    >
      {/* Header — Enhanced visual hierarchy */}
      <div
        className="px-5 py-4"
        style={{ background: stateStyle.gradient }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                style={{ background: stateStyle.chipBg }}
              >
                <StateIcon size={11} style={{ color: stateStyle.color }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: stateStyle.color }}
                >
                  {stateStyle.label}
                </span>
              </div>
              {highSeverityCount > 0 && verdictState !== 'ready' && (
                <span className="text-[10px] font-medium text-zinc-500">
                  {highSeverityCount} critical {highSeverityCount === 1 ? 'fix' : 'fixes'}
                </span>
              )}
            </div>
            {/* Main verdict headline */}
            <p className="text-[14px] font-medium text-zinc-100 leading-relaxed">
              {verdictOneLiner}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Priority fix callout — Enhanced visual prominence */}
        {topIssue && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg mb-4 p-3 border"
            style={{ 
              background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)',
              borderColor: 'rgba(239,68,68,0.15)'
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)' }}
              >
                <AlertCircle size={13} style={{ color: '#ef4444' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                    Priority Fix
                  </span>
                  <ArrowRight size={10} className="text-red-400/60" />
                </div>
                <p className="text-[12px] text-zinc-300 leading-relaxed font-medium">
                  {topIssue.fix}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category filters — Enhanced with icons and better interaction */}
        {categories.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mb-4 pb-3 border-b border-white/[0.04]">
            {categories.map(cat => {
              const isActive = activeFilter === cat.key;
              const catStyle = CATEGORY_STYLES[cat.key];
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  aria-label={`Filter by ${cat.label}`}
                  aria-pressed={isActive}
                  className="flex items-center gap-1.5 cursor-pointer transition-all text-[11px] font-medium px-2.5 py-1.5 rounded-lg border"
                  style={{
                    background: isActive 
                      ? (catStyle?.bgActive ?? 'rgba(255,255,255,0.08)') 
                      : 'transparent',
                    borderColor: isActive 
                      ? (catStyle?.color ?? 'rgba(255,255,255,0.12)') + '30'
                      : 'transparent',
                    color: isActive 
                      ? (catStyle?.color ?? '#e4e4e7') 
                      : '#71717a',
                  }}
                >
                  {CatIcon && (
                    <CatIcon 
                      size={11} 
                      style={{ 
                        color: isActive ? catStyle?.color : '#52525b',
                        opacity: isActive ? 1 : 0.7
                      }} 
                    />
                  )}
                  {cat.label}
                  {cat.key !== 'all' && categoryCounts[cat.key] && (
                    <span 
                      className="text-[9px] font-mono ml-0.5 opacity-60"
                    >
                      {categoryCounts[cat.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Fix list — Enhanced with severity indicators and better visual hierarchy */}
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {filteredFixes.slice(0, 6).map((fix, i) => {
              const catStyle = CATEGORY_STYLES[fix.category] ?? { 
                bg: 'rgba(161,161,170,0.06)', 
                bgActive: 'rgba(161,161,170,0.1)',
                color: '#a1a1aa', 
                dot: '#71717a',
                icon: Layout,
                label: fix.category
              };
              const severityStyle = SEVERITY_STYLES[fix.severity] ?? SEVERITY_STYLES.low;
              const CatIcon = catStyle.icon;
              const isExpanded = expandedFix === i;
              const isHighPriority = fix.severity === 'high';
              
              return (
                <motion.div
                  key={`${fix.fix}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => setExpandedFix(isExpanded ? null : i)}
                  className="group relative rounded-lg border cursor-pointer transition-all hover:border-white/[0.08]"
                  style={{
                    background: isHighPriority 
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(255,255,255,0.015) 100%)'
                      : 'rgba(255,255,255,0.015)',
                    borderColor: isHighPriority ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Category icon indicator */}
                    <div 
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors"
                      style={{ background: catStyle.bg }}
                    >
                      <CatIcon size={13} style={{ color: catStyle.color }} />
                    </div>
                    
                    {/* Fix content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Severity indicator */}
                        <span 
                          className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ 
                            background: severityStyle.bg,
                            color: severityStyle.color
                          }}
                        >
                          {severityStyle.label}
                        </span>
                        {/* Category label */}
                        <span 
                          className="text-[9px] font-medium uppercase tracking-wide"
                          style={{ color: catStyle.color, opacity: 0.8 }}
                        >
                          {catStyle.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-zinc-300 leading-relaxed">
                        {fix.fix}
                      </p>
                    </div>

                    {/* Expand indicator */}
                    <ChevronRight 
                      size={14} 
                      className="text-zinc-600 shrink-0 transition-transform group-hover:text-zinc-500"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    />
                  </div>

                  {/* Expanded state with additional context */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-0 ml-10">
                          <div className="text-[11px] text-zinc-500 leading-relaxed border-t border-white/[0.04] pt-2">
                            <span className="text-zinc-400">Why it matters:</span> This improvement will help increase visual clarity and conversion potential.
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Show more indicator if there are additional fixes */}
        {filteredFixes.length > 6 && (
          <div className="mt-3 pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] text-zinc-500">
              +{filteredFixes.length - 6} more suggestions available
            </span>
          </div>
        )}

        {/* Overall note — Enhanced styling */}
        {overallNote && (
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <p className="text-[11px] text-zinc-500 leading-relaxed italic">
              {overallNote}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
