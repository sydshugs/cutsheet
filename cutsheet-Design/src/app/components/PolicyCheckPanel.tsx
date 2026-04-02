import React, { useState } from "react";
import { 
  ShieldX, Copy, X, AlertTriangle, ChevronRight, 
  ChevronDown, ChevronUp, XCircle, CheckCircle, 
  Wrench, FileText, ShieldCheck, ChevronLeft
} from "lucide-react";

const categories = [
  {
    id: '1',
    title: 'Misleading Claims',
    status: 'Likely Rejection',
    risk: 'HIGH RISK',
    description: 'The phrase "guaranteed to double your money" violates Meta\'s Unacceptable Business Practices policy regarding deceptive claims.',
    recommendation: 'Remove the word "guaranteed" and reframe as a potential outcome rather than a certainty.'
  },
  {
    id: '2',
    title: 'Personal Attributes',
    status: 'Review',
    risk: 'MEDIUM RISK',
    description: 'The text "Are you tired of being overweight?" implies knowledge of the user\'s personal attributes (health/body type).',
    recommendation: 'Focus on the product benefits instead: "Discover a new approach to fitness."'
  },
  {
    id: '3',
    title: 'Low Quality or Disruptive Content',
    status: 'Clear',
    risk: null,
    description: 'No overly sensationalized language, spammy layouts, or disruptive elements detected.',
    recommendation: null
  },
  {
    id: '4',
    title: 'Non-Functional Landing Page',
    status: 'Clear',
    risk: null,
    description: 'Destination URL appears to be functional and relevant to the ad content.',
    recommendation: null
  },
  {
    id: '5',
    title: 'Adult Content',
    status: 'Clear',
    risk: null,
    description: 'No nudity, suggestive poses, or sexually explicit content detected.',
    recommendation: null
  }
];

function PolicyCategoryCard({ category }: { category: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const statusConfig = {
    'Likely Rejection': { icon: XCircle, color: 'text-[#ef4444]', textClass: 'text-red-400', bgClass: 'bg-red-500/10' },
    'Review': { icon: AlertTriangle, color: 'text-[#f59e0b]', textClass: 'text-amber-400', bgClass: 'bg-amber-500/10' },
    'Clear': { icon: CheckCircle, color: 'text-[#10b981]', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
  }[category.status as string] || { icon: CheckCircle, color: 'text-emerald-400', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col overflow-hidden mb-2">
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusConfig.bgClass}`}>
            <StatusIcon size={12} className={statusConfig.color} />
            <span className={`text-[10px] font-semibold ${statusConfig.textClass}`}>
              {category.status}
            </span>
          </div>
          <span className="text-sm font-medium text-zinc-200">{category.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {category.risk && (
            <span className={`text-[9px] font-semibold uppercase rounded px-1.5 py-0.5 ${
              category.risk === 'HIGH RISK' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {category.risk}
            </span>
          )}
          {isOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-white/[0.04]">
          <p className="text-sm text-zinc-400 mt-3 mb-3 leading-relaxed">
            {category.description}
          </p>
          {category.recommendation && (
            <div className="rounded-xl bg-indigo-500/[0.06] border border-indigo-500/20 px-3 py-2.5 flex items-start gap-2">
              <Wrench size={12} className="text-[#6366f1] mt-0.5 shrink-0" />
              <p className="text-sm text-indigo-300 leading-snug">
                {category.recommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PolicyCheckPanel({ onClose }: { onClose: () => void }) {
  const [showClear, setShowClear] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const visibleCategories = showClear 
    ? categories 
    : categories.filter(c => c.status !== 'Clear');

  return (
    <div className="w-full flex flex-col">
      {/* Back Link */}
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 mb-4 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors w-fit group"
      >
        <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-medium">Back to Scores</span>
      </button>

      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/[0.12] flex items-center justify-center shrink-0 border border-amber-500/[0.08]">
            <ShieldCheck size={16} className="text-[#f59e0b]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-zinc-100 leading-tight">Policy Check</h2>
            <span className="text-xs text-zinc-500 mt-0.5">Meta · Ad policy scan</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-300 transition-colors">
            <Copy size={12} />
            <span className="text-xs">Copy Report</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* SECTION 1 — Header banner */}
      <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 flex justify-between items-start">
        <div className="flex gap-3">
          <ShieldX className="text-[#ef4444] mt-0.5 shrink-0" size={18} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-red-400">High rejection risk</span>
            <span className="text-xs text-zinc-500 mt-0.5">5 items need attention</span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Top 3 Fixes */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 mt-3 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-[#f59e0b]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
            TOP 3 FIXES
          </span>
        </div>
        <div className="flex flex-col">
          {[
            'Remove "guaranteed" claim at 0:05', 
            'Rephrase "tired of being overweight" to focus on product', 
            'Remove exaggerated claims from the final call to action'
          ].map((fix, i, arr) => (
            <div key={i} className={`flex items-start gap-2 py-2 ${i !== arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
              <ChevronRight size={10} className="text-[#f59e0b] mt-1 shrink-0" />
              <span className="text-sm text-zinc-300 leading-snug">{fix}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3 — Policy Categories */}
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mt-4 mb-2 px-1">
        POLICY CATEGORIES
      </div>
      
      <div className="flex flex-col">
        {visibleCategories.map(category => (
          <PolicyCategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* SECTION 4 — Show/Hide clear items */}
      <div className="flex justify-center mt-2 mb-2">
        <button 
          onClick={() => setShowClear(!showClear)}
          className="flex items-center gap-1.5 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {showClear ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{showClear ? 'Hide 3 clear items' : 'Show 3 clear items'}</span>
        </button>
      </div>

      {/* SECTION 5 — Reviewer Notes */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] mt-2 flex flex-col overflow-hidden mb-4">
        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition-colors"
          onClick={() => setNotesOpen(!notesOpen)}
        >
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Reviewer Notes</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600">For appeal if flagged</span>
            {notesOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
          </div>
        </div>
        {notesOpen && (
          <div className="px-4 pb-4 border-t border-white/[0.04]">
            <p className="text-sm text-zinc-400 leading-relaxed mt-3">
              If this ad is incorrectly flagged for Unacceptable Business Practices, appeal by emphasizing that the language describes a potential outcome of using the product, rather than a guaranteed result. Point to the disclaimer in the final frame which clarifies the results are typical but not assured.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}