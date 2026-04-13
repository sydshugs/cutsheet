// DesignReviewCard — matched to Figma Make reference design
// Header: verdict pill + critical count | Verdict headline | Priority Fix (left-border accent)
// Category filter pills | Fix rows with hover state

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  not_ready:  { label: 'Not Ready',  bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  text: '#f87171' },
  needs_work: { label: 'Needs Work', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  ready:      { label: 'Ready',      bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#10b981' },
} as const;

// Category → icon + Figma rgba colors
type IconComp = React.ElementType<{ size?: number; className?: string; style?: React.CSSProperties }>;
const CATEGORY_META: Record<string, { icon: IconComp; bg: string; color: string }> = {
  typography:  { icon: Type,       bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  hierarchy:   { icon: Layers,     bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  layout:      { icon: Box,        bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
  contrast:    { icon: CircleX,    bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  motion:      { icon: Activity,   bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  scroll:      { icon: Activity,   bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category.toLowerCase()] ?? { icon: AlertCircle, bg: 'rgba(113,113,122,0.1)', color: '#71717a' };
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

  const criticalCount = useMemo(() => flags.filter(f =>
    f.severity === 'critical' || f.severity === 'high'
  ).length, [flags]);

  const availableFilters = useMemo(() => {
    const categories = new Set(flags.map(f => f.category.toLowerCase()));
    return ALL_FILTER_IDS.filter(id => id === 'All' || categories.has(id.toLowerCase()));
  }, [flags]);

  const visibleFlags = activeFilter === 'All'
    ? flags
    : flags.filter(f => f.category.toLowerCase() === activeFilter.toLowerCase());

  const getCount = (filterId: string) =>
    filterId === 'All' ? flags.length : flags.filter(f => f.category.toLowerCase() === filterId.toLowerCase()).length;

  return (
    <div className="w-full flex flex-col shrink-0 rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden font-['Geist',sans-serif]">

      {/* ── Header bar — verdict pill + critical count ── */}
      <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[10px] font-bold uppercase tracking-widest"
            style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
          >
            <CircleX size={12} strokeWidth={2.5} />
            <span>{badge.label}</span>
          </div>
          {criticalCount > 0 && (
            <>
              <div className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
              <span className="text-xs font-medium text-zinc-500 tracking-wide">
                {criticalCount} Critical {criticalCount === 1 ? 'Fix' : 'Fixes'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-5 flex flex-col gap-6">

        {/* Verdict headline */}
        <h2 className="text-lg font-semibold text-[#f4f4f5] leading-snug tracking-tight">
          {verdictHeadline}
        </h2>

        {/* Priority Fix — left-border accent (not full amber border) */}
        {priorityFix && !priorityDismissed && (
          <div className="rounded-xl border border-white/[0.08] border-l-[2px] border-l-amber-500/40 bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={13} className="text-[#f59e0b] shrink-0" />
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
            <p className="text-sm text-zinc-200 leading-relaxed mt-2">
              {priorityFix}
            </p>
          </div>
        )}

        {/* Filter pills */}
        {availableFilters.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {availableFilters.map(filterId => {
              const count = getCount(filterId);
              const isActive = activeFilter === filterId;
              return (
                <button
                  key={filterId}
                  onClick={() => setActiveFilter(filterId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${
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

        {/* Fix rows */}
        <div className="flex flex-col gap-2.5">
          {visibleFlags.map((flag, i) => {
            const meta = getCategoryMeta(flag.category);
            const IconComp = meta.icon;
            const isHigh = flag.severity === 'critical' || flag.severity === 'high';
            return (
              <div
                key={i}
                className="group relative flex flex-col gap-2.5 rounded-xl bg-[#18181b] border border-white/[0.08] p-3.5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center p-1.5 rounded-md shrink-0"
                    style={{ background: meta.bg }}
                  >
                    <IconComp size={14} style={{ color: meta.color }} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 capitalize">
                    {flag.category}
                  </span>
                  <span
                    className="ml-auto text-[9px] font-semibold uppercase rounded px-1.5 py-0.5"
                    style={{
                      background: isHigh ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: isHigh ? '#f87171' : '#f59e0b',
                    }}
                  >
                    {isHigh ? 'HIGH PRIORITY' : 'MEDIUM'}
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
