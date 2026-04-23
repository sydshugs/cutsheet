// DesignReviewCard — matched to Figma node 428-529
// Layout: outer card → verdict headline → priority fix → filter pills → fix rows → footer (verdict pill + count)

import React, { memo, useState, useRef, useEffect, useMemo } from "react";
import { CircleX, Type, Layers, Box, Activity, AlertCircle, ChevronRight, Wand2, X, Eye, TrendingDown, TrendingUp, CheckCircle } from "lucide-react";

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
  /** When provided, renders the Figma 493:2842 top stack: header bar + THE VERDICT block + Review heading. */
  verdictDetail?: string;
  /** Critical-fix count shown next to the THE VERDICT eyebrow. Only rendered when verdictDetail is also provided. */
  criticalCount?: number;
  priorityFix?: string;
  flags: DesignFlag[];
  onFixWithAI?: () => void;
}

const VERDICT_BADGE = {
  not_ready:  { label: 'Not Ready',  bg: 'rgba(251,44,54,0.1)',  border: 'rgba(251,44,54,0.2)',  text: '#ff6467' },
  needs_work: { label: 'Needs Work', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  ready:      { label: 'Ready',      bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#10b981' },
} as const;

// Figma 493:2842 — header-pill + THE VERDICT block config.
// TODO(tech-debt): duplicates CreativeVerdictAndSecondEye.tsx:23-54 VERDICT_CONFIG.
// Extract to shared VerdictHeader + VerdictBlock components during paid/organic shared-component pass.
const VERDICT_HEADER_CONFIG = {
  not_ready: {
    label: 'Not ready',
    pillBg: 'rgba(251,44,54,0.10)',
    pillColor: '#ff6467',
    gradient: 'linear-gradient(171.28deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)',
    iconBg: 'rgba(251,44,54,0.15)',
    iconColor: '#ff6467',
    labelColor: '#ff6467',
    Icon: TrendingDown,
  },
  needs_work: {
    label: 'Needs work',
    pillBg: 'rgba(254,154,0,0.10)',
    pillColor: '#fea000',
    gradient: 'linear-gradient(171.28deg, rgba(254,154,0,0.08) 0%, rgba(254,154,0,0.02) 100%)',
    iconBg: 'rgba(254,154,0,0.15)',
    iconColor: '#fea000',
    labelColor: '#fea000',
    Icon: TrendingUp,
  },
  ready: {
    label: 'Strong',
    pillBg: 'rgba(0,188,125,0.10)',
    pillColor: '#00d492',
    gradient: 'linear-gradient(171.28deg, rgba(0,188,125,0.08) 0%, rgba(0,188,125,0.02) 100%)',
    iconBg: 'rgba(0,188,125,0.15)',
    iconColor: '#00d492',
    labelColor: '#00d492',
    Icon: CheckCircle,
  },
} as const;

// Category → icon + Figma rgba colors
type IconComp = React.ElementType<{ size?: number; className?: string; style?: React.CSSProperties }>;
const CATEGORY_META: Record<string, { icon: IconComp; bg: string; color: string }> = {
  typography:  { icon: Type,       bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  hierarchy:   { icon: Layers,     bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  layout:      { icon: Box,        bg: 'rgba(0,188,125,0.1)',   color: '#00bc7d' },
  contrast:    { icon: CircleX,    bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  motion:      { icon: Activity,   bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  scroll:      { icon: Activity,   bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category.toLowerCase()] ?? { icon: AlertCircle, bg: 'rgba(113,113,122,0.1)', color: '#71717a' };
}

const ALL_FILTER_IDS = ['All', 'Hierarchy', 'Typography', 'Layout', 'Contrast'];

export const DesignReviewCard = memo(function DesignReviewCard({ verdictState, verdictHeadline, verdictDetail, criticalCount: criticalCountProp, priorityFix, flags, onFixWithAI }: DesignReviewCardProps) {
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
  const hc = verdictDetail !== undefined ? VERDICT_HEADER_CONFIG[verdictState] : null;
  const HeaderIcon = hc?.Icon;

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
    <div className="w-full flex flex-col shrink-0 rounded-2xl border border-white/[0.08] bg-[rgba(24,24,27,0.5)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden font-['Geist',sans-serif]">

      {/* ── Header bar (Figma 493:2842) — only rendered when verdictDetail is provided ── */}
      {hc && HeaderIcon && (
        <div className="h-[45px] flex items-center justify-between px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Eye size={13} color="#71717a" />
            <span className="text-[14px] font-medium whitespace-nowrap" style={{ color: "#e4e4e7" }}>
              Creative verdict
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] whitespace-nowrap hidden sm:block" style={{ color: "#52525c" }}>
              Fresh viewer perspective
            </span>
            <div className="flex items-center gap-[6px] h-[19px] px-2 rounded-full" style={{ background: hc.pillBg }}>
              <HeaderIcon size={10} color={hc.pillColor} />
              <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: hc.pillColor }}>
                {hc.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── THE VERDICT block (Figma 493:2842) ── */}
      {hc && HeaderIcon && (
        <div
          className="flex gap-3 px-4 py-4 border-b border-white/[0.06]"
          style={{ backgroundImage: hc.gradient }}
        >
          <div
            className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: hc.iconBg }}
          >
            <HeaderIcon size={16} color={hc.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-[10px]">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.5px]"
                style={{ color: hc.labelColor }}
              >
                THE VERDICT
              </span>
              {criticalCountProp !== undefined && criticalCountProp > 0 && (
                <span className="text-[10px]" style={{ color: "#71717b" }}>
                  {criticalCountProp} critical {criticalCountProp === 1 ? 'fix' : 'fixes'}
                </span>
              )}
            </div>
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: "#f4f4f5", margin: "0 0 6px" }}
            >
              {verdictHeadline}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#9f9fa9", margin: 0 }}>
              {verdictDetail}
            </p>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="p-5 flex flex-col gap-5">

        {/* Review section heading (Figma 493:2842) — paired with top stack */}
        {hc && (
          <div className="flex items-center gap-2">
            <Eye size={14} color="#9f9fa9" />
            <span className="text-[14px] font-semibold" style={{ color: "#e4e4e7" }}>
              Review
            </span>
          </div>
        )}

        {/* Verdict headline — fallback when top stack not rendered (Display path) */}
        {!hc && (
          <h2 className="text-[18px] font-semibold text-[#f4f4f5] leading-snug tracking-tight">
            {verdictHeadline}
          </h2>
        )}

        {/* Priority Fix — full amber border (Figma 428-529) */}
        {priorityFix && !priorityDismissed && (
          <div className="rounded-xl border border-[rgba(254,154,0,0.4)] bg-[rgba(24,24,27,0.7)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <AlertCircle size={13} className="text-[#f59e0b] shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                PRIORITY FIX
              </span>
              <div className="relative ml-auto" ref={popoverRef}>
                <button
                  onClick={() => setPopoverOpen(v => !v)}
                  className="flex items-center justify-center w-5 h-5 rounded-md hover:bg-white/[0.06] transition-opacity cursor-pointer"
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-opacity whitespace-nowrap shrink-0 cursor-pointer ${
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
        <div className="flex flex-col gap-3">
          {visibleFlags.map((flag, i) => {
            const meta = getCategoryMeta(flag.category);
            const IconComp = meta.icon;
            const isHigh = flag.severity === 'critical' || flag.severity === 'high';
            return (
              <div
                key={i}
                className="flex flex-col gap-2.5 rounded-xl bg-[rgba(24,24,27,0.7)] border border-white/[0.08] px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              >
                {/* Row: icon + category + badge */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-[7px] shrink-0"
                    style={{ background: meta.bg }}
                  >
                    <IconComp size={14} style={{ color: meta.color }} />
                  </div>
                  <span className="text-[13px] font-semibold text-zinc-300 capitalize">
                    {flag.category}
                  </span>
                  <span
                    className="ml-auto text-[9px] font-semibold uppercase rounded px-1.5 py-0.5 shrink-0"
                    style={{
                      background: isHigh ? 'rgba(251,44,54,0.1)' : 'rgba(245,158,11,0.1)',
                      color: isHigh ? '#ff6467' : '#f59e0b',
                    }}
                  >
                    {isHigh ? 'HIGH PRIORITY' : 'MEDIUM'}
                  </span>
                </div>
                {/* Description — indented to align with category text */}
                <p className="text-[13px] text-zinc-300 leading-relaxed pl-10">
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

      {/* ── Footer — verdict pill + critical count (Figma 428-529 bottom bar) ── */}
      <div className="border-t border-white/[0.04] px-5 py-3.5 flex items-center gap-3">
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
            <span className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
              {criticalCount} Critical {criticalCount === 1 ? 'Fix' : 'Fixes'}
            </span>
          </>
        )}
      </div>
    </div>
  );
});
