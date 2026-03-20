// ScoreAdaptiveCTA — primary CTA that adapts based on overall score (3A hypothesis)

import { Share2, Sparkles, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreAdaptiveCTAProps {
  overallScore: number;
  onShare?: () => void;
  onGenerateBrief?: () => void;
}

export function ScoreAdaptiveCTA({ overallScore, onShare, onGenerateBrief }: ScoreAdaptiveCTAProps) {
  return (
    <div className="px-5 pb-3">
      <AnimatePresence mode="wait">
        {overallScore >= 8 ? (
          <motion.div
            key="cta-share"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => onShare?.()}
              className="w-full h-11 rounded-full border-none text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors duration-150"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; }}
            >
              <Share2 size={14} /> Share Your Score
            </button>
          </motion.div>
        ) : overallScore >= 5.5 ? (
          <motion.div
            key="cta-fix"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => {
                const impSection = document.getElementById("improvements-section");
                if (impSection) impSection.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full h-11 rounded-full border-none text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors duration-150"
              style={{ background: "#4f46e5", color: "white" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#4338ca"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#4f46e5"; }}
            >
              <Sparkles size={14} /> Fix the Weak Spots
            </button>
            <p className="text-[11px] text-zinc-500 text-center mt-1.5">
              Jump to improvements below
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="cta-brief"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => onGenerateBrief?.()}
              className="w-full h-11 rounded-full border-none text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors duration-150"
              style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.15)"; }}
            >
              <FileText size={14} /> Generate a New Brief
            </button>
            <p className="text-[11px] text-zinc-500 text-center mt-1.5">
              AI-powered creative brief based on your score
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
