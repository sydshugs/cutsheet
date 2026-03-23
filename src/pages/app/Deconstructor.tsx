// src/pages/app/Deconstructor.tsx — Winning Ad Deconstructor

import { useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ScanSearch, Link2, ChevronDown, Copy, Check, RotateCcw, Bookmark,
  ExternalLink, AlertCircle, Upload,
} from "lucide-react";
import {
  detectSourceType,
  deconstructAd,
  parseTeardownSections,
  getSourceLabel,
  type SourceType,
  type DeconstructResult,
  type TeardownSection,
} from "../../lib/deconstructorService";
import { InlineError } from "../../components/InlineError";
import type { AppSharedContext } from "../../components/AppLayout";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<SourceType, string> = {
  meta: "#1877F2",
  tiktok: "#69C9D0",
  youtube: "#FF0000",
};

const SOURCE_ICONS: Record<SourceType, string> = {
  meta: "f",
  tiktok: "tt",
  youtube: "▶",
};

// The "Your Brief" section gets distinct dark styling
const BRIEF_TITLE = "Your Brief";

// ─── URL INPUT ────────────────────────────────────────────────────────────────

function UrlInput({
  onSubmit,
  loading,
}: {
  onSubmit: (url: string, sourceType: SourceType) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlError("Paste a URL to get started.");
      return;
    }
    const sourceType = detectSourceType(trimmed);
    if (!sourceType) {
      setUrlError(
        "Paste a valid Meta Ad Library, TikTok Creative Center, or YouTube URL."
      );
      return;
    }
    setUrlError(null);
    onSubmit(trimmed, sourceType);
  }, [url, onSubmit]);

  const handleKeyDown = (e: { key: string }) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="flex gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/[0.03]"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center pl-3 shrink-0 text-zinc-500">
          <Link2 size={16} />
        </div>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) setUrlError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a Meta Ad Library, TikTok Creative Center, or YouTube URL"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 py-2.5 min-w-0"
          disabled={loading}
          autoFocus
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#f59e0b" }}
          onMouseEnter={(e) => {
            if (!loading && url.trim())
              e.currentTarget.style.background = "#d97706";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f59e0b";
          }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Deconstruct"
          )}
        </button>
      </div>

      {urlError && (
        <p className="text-xs text-red-400 mt-2 pl-1 flex items-center gap-1.5">
          <AlertCircle size={12} />
          {urlError}
        </p>
      )}

      {/* Supported sources */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {(["meta", "youtube", "tiktok"] as SourceType[]).map((s) => (
          <span
            key={s}
            className="text-xs text-zinc-500 font-mono"
            style={{ color: SOURCE_COLORS[s] + "99" }}
          >
            {getSourceLabel(s)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── TIKTOK FALLBACK ─────────────────────────────────────────────────────────

function TikTokFallback({
  onMediaUrl,
}: {
  onMediaUrl: (url: string) => void;
}) {
  const [embedUrl, setEmbedUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="w-full max-w-2xl mx-auto mt-4 rounded-xl p-4"
      style={{
        background: "rgba(105,201,208,0.05)",
        border: "1px solid rgba(105,201,208,0.15)",
      }}
    >
      <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
        <span style={{ color: "#69C9D0" }} className="font-semibold">
          TikTok
        </span>{" "}
        — TikTok&apos;s API requires manual access. Optionally provide a
        screenshot or embed URL for visual analysis.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={embedUrl}
          onChange={(e) => setEmbedUrl(e.target.value)}
          placeholder="Paste embed/direct image URL (optional)"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-500 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:border-white/20"
        />
        <button
          type="button"
          onClick={() => embedUrl.trim() && onMediaUrl(embedUrl.trim())}
          className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          Use URL
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5"
        >
          <Upload size={12} />
          Screenshot
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            // Convert to object URL for Gemini (server will fetch it as base64)
            const objectUrl = URL.createObjectURL(f);
            onMediaUrl(objectUrl);
          }
        }}
      />
    </div>
  );
}

// ─── LOADING STATE ────────────────────────────────────────────────────────────

function DeconstructingState({ sourceType }: { sourceType: SourceType }) {
  const STAGES = [
    "Fetching ad metadata...",
    "Running visual analysis...",
    "Identifying psychological triggers...",
    "Writing teardown report...",
    "Building your creative brief...",
  ];
  const [stageIdx, setStageIdx] = useState(0);

  useState(() => {
    const interval = setInterval(
      () => setStageIdx((p) => Math.min(p + 1, STAGES.length - 1)),
      3200
    );
    return () => clearInterval(interval);
  });

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative w-16 h-16">
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(99,102,241,0.15)" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: "2px solid transparent", borderTopColor: "#6366f1" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono" style={{ color: SOURCE_COLORS[sourceType] }}>
            {SOURCE_ICONS[sourceType]}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-zinc-300">
          Deconstructing {getSourceLabel(sourceType)} ad
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={stageIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-zinc-500"
          >
            {STAGES[stageIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === stageIdx ? 16 : 4,
              height: 4,
              background: i <= stageIdx ? "#6366f1" : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── TEARDOWN SECTION ─────────────────────────────────────────────────────────

function TeardownSectionCard({
  section,
  defaultOpen = false,
}: {
  section: TeardownSection;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isBrief = section.title === BRIEF_TITLE;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(section.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: isBrief
          ? "rgba(99,102,241,0.06)"
          : "rgba(255,255,255,0.02)",
        border: isBrief
          ? "1px solid rgba(99,102,241,0.2)"
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {isBrief && (
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#6366f1" }}
            />
          )}
          <span
            className="text-sm font-semibold"
            style={{ color: isBrief ? "#818cf8" : "#f4f4f5" }}
          >
            {section.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isBrief && open && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              {copied ? (
                <>
                  <Check size={11} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={11} />
                  Copy
                </>
              )}
            </button>
          )}
          <ChevronDown
            size={15}
            className="text-zinc-500 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed teardown-content"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              <style>{`
                .teardown-content p { margin: 8px 0; color: rgba(255,255,255,0.7); }
                .teardown-content strong { color: rgba(255,255,255,0.9); font-weight: 600; }
                .teardown-content ul, .teardown-content ol { padding-left: 18px; margin: 8px 0; }
                .teardown-content li { margin: 4px 0; color: rgba(255,255,255,0.65); }
                .teardown-content h3, .teardown-content h4 {
                  font-size: 11px; font-weight: 600; text-transform: uppercase;
                  letter-spacing: 0.08em; color: rgba(255,255,255,0.4);
                  margin: 14px 0 6px;
                }
                .teardown-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 12px 0; }
              `}</style>
              <div className="pt-4">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── WHY IT WORKS CARD ────────────────────────────────────────────────────────

function WhyItWorksCard({ content }: { content: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.25)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#818cf8" }}
        />
        <span
          className="text-xs font-mono font-semibold uppercase tracking-widest"
          style={{ color: "#818cf8" }}
        >
          Why It Works
        </span>
      </div>
      <div className="text-sm text-zinc-300 leading-relaxed">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

// ─── AD META HEADER ───────────────────────────────────────────────────────────

function AdMetaHeader({
  result,
  onReset,
}: {
  result: DeconstructResult;
  onReset: () => void;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      {result.thumbnailUrl && (
        <img
          src={result.thumbnailUrl}
          alt="Ad creative thumbnail"
          className="w-16 h-16 rounded-xl object-cover shrink-0"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded-full"
            style={{
              background: SOURCE_COLORS[result.sourceType] + "15",
              color: SOURCE_COLORS[result.sourceType],
              border: `1px solid ${SOURCE_COLORS[result.sourceType]}30`,
            }}
          >
            {getSourceLabel(result.sourceType)}
          </span>
        </div>
        <p className="text-sm font-medium text-zinc-200 truncate">
          {result.adTitle}
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="shrink-0 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
        title="Analyze another ad"
      >
        <RotateCcw size={13} />
        <span className="hidden sm:inline">New</span>
      </button>
    </div>
  );
}

// ─── RESULTS PANEL ────────────────────────────────────────────────────────────

function ResultsPanel({
  result,
  onReset,
  onSaveToSwipeFile,
}: {
  result: DeconstructResult;
  onReset: () => void;
  onSaveToSwipeFile: () => void;
}) {
  const sections = parseTeardownSections(result.teardown);
  const whySection = sections.find((s) => s.title === "Why This Ad Works");
  const otherSections = sections.filter((s) => s.title !== "Why This Ad Works");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <AdMetaHeader result={result} onReset={onReset} />

      {/* Why It Works — always open, prominent */}
      {whySection && (
        <div className="mb-4">
          <WhyItWorksCard content={whySection.content} />
        </div>
      )}

      {/* Remaining sections — collapsible */}
      <div className="flex flex-col gap-2">
        {otherSections.map((section, i) => (
          <TeardownSectionCard
            key={section.title}
            section={section}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-6">
        <button
          type="button"
          onClick={onSaveToSwipeFile}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all"
        >
          <Bookmark size={14} />
          Save to Library
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 border border-white/[0.06] bg-transparent hover:bg-white/[0.03] hover:text-zinc-300 transition-all"
        >
          <RotateCcw size={14} />
          Analyze Another
        </button>
      </div>

      {/* Powered by */}
      <p className="text-center text-[11px] text-zinc-700 font-mono mt-8 mb-4">
        Powered by Gemini + Claude Sonnet
      </p>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Deconstructor() {
  const { addSwipeItem, onUpgradeRequired, isPro } =
    useOutletContext<AppSharedContext>();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeconstructResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<SourceType | null>(null);
  const [tiktokMediaUrl, setTikTokMediaUrl] = useState<string | null>(null);
  const [infoToast, setInfoToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setInfoToast(msg);
    setTimeout(() => setInfoToast(null), 2500);
  };

  const handleSubmit = useCallback(
    async (url: string, sourceType: SourceType, mediaUrl?: string) => {
      setError(null);
      setResult(null);

      // If TikTok with no media yet, prompt the fallback
      if (sourceType === "tiktok" && !mediaUrl && !tiktokMediaUrl) {
        setPendingUrl(url);
        setPendingSource(sourceType);
        return;
      }

      setLoading(true);
      try {
        const data = await deconstructAd(
          url,
          sourceType,
          mediaUrl ?? tiktokMediaUrl ?? undefined
        );
        setResult(data);
        setPendingUrl(null);
        setPendingSource(null);
        setTikTokMediaUrl(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        if (msg.startsWith("RATE_LIMITED:")) {
          const wait = msg.replace("RATE_LIMITED:", "");
          setError(
            isPro
              ? `Rate limit reached — try again in ${wait}.`
              : `You've used all 3 free deconstructions today. Try again in ${wait} or upgrade to Pro for unlimited.`
          );
          if (!isPro) onUpgradeRequired("deconstruct");
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [tiktokMediaUrl, isPro, onUpgradeRequired]
  );

  const handleTikTokMediaUrl = (url: string) => {
    setTikTokMediaUrl(url);
    if (pendingUrl && pendingSource) {
      handleSubmit(pendingUrl, pendingSource, url);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPendingUrl(null);
    setPendingSource(null);
    setTikTokMediaUrl(null);
  };

  const handleSaveToSwipeFile = () => {
    if (!result) return;
    addSwipeItem({
      fileName: result.adTitle,
      timestamp: new Date().toISOString(),
      scores: null,
      markdown: result.teardown,
      brand: "",
      format: "video",
      niche: "",
      platform: result.sourceType,
      tags: ["deconstruction"],
      notes: "",
    });
    showToast("Saved to your library");
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-auto"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      <Helmet>
        <title>Ad Breakdown — Cutsheet</title>
        <meta
          name="description"
          content="Paste any ad URL. Get a full teardown: hook analysis, psychological triggers, structure breakdown, and a ready-to-use creative brief."
        />
        <link
          rel="canonical"
          href="https://cutsheet.xyz/app/deconstructor"
        />
      </Helmet>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[700px] h-[500px] rounded-full bg-amber-500/[0.04] blur-[140px]" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 md:py-14">
        {/* Header — visible until result */}
        {!result && (
          <div className="text-center mb-8">
            <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ScanSearch size={28} color="#f59e0b" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginBottom: 0 }}>
              Ad Breakdown
            </h1>
            <p className="text-sm text-zinc-500 max-w-md mx-auto" style={{ marginTop: 10, lineHeight: 1.6 }}>
              Paste any ad URL. Get a full AI breakdown in 30 seconds.
            </p>

            {/* Feature pills — amber styled */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
              {["Hook analysis", "Psychological triggers", "Creative brief"].map((p) => (
                <span key={p} style={{ fontSize: 12, color: "#fbbf24", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 9999, padding: "4px 12px" }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* URL input — always show unless loading or result */}
        {!result && (
          <UrlInput
            onSubmit={(url, sourceType) => handleSubmit(url, sourceType)}
            loading={loading}
          />
        )}

        {/* TikTok fallback prompt */}
        {!loading && !result && pendingSource === "tiktok" && (
          <TikTokFallback onMediaUrl={handleTikTokMediaUrl} />
        )}

        {/* Loading */}
        {loading && pendingSource && (
          <DeconstructingState sourceType={pendingSource} />
        )}
        {loading && !pendingSource && (
          <DeconstructingState sourceType="youtube" />
        )}

        {/* Error */}
        {error && !loading && (
          <div className="w-full max-w-2xl mx-auto mt-6">
            <InlineError
              severity="red"
              message={error}
              dismissible
              onDismiss={() => setError(null)}
              primaryAction={
                error.includes("3 free") || error.includes("Rate limit")
                  ? undefined
                  : { label: "Try again", onClick: handleReset }
              }
            />
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="w-full">
            <ResultsPanel
              result={result}
              onReset={handleReset}
              onSaveToSwipeFile={handleSaveToSwipeFile}
            />
          </div>
        )}

        {/* Result: show URL input below for new analysis */}
        {result && !loading && (
          <div className="w-full max-w-2xl mx-auto mt-8 pt-8 border-t border-white/[0.04]">
            <p className="text-xs text-zinc-500 text-center mb-4">
              Deconstruct another ad
            </p>
            <UrlInput
              onSubmit={(url, sourceType) => handleSubmit(url, sourceType)}
              loading={false}
            />
          </div>
        )}
      </div>

      {/* Toast */}
      {infoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]"
        >
          {infoToast}
        </div>
      )}
    </div>
  );
}
