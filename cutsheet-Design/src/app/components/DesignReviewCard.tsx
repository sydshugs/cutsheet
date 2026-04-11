import React, { useState, useRef, useEffect } from "react";
import { CircleX, Zap, Type, Layers, Box, Quote, ArrowRight, Activity, AlertCircle, ChevronRight, Wand2, X } from "lucide-react";

interface DesignReviewCardProps {
  onFixWithAI?: () => void;
}

export function DesignReviewCard({ onFixWithAI }: DesignReviewCardProps) {
  const [activeFilter, setActiveFilter] = useState("All");
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  const fixRows = [
    {
      category: "Typography",
      icon: <Type size={14} />,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
      text: "Key benefits text is unreadable on mobile devices. Increase font size and ensure proper contrast against the video background.",
    },
    {
      category: "Hierarchy",
      icon: <Layers size={14} />,
      iconColor: "text-[#6366f1]",
      iconBg: "bg-[#6366f1]/10",
      text: "Brand logo is completely lost in the opening frames. Move to top left and ensure it persists through the hook.",
    },
    {
      category: "Layout",
      icon: <Box size={14} />,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      text: "Critical UI elements fall into the TikTok/Reels safe zone dead areas. Shift main subjects and text to the center grid.",
    },
  ];

  const filters = [
    { id: "All", label: "All" },
    { id: "Hierarchy", label: "Hierarchy" },
    { id: "Typography", label: "Typography" },
    { id: "Layout", label: "Layout" },
    { id: "Contrast", label: "Contrast" },
  ];

  const getCount = (filterId: string) => {
    if (filterId === "All") return fixRows.length;
    return fixRows.filter((r) => r.category === filterId).length;
  };

  const visibleRows =
    activeFilter === "All"
      ? fixRows
      : fixRows.filter((r) => r.category === activeFilter);

  return (
    <div className="w-full flex flex-col shrink-0 rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden">
      
      {/* Top Header — Minimal Audit Status */}
      <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center bg-transparent bg-[#ffffff00]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1">
            <CircleX size={12} strokeWidth={2.5} />
            <span>Not Ready</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
            3 Critical Fixes
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6 bg-transparent bg-[#00000000]">
        {/* Verdict Headline */}
        <div>
          <h2 className="text-lg font-semibold text-[#f4f4f5] leading-snug tracking-tight">
            Visually arresting, but completely lacks product context, offer, and conversion elements.
          </h2>
        </div>

        {/* Priority Fix Insight Card */}
        {!priorityDismissed && (
          <div className="rounded-xl border border-white/[0.08] border-l-[2px] border-l-amber-500/40 bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={13} className="text-[#f59e0b]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                PRIORITY FIX
              </span>
              {/* Popover trigger */}
              <div className="relative ml-auto" ref={popoverRef}>
                <button
                  onClick={() => setPopoverOpen((v) => !v)}
                  className="flex items-center justify-center w-5 h-5 rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <ChevronRight size={11} className="text-amber-500" />
                </button>
                {popoverOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 z-10 rounded-xl border border-white/[0.06] bg-[#18181b] shadow-xl p-1">
                    <button
                      onClick={() => { setPopoverOpen(false); onFixWithAI?.(); }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-white/[0.04] cursor-pointer w-full text-left text-zinc-200"
                    >
                      <Wand2 size={14} className="text-[#6366f1] shrink-0" />
                      Fix with AI Rewrite
                    </button>
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
              Add a clear call-to-action and value proposition in the final 3 seconds. The current ending is too abrupt and provides no next steps for the viewer.
            </p>
          </div>
        )}

        {/* Subtle Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {filters.map((filter) => {
            const count = getCount(filter.id);
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white/[0.06] border border-white/[0.10] text-zinc-200"
                    : "bg-transparent border border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                }`}
              >
                {filter.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none ${
                    isActive ? "bg-white/10 text-white" : "bg-white/5 text-zinc-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Fix Rows */}
        <div className="flex flex-col gap-2.5">
          {visibleRows.map((row) => (
            <FixRow
              key={row.category}
              icon={row.icon}
              category={row.category}
              iconColor={row.iconColor}
              iconBg={row.iconBg}
              text={row.text}
            />
          ))}
          {visibleRows.length === 0 && (
            <p className="text-xs text-zinc-600 py-2">No issues in this category.</p>
          )}
        </div>
      </div>

      {/* Expert Footer — Distinct visual block */}
      
    </div>
  );
}

function FixRow({ icon, category, iconColor, iconBg, text, priority = "high" }: { icon: React.ReactNode, category: string, iconColor: string, iconBg: string, text: string, priority?: "high" | "medium" }) {
  const badgeClass = priority === "high"
    ? "bg-red-500/10 text-red-400"
    : "bg-amber-500/10 text-amber-400";
  const badgeLabel = priority === "high" ? "HIGH PRIORITY" : "MEDIUM";

  return (
    <div className="group relative flex flex-col gap-2.5 rounded-xl bg-[#18181b] border border-white/[0.08] p-3.5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-md ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-zinc-300">{category}</span>
        <span className={`ml-auto text-[9px] font-semibold uppercase rounded px-1.5 py-0.5 ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>
      <p className="text-[13px] text-zinc-300 leading-relaxed pl-[38px] pr-4">
        {text}
      </p>
    </div>
  );
}