import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface QuickWinsProps {
  improvements: string[];
  loading?: boolean;
}

export function QuickWins({ improvements, loading }: QuickWinsProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="cs-card p-4 flex items-center gap-3">
        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>Generating improvements...</span>
      </div>
    );
  }

  if (!improvements || improvements.length === 0) {
    return (
      <div className="cs-card p-4">
        <span className="text-xs" style={{ color: 'var(--success)' }}>
          No critical issues. This ad is ready.
        </span>
      </div>
    );
  }

  const visible = expanded ? improvements : improvements.slice(0, 3);
  const hasMore = improvements.length > 3;

  return (
    <div className="cs-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>
          Quick wins
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {visible.map((item, i) => (
            <motion.li
              key={`improvement-${i}`}
              initial={i >= 3 ? { opacity: 0, height: 0 } : false}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2.5 items-start"
            >
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
              <span className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{item}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium mt-3 bg-transparent border-none p-0 cursor-pointer transition-colors"
          style={{ color: 'var(--accent-text)' }}
        >
          {expanded ? 'Show less' : `All ${improvements.length} improvements`}
        </button>
      )}
    </div>
  );
}
