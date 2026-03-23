// ScoreAdaptiveCTA — verdict-driven action strip using Kill/Test/Scale framing

import { Share2, FileText, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getVerdict, getVerdictColor, getVerdictBg, getVerdictCopy, type Verdict } from '../../lib/scoreColors';

interface ScoreAdaptiveCTAProps {
  overallScore: number;
  onShare?: () => void;
  onGenerateBrief?: () => void;
}

export function ScoreAdaptiveCTA({ overallScore, onShare, onGenerateBrief }: ScoreAdaptiveCTAProps) {
  const verdict: Verdict = getVerdict(overallScore);
  const verdictColor = getVerdictColor(verdict);
  const verdictBg = getVerdictBg(verdict);
  const verdictCopy = getVerdictCopy(verdict);

  return (
    <div
      style={{
        borderRadius: "var(--radius-sm)",
        background: verdictBg,
        border: `1px solid`,
        borderColor: verdictColor,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Verdict copy line */}
      <p
        style={{
          fontSize: 12,
          color: verdictColor,
          margin: 0,
          fontWeight: 500,
          fontFamily: "var(--sans)",
        }}
      >
        {verdictCopy}
      </p>

      {/* Action buttons */}
      <AnimatePresence mode="wait">
        {verdict === 'Scale' ? (
          <motion.div
            key="cta-scale"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex gap-2"
          >
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="cs-btn-primary flex-1 justify-center h-9"
              >
                <Share2 size={13} />
                Share Score
              </button>
            )}
            {onGenerateBrief && (
              <button
                type="button"
                onClick={onGenerateBrief}
                className="cs-btn-ghost flex-1 justify-center h-9"
              >
                <FileText size={13} />
                Generate Brief
              </button>
            )}
          </motion.div>
        ) : verdict === 'Test' ? (
          <motion.div
            key="cta-test"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            {onGenerateBrief && (
              <button
                type="button"
                onClick={onGenerateBrief}
                className="cs-btn-primary w-full justify-center h-9"
              >
                <FileText size={13} />
                Generate Brief
              </button>
            )}
            <p
              style={{
                fontSize: 11,
                color: "var(--ink-muted)",
                margin: 0,
                textAlign: "center",
              }}
            >
              AI-powered brief to fix weak areas first
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="cta-kill"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            {onGenerateBrief && (
              <button
                type="button"
                onClick={onGenerateBrief}
                className="cs-btn-ghost w-full justify-center h-9"
              >
                <Wand2 size={13} />
                Fix This Ad
              </button>
            )}
            <p
              style={{
                fontSize: 11,
                color: "var(--ink-muted)",
                margin: 0,
                textAlign: "center",
              }}
            >
              Generate a new creative brief from scratch
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
