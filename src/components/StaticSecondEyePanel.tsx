// src/components/StaticSecondEyePanel.tsx — Design Review (Premium redesign)
// Visual-first design tool with clear hierarchy, impact indicators, and actionable fixes

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PenTool, CheckCircle, AlertCircle, ChevronDown, ChevronRight,
  Layers, Type, Move, Contrast, Sparkles, TrendingUp, Eye
} from "lucide-react";
import type { StaticSecondEyeResult, StaticSecondEyeFlag } from "../services/claudeService";

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────

const AREA_CONFIG: Record<
  StaticSecondEyeFlag["area"],
  { label: string; icon: typeof Layers; color: string; gradient: string }
> = {
  hierarchy:  { label: "Hierarchy",  icon: Layers,   color: "#818cf8", gradient: "from-indigo-500/15 to-indigo-500/5" },
  typography: { label: "Typography", icon: Type,     color: "#f59e0b", gradient: "from-amber-500/15 to-amber-500/5" },
  layout:     { label: "Layout",     icon: Move,     color: "#10b981", gradient: "from-emerald-500/15 to-emerald-500/5" },
  contrast:   { label: "Contrast",   icon: Contrast, color: "#ef4444", gradient: "from-red-500/15 to-red-500/5" },
};

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", label: "Critical", bgColor: "rgba(239,68,68,0.1)" },
  warning:  { color: "#f59e0b", label: "Warning", bgColor: "rgba(245,158,11,0.1)" },
  note:     { color: "#71717a", label: "Note", bgColor: "rgba(113,113,122,0.1)" },
};

// ─── SHIMMER ─────────────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/[0.04] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
          <div className="h-4 w-full rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── VERDICT HEADER ──────────────────────────────────────────────────────────

function VerdictHeader({ 
  isReady, 
  summary, 
  fixCount 
}: { 
  isReady: boolean; 
  summary: string; 
  fixCount: number;
}) {
  return (
    <div 
      className={`relative rounded-2xl p-5 overflow-hidden ${
        isReady 
          ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20' 
          : 'bg-gradient-to-br from-red-500/10 to-amber-500/5 border border-red-500/20'
      }`}
    >
      {/* Background glow */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: isReady ? '#10b981' : '#ef4444' }}
      />
      
      <div className="relative flex items-start gap-4">
        {/* Status indicator */}
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isReady ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}
        >
          {isReady ? (
            <CheckCircle size={24} className="text-emerald-400" />
          ) : (
            <AlertCircle size={24} className="text-red-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-2">
            <span 
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isReady 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isReady ? 'Ready to publish' : 'Needs attention'}
            </span>
            {!isReady && fixCount > 0 && (
              <span className="text-[10px] text-zinc-500">{fixCount} fixes suggested</span>
            )}
          </div>
          
          {/* Summary */}
          <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
}

// ─── PRIORITY FIX CARD ───────────────────────────────────────────────────────

function PriorityFixCard({ flag }: { flag: StaticSecondEyeFlag }) {
  const area = AREA_CONFIG[flag.area];
  const Icon = area.icon;
  
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.05))', border: '1px solid rgba(239,68,68,0.15)' }}>
      {/* Priority banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/10">
        <Sparkles size={12} className="text-red-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Priority Fix</span>
        <span className="text-[10px] text-zinc-600">- Will have the biggest impact</span>
      </div>
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${area.color}20` }}
          >
            <Icon size={18} style={{ color: area.color }} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-medium uppercase tracking-wide block mb-1" style={{ color: area.color }}>
              {area.label}
            </span>
            <p className="text-[15px] font-semibold text-zinc-100 leading-snug">{flag.fix}</p>
            {flag.issue && (
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{flag.issue}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CATEGORY SECTION ────────────────────────────────────────────────────────

type FilterCategory = "all" | StaticSecondEyeFlag["area"];

function CategoryTabs({
  flags,
  active,
  onFilter,
}: {
  flags: StaticSecondEyeFlag[];
  active: FilterCategory;
  onFilter: (cat: FilterCategory) => void;
}) {
  const counts: Record<string, number> = { all: flags.length };
  for (const f of flags) counts[f.area] = (counts[f.area] ?? 0) + 1;

  const categories: { key: FilterCategory; label: string; color?: string; icon?: typeof Layers }[] = [
    { key: "all", label: `All ${flags.length}` },
    ...(counts.hierarchy ? [{ key: "hierarchy" as const, ...AREA_CONFIG.hierarchy }] : []),
    ...(counts.typography ? [{ key: "typography" as const, ...AREA_CONFIG.typography }] : []),
    ...(counts.layout ? [{ key: "layout" as const, ...AREA_CONFIG.layout }] : []),
    ...(counts.contrast ? [{ key: "contrast" as const, ...AREA_CONFIG.contrast }] : []),
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map((cat) => {
        const isActive = active === cat.key;
        const Icon = cat.icon;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onFilter(cat.key)}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
              isActive 
                ? 'bg-white/[0.08] border-white/[0.15]' 
                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
            } border`}
            style={{ color: isActive && cat.color ? cat.color : isActive ? '#e4e4e7' : '#71717a' }}
          >
            {Icon && <Icon size={12} />}
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── FIX CARD ────────────────────────────────────────────────────────────────

function FixCard({
  flag,
  index,
  isExpanded,
  onClick,
}: {
  flag: StaticSecondEyeFlag;
  index: number;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const area = AREA_CONFIG[flag.area];
  const severity = SEVERITY_CONFIG[flag.severity];
  const Icon = area.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={onClick}
      className={`group relative rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
        isExpanded 
          ? 'bg-white/[0.04] border-white/[0.12]' 
          : 'bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]'
      } border`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ background: `${area.color}15` }}
          >
            <Icon size={16} style={{ color: area.color }} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: area.color }}
              >
                {area.label}
              </span>
              <span 
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: severity.color }}
                title={severity.label}
              />
            </div>
            
            {/* Fix text */}
            <p className="text-[13px] font-medium text-zinc-200 leading-snug pr-6">{flag.fix}</p>
          </div>
          
          {/* Expand indicator */}
          <ChevronDown 
            size={14} 
            className={`text-zinc-600 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
        
        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && flag.issue && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/[0.05] ml-12">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Eye size={10} className="text-zinc-600" />
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wide">Why this matters</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{flag.issue}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── IMPACT SUMMARY ──────────────────────────────────────────────────────────

function ImpactSummary({ flags }: { flags: StaticSecondEyeFlag[] }) {
  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const warningCount = flags.filter(f => f.severity === 'warning').length;
  const noteCount = flags.filter(f => f.severity === 'note').length;
  
  const impactScore = Math.max(0, 100 - (criticalCount * 25) - (warningCount * 10) - (noteCount * 3));
  
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-zinc-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Expected Impact</span>
        </div>
        <span className="text-sm font-bold text-zinc-300">{impactScore}/100</span>
      </div>
      
      {/* Impact bar */}
      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden mb-3">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${impactScore}%`,
            background: impactScore >= 70 ? '#10b981' : impactScore >= 40 ? '#f59e0b' : '#ef4444'
          }}
        />
      </div>
      
      {/* Severity breakdown */}
      <div className="flex items-center gap-4">
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[11px] text-zinc-500">{criticalCount} critical</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11px] text-zinc-500">{warningCount} warnings</span>
          </div>
        )}
        {noteCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-[11px] text-zinc-500">{noteCount} notes</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OVERALL VERDICT ─────────────────────────────────────────────────────────

function OverallVerdict({ verdict }: { verdict: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] p-4">
      <div className="flex items-center gap-2 mb-2">
        <PenTool size={12} className="text-zinc-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Designer's Take</span>
      </div>
      <p className="text-[13px] text-zinc-400 leading-relaxed italic">"{verdict}"</p>
    </div>
  );
}

// ─── MAIN PANEL ──────────────────────────────────────────────────────────────

export function StaticSecondEyePanel({
  result,
  loading,
}: {
  result: StaticSecondEyeResult | null;
  loading: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!loading && !result) return null;

  const hasFlags = result && result.flags.length > 0;
  const isEmpty = result && result.flags.length === 0;
  const isReady = isEmpty || (result && !result.flags.some(f => f.severity === 'critical'));

  const visibleFlags = result
    ? activeFilter === "all"
      ? result.flags
      : result.flags.filter(f => f.area === activeFilter)
    : [];

  // Skip priority fix in main list
  const priorityFlag = result?.flags.find(f => f.severity === "critical");
  const remainingFlags = visibleFlags.filter(f => f !== priorityFlag);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-4 mt-5 mb-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <PenTool size={14} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Design Review</h3>
          <span className="text-[11px] text-zinc-600">Visual polish & layout analysis</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {loading && !result && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </motion.div>
        )}

        {/* Empty - All Good */}
        {isEmpty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-6 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <h4 className="text-lg font-semibold text-zinc-100 mb-1">Design looks great</h4>
            <p className="text-sm text-zinc-500">No typography, layout, or contrast issues detected.</p>
          </motion.div>
        )}

        {/* Has Fixes */}
        {hasFlags && result && (
          <motion.div
            key="flags"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Verdict header */}
            <VerdictHeader 
              isReady={!!isReady} 
              summary={result.topIssue || 'Your design has a few areas for improvement.'} 
              fixCount={result.flags.length}
            />

            {/* Priority fix */}
            {priorityFlag && <PriorityFixCard flag={priorityFlag} />}

            {/* Category tabs */}
            <CategoryTabs 
              flags={result.flags} 
              active={activeFilter} 
              onFilter={(cat) => {
                setActiveFilter(cat);
                setExpandedIndex(null);
              }} 
            />

            {/* Fix cards */}
            <div className="space-y-2">
              {remainingFlags.map((flag, i) => (
                <FixCard
                  key={`${flag.area}-${i}`}
                  flag={flag}
                  index={i}
                  isExpanded={expandedIndex === i}
                  onClick={() => setExpandedIndex(prev => prev === i ? null : i)}
                />
              ))}
            </div>

            {/* Impact summary */}
            <ImpactSummary flags={result.flags} />

            {/* Overall verdict */}
            {result.overallDesignVerdict && (
              <OverallVerdict verdict={result.overallDesignVerdict} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
