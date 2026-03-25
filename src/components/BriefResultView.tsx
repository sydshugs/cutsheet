import { useState } from "react";
import { Copy, Check, ArrowLeft } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
export interface BriefSection {
  label: string;
  content?: string;
  items?: string[];
}

export interface BriefResultViewProps {
  sections: BriefSection[];
  platform: string;
  adFormat: string;
  onBack: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────
const CARD =
  "bg-[#18181b] border border-white/[0.06] rounded-xl p-4 relative group";
const LABEL =
  "uppercase tracking-[0.08em] text-[11px] text-[#71717a] mb-2 font-medium";
const BODY = "text-[#f4f4f5] text-sm leading-relaxed font-sans";

function isKeyMessage(label: string) {
  return /key\s*message/i.test(label);
}
function isCTA(label: string) {
  return /cta|call.to.action/i.test(label);
}
function isHook(label: string) {
  return /hook/i.test(label);
}
function isProofPoints(label: string) {
  return /proof\s*point/i.test(label);
}
function isDo(label: string) {
  return /^do$/i.test(label);
}
function isDont(label: string) {
  return /^don'?t$/i.test(label);
}

// ─── Copy button (per-card) ─────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
      aria-label="Copy section"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Section card renderers ─────────────────────────────────────────
function sectionText(sec: BriefSection): string {
  if (sec.items?.length) return sec.items.join("\n");
  return sec.content ?? "";
}

function SectionCard({ sec }: { sec: BriefSection }) {
  const leftBorder = isKeyMessage(sec.label)
    ? "border-l-[3px] border-l-[#6366f1]"
    : isCTA(sec.label)
      ? "border-l-[3px] border-l-[#f59e0b]"
      : "";

  return (
    <div className={`${CARD} ${leftBorder}`}>
      <CopyButton text={sectionText(sec)} />
      <p className={LABEL}>{sec.label}</p>

      {isHook(sec.label) && sec.items?.length ? (
        <ol className="flex flex-col gap-1.5 list-none m-0 p-0">
          {sec.items.map((item, j) => (
            <li key={j} className={`${BODY} flex gap-2`}>
              <span className="text-[#71717a] shrink-0 tabular-nums">{j + 1}.</span>
              <span>{item.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ol>
      ) : isProofPoints(sec.label) && sec.items?.length ? (
        <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
          {sec.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 bg-[#71717a]" />
              <span className={BODY}>{item}</span>
            </li>
          ))}
        </ul>
      ) : isDo(sec.label) && sec.items?.length ? (
        <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
          {sec.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 bg-[#10b981]" />
              <span className={BODY}>{item}</span>
            </li>
          ))}
        </ul>
      ) : isDont(sec.label) && sec.items?.length ? (
        <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
          {sec.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 bg-[#ef4444]" />
              <span className={BODY}>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={BODY}>{sec.content ?? ""}</p>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────
export function BriefResultView({ sections, platform, adFormat, onBack }: BriefResultViewProps) {
  const [fullCopied, setFullCopied] = useState(false);

  const handleCopyAll = async () => {
    const full = sections
      .map((s) => {
        const body = s.items?.length ? s.items.join("\n") : (s.content ?? "");
        return `${s.label.toUpperCase()}\n${body}`;
      })
      .join("\n\n");
    await navigator.clipboard.writeText(full);
    setFullCopied(true);
    setTimeout(() => setFullCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Scores
        </button>

        <span className="text-[10px] uppercase tracking-[0.08em] text-[#71717a] font-medium">
          Creative Brief
        </span>

        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {platform} · {adFormat}
        </span>
      </div>

      {/* ── Cards ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
        {sections.map((sec, i) => (
          <SectionCard key={i} sec={sec} />
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={handleCopyAll}
          className="w-full py-2.5 px-4 rounded-lg bg-transparent border border-indigo-500/30 text-indigo-400 text-xs font-medium hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:text-indigo-300 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
        >
          {fullCopied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy Brief
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Mock preview ───────────────────────────────────────────────────
const MOCK_SECTIONS: BriefSection[] = [
  {
    label: "Objective",
    content: "Drive trial sign-ups for the new AI-powered ad analysis tool among performance marketers.",
  },
  {
    label: "Target Audience",
    content: "Growth marketers, media buyers, and creative strategists at DTC brands spending $10k+/mo on paid social.",
  },
  {
    label: "Key Message",
    content: "Stop guessing which ads work — get instant, AI-powered scores and actionable briefs for every creative.",
  },
  {
    label: "Hook Direction",
    items: [
      "Open with a failed ad score to create tension and curiosity",
      "Show the before/after of an ad rewritten with AI guidance",
      "Lead with a bold stat: \"83% of ads fail in the first 3 seconds\"",
    ],
  },
  {
    label: "Proof Points",
    items: [
      "Analyzes 12 creative dimensions in under 30 seconds",
      "Used by 2,400+ brands across Meta, Google, and TikTok",
      "Average 34% improvement in CTR after applying briefs",
    ],
  },
  {
    label: "CTA",
    content: "Analyze your first ad free — no credit card required.",
  },
  {
    label: "Do",
    items: [
      "Use specific numbers and data points",
      "Show the product in action with real ad examples",
      "Emphasize speed and ease of use",
    ],
  },
  {
    label: "Don't",
    items: [
      "Don't use generic stock imagery of people on laptops",
      "Avoid jargon like \"proprietary algorithm\" or \"machine learning\"",
      "Don't make claims you can't back with data",
    ],
  },
  {
    label: "Tone",
    content: "Confident, direct, and data-driven. Avoid hype — let the product speak through results.",
  },
];

export function BriefResultViewPreview() {
  return (
    <div className="w-full max-w-lg h-[720px] mx-auto bg-[#08080f] rounded-2xl border border-white/[0.06] overflow-hidden">
      <BriefResultView
        sections={MOCK_SECTIONS}
        platform="Meta"
        adFormat="Static"
        onBack={() => console.log("Back clicked")}
      />
    </div>
  );
}

export default BriefResultView;
