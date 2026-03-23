// ScoreAdaptiveCTA — primary CTA that adapts based on overall score (3A hypothesis)

import { Share2, Sparkles, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreAdaptiveCTAProps {
  overallScore: number;
  onShare?: () => void;
  onGenerateBrief?: () => void;
  briefLoading?: boolean;
}

export function ScoreAdaptiveCTA({ overallScore, onShare, onGenerateBrief, briefLoading }: ScoreAdaptiveCTAProps) {
  return (
    <div className="px-5 pb-4">
      <AnimatePresence mode="wait">
        {overallScore >= 8 ? (
          <motion.div
            key="cta-share"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => onShare?.()}
              className="w-full py-3.5 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2.5 transition-all bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30"
            >
              <Share2 size={15} /> Share Your Score
            </button>
          </motion.div>
        ) : overallScore >= 5.5 ? (
          <motion.div
            key="cta-fix"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => onGenerateBrief?.()}
              disabled={briefLoading}
              className="w-full py-3.5 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2.5 transition-all bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {briefLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Generating...</>
              ) : (
                <><FileText size={15} /> Generate Brief</>
              )}
            </button>
            <p className="text-[11px] text-zinc-600 text-center mt-2">
              AI-powered creative brief based on your score
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="cta-brief"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => onGenerateBrief?.()}
              disabled={briefLoading}
              className="w-full py-3.5 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2.5 transition-all bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {briefLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Generating...</>
              ) : (
                <><FileText size={15} /> Generate Brief</>
              )}
            </button>
            <p className="text-[11px] text-zinc-600 text-center mt-2">
              AI-powered creative brief based on your score
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
