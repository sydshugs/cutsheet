// DesignReviewCard — Creative verdict + design flags, matching Figma spec (node 217:612)
// Unified for both video (secondEye flags) and static (designReview flags) formats

import { useState, useRef, useEffect, useMemo } from "react";
import { CircleX, Type, Layers, Box, Activity, AlertCircle, ChevronRight, Wand2, X } from "lucide-react";

interface DesignFlag {
  category: string;
  severity: 'critical' | 'warning' | 'info' | 'high' | 'medium' | 'low';
  issue: string;
  fix: string;
  timestamp?: string;
}

interface DesignReviewCardProps {
  verdictState: 'not_ready' | 'needs_work' | 'ready';
  verdictHeadline: string;
  priorityFix?: string;
  flags: DesignFlag[];
  onFixWithAI?: () => void;
}

const VERDICT_BADGE = {
  not_ready:  { label: 'Not Ready',   style: 'bg-red-500/10 border-red-500/20 text-red-400',       icon: CircleX },
  needs_work: { label: 'Needs Work',  style: 'bg-amber-500/10 border-amber-500/20 text-amber-400',  icon: AlertCircle },
  ready:      { label: 'Ready',        style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', icon: CircleX },
} as const;

type IconComponent = (props: { size?: number; className?: string }) => JSX.Element | null;
const CATEGORY_ICON: Record<string, { icon: IconComponent; color: string; bg: string }> = {
  Typography:  { icon: Type,     color: 'text-amber-500',   bg: 'bg-amber-500/10' },
  Hierarchy:   { icon: Layers,   color: 'text-[#6366f1]',   bg: 'bg-[#6366f1]/10' },
  Layout:      { icon: Box,      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  Contrast:    { icon: CircleX,  color: 'text-red-400',     bg: 'bg-red-500/10' },
  Motion:      { icon: Activity, color: 'text-[#6366f1]',   bg: 'bg-[#6366f1]/10' },
  Scroll:      { icon: Activity, color: 'text-amber-500',   bg: 'bg-amber-500/10' },
};

function getIconMeta(category: string) {
  return CATEGORY_ICON[category] ?? { icon: AlertCircle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
}

const ALL_FILTER_IDS = ['All', 'Hierarchy', 'Typography', 'Layout', 'Contrast'];

export function DesignReviewCard({ verdictState, verdictHeadline, priorityFix, flags, onFixWithAI }: DesignReviewCardProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [priorityDismissed, setPriorityDismissed] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const badge = VERDICT_BADGE[verdictState];
  const BadgeIcon = badge.icon;

  const criticalCount = useMemo(() => flags.filter(f =>
    f.severity === 'critical' || f.severity === 'high'
  ).length, [flags]);

  const availableFilters = useMemo(() => {
    const categories = new Set(flags.map(f => f.category));
    return ALL_FILTER_IDS.filter(id => id === 'All' || categories.has(id));
  }, [flags]);

  const visibleFlags = activeFilter === 'All'
    ? flags
    : flags.filter(f => f.category === activeFilter);

  const getCount = (filterId: string) => {
    if (filterId === 'All') return flags.length;
    return flags.filter(f => f.category === filterId).length;
  };

  return (
    <div className="w-full flex flex-col shrink-0 rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 border text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1 ${badge.style}`}>
            <BadgeIcon size={12} strokeWidth={2.5} />
            <span>{badge.label}</span>
          </div>
          {criticalCount > 0 && (
            <>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
                {criticalCount} Critical {criticalCount === 1 ? 'Fix' : 'Fixes'}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Verdict Headline */}
        <h2 className="text-lg font-semibold text-[#f4f4f5] leading-snug tracking-tight">
          {verdictHeadline}
        </h2>

        {/* Priority Fix Card */}
        {priorityFix && !priorityDismissed && (
          <div className="rounded-xl border border-white/[0.08] border-l-[2px] border-l-amber-500/40 bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={13} className="text-[#f59e0b]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                PRIORITY FIX
              </span>
              <div className="relative ml-auto" ref={popoverRef}>
                <button
                  onClick={() => setPopoverOpen(v => !v)}
                  className="flex items-center justify-center w-5 h-5 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  <ChevronRight size={11} className="text-amber-500" />
                </button>
                {popoverOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 z-10 rounded-xl border border-white/[0.06] bg-[#18181b] shadow-xl p-1">
                    {onFixWithAI && (
                      <button
                        onClick={() => { setPopoverOpen(false); onFixWithAI(); }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-white/[0.04] cursor-pointer w-full text-left text-zinc-200"
                      >
                        <Wand2 size={14} className="text-[#6366f1] shrink-0" />
                        Fix with AI Rewrite
                      </button>
                    )}
                    <button
                      onClick={() => { setPopoverOpen(false); setPriorityDismissed(true); }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-white/[0.04] cursor-pointer w-full text-left text-zinc-500"
                    >
                      <X size={14} className="text-zinc-500 shrink-0" />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed mt-2">{priorityFix}</p>
          </div>
        )}

        {/* Filter Pills */}
        {availableFilters.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {availableFilters.map(filterId => {
              const count = getCount(filterId);
              const isActive = activeFilter === filterId;
              return (
                <button
                  key={filterId}
                  onClick={() => setActiveFilter(filterId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white/[0.06] border border-white/[0.10] text-zinc-200'
                      : 'bg-transparent border border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  {filterId}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none ${
                      isActive ? 'bg-white/10 text-white' : 'bg-white/5 text-zinc-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Fix Rows */}
        <div className="flex flex-col gap-2.5">
          {visibleFlags.map((flag, i) => {
            const meta = getIconMeta(flag.category);
            const IconComp = meta.icon;
            const priority = (flag.severity === 'critical' || flag.severity === 'high') ? 'high' : 'medium';
            const badgeClass = priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400';
            return (
              <div key={i} className="group relative flex flex-col gap-2.5 rounded-xl bg-[#18181b] border border-white/[0.08] p-3.5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${meta.bg} ${meta.color}`}>
                    <IconComp size={14} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">{flag.category}</span>
                  <span className={`ml-auto text-[9px] font-semibold uppercase rounded px-1.5 py-0.5 ${badgeClass}`}>
                    {priority === 'high' ? 'HIGH PRIORITY' : 'MEDIUM'}
                  </span>
                </div>
                <p className="text-[13px] text-zinc-300 leading-relaxed pl-[38px] pr-4">
                  {flag.fix || flag.issue}
                </p>
              </div>
            );
          })}
          {visibleFlags.length === 0 && (
            <p className="text-xs text-zinc-600 py-2">No issues in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}
