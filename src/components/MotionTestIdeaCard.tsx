// MotionTestIdeaCard — matches Figma node 217:2401 exactly
// Phase list (Opening / Transition / Payoff) + generating state with Kling progress

import { useEffect, useState } from "react";
import { Clapperboard, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const PHASES = [
  { label: "OPENING",    time: "0–2s",  color: "#615fff", dot: "#615fff",  desc: "Fast-paced jump cuts. High contrast visual hook." },
  { label: "TRANSITION", time: "2–5s",  color: "#00bc7d", dot: "#00bc7d",  desc: "Quick UI zoom. Satisfying synchronized audio cue." },
  { label: "PAYOFF",     time: "5–8s",  color: "#fe9a00", dot: "#fe9a00",  desc: "Pulsing CTA button. Instant offer presentation." },
];

interface MotionTestIdeaCardProps {
  platform?: string;
  /** Called when user hits "Generate Motion Preview" */
  onGenerate?: () => void;
  /** Whether Kling is actively generating */
  isGenerating?: boolean;
  /** URL of completed video — shows player instead of generate button */
  videoUrl?: string | null;
  error?: string | null;
  onCancelGenerate?: () => void;
  /** Override phase descriptions with AI-derived text */
  phaseDescs?: [string, string, string];
}

export function MotionTestIdeaCard({
  platform,
  onGenerate,
  isGenerating = false,
  videoUrl,
  error,
  onCancelGenerate,
  phaseDescs,
}: MotionTestIdeaCardProps) {
  const [elapsed, setElapsed] = useState(0);

  // Count up while generating
  useEffect(() => {
    if (!isGenerating) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isGenerating]);

  const phases = PHASES.map((p, i) => ({
    ...p,
    desc: phaseDescs?.[i] ?? p.desc,
  }));

  const currentPhaseIndex = Math.min(Math.floor(elapsed / 30), 2);
  const currentPhase = phases[currentPhaseIndex];
  const progressPct = Math.min((elapsed / 90) * 100, 95);
  const platformLabel = platform ?? "social";

  return (
    <div className="w-full flex flex-col rounded-[16px] border border-white/[0.08] bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-[25px] pt-[25px] pb-0">
        <Clapperboard size={16} className="text-zinc-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Motion Concept
        </span>
      </div>

      {/* Phase List */}
      <div className="flex flex-col px-[25px] pt-[18px]">
        {phases.map((p, i) => (
          <div
            key={p.label}
            className={`flex items-start gap-[16px] py-5 ${i !== 0 ? "border-t border-white/[0.04]" : "pt-0"}`}
          >
            {/* Label column */}
            <div className="w-[140px] shrink-0 flex items-center gap-3 mt-1">
              <div
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ backgroundColor: p.dot }}
              />
              <span
                className="text-[12px] font-bold uppercase tracking-[0.05em]"
                style={{ color: p.color }}
              >
                {p.label}
              </span>
            </div>
            {/* Content column */}
            <div className="flex flex-col gap-[6px]">
              <span className="text-[12px] text-zinc-500 font-mono">{p.time}</span>
              <span className="text-[14px] text-[#e4e4e7] leading-[1.5]">{p.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom section */}
      {videoUrl ? (
        /* Completed — show video player */
        <div className="px-[25px] pb-[25px] mt-2">
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-xl border border-white/[0.06]"
          />
        </div>
      ) : isGenerating ? (
        /* Generating state — dark box */
        <div className="mx-[25px] mb-[25px] mt-2 bg-[#0a0a0c] border border-white/[0.04] rounded-[20px] flex flex-col items-center pt-[32px] pb-[24px] relative">
          {/* Gen header */}
          <div className="flex items-center gap-2 mb-[28px]">
            <Clapperboard size={14} className="text-zinc-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Generating Motion Preview
            </span>
          </div>

          {/* Phase pill */}
          <div
            className="h-[28px] px-[14px] rounded-full border flex items-center justify-center mb-[30px] text-[12px]"
            style={{
              background: "rgba(97,95,255,0.1)",
              borderColor: "rgba(97,95,255,0.3)",
              color: "#a3b3ff",
            }}
          >
            {currentPhase.label.charAt(0) + currentPhase.label.slice(1).toLowerCase()} · {currentPhase.time}
          </div>

          {/* Spinner */}
          <div className="relative w-[76px] h-[76px] flex items-center justify-center mb-[24px]">
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid rgba(97,95,255,0.2)",
                borderTopColor: "#615fff",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner bars */}
            <div className="flex items-center gap-[3px]">
              {[20, 18, 14, 9].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{ backgroundColor: "#7c86ff", height: `${h}px` }}
                  animate={{ height: [`${h * 0.5}px`, `${h}px`, `${h * 0.5}px`] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>

          {/* Status text */}
          <div className="text-center mb-[40px]">
            <p className="text-[15px] font-medium text-[#e4e4e7] mb-1">Sending to Kling</p>
            <p className="text-[13px] text-zinc-500">This usually takes 1–2 minutes</p>
          </div>

          {/* Progress bar */}
          <div className="w-full px-[32px] mb-[16px]">
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: "#615fff" }}
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
            <div className="flex items-center gap-2 text-[12px] text-zinc-500 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00bc7d]" />
              {elapsed}s elapsed
            </div>
          </div>

          {/* Cancel */}
          {onCancelGenerate && (
            <button
              onClick={onCancelGenerate}
              className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        /* Idle state — insight + generate button */
        <div className="flex flex-col gap-5 px-[25px] pb-[25px] pt-4">
          <div className="flex items-center gap-2 text-[14px] text-zinc-400">
            <TrendingUp size={16} className="text-[#615fff]" />
            <span>
              Motion ads drive{" "}
              <strong className="text-zinc-200 font-medium">2–3x higher engagement</strong>{" "}
              vs static on {platformLabel}.
            </span>
          </div>
          {onGenerate && (
            <button
              onClick={onGenerate}
              className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
              style={{
                border: "1px solid rgba(97,95,255,0.3)",
                background: "rgba(97,95,255,0.04)",
                color: "#a3b3ff",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(97,95,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(97,95,255,0.04)")}
            >
              <Sparkles size={16} />
              Generate Motion Preview
            </button>
          )}
          {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
