// CollapsibleSection — reusable expand/collapse with chevron animation
// Uses framer-motion for smooth height transitions

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

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
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 group"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span
              className="flex-shrink-0 transition-colors"
              style={{ color: open ? "var(--accent)" : "#52525b" }}
            >
              {icon}
            </span>
          )}
          <span
            className="text-[13px] tracking-normal"
            style={{ fontWeight: open ? 600 : 500, color: open ? "var(--ink)" : "rgba(255,255,255,0.5)" }}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {trailing}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
          >
            <ChevronDown size={14} />
          </motion.span>
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
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
