// ErrorCard.tsx — Full-page error card for analysis failures, uses InlineError internally

import { motion } from "framer-motion";
import { InlineError } from "./InlineError";
import type { AnalysisError } from "../hooks/useVideoAnalyzer";

interface ErrorCardProps {
  error: string | null;
  analysisError?: AnalysisError | null;
  onRetry: () => void;
  onReset: () => void;
}

export function ErrorCard({ error, analysisError, onRetry, onReset }: ErrorCardProps) {
  // Use categorized error if available
  if (analysisError) {
    return (
      <motion.div
        layoutId="analyzer-card"
        className="max-w-[480px] mx-auto"
      >
        <InlineError
          severity={analysisError.severity}
          message={analysisError.message}
          recovery={analysisError.recovery}
          primaryAction={{ label: analysisError.type === "rate_limit" ? "Retry in 30s" : "Try again", onClick: onRetry }}
          secondaryAction={{ label: "Start over", onClick: onReset }}
        />
      </motion.div>
    );
  }

  // Fallback: basic error display
  return (
    <motion.div
      layoutId="analyzer-card"
      className="max-w-[480px] mx-auto"
    >
      <InlineError
        severity="red"
        message={error || "Something went wrong"}
        recovery="Your file is still loaded — try again"
        primaryAction={{ label: "Try again", onClick: onRetry }}
        secondaryAction={{ label: "Start over", onClick: onReset }}
      />
    </motion.div>
  );
}
