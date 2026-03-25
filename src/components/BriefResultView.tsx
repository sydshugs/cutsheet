import { useState, useMemo } from "react";
import { Copy, Check, ArrowLeft, Target, Users, Lightbulb, MessageSquare, Shield, MousePointer, ThumbsUp, ThumbsDown, Palette, ChevronRight, Sparkles } from "lucide-react";

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

// ─── Section categorization ─────────────────────────────────────────
type SectionCategory = "strategy" | "creative" | "execution";

function getCategory(label: string): SectionCategory {
  const lower = label.toLowerCase();
  if (/objective|target|audience/i.test(lower)) return "strategy";
  if (/hook|format|key\s*message|cta|call/i.test(lower)) return "creative";
  return "execution";
}

function getCategoryColor(cat: SectionCategory) {
  switch (cat) {
    case "strategy": return { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" };
    case "creative": return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
    case "execution": return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
  }
}

function getCategoryLabel(cat: SectionCategory) {
  switch (cat) {
    case "strategy": return "Strategy";
    case "creative": return "Creative";
    case "execution": return "Execution";
  }
}

// ─── Icon mapping ───────────────────────────────────────────────────
function getSectionIcon(label: string) {
  const lower = label.toLowerCase();
  if (/objective/i.test(lower)) return Target;
  if (/audience|target/i.test(lower)) return Users;
  if (/hook/i.test(lower)) return Lightbulb;
  if (/format/i.test(lower)) return Palette;
  if (/key\s*message/i.test(lower)) return MessageSquare;
  if (/proof/i.test(lower)) return Shield;
  if (/cta|call/i.test(lower)) return MousePointer;
  if (/^do$/i.test(lower)) return ThumbsUp;
  if (/don'?t/i.test(lower)) return ThumbsDown;
  return Sparkles;
}

// ─── Helpers ────────────────────────────────────────────────────────
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
      className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
      aria-label="Copy section"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Category filter pills ──────────────────────────────────────────
function CategoryPills({ 
  activeFilter, 
  onFilterChange, 
  counts 
}: { 
  activeFilter: SectionCategory | "all"; 
  onFilterChange: (filter: SectionCategory | "all") => void;
  counts: Record<SectionCategory | "all", number>;
}) {
  const filters: (SectionCategory | "all")[] = ["all", "strategy", "creative", "execution"];
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => {
        const isActive = activeFilter === filter;
        const colors = filter === "all" 
          ? { bg: "bg-white/5", text: "text-zinc-300", border: "border-white/10" }
          : getCategoryColor(filter);
        
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-150 cursor-pointer
              ${isActive 
                ? `${colors.bg} ${colors.text} ${colors.border}` 
                : "bg-transparent border-white/[0.06] text-zinc-500 hover:text-zinc-400 hover:border-white/10"
              }
            `}
          >
            <span className="capitalize">{filter === "all" ? "All" : getCategoryLabel(filter)}</span>
            <span className={`
              text-[10px] font-mono px-1.5 py-0.5 rounded-full
              ${isActive ? "bg-white/10" : "bg-white/5"}
            `}>
              {counts[filter]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Section card renderers ─────────────────────────────────────────
function sectionText(sec: BriefSection): string {
  if (sec.items?.length) return sec.items.join("\n");
  return sec.content ?? "";
}

function SectionCard({ sec, expanded, onToggle }: { sec: BriefSection; expanded: boolean; onToggle: () => void }) {
  const category = getCategory(sec.label);
  const categoryColors = getCategoryColor(category);
  const Icon = getSectionIcon(sec.label);
  
  const hasItems = (sec.items?.length ?? 0) > 0;
  const isExpandable = hasItems || (sec.content && sec.content.length > 150);
  const contentPreview = sec.content && sec.content.length > 150 && !expanded
    ? sec.content.slice(0, 150) + "..."
    : sec.content;

  return (
    <div 
      className={`
        bg-[#18181b] border border-white/[0.06] rounded-xl overflow-hidden
        hover:border-white/[0.1] transition-all duration-150 group
      `}
    >
      {/* Card Header */}
      <div 
        className={`
          flex items-center justify-between px-4 py-3
          ${isExpandable ? "cursor-pointer" : ""}
        `}
        onClick={isExpandable ? onToggle : undefined}
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${categoryColors.bg} ${categoryColors.border} border
          `}>
            <Icon className={`w-4 h-4 ${categoryColors.text}`} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-zinc-100 leading-tight">
              {sec.label}
            </span>
            <span className={`
              text-[10px] font-medium uppercase tracking-wider
              ${categoryColors.text}
            `}>
              {getCategoryLabel(category)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <CopyButton text={sectionText(sec)} />
          {isExpandable && (
            <ChevronRight 
              className={`
                w-4 h-4 text-zinc-500 transition-transform duration-200
                ${expanded ? "rotate-90" : ""}
              `} 
            />
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className={`
        px-4 pb-4 pt-0
        ${!expanded && isExpandable ? "max-h-24 overflow-hidden relative" : ""}
      `}>
        {/* Gradient fade for collapsed state */}
        {!expanded && isExpandable && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#18181b] to-transparent pointer-events-none" />
        )}
        
        {isHook(sec.label) && sec.items?.length ? (
          <div className="flex flex-col gap-2">
            {sec.items.map((item, j) => (
              <div 
                key={j} 
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="
                  w-5 h-5 rounded-full bg-amber-500/15 text-amber-400
                  flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5
                ">
                  {j + 1}
                </span>
                <span className="text-[13px] text-zinc-300 leading-relaxed">
                  {item.replace(/^\d+\.\s*/, "")}
                </span>
              </div>
            ))}
          </div>
        ) : isProofPoints(sec.label) && sec.items?.length ? (
          <div className="flex flex-col gap-2">
            {sec.items.map((item, j) => (
              <div 
                key={j} 
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-[13px] text-zinc-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        ) : isDo(sec.label) && sec.items?.length ? (
          <div className="flex flex-col gap-2">
            {sec.items.map((item, j) => (
              <div 
                key={j} 
                className="flex items-start gap-3 p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-[13px] text-zinc-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        ) : isDont(sec.label) && sec.items?.length ? (
          <div className="flex flex-col gap-2">
            {sec.items.map((item, j) => (
              <div 
                key={j} 
                className="flex items-start gap-3 p-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/10"
              >
                <span className="w-4 h-4 flex items-center justify-center text-red-400 shrink-0 mt-0.5 text-sm font-bold">×</span>
                <span className="text-[13px] text-zinc-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-zinc-300 leading-relaxed">
            {contentPreview ?? ""}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────
export function BriefResultView({ sections, platform, adFormat, onBack }: BriefResultViewProps) {
  const [fullCopied, setFullCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SectionCategory | "all">("all");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  // Calculate counts for filter pills
  const counts = useMemo(() => {
    const result: Record<SectionCategory | "all", number> = { all: sections.length, strategy: 0, creative: 0, execution: 0 };
    sections.forEach(sec => {
      result[getCategory(sec.label)]++;
    });
    return result;
  }, [sections]);

  // Filter sections based on active filter
  const filteredSections = useMemo(() => {
    if (activeFilter === "all") return sections;
    return sections.filter(sec => getCategory(sec.label) === activeFilter);
  }, [sections, activeFilter]);

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

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
    <div className="flex flex-col h-full bg-[#09090b]">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Scores
          </button>

          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {platform} · {adFormat}
          </span>
        </div>
        
        {/* Title row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Creative Brief</h2>
            <p className="text-[11px] text-zinc-500">AI-generated strategy & direction</p>
          </div>
        </div>

        {/* Filter pills */}
        <CategoryPills 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      </div>

      {/* ── Cards ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {filteredSections.map((sec, i) => {
          const originalIndex = sections.indexOf(sec);
          return (
            <SectionCard 
              key={originalIndex} 
              sec={sec} 
              expanded={expandedSections.has(originalIndex)}
              onToggle={() => toggleSection(originalIndex)}
            />
          );
        })}
        
        {filteredSections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-zinc-500">No sections in this category</p>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={handleCopyAll}
          className="w-full py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {fullCopied ? (
            <>
              <Check className="w-4 h-4" />
              Copied to Clipboard
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Full Brief
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
    content: "Drive immediate conversions for Bawdee's vaginal health probiotics by creating urgency around solving an intimate health problem that women are actively seeking solutions for.",
  },
  {
    label: "Target Audience",
    content: "Health-conscious women aged 25-45 who experience recurring vaginal health issues (UTIs, yeast infections, pH imbalance), value scientific backing, and are willing to invest in premium supplements.",
  },
  {
    label: "Key Message",
    content: "Finally, a gynaecologist-recommended solution that actually works for down-there health, backed by science and proven by thousands of women.",
  },
  {
    label: "Hook Direction",
    items: [
      "Problem-focused: Split screen showing \"Before: Constant worry\" vs \"After: Confident, comfortable you\"",
      "Social proof: \"Why 50,000+ women switched to Bawdee after trying everything else\"",
      "Urgency-driven: \"The gynaecologist-recommended probiotic that sold out 3x this year\"",
    ],
  },
  {
    label: "Format",
    content: "UGC testimonial with split-screen lifestyle moments — this format builds trust through real women sharing vulnerable health wins, which is essential for intimate health products.",
  },
  {
    label: "Proof Points",
    items: [
      "32.5 Billion CFU clinically-proven strains",
      "Recommended by gynaecologists",
      "50,000+ satisfied customers",
      "Sold out 3x in 2024",
    ],
  },
  {
    label: "CTA",
    content: "\"Get Bawdee Now\" positioned prominently in contrasting color (bright coral/orange) in bottom third, with urgency text \"Limited stock - order today\" directly below.",
  },
  {
    label: "Do",
    items: [
      "Use authentic, relatable women in testimonials",
      "Lead with the problem before introducing the solution",
      "Include specific scientific claims with visual proof",
    ],
  },
  {
    label: "Don't",
    items: [
      "Don't use overly clinical or embarrassing language",
      "Avoid stock photography or staged scenarios",
      "Don't make the ad feel like a pharmaceutical commercial",
    ],
  },
];

export function BriefResultViewPreview() {
  return (
    <div className="w-full max-w-lg h-[780px] mx-auto bg-[#09090b] rounded-2xl border border-white/[0.06] overflow-hidden">
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
