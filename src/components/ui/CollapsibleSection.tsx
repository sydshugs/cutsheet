// CollapsibleSection — reusable expand/collapse with chevron animation
// Uses framer-motion for smooth height transitions

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional trailing element shown in the header row (e.g. a badge) */
  trailing?: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  icon,
  trailing,
  className = "",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div 
      className={`rounded-xl transition-colors ${className}`}
      style={{ 
        background: open ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
        className="w-full flex items-center justify-between gap-3 group focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none rounded-xl py-3 px-0.5 hover:bg-white/[0.02] transition-colors"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <div className="flex items-center gap-2.5">
          {/* Chevron indicator */}
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="text-zinc-500 group-hover:text-zinc-400 transition-colors"
          >
            <ChevronRight size={14} />
          </motion.span>
          {icon && (
            <span
              className="flex-shrink-0 transition-colors"
              style={{ color: open ? "#a5b4fc" : "#52525b" }}
            >
              {icon}
            </span>
          )}
          <span
            className="text-[13px] tracking-normal transition-colors"
            style={{ fontWeight: 500, color: open ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)" }}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {trailing}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-1 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
