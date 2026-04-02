// DesignReviewCard — pixel-matched to Figma node 217:612
// Verdict headline + priority fix + filter pills + flag rows

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
  not_ready:  { label: 'Not Ready',  bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  text: '#f87171' },
  needs_work: { label: 'Needs Work', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  ready:      { label: 'Ready',      bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#10b981' },
} as const;

// Category → icon + exact Figma rgba colors
type IconComp = (props: { size?: number; className?: string; style?: Record<string, string | number> }) => ReturnType<() => null>;
const CATEGORY_META: Record<string, { icon: IconComp; bg: string; color: string }> = {
  typography:  { icon: Type,       bg: 'rgba(254,154,0,0.1)',   color: '#fe9a00' },
  hierarchy:   { icon: Layers,     bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  layout:      { icon: Box,        bg: 'rgba(0,188,125,0.1)',   color: '#00bc7d' },
  contrast:    { icon: CircleX,    bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  motion:      { icon: Activity,   bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  scroll:      { icon: Activity,   bg: 'rgba(254,154,0,0.1)',   color: '#fe9a00' },
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
    <div
      className="w-full flex flex-col shrink-0 overflow-hidden font-['Geist',sans-serif]"
      style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}
    >
      {/* ── Content ── */}
      <div className="p-5 flex flex-col gap-5">
        {/* Header row — verdict pill + critical count */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-[6.5px] px-3 py-1 rounded-full border"
            style={{ background: badge.bg, borderColor: badge.border }}
          >
            <CircleX size={13} style={{ color: badge.text, flexShrink: 0 }} />
            <span
              className="font-bold uppercase whitespace-nowrap"
              style={{ fontSize: 10.959, letterSpacing: '1.096px', color: badge.text }}
            >
              {badge.label}
            </span>
          </div>
          {criticalCount > 0 && (
            <>
              <div className="w-[4px] h-[4px] rounded-full bg-white/20 shrink-0" />
              <span
                className="font-medium whitespace-nowrap"
                style={{ fontSize: 13, color: '#71717b' }}
              >
                {criticalCount} Critical {criticalCount === 1 ? 'Fix' : 'Fixes'}
              </span>
            </>
          )}
        </div>

        {/* Verdict headline */}
        <h2
          className="font-semibold text-[#f4f4f5] leading-snug"
          style={{ fontSize: 20, letterSpacing: '-0.025em' }}
        >
          {verdictHeadline}
        </h2>

        {/* Priority Fix */}
        {priorityFix && !priorityDismissed && (
          <div
            className="relative flex flex-col gap-[9px] pt-[14px] pb-[10px] pl-5 pr-5"
            style={{
              border: '1px solid rgba(254,154,0,0.4)',
              borderRadius: 20,
              background: 'rgba(24,24,27,0.7)',
              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[9px]">
                <AlertCircle size={14} style={{ color: '#fe9a00', flexShrink: 0 }} />
                <span
                  className="font-semibold uppercase text-[#fe9a00]"
                  style={{ fontSize: 10.959, letterSpacing: '0.5479px' }}
                >
                  PRIORITY FIX
                </span>
              </div>
              {/* Chevron — opens dismiss/AI popover */}
              <div className="relative" ref={popoverRef}>
                <button
                  onClick={() => setPopoverOpen(v => !v)}
                  className="flex items-center justify-center w-[22px] h-[22px] rounded-[6.575px] hover:bg-white/[0.06] transition-colors"
                >
                  <ChevronRight size={12} style={{ color: '#fe9a00' }} />
                </button>
                {popoverOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 z-10 rounded-xl p-1"
                    style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#18181b', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  >
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
            {/* Fix text */}
            <p className="text-[#e4e4e7]" style={{ fontSize: 15.342, lineHeight: '24.932px', fontWeight: 400 }}>
              {priorityFix}
            </p>
          </div>
        )}

        {/* Filter pills */}
        {availableFilters.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {availableFilters.map(filterId => {
              const count = getCount(filterId);
              const isActive = activeFilter === filterId;
              return (
                <button
                  key={filterId}
                  onClick={() => setActiveFilter(filterId)}
                  className="flex items-center gap-[7px] px-3 h-[33px] rounded-full text-[12px] font-medium transition-all whitespace-nowrap shrink-0"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.04)',
                    color: isActive ? '#e4e4e7' : '#71717b',
                  }}
                >
                  {filterId}
                  {count > 0 && (
                    <span
                      className="px-[5px] py-[1px] rounded-[6px] text-[11px] font-semibold leading-none"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#fff' : '#71717b',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Flag rows */}
        <div className="flex flex-col gap-[11px]">
          {visibleFlags.map((flag, i) => {
            const meta = getCategoryMeta(flag.category);
            const IconComp = meta.icon;
            const isHigh = flag.severity === 'critical' || flag.severity === 'high';
            return (
              <div
                key={i}
                className="flex flex-col gap-[11px] pl-4 pr-[1px] py-4"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  background: 'rgba(24,24,27,0.7)',
                  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
                }}
              >
                {/* Category row */}
                <div className="flex items-center gap-0 justify-between pr-[15px]">
                  <div className="flex items-center gap-[14px]">
                    {/* Icon box */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 28, height: 28,
                        borderRadius: 6.575,
                        background: meta.bg,
                      }}
                    >
                      <IconComp size={15} style={{ color: meta.color }} />
                    </div>
                    {/* Category label */}
                    <span
                      className="font-semibold text-[#d4d4d8] capitalize"
                      style={{ fontSize: 13.151 }}
                    >
                      {flag.category}
                    </span>
                  </div>
                  {/* Priority badge */}
                  <div
                    className="flex items-center px-[6.5px]"
                    style={{
                      height: 19,
                      borderRadius: 4.384,
                      background: isHigh ? 'rgba(251,44,54,0.1)' : 'rgba(245,158,11,0.1)',
                    }}
                  >
                    <span
                      className="font-semibold uppercase whitespace-nowrap"
                      style={{
                        fontSize: 9.863,
                        color: isHigh ? '#ff6467' : '#f59e0b',
                      }}
                    >
                      {isHigh ? 'HIGH PRIORITY' : 'MEDIUM'}
                    </span>
                  </div>
                </div>
                {/* Fix text — indented to align with label */}
                <p
                  className="text-[#d4d4d8] pr-4"
                  style={{ fontSize: 14.247, lineHeight: '23.151px', fontWeight: 400, paddingLeft: 42 }}
                >
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
