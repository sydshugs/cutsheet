import React, { useState } from "react";
import { 
  Wand2, Copy, Lightbulb, MessageSquare, 
  CheckCircle, ArrowRight, Sparkles, MessageCircle, 
  ChevronLeft, ThumbsUp, ThumbsDown, AlertCircle
} from "lucide-react";

interface AIRewritePanelProps {
  onClose: () => void;
  fromPriorityFix?: boolean;
}

type Vote = "up" | "down" | null;

function FeedbackRow({ vote, onVote }: { vote: Vote; onVote: (v: Vote) => void }) {
  return (
    <div className="flex items-center gap-2 mt-2 opacity-40 hover:opacity-100 transition-opacity">
      <button
        onClick={() => onVote(vote === "up" ? null : "up")}
        className={`rounded-lg border p-1.5 cursor-pointer transition-colors ${
          vote === "up"
            ? "border-indigo-500/30 bg-indigo-500/[0.08]"
            : "border-white/[0.06] bg-transparent"
        }`}
      >
        <ThumbsUp size={12} color={vote === "up" ? "#818cf8" : "#52525b"} />
      </button>
      <button
        onClick={() => onVote(vote === "down" ? null : "down")}
        className={`rounded-lg border p-1.5 cursor-pointer transition-colors ${
          vote === "down"
            ? "border-red-500/30 bg-red-500/[0.06]"
            : "border-white/[0.06] bg-transparent"
        }`}
      >
        <ThumbsDown size={12} color={vote === "down" ? "#f87171" : "#52525b"} />
      </button>
      {vote !== null && (
        <span className="text-[10px] text-zinc-600">Thanks</span>
      )}
    </div>
  );
}

export function AIRewritePanel({ onClose, fromPriorityFix = false }: AIRewritePanelProps) {
  const [hookVote, setHookVote] = useState<Vote>(null);
  const [bodyVote, setBodyVote] = useState<Vote>(null);
  const [ctaVote, setCtaVote] = useState<Vote>(null);

  return (
    <div className="w-full flex flex-col font-sans">
      {/* Back Link */}
      <button 
        onClick={onClose}
        className="flex items-center gap-1.5 mb-4 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors w-fit group"
      >
        <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-medium">Back to Scores</span>
      </button>

      {/* Priority Fix Context Banner */}
      {fromPriorityFix && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 mb-4 flex items-start gap-3">
          <AlertCircle size={14} style={{ color: "#f59e0b" }} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 mb-1">Fixing Priority Issue</p>
            <p className="text-xs text-zinc-400 leading-relaxed">Add a clear call-to-action and value proposition in the final 3 seconds.</p>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/[0.12] flex items-center justify-center shrink-0 border border-indigo-500/[0.08]">
            <Wand2 size={16} className="text-[#6366f1]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-zinc-100 leading-tight">Your Rewrite</h2>
            <span className="text-xs text-zinc-500 mt-0.5">Static ad · AI-optimized copy</span>
          </div>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
          <Copy size={12} />
          Copy All
        </button>
      </div>

      {/* Section 1 — Rewritten Hook */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Lightbulb size={14} className="text-[#6366f1]" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Rewritten Hook</h3>
        </div>
        <p className="text-sm font-semibold text-zinc-100 leading-relaxed">
          Stop struggling with weak hair. The science of stronger roots is finally here.
        </p>
        <div className="bg-white/[0.03] border border-white/[0.04] px-3 py-2.5 mt-3 text-xs leading-relaxed rounded-[12px]">
          <span className="font-medium text-zinc-500 mr-1.5">Why:</span>
          <span className="text-zinc-400 inline">
            Shifting from a feature-led opening to a problem/solution hook immediately captures the target audience's core pain point.
          </span>
        </div>
        <FeedbackRow vote={hookVote} onVote={setHookVote} />
      </div>

      {/* Section 2 — Revised Body */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mt-3">
        <div className="flex items-center gap-1.5 mb-3">
          <MessageSquare size={14} className="text-[#6366f1]" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Revised Body</h3>
        </div>
        <p className="text-sm text-zinc-200 leading-relaxed mb-4">
          Our clinically proven formula penetrates deep into the scalp to nourish follicles from the inside out. Real results in just 30 days.
        </p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2">
            <CheckCircle size={12} className="text-[#10b981] shrink-0 mt-[3px]" />
            <span className="text-sm text-zinc-300 leading-snug">Adds visible volume and thickness</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={12} className="text-[#10b981] shrink-0 mt-[3px]" />
            <span className="text-sm text-zinc-300 leading-snug">Strengthens against everyday breakage</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={12} className="text-[#10b981] shrink-0 mt-[3px]" />
            <span className="text-sm text-zinc-300 leading-snug">100% vegan and cruelty-free</span>
          </div>
        </div>
        <FeedbackRow vote={bodyVote} onVote={setBodyVote} />
      </div>

      {/* Section 3 — New CTA */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 mt-3">
        <div className="flex items-center gap-1.5 mb-3">
          <ArrowRight size={14} className="text-[#f59e0b]" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">New CTA</h3>
        </div>
        <p className="text-base font-semibold text-zinc-100 mb-2">
          Claim your 30-day trial today
        </p>
        <div className="text-xs">
          <span className="font-medium text-zinc-500 mr-1.5">Placement:</span>
          <span className="text-zinc-400">Final frame, centered above a high-contrast button. Keep on screen for at least 3 seconds.</span>
        </div>
        <FeedbackRow vote={ctaVote} onVote={setCtaVote} />
      </div>

      {/* Section 4 — Predicted Improvements */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mt-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles size={14} className="text-[#6366f1]" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Predicted Improvements</h3>
        </div>
        
        <div className="border border-white/[0.04] bg-white/[0.02] p-3 mb-2 rounded-[12px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-300">Hook Rate</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-600">3.2</span>
              <ArrowRight size={10} className="text-zinc-600" />
              <span className="text-xs font-semibold text-emerald-400">7.8</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Stronger emotional resonance in the opening 3 seconds.
          </p>
        </div>

        <div className="border border-white/[0.04] bg-white/[0.02] p-3 mb-2 rounded-[12px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-300">Conversion Rate</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-600">4.5</span>
              <ArrowRight size={10} className="text-zinc-600" />
              <span className="text-xs font-semibold text-emerald-400">6.1</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Clearer value proposition and more urgent CTA.
          </p>
        </div>
      </div>

      {/* Section 5 — Editor Notes */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mt-3">
        <div className="flex items-center gap-1.5 mb-3">
          <MessageCircle size={14} className="text-zinc-500" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Editor Notes</h3>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-zinc-600 shrink-0 mt-1.5"></div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ensure text overlays have sufficient contrast against the background video.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-zinc-600 shrink-0 mt-1.5"></div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Time the bullet points to appear sequentially with the voiceover.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-zinc-600 shrink-0 mt-1.5"></div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use a punchy sound effect when the new CTA appears.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}