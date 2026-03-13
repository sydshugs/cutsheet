// DemoUploadToAnalysis.tsx — Sequence 1: Upload → Analyze → Results (3s loop)

import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { useTimeline } from "./useTimeline";
import { DemoShell } from "./DemoShell";
import { ScoreCard } from "@/src/components/ScoreCard";
import {
  MOCK_SCORES,
  MOCK_FILENAME,
  MOCK_IMPROVEMENTS,
  MOCK_BUDGET,
  MOCK_HASHTAGS,
} from "./mockData";

const DURATION = 3000;

const ANALYSIS_HINTS = [
  "Detecting hook pattern...",
  "Evaluating CTA placement...",
  "Measuring production quality...",
  "Calculating overall score...",
];

type Phase = "dropzone" | "dragover" | "analyzing" | "results";

function getPhase(elapsed: number): Phase {
  if (elapsed < 500) return "dropzone";
  if (elapsed < 1000) return "dragover";
  if (elapsed < 1500) return "analyzing";
  return "results";
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

interface Props {
  playing?: boolean;
}

export function DemoUploadToAnalysis({ playing = true }: Props) {
  const { elapsed, loopCount } = useTimeline({ duration: DURATION, playing });
  const phase = getPhase(elapsed);

  return (
    <DemoShell>
      <div className="flex items-center justify-center w-full h-full p-6" key={loopCount}>
        <AnimatePresence mode="wait">
          {/* ── Dropzone ── */}
          {phase === "dropzone" && (
            <motion.div key="dropzone" {...fade} className="w-full max-w-sm">
              <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <Upload className="h-5 w-5 text-zinc-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drop your creative here</p>
                  <p className="mt-1 text-xs text-zinc-500">or click to browse</p>
                </div>
                <div className="flex gap-2">
                  {["MP4", "MOV", "AVI"].map((f) => (
                    <span
                      key={f}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-500"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-1 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  Browse Files
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Drag Over ── */}
          {phase === "dragover" && (
            <motion.div key="dragover" {...fade} className="w-full max-w-sm">
              <div
                className="relative flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/[0.04] p-10 scale-[1.01]"
                style={{ boxShadow: "0 0 40px rgba(99,102,241,0.15)" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Upload className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drop your creative here</p>
                  <p className="mt-1 text-xs text-zinc-500">or click to browse</p>
                </div>

                {/* File label sliding in */}
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-indigo-500 px-3 py-1 text-[11px] font-mono font-semibold text-white shadow-lg"
                >
                  {MOCK_FILENAME}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── Analyzing ── */}
          {phase === "analyzing" && (
            <motion.div key="analyzing" {...fade} className="w-full max-w-sm">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {/* Thumbnail placeholder */}
                <div className="mb-4 h-[120px] w-full rounded-xl bg-white/5" />

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-white animate-pulse">
                    Analyzing your creative...
                  </p>

                  {/* Shimmer bar */}
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, var(--accent), transparent)",
                        animation: "shimmer 1.2s ease-in-out infinite",
                      }}
                    />
                  </div>

                  {/* Cycling hint */}
                  <p className="text-xs text-zinc-500 font-mono">
                    {ANALYSIS_HINTS[Math.floor(((elapsed - 1000) / 500) * ANALYSIS_HINTS.length) % ANALYSIS_HINTS.length]}
                  </p>
                </div>
              </div>

              <style>{`
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
            </motion.div>
          )}

          {/* ── Results ── */}
          {phase === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
            >
              <ScoreCard
                scores={MOCK_SCORES}
                improvements={MOCK_IMPROVEMENTS}
                budget={MOCK_BUDGET}
                hashtags={MOCK_HASHTAGS}
                fileName={MOCK_FILENAME}
                isDark={true}
                analysisTime={new Date()}
                modelName="Gemini 2.5 Flash"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DemoShell>
  );
}
