// CollapsibleSection — reusable expand/collapse with chevron animation
// Uses framer-motion for smooth height transitions

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
// motion used for content expand/collapse, CSS transition for chevron rotation

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
    <div className={`transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
        className="w-full flex items-center justify-between h-[44px] group focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none px-0 hover:bg-transparent transition-all"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span
              className="flex-shrink-0 transition-colors"
              style={{ color: open ? "#a5b4fc" : "#71717a" }}
            >
              {icon}
            </span>
          )}
          <span
            className="text-[15px] font-medium transition-colors"
            style={{ color: open ? "rgba(255,255,255,0.85)" : "#d4d4d8" }}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {trailing}
          <ChevronRight
            size={14}
            className={`text-zinc-600 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
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
            <div className="px-4 pb-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
