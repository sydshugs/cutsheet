import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorCardProps {
  error: string | null;
  onRetry: () => void;
  onReset: () => void;
}

export function ErrorCard({ error, onRetry, onReset }: ErrorCardProps) {
  return (
    <motion.div
      layoutId="analyzer-card"
      className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-red-500/20 max-w-[480px] mx-auto p-8 flex flex-col items-center gap-4"
    >
      {/* Error icon */}
      <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
        <AlertCircle size={24} className="text-red-400" />
      </div>

      {/* Heading */}
      <h3 className="text-lg font-semibold text-white">Analysis failed</h3>

      {/* Error message */}
      <p className="text-sm text-zinc-400 text-center">
        {error || "Something went wrong. Please try again."}
      </p>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onRetry}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl px-5 py-2.5 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onReset}
          className="bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl px-5 py-2.5 transition-colors"
        >
          Start Over
        </button>
      </div>
    </motion.div>
  );
}
