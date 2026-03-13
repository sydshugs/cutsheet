// DemoPreFlight.tsx — Sequence 3: A/B Pre-Flight comparison (4s loop)

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2 } from "lucide-react";
import { useTimeline } from "./useTimeline";
import { DemoShell } from "./DemoShell";
import { PreFlightWinner } from "@/src/components/PreFlightWinner";
import { PreFlightRankCard } from "@/src/components/PreFlightRankCard";
import { PreFlightHeadToHead } from "@/src/components/PreFlightHeadToHead";
import { MOCK_COMPARISON } from "./mockData";

const DURATION = 8000;

type Phase = "upload" | "analyzing" | "results";

function getPhase(elapsed: number): Phase {
  if (elapsed < 1000) return "upload";
  if (elapsed < 3000) return "analyzing";
  return "results";
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

interface Props {
  playing?: boolean;
}

function UploadSlot({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <span className="text-xs font-mono font-semibold text-zinc-400">{label}</span>
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/10 py-8">
        <Upload className="h-4 w-4 text-zinc-600" />
        <span className="text-[11px] text-zinc-600">Drop file here</span>
      </div>
    </div>
  );
}

function FileLoadedSlot({ label, filename, size }: { label: string; filename: string; size: string }) {
  return (
    <div className="flex-1 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <span className="text-xs font-mono font-semibold text-zinc-400">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono text-white truncate">{filename}</p>
          <p className="text-[10px] text-zinc-600 font-mono">{size}</p>
        </div>
      </div>
    </div>
  );
}

export function DemoPreFlight({ playing = true }: Props) {
  const { elapsed, loopCount } = useTimeline({ duration: DURATION, playing });
  const phase = getPhase(elapsed);

  const analysisStep = elapsed >= 2000 ? 2 : 1;

  const showWinner = elapsed >= 3000;
  const showRanks = elapsed >= 4000;
  const showH2H = elapsed >= 5000;

  return (
    <DemoShell>
      <div className="flex items-start justify-center w-full h-full p-6 overflow-y-auto" key={loopCount}>
        <AnimatePresence mode="wait">
          {/* ── Upload Slots ── */}
          {phase === "upload" && (
            <motion.div key="upload" {...fade} className="flex gap-4 w-full max-w-md">
              <UploadSlot label="Variant A" />
              <UploadSlot label="Variant B" />
            </motion.div>
          )}

          {/* ── Analyzing ── */}
          {phase === "analyzing" && (
            <motion.div key="analyzing" {...fade} className="flex flex-col gap-4 w-full max-w-md">
              <div className="flex gap-4">
                <FileLoadedSlot
                  label="Variant A"
                  filename="summer-campaign-v2.mp4"
                  size="12.4 MB"
                />
                <FileLoadedSlot
                  label="Variant B"
                  filename="summer-campaign-alt.mp4"
                  size="10.1 MB"
                />
              </div>
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                <span className="text-xs font-mono text-zinc-400">
                  Analyzing {analysisStep}/2...
                </span>
              </div>
            </motion.div>
          )}

          {/* ── Results ── */}
          {phase === "results" && (
            <motion.div key="results" {...fade} className="flex flex-col gap-4 w-full max-w-lg">
              {showWinner && (
                <motion.div {...slideUp}>
                  <PreFlightWinner winner={MOCK_COMPARISON.winner} isDark={true} />
                </motion.div>
              )}

              {showRanks && (
                <motion.div
                  {...slideUp}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="flex gap-4"
                >
                  {MOCK_COMPARISON.rankings.map((ranking) => (
                    <div key={ranking.variant} className="flex-1">
                      <PreFlightRankCard
                        variant={ranking}
                        isWinner={ranking.rank === 1}
                        isDark={true}
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {showH2H && (
                <motion.div {...slideUp} transition={{ duration: 0.35, delay: 0.1 }}>
                  <PreFlightHeadToHead
                    headToHead={MOCK_COMPARISON.headToHead}
                    recommendation={MOCK_COMPARISON.recommendation}
                    hybridNote={MOCK_COMPARISON.hybridNote}
                    isDark={true}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DemoShell>
  );
}
