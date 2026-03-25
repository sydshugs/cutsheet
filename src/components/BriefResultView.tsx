import { useState, useCallback } from "react";
import { Copy, Check, ArrowLeft } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
export interface BriefSection {
  label: string;
  content: string;
  items?: string[];
}

export interface BriefResultViewProps {
  sections: BriefSection[];
  platform: string;
  adFormat: string;
  onBack: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────
type CardAccent = "indigo" | "amber" | "none";

function accentForLabel(label: string): CardAccent {
  const l = label.toLowerCase();
  if (l.includes("key message") || l.includes("core message")) return "indigo";
  if (l.includes("cta") || l.includes("call to action")) return "amber";
  return "none";
}

type BulletStyle = "default" | "green" | "red" | "numbered";

function bulletStyleForLabel(label: string): BulletStyle {
  const l = label.toLowerCase();
  if (l.includes("hook") && l.includes("direction")) return "numbered";
  if (l.includes("don't") || l.includes("dont") || l.includes("avoid")) return "red";
  if (l.includes("do ") || l === "do" || l.includes("do's") || l.includes("dos")) return "green";
  if (l.includes("proof point")) return "default";
  return "default";
}

const accentBorder: Record<CardAccent, string> = {
  indigo: "border-l-[3px] border-l-[#6366f1]",
  amber: "border-l-[3px] border-l-[#f59e0b]",
  none: "",
};

const dotColor: Record<BulletStyle, string> = {
  default: "bg-zinc-500",
  green: "bg-[#10b981]",
  red: "bg-[#ef4444]",
  numbered: "",
};

// ── Copy button ──────────────────────────────────────────────────────
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard API may be blocked */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      className={`text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer ${className ?? ""}`}
      aria-label="Copy section"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

// ── Section card ─────────────────────────────────────────────────────
function SectionCard({ section }: { section: BriefSection }) {
  const accent = accentForLabel(section.label);
  const bullet = section.items ? bulletStyleForLabel(section.label) : "default";

  const plainText = [
    section.content,
    ...(section.items ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div
      className={`relative bg-[#18181b] border border-white/[0.06] rounded-xl p-4 ${accentBorder[accent]}`}
    >
      {/* Copy icon — top right */}
      <CopyButton text={plainText} className="absolute top-3 right-3" />

      {/* Label */}
      <p className="uppercase tracking-widest text-[11px] text-[#71717a] font-medium mb-2 pr-6">
        {section.label}
      </p>

      {/* Body text */}
      {section.content && (
        <p className="text-[#f4f4f5] text-sm leading-relaxed font-[var(--sans)]">
          {section.content}
        </p>
      )}

      {/* Items list */}
      {section.items && section.items.length > 0 && (
        <ul className={`flex flex-col gap-1.5 ${section.content ? "mt-3" : ""}`}>
          {section.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-[#f4f4f5]">
              {bullet === "numbered" ? (
                <span className="text-zinc-500 font-mono text-xs mt-[2px] min-w-[16px]">
                  {idx + 1}.
                </span>
              ) : (
                <span
                  className={`mt-[7px] w-[5px] h-[5px] rounded-full flex-shrink-0 ${dotColor[bullet]}`}
                />
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export function BriefResultView({ sections, platform, adFormat, onBack }: BriefResultViewProps) {
  const [fullCopied, setFullCopied] = useState(false);

  const fullText = sections
    .map((s) => {
      const parts = [s.label.toUpperCase(), s.content];
      if (s.items?.length) parts.push(s.items.map((it, i) => {
        const style = bulletStyleForLabel(s.label);
        return style === "numbered" ? `${i + 1}. ${it}` : `• ${it}`;
      }).join("\n"));
      return parts.filter(Boolean).join("\n");
    })
    .join("\n\n");

  const handleCopyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setFullCopied(true);
      setTimeout(() => setFullCopied(false), 2000);
    } catch {
      /* noop */
    }
  }, [fullText]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
        >
          <ArrowLeft size={12} />
          Back to Scores
        </button>

        <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-medium">
          Creative Brief
        </span>

        <span className="text-[11px] font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-full px-2.5 py-0.5">
          {platform} · {adFormat}
        </span>
      </div>

      {/* ── Cards ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-3">
          {sections.map((section, idx) => (
            <SectionCard key={idx} section={section} />
          ))}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={handleCopyAll}
          className="w-full py-2.5 px-4 bg-transparent border border-indigo-500/25 rounded-xl text-indigo-400 text-xs font-medium hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
        >
          {fullCopied ? (
            <>
              <Check size={13} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={13} />
              Copy Brief
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Mock preview ─────────────────────────────────────────────────────
export const MOCK_BRIEF_SECTIONS: BriefSection[] = [
  {
    label: "Key Message",
    content:
      "Your ad creative isn't broken — your testing process is. Cutsheet gives you AI-powered scoring so you know which creatives will win before you spend.",
  },
  {
    label: "Hook Direction",
    content: "",
    items: [
      "Open on a frustrated media buyer staring at a dashboard full of red metrics",
      "Quick-cut montage of 'winning' ads that actually flopped — reveal the waste",
      "Bold text card: 'What if you could score every ad before launch?'",
    ],
  },
  {
    label: "Proof Points",
    content: "",
    items: [
      "AI scores ads across 12 proven creative dimensions",
      "Average 2.3× ROAS improvement for early adopters",
      "Works with static, video, and carousel formats",
      "Integrates with Meta, TikTok, and Google Ads",
    ],
  },
  {
    label: "Do",
    content: "",
    items: [
      "Lead with the pain of wasted ad spend",
      "Show the scoring UI in action — make it tangible",
      "Use real before/after metrics from beta users",
      "End with a clear, low-friction CTA",
    ],
  },
  {
    label: "Don't",
    content: "",
    items: [
      "Don't oversell AI — keep it grounded and specific",
      "Avoid jargon like 'neural network analysis'",
      "Don't show competitor comparisons directly",
      "Skip generic stock footage of people at laptops",
    ],
  },
  {
    label: "CTA",
    content: "Score your first ad free — no credit card required. See your creative's weak spots in 30 seconds.",
  },
];

export function BriefResultViewPreview() {
  return (
    <div className="w-full max-w-md h-[700px] bg-[#09090b] border border-white/[0.06] rounded-2xl overflow-hidden">
      <BriefResultView
        sections={MOCK_BRIEF_SECTIONS}
        platform="Meta"
        adFormat="Static"
        onBack={() => console.log("Back clicked")}
      />
    </div>
  );
}

export default BriefResultView;
