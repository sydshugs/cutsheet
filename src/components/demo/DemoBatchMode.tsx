// DemoBatchMode.tsx — Sequence 4: Batch Mode upload → analyze → table (3s loop)

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, Check } from "lucide-react";
import { useTimeline } from "./useTimeline";
import { DemoShell } from "./DemoShell";
import { BatchTable } from "@/src/components/BatchTable";
import { MOCK_BATCH_FILES, MOCK_BATCH_RESULTS } from "./mockData";

const DURATION = 6000;

type Phase = "dropzone" | "files" | "analyzing" | "results";

function getPhase(elapsed: number): Phase {
  if (elapsed < 1000) return "dropzone";
  if (elapsed < 2000) return "files";
  if (elapsed < 4000) return "analyzing";
  return "results";
}

// Pseudo-random but deterministic file sizes per index
const FILE_SIZES = ["12.4 MB", "8.7 MB", "3.2 MB", "15.1 MB", "6.9 MB"];

type FileStatus = "pending" | "analyzing" | "done";

function getFileStatus(fileIndex: number, elapsed: number): FileStatus {
  // Each file starts analyzing 400ms apart after 2000ms
  const startMs = 2000 + fileIndex * 400;
  const doneMs = startMs + 400;
  if (elapsed < startMs) return "pending";
  if (elapsed < doneMs) return "analyzing";
  return "done";
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

export function DemoBatchMode({ playing = true }: Props) {
  const { elapsed, loopCount } = useTimeline({ duration: DURATION, playing });
  const phase = getPhase(elapsed);

  return (
    <DemoShell>
      <div className="flex items-start justify-center w-full h-full p-6 overflow-y-auto" key={loopCount}>
        <AnimatePresence mode="wait">
          {/* ── Dropzone ── */}
          {phase === "dropzone" && (
            <motion.div key="dropzone" {...fade} className="w-full max-w-md">
              <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <Upload className="h-5 w-5 text-zinc-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drop files to batch analyze</p>
                  <p className="mt-1 text-xs text-zinc-500">Up to 10 creatives at once</p>
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

          {/* ── File Cards ── */}
          {phase === "files" && (
            <motion.div key="files" {...fade} className="w-full max-w-md">
              <div className="grid grid-cols-3 gap-3">
                {MOCK_BATCH_FILES.map((filename, i) => {
                  const delay = i * 160;
                  const show = elapsed >= 1000 + delay;
                  if (!show) return <div key={filename} />;
                  return (
                    <motion.div
                      key={filename}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <p className="text-[11px] font-mono text-white truncate">{filename}</p>
                      <p className="text-[10px] font-mono text-zinc-600">{FILE_SIZES[i]}</p>
                      <span className="inline-flex self-start rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                        Pending
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Analyzing Cards ── */}
          {phase === "analyzing" && (
            <motion.div key="analyzing" {...fade} className="w-full max-w-md">
              <div className="grid grid-cols-3 gap-3">
                {MOCK_BATCH_FILES.map((filename, i) => {
                  const status = getFileStatus(i, elapsed);
                  return (
                    <div
                      key={filename}
                      className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <p className="text-[11px] font-mono text-white truncate">{filename}</p>
                      <p className="text-[10px] font-mono text-zinc-600">{FILE_SIZES[i]}</p>

                      {status === "pending" && (
                        <span className="inline-flex self-start rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                          Pending
                        </span>
                      )}
                      {status === "analyzing" && (
                        <span className="inline-flex self-start items-center gap-1 rounded-md bg-indigo-500/15 px-2 py-0.5 text-[10px] font-mono text-indigo-400">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Analyzing
                        </span>
                      )}
                      {status === "done" && (
                        <span className="inline-flex self-start items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                          <Check className="h-2.5 w-2.5" />
                          Done
                        </span>
                      )}

                      {/* Progress bar */}
                      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width:
                              status === "done"
                                ? "100%"
                                : status === "analyzing"
                                  ? "60%"
                                  : "0%",
                            background:
                              status === "done"
                                ? "var(--success, #10B981)"
                                : "var(--accent, #6366F1)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Results Table ── */}
          {phase === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-2xl relative"
            >
              {/* Subtle glow behind top row */}
              <div
                className="pointer-events-none absolute top-[44px] left-0 right-0 h-[48px] z-10 rounded-lg"
                style={{
                  background: "linear-gradient(90deg, rgba(16,185,129,0.06), transparent 80%)",
                }}
              />
              <BatchTable results={MOCK_BATCH_RESULTS} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DemoShell>
  );
}
