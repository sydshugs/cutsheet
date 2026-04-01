// MotionTestIdeaCard — Motion concept card matching Figma spec (node 217:687)
// Shows motion phases + generate button that triggers Kling video generation

import { Clapperboard, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface MotionPhase {
  label: string;
  time: string;
  color: string;
  dot: string;
  desc: string;
}

const DEFAULT_PHASES: MotionPhase[] = [
  { label: 'OPENING',    time: '0–2s', color: 'text-indigo-500', dot: 'bg-indigo-500',  desc: 'Fast-paced jump cuts. High contrast visual hook.' },
  { label: 'TRANSITION', time: '2–5s', color: 'text-emerald-500', dot: 'bg-emerald-500', desc: 'Quick UI zoom. Satisfying synchronized audio cue.' },
  { label: 'PAYOFF',     time: '5–8s', color: 'text-amber-500',   dot: 'bg-amber-500',   desc: 'Pulsing CTA button. Instant offer presentation.' },
];

interface MotionTestIdeaCardProps {
  phases?: MotionPhase[];
  platform?: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
  elapsedSeconds?: number;
  onCancelGenerate?: () => void;
  videoUrl?: string | null;
  stillFrameUrl?: string | null;
  error?: string | null;
}

export function MotionTestIdeaCard({
  phases = DEFAULT_PHASES,
  platform,
  onGenerate,
  isGenerating = false,
  elapsedSeconds = 0,
  onCancelGenerate,
  videoUrl,
  error,
}: MotionTestIdeaCardProps) {
  const platformTag = platform ?? 'social';

  return (
    <div className="w-full flex flex-col p-6 rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      {/* Header */}
      <div className="flex items-center gap-2 text-zinc-500 mb-6">
        <Clapperboard size={16} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Motion Concept</span>
      </div>

      {/* Phase List */}
      <div className="flex flex-col w-full">
        {phases.map((p, i) => (
          <div key={p.label} className={`flex items-start gap-4 py-5 ${i !== 0 ? 'border-t border-white/[0.04]' : 'pt-0'}`}>
            <div className="w-[140px] shrink-0 flex items-center gap-3 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              <span className={`text-[12px] font-bold uppercase tracking-wider ${p.color}`}>{p.label}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-zinc-500 font-mono">{p.time}</span>
              <span className="text-[14px] text-zinc-200">{p.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Video playback if already generated */}
      {videoUrl && (
        <div className="mt-4 rounded-xl overflow-hidden border border-white/[0.06]">
          <video src={videoUrl} controls autoPlay loop muted playsInline className="w-full rounded-xl" />
        </div>
      )}

      {/* Action Area */}
      {!videoUrl && (
        <div className="mt-4">
          {!isGenerating ? (
            <div className="flex flex-col gap-5 pt-2">
              <div className="flex items-center gap-2 text-[14px] text-zinc-400">
                <TrendingUp size={16} className="text-indigo-400" />
                <span>Motion ads drive <strong className="text-zinc-200 font-medium">2–3x higher engagement</strong> vs static on {platformTag}.</span>
              </div>
              {onGenerate && (
                <button
                  onClick={onGenerate}
                  className="w-full h-11 rounded-[12px] border border-indigo-500/30 bg-indigo-500/[0.04] text-indigo-300 text-[14px] font-medium hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
                >
                  <Sparkles size={16} />
                  Generate Motion Preview
                </button>
              )}
              {error && (
                <p className="text-[12px] text-red-400">{error}</p>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center pt-8 pb-6 rounded-[20px] border border-white/[0.04] bg-[#0a0a0c] relative mt-2">
              {/* Gen Header */}
              <div className="flex items-center gap-2 text-zinc-500 mb-6">
                <Clapperboard size={14} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Generating Motion Preview</span>
              </div>

              {/* Spinner */}
              <div className="relative w-[72px] h-[72px] flex items-center justify-center mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <div className="flex gap-[3px] items-center">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      className="w-[3px] bg-indigo-400 rounded-full"
                      animate={{ height: ["8px", "20px", "8px"] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="text-center mb-10">
                <div className="text-[15px] text-zinc-200 font-medium mb-1">Sending to Kling</div>
                <div className="text-[13px] text-zinc-500">This usually takes 1–2 minutes</div>
              </div>

              {/* Progress */}
              <div className="w-full px-8 pb-6">
                <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min((elapsedSeconds / 90) * 100, 95)}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[12px] text-zinc-500 font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {elapsedSeconds}s elapsed
                </div>
              </div>

              {onCancelGenerate && (
                <button
                  onClick={onCancelGenerate}
                  className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
