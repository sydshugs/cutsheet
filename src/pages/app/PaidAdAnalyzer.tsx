// src/pages/app/PaidAdAnalyzer.tsx
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Zap, RotateCcw, Upload, AlertCircle } from "lucide-react";
import { AnalyzerView } from "../../components/AnalyzerView";
import { ScoreCard } from "../../components/ScoreCard";
import { VideoDropzone } from "../../components/VideoDropzone";
import { HistoryDrawer } from "../../components/HistoryDrawer";
import { useVideoAnalyzer } from "../../hooks/useVideoAnalyzer";
import { type HistoryEntry } from "../../hooks/useHistory";
import { useThumbnail } from "../../hooks/useThumbnail";
import {
  downloadMarkdown, copyToClipboard, generateBrief,
  parseImprovements, parseBudget, parseHashtags,
  type AnalysisResult,
} from "../../services/analyzerService";
import {
  generateBriefWithClaude, generateCTARewrites, generateSecondEyeReview,
  generateStaticSecondEye, generateImprovements,
  type SecondEyeResult,
  type StaticSecondEyeResult,
} from "../../services/claudeService";
import { SecondEyePanel } from "../../components/SecondEyePanel";
import { StaticSecondEyePanel } from "../../components/StaticSecondEyePanel";
import { BeforeAfterComparison } from "../../components/BeforeAfterComparison";
import { generateComparison, type ComparisonResult } from "../../services/claudeService";
import { createShare } from "../../services/shareService";
import { checkShareLimit, incrementShareCount } from "../../utils/rateLimiter";
import { getUserContext, formatUserContextBlock } from "../../services/userContextService";
import { generateBudgetRecommendation, type EngineBudgetRecommendation } from "../../services/budgetService";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

const PLATFORMS = ["all", "Meta", "TikTok", "Google", "YouTube"] as const;
const FORMATS = ["video", "static"] as const;
type Platform = (typeof PLATFORMS)[number];
type Format = (typeof FORMATS)[number];

interface PlatformOption {
  value: Platform;
  label: string;
  enabled: boolean;
  note: string | null;
}

const PLATFORM_COMPAT: Record<Format, PlatformOption[]> = {
  video: [
    { value: "all",     label: "All",     enabled: true,  note: null },
    { value: "Meta",    label: "Meta",    enabled: true,  note: null },
    { value: "TikTok",  label: "TikTok",  enabled: true,  note: null },
    { value: "Google",  label: "Google",  enabled: true,  note: null },
    { value: "YouTube", label: "YouTube", enabled: true,  note: null },
  ],
  static: [
    { value: "all",     label: "All",     enabled: true,  note: null },
    { value: "Meta",    label: "Meta",    enabled: true,  note: null },
    { value: "TikTok",  label: "TikTok",  enabled: false, note: "Carousel only — uncommon" },
    { value: "Google",  label: "Google",  enabled: true,  note: null },
    { value: "YouTube", label: "YouTube", enabled: false, note: "Not available for static ads" },
  ],
};

const STATUS_COPY = {
  uploading: "Reading video...",
  processing: "Gemini is analyzing your creative...",
  complete: "Analysis complete",
  error: "Something went wrong",
  idle: "",
} as const;

// ─── INTENT HEADER ────────────────────────────────────────────────────────────

function IntentHeader({
  platform, setPlatform, format, setFormat,
  secondEye, setSecondEye,
  staticSecondEye, setStaticSecondEye,
}: {
  platform: Platform; setPlatform: (p: Platform) => void;
  format: Format; setFormat: (f: Format) => void;
  secondEye: boolean; setSecondEye: (v: boolean) => void;
  staticSecondEye: boolean; setStaticSecondEye: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        padding: "12px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#52525b", flexShrink: 0 }}>Analyzing for:</span>

        {/* Platform pills — radio group with accessibility */}
        <div role="radiogroup" aria-label="Platform selector" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PLATFORM_COMPAT[format].map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={platform === opt.value && opt.enabled}
              aria-disabled={!opt.enabled || undefined}
              aria-label={!opt.enabled && opt.note ? `${opt.label} — ${opt.note}` : opt.label}
              tabIndex={!opt.enabled ? -1 : undefined}
              onClick={() => { if (opt.enabled) setPlatform(opt.value); }}
              title={opt.note ?? undefined}
              style={{
                height: 30, padding: "0 12px", borderRadius: 9999, fontSize: 13,
                cursor: opt.enabled ? "pointer" : "not-allowed",
                opacity: opt.enabled ? 1 : 0.35,
                background: platform === opt.value && opt.enabled ? "#4f46e5" : "rgba(255,255,255,0.04)",
                border: `1px solid ${platform === opt.value && opt.enabled ? "#4f46e5" : "rgba(255,255,255,0.08)"}`,
                color: platform === opt.value && opt.enabled ? "white" : "#71717a",
                fontWeight: platform === opt.value && opt.enabled ? 500 : 400,
                transition: "all 150ms",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* Format pills */}
        <div role="radiogroup" aria-label="Format selector" style={{ display: "flex", gap: 6 }}>
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={format === f}
              onClick={() => {
                setFormat(f);
                if (f === "static" && (platform === "YouTube" || platform === "TikTok")) {
                  setPlatform("all");
                }
              }}
              style={{
                height: 30, padding: "0 12px", borderRadius: 9999, fontSize: 13, cursor: "pointer",
                background: format === f ? "#4f46e5" : "rgba(255,255,255,0.04)",
                border: `1px solid ${format === f ? "#4f46e5" : "rgba(255,255,255,0.08)"}`,
                color: format === f ? "white" : "#71717a",
                fontWeight: format === f ? 500 : 400,
                transition: "all 150ms",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Second Eye toggle — video only */}
      {format === "video" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 13, color: "#a1a1aa" }}>Second Eye</span>
            {secondEye && (
              <span style={{ fontSize: 11, color: "#52525b" }}>Fresh first-time viewer perspective</span>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={secondEye}
            onClick={() => setSecondEye(!secondEye)}
            style={{
              width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
              background: secondEye ? "#6366f1" : "#27272a",
              position: "relative", transition: "background 200ms", flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%", background: "white",
                left: secondEye ? 20 : 2, transition: "left 200ms cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </button>
        </div>
      )}

      {/* Design Review toggle — static only */}
      {format === "static" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 13, color: "#a1a1aa" }}>Design Review</span>
            {staticSecondEye && (
              <span style={{ fontSize: 11, color: "#52525b" }}>Typography & layout check</span>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={staticSecondEye}
            onClick={() => setStaticSecondEye(!staticSecondEye)}
            style={{
              width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
              background: staticSecondEye ? "#6366f1" : "#27272a",
              position: "relative", transition: "background 200ms", flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%", background: "white",
                left: staticSecondEye ? 20 : 2, transition: "left 200ms cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function PaidEmptyState({
  onFileSelect, onUrlSubmit,
}: {
  onFileSelect: (f: File | null) => void;
  onUrlSubmit?: (url: string) => void;
}) {
  const PILLS = ["Hook strength", "CTA score", "Budget recommendation"];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", minHeight: "calc(100vh - 120px)" }}>
      {/* Icon */}
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Zap size={28} color="#6366f1" fill="rgba(99,102,241,0.3)" />
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginTop: 20, marginBottom: 0 }}>
        Score your paid ad
      </h2>
      <p style={{ fontSize: 14, color: "#71717a", textAlign: "center", maxWidth: 320, marginTop: 10, lineHeight: 1.6 }}>
        Upload a video or static creative. Get a full AI breakdown in 30 seconds.
      </p>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
        {PILLS.map((pill) => (
          <span key={pill} style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 9999, padding: "4px 12px" }}>
            {pill}
          </span>
        ))}
      </div>

      {/* Dropzone */}
      <div style={{ width: "100%", maxWidth: 520, marginTop: 32 }}>
        <VideoDropzone onFileSelect={onFileSelect} file={null} onUrlSubmit={onUrlSubmit} acceptImages />
      </div>
      <p style={{ fontSize: 11, color: "#52525b", marginTop: 12 }} className="hidden md:block">or press &#8984;K</p>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PaidAdAnalyzer() {
  const {
    addHistoryEntry, historyEntries, deleteHistoryEntry, clearAllHistory,
    addSwipeItem, canAnalyze, isPro, increment, FREE_LIMIT,
    onUpgradeRequired, registerCallbacks,
  } = useOutletContext<AppSharedContext>();
  const navigate = useNavigate();

  // ── User context for personalized AI ──────────────────────────────────────
  const [userContext, setUserContext] = useState<string>('')
  useEffect(() => {
    getUserContext().then(ctx => setUserContext(formatUserContextBlock(ctx)))
  }, [])

  // ── Platform / format / second eye state ───────────────────────────────────
  const [platform, setPlatform] = useState<Platform>("all");
  const [format, setFormat] = useState<Format>("video");
  const [secondEye, setSecondEye] = useState(false);
  const [secondEyeOutput, setSecondEyeOutput] = useState<SecondEyeResult | null>(null);
  const [secondEyeLoading, setSecondEyeLoading] = useState(false);
  const [staticSecondEye, setStaticSecondEye] = useState(false);
  const [staticSecondEyeResult, setStaticSecondEyeResult] = useState<StaticSecondEyeResult | null>(null);
  const [staticSecondEyeLoading, setStaticSecondEyeLoading] = useState(false);
  const [engineBudget, setEngineBudget] = useState<EngineBudgetRecommendation | null>(null);
  // ── Before/After re-analysis state
  const [reanalyzeMode, setReanalyzeMode] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [originalScoresSnapshot, setOriginalScoresSnapshot] = useState<{ overall: number; hook: number; cta: number; clarity: number; production: number } | null>(null);
  const [originalImprovementsSnapshot, setOriginalImprovementsSnapshot] = useState<string[]>([]);

  // ── Local analyzer state ───────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState<HistoryEntry | null>(null);
  const [rightTab, setRightTab] = useState<"analysis" | "brief">("analysis");
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const [ctaRewrites, setCtaRewrites] = useState<string[] | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [infoToast, setInfoToast] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);

  const [improvementsLoading, setImprovementsLoading] = useState(false);
  const [platformImprovements, setPlatformImprovements] = useState<string[] | null>(null);
  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const prevPlatformRef = useRef<Platform>(platform);

  const { status, statusMessage, result, error, analysisError, analyze, download, copy, reset } = useVideoAnalyzer();
  const thumbnailDataUrl = useThumbnail(file);

  const isAnalyzing = status === "uploading" || status === "processing";

  // ── Register TopBar callbacks ──────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setFile(null);
    setLoadedEntry(null);
    reset();
    setBrief(null);
    setBriefError(null);
    setBriefLoading(false);
    setCtaRewrites(null);
    setCtaLoading(false);
    setRightTab("analysis");
    setSecondEyeOutput(null);
    setSecondEyeLoading(false);
    setStaticSecondEyeResult(null);
    setStaticSecondEyeLoading(false);
    setEngineBudget(null);
    setReanalyzeMode(false);
    setComparisonResult(null);
    setComparisonLoading(false);
    setOriginalScoresSnapshot(null);
    setOriginalImprovementsSnapshot([]);
  }, [reset]);

  // Re-analyze handler: upload improved version, score, compare
  const handleReanalyze = async (improvedFile: File) => {
    if (!activeResult?.scores) return;
    // Snapshot original scores before overwriting
    if (!originalScoresSnapshot) {
      setOriginalScoresSnapshot({ ...activeResult.scores });
      setOriginalImprovementsSnapshot(activeResult.improvements ?? []);
    }
    setComparisonLoading(true);
    setComparisonResult(null);
    try {
      const improvedResult = await analyze(improvedFile, API_KEY, contextPrefix, userContext || undefined);
      // Now generate comparison
      if (improvedResult?.scores && originalScoresSnapshot) {
        const comp = await generateComparison(
          originalScoresSnapshot,
          improvedResult.scores,
          originalImprovementsSnapshot,
          userContext || undefined
        );
        setComparisonResult(comp);
      }
    } catch (err) {
      console.error("Re-analysis failed:", err);
    } finally {
      setComparisonLoading(false);
    }
  };


  // ── Build context prefix for Gemini prompt ────────────────────────────────
  const contextPrefix =
    platform !== "all"
      ? `Analyzing as ${format} ad for ${platform}.\nScore and optimize specifically for ${platform} performance.\nApply ${platform}-specific improvement suggestions.`
      : undefined;

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "complete") setAnalysisCompletedAt(new Date());
  }, [status]);

  // Compute budget recommendation from engine when analysis completes
  useEffect(() => {
    if (status === "complete" && result?.scores) {
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || 'Other';
      const budget = generateBudgetRecommendation(
        result.scores.overall,
        platform,
        niche,
        format
      );
      setEngineBudget(budget);
    }
  }, [status, result, platform, format, userContext]);

  useEffect(() => {
    if (status === "complete" && result) {
      const key = `${result.fileName}-${result.timestamp.toISOString()}`;
      if (lastSavedRef.current !== key) {
        lastSavedRef.current = key;
        addHistoryEntry({
          fileName: result.fileName,
          timestamp: result.timestamp.toISOString(),
          scores: result.scores,
          markdown: result.markdown,
          thumbnailDataUrl: thumbnailDataUrl ?? undefined,
        });
        const newCount = increment();
        if (newCount >= FREE_LIMIT && !isPro) onUpgradeRequired();
      }
    }
  }, [status, result, addHistoryEntry, increment, isPro, FREE_LIMIT, onUpgradeRequired, thumbnailDataUrl]);

  // Second Eye trigger: fires when analysis completes and secondEye is on
  useEffect(() => {
    if (status === "complete" && result && secondEye) {
      if (secondEyeLoading) return;
      const run = async () => {
        setSecondEyeLoading(true);
        setSecondEyeOutput(null);
        try {
          const output = await generateSecondEyeReview(
            result.markdown,
            result.fileName,
            result.scores ? { hook: result.scores.hook, overall: result.scores.overall } : undefined,
            result.improvements,
            userContext || undefined
          );
          setSecondEyeOutput(output);
        } catch (err) {
          console.error('Second Eye failed:', err);
          setSecondEyeOutput(null);
        } finally {
          setSecondEyeLoading(false);
        }
      };
      run();
    }
  }, [status, result, secondEye]); // eslint-disable-line

  // Static Second Eye trigger: fires when analysis completes and staticSecondEye is on
  useEffect(() => {
    if (status === "complete" && result && staticSecondEye && format === "static") {
      if (staticSecondEyeLoading) return;
      const run = async () => {
        setStaticSecondEyeLoading(true);
        setStaticSecondEyeResult(null);
        try {
          const output = await generateStaticSecondEye(
            result.markdown,
            result.fileName,
            result.scores ? { overall: result.scores.overall, cta: result.scores.cta } : undefined,
            result.improvements,
            userContext || undefined
          );
          setStaticSecondEyeResult(output);
        } catch (err) {
          console.error('Static Second Eye failed:', err);
          setStaticSecondEyeResult(null);
        } finally {
          setStaticSecondEyeLoading(false);
        }
      };
      run();
    }
  }, [status, result, staticSecondEye, format]); // eslint-disable-line

  // Platform switch: re-generate improvements when platform changes after analysis
  useEffect(() => {
    if (prevPlatformRef.current === platform) return;
    prevPlatformRef.current = platform;
    if (status !== "complete" || !result?.markdown || !result?.scores) return;

    setImprovementsLoading(true);
    generateImprovements(result.markdown, result.scores, userContext || undefined, platform)
      .then((imps) => { setPlatformImprovements(imps); })
      .catch(() => { setPlatformImprovements(null); })
      .finally(() => setImprovementsLoading(false));
  }, [platform]); // eslint-disable-line

  useEffect(() => {
    if (status === "uploading") {
      setLoadedEntry(null);
      setPlatformImprovements(null);
      setBrief(null);
      setBriefError(null);
      setRightTab("analysis");
      setSecondEyeOutput(null);
      setStaticSecondEyeResult(null);
    }
  }, [status]);

  // ── Format mismatch detection ──────────────────────────────────────────
  const [formatMismatch, setFormatMismatch] = useState<"video_as_static" | "static_as_video" | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileWithFormatCheck = useCallback((f: File | null) => {
    if (!f) { handleReset(); return; }
    setFormatMismatch(null);
    setPendingFile(null);

    const fileIsVideo = f.type.startsWith("video/") || [".mp4", ".mov", ".webm"].some(e => f.name.toLowerCase().endsWith(e));
    const fileIsImage = f.type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].some(e => f.name.toLowerCase().endsWith(e));

    if (format === "video" && fileIsImage) {
      setFormatMismatch("static_as_video");
      setPendingFile(f);
      return;
    }
    if (format === "static" && fileIsVideo) {
      setFormatMismatch("video_as_static");
      setPendingFile(f);
      return;
    }
    setFile(f);
    reset();
  }, [format, handleReset, reset]);

  const handleFormatSwitch = useCallback(() => {
    if (!pendingFile) return;
    const newFormat = formatMismatch === "static_as_video" ? "static" : "video";
    setFormat(newFormat as Format);
    if (newFormat === "static" && (platform === "YouTube" || platform === "TikTok")) {
      setPlatform("all");
    }
    setFormatMismatch(null);
    setFile(pendingFile);
    setPendingFile(null);
    reset();
  }, [pendingFile, formatMismatch, platform]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!file || isAnalyzing || !canAnalyze) return;
    await analyze(file, API_KEY, contextPrefix, userContext || undefined);
  }, [file, isAnalyzing, canAnalyze, analyze, contextPrefix]);

  useEffect(() => {
    if (file && status === "idle" && canAnalyze) {
      handleAnalyze();
    }
  }, [file]); // eslint-disable-line

  // ── Derived ───────────────────────────────────────────────────────────────
  const liveResult: AnalysisResult | null = result
    ? { ...result, thumbnailDataUrl: thumbnailDataUrl ?? result.thumbnailDataUrl }
    : result;

  const activeResult: AnalysisResult | null = loadedEntry
    ? {
        markdown: loadedEntry.markdown,
        scores: loadedEntry.scores,
        improvements: parseImprovements(loadedEntry.markdown),
        budget: parseBudget(loadedEntry.markdown),
        hashtags: parseHashtags(loadedEntry.markdown),
        thumbnailDataUrl: loadedEntry.thumbnailDataUrl,
        fileName: loadedEntry.fileName,
        timestamp: new Date(loadedEntry.timestamp),
      }
    : liveResult;

  const effectiveStatus = loadedEntry ? ("complete" as const) : status;
  const showRightPanel = effectiveStatus === "complete" && activeResult !== null;

  // Report hasResult to TopBar via AppLayout
  useEffect(() => {
    registerCallbacks({
      onNewAnalysis: handleReset,
      onHistoryOpen: () => setHistoryOpen(true),
      hasResult: showRightPanel,
    });
  }, [registerCallbacks, handleReset, showRightPanel]);

  const handleCopy = async () => {
    if (activeResult) await copyToClipboard(activeResult.markdown);
    else await copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (activeResult) downloadMarkdown(activeResult);
    else download();
  };
  void handleDownload;

  const handleExportPdf = async () => {
    setInfoToast("PDF export coming soon — we're working on it.");
    setTimeout(() => setInfoToast(null), 3000);
  };

  const handleGenerateBrief = async () => {
    if (!activeResult || briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName, userContext || undefined);
      setBrief(r);
      setRightTab("brief");
    } catch {
      try {
        const r = await generateBrief(activeResult.markdown, API_KEY);
        setBrief(r);
        setRightTab("brief");
      } catch (err) {
        setBriefError(err instanceof Error ? err.message : "Failed to generate brief.");
      }
    } finally { setBriefLoading(false); }
  };

  const handleCTARewrite = async () => {
    if (!activeResult || ctaLoading) return;
    setCtaLoading(true);
    try {
      const ctaSection = activeResult.markdown.match(/CTA[\s\S]*?(?=\n##|\n---)/i)?.[0] ?? "";
      const rewrites = await generateCTARewrites(ctaSection, activeResult.fileName, userContext || undefined);
      setCtaRewrites(rewrites);
    } catch { /* silent */ }
    finally { setCtaLoading(false); }
  };

  const handleBriefCopy = async () => {
    if (!brief) return;
    await copyToClipboard(brief);
    setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 2000);
  };

  const handleAddToSwipeFile = () => {
    if (!activeResult) return;
    addSwipeItem({
      fileName: activeResult.fileName,
      timestamp: activeResult.timestamp.toISOString(),
      scores: activeResult.scores,
      markdown: activeResult.markdown,
      brand: "", format: "", niche: "", platform: "", tags: [], notes: "",
    });
    setInfoToast("Saved to Swipe File");
    setTimeout(() => setInfoToast(null), 2500);
  };

  const handleShareLink = async () => {
    if (!activeResult || shareLoading) return;
    const { allowed, resetAt } = checkShareLimit();
    if (!allowed) {
      setRateLimitError(`Share limit reached (10/hour). Resets at ${resetAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      setTimeout(() => setRateLimitError(null), 5000);
      return;
    }
    setShareLoading(true);
    setRateLimitError(null);
    try {
      const slug = await createShare({
        file_name: activeResult.fileName,
        scores: activeResult.scores,
        markdown: activeResult.markdown,
      });
      await navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
      incrementShareCount();
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch (err) {
      setRateLimitError(err instanceof Error ? err.message : "Failed to create share link");
      setTimeout(() => setRateLimitError(null), 5000);
    } finally { setShareLoading(false); }
  };

  const importFromUrl = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed || isAnalyzing || isImporting) return;
    let parsed: URL;
    try { parsed = new URL(trimmed); } catch { setUrlError("Enter a valid URL."); return; }
    setIsImporting(true);
    setUrlError(null);
    try {
      const res = await fetch(trimmed);
      if (!res.ok) { setUrlError("Could not fetch video from this URL."); return; }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("video/")) { setUrlError("This link does not appear to be a direct video URL."); return; }
      const blob = await res.blob();
      const guessedName = parsed.pathname.split("/").filter(Boolean).pop() || "video-from-url.mp4";
      setFile(new File([blob], guessedName, { type: contentType || "video/mp4" }));
      reset();
    } catch { setUrlError("Could not fetch video from this URL."); }
    finally { setIsImporting(false); }
  };

  // suppress unused-var warnings for state used only in importFromUrl / URL flow
  void urlInput; void urlError; void isImporting;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Paid Ad Analyzer — Cutsheet</title>
        <meta name="description" content="Score Meta, TikTok, Google, and YouTube ads. Get hook strength, CTA score, and budget recommendations in 30 seconds." />
        <link rel="canonical" href="https://cutsheet.xyz/app/paid" />
      </Helmet>
      {/* Accessibility: screen reader announcements */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</p>
      <div className="sr-only" aria-live="assertive">
        {status === "complete" && result?.scores ? `Analysis complete. Your ad scored ${result.scores.overall} out of 10.` : ""}
      </div>
      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <IntentHeader platform={platform} setPlatform={setPlatform} format={format} setFormat={setFormat} secondEye={secondEye} setSecondEye={setSecondEye} staticSecondEye={staticSecondEye} setStaticSecondEye={setStaticSecondEye} />

        <div className="flex-1 overflow-auto">
          {/* Format mismatch error */}
          {formatMismatch && (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 24px" }}>
              <div style={{ maxWidth: 420, padding: 20, borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <AlertCircle size={16} color="#ef4444" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>
                    {formatMismatch === "static_as_video" ? "This looks like a static image" : "This looks like a video"}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 16px", lineHeight: 1.5 }}>
                  {formatMismatch === "static_as_video"
                    ? "You have Video selected. Switch to Static to analyze this image correctly."
                    : "You have Static selected. Switch to Video to analyze this correctly."}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={handleFormatSwitch}
                    style={{ flex: 1, height: 40, borderRadius: 9999, border: "none", background: "#6366f1", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    Switch to {formatMismatch === "static_as_video" ? "Static" : "Video"}
                  </button>
                  <button type="button" onClick={() => { setFormatMismatch(null); setPendingFile(null); }}
                    style={{ height: 40, padding: "0 16px", borderRadius: 9999, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#71717a", fontSize: 13, cursor: "pointer" }}>
                    Remove file
                  </button>
                </div>
              </div>
            </div>
          )}
          {!formatMismatch && status === "idle" && !loadedEntry ? (
            <PaidEmptyState
              onFileSelect={(f) => handleFileWithFormatCheck(f)}
              onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
            />
          ) : !formatMismatch && (status !== "idle" || loadedEntry) ? (
            <div className="relative px-4 py-6 md:px-8 min-h-full flex flex-col">
              {/* Ambient glow */}
              <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
              <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />
              <div className="relative flex flex-col flex-1">
                <AnalyzerView
                  file={file}
                  status={effectiveStatus}
                  statusMessage={statusMessage || STATUS_COPY[status]}
                  result={activeResult}
                  error={error}
                  analysisError={analysisError}
                  thumbnailDataUrl={activeResult?.thumbnailDataUrl}
                  onFileSelect={(f) => handleFileWithFormatCheck(f)}
                  onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
                  onAnalyze={handleAnalyze}
                  onReset={handleReset}
                  onCopy={handleCopy}
                  onExportPdf={handleExportPdf}
                  onShare={handleShareLink}
                  onGenerateBrief={handleGenerateBrief}
                  onAddToSwipeFile={handleAddToSwipeFile}
                  copied={copied}
                  shareLoading={shareLoading}
                  historyEntries={historyEntries}
                  onHistoryEntryClick={(entry) => setLoadedEntry(entry)}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right panel — ScoreCard */}
      <div
        className={`shrink-0 bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/5 ${showRightPanel ? "w-[340px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"}`}
      >
        {showRightPanel && activeResult?.scores && rightTab === "analysis" && (
          <>
            <div ref={scorecardRef}>
              <ScoreCard
                scores={activeResult.scores}
                improvements={platformImprovements ?? activeResult.improvements}
                improvementsLoading={improvementsLoading}
                budget={activeResult.budget}
                hashtags={activeResult.hashtags}
                scenes={activeResult.scenes}
                fileName={activeResult.fileName}
                analysisTime={analysisCompletedAt ?? undefined}
                modelName="Gemini + Claude"
                onGenerateBrief={handleGenerateBrief}
                onAddToSwipeFile={handleAddToSwipeFile}
                onCTARewrite={handleCTARewrite}
                ctaRewrites={ctaRewrites}
                ctaLoading={ctaLoading}
                onShare={handleCopy}
                isDark={true}
                format={format}
                engineBudget={engineBudget}
                onNavigateSettings={() => navigate('/settings')}
              />
            </div>
            {/* Second Eye output below scorecard — video only */}
            {format === "video" && secondEye && (
              <SecondEyePanel result={secondEyeOutput} loading={secondEyeLoading} />
            )}
            {/* Static Design Review below scorecard — static only */}
            {format === "static" && staticSecondEye && (
              <StaticSecondEyePanel result={staticSecondEyeResult} loading={staticSecondEyeLoading} />
            )}
          </>
        )}

        {showRightPanel && rightTab === "brief" && (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRightTab("analysis")}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                ← Back to Scores
              </button>
              <span className="text-xs text-zinc-600 font-mono">Claude Sonnet</span>
            </div>
            {briefLoading && !brief && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs text-zinc-500">Generating creative brief...</span>
              </div>
            )}
            {briefError && (
              <div className="px-5 py-4">
                <p className="text-xs text-red-400">{briefError}</p>
              </div>
            )}
            {brief && (
              <>
                <div className="px-5 pt-5 pb-2 flex-1 overflow-y-auto">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Creative Brief</p>
                  <div className="flex flex-col gap-0.5">
                    {brief.split("\n").map((line, i) => {
                      const t = line.trim();
                      if (!t) return null;
                      if (t.startsWith("## ")) return (
                        <p key={i} className="text-xs font-semibold text-white mt-4 mb-1">
                          {t.replace(/^##\s*/, "")}
                        </p>
                      );
                      const boldMatch = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                      if (boldMatch) return (
                        <div key={i} className="mb-3">
                          <p className="text-xs text-zinc-500 font-medium">{boldMatch[1]}</p>
                          {boldMatch[2] && (
                            <p className="text-xs text-zinc-300 leading-relaxed mt-0.5">{boldMatch[2]}</p>
                          )}
                        </div>
                      );
                      if (t.startsWith("- ") || t.startsWith("* ")) return (
                        <div key={i} className="flex gap-2 items-start ml-1 mb-1">
                          <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                          <span className="text-xs text-zinc-400 leading-relaxed">{t.replace(/^[-*]\s*/, "")}</span>
                        </div>
                      );
                      if (t === "---") return <div key={i} className="border-t border-white/5 my-3" />;
                      return <p key={i} className="text-xs text-zinc-300 leading-relaxed mb-1">{t}</p>;
                    })}
                  </div>
                </div>
                <div className="p-5 border-t border-white/5">
                  <button
                    type="button"
                    onClick={handleBriefCopy}
                    className="w-full py-2 px-3 bg-transparent border border-white/10 rounded-lg text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-150 cursor-pointer"
                  >
                    {briefCopied ? "Copied!" : "Copy Brief"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Before/After re-analysis section */}
        {showRightPanel && rightTab === "analysis" && !comparisonResult && (
          <div style={{ padding: "0 16px 12px" }}>
            {!reanalyzeMode ? (
              <button type="button" onClick={() => setReanalyzeMode(true)}
                style={{
                  width: "100%", height: 40, background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.3)", borderRadius: 9999,
                  color: "#818cf8", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                <RotateCcw size={14} /> Re-analyze improved version →
              </button>
            ) : (
              <div style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.3)", borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5", margin: "0 0 4px" }}>Upload your improved version</p>
                <p style={{ fontSize: 12, color: "#71717a", margin: "0 0 12px" }}>We'll score it and compare against your original.</p>
                {comparisonLoading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 0" }}>
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    <span style={{ fontSize: 12, color: "#71717a" }}>Analyzing improved version...</span>
                  </div>
                ) : (
                  <div
                    style={{ height: 64, border: "1px dashed rgba(99,102,241,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: "all 150ms" }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file"; input.accept = "video/*,image/*";
                      input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleReanalyze(f); };
                      input.click();
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; const f = e.dataTransfer.files[0]; if (f) handleReanalyze(f); }}
                  >
                    <Upload size={14} color="#6366f1" />
                    <span style={{ fontSize: 12, color: "#6366f1" }}>Drop improved version here</span>
                  </div>
                )}
                <button type="button" onClick={() => setReanalyzeMode(false)}
                  style={{ fontSize: 11, color: "#52525b", background: "none", border: "none", cursor: "pointer", marginTop: 8, width: "100%", textAlign: "center" }}>
                  ← Keep original
                </button>
              </div>
            )}
          </div>
        )}

        {/* Before/After comparison result */}
        {showRightPanel && comparisonResult && originalScoresSnapshot && activeResult?.scores && (
          <div style={{ padding: "0 16px 12px" }}>
            <BeforeAfterComparison
              originalScores={originalScoresSnapshot}
              improvedScores={activeResult.scores}
              comparison={comparisonResult}
              fileName={activeResult.fileName}
              onReanalyzeAgain={() => { setComparisonResult(null); setReanalyzeMode(true); }}
              onStartFresh={handleReset}
            />
          </div>
        )}

        {/* Analyze another — sticky at bottom of right panel */}
        {showRightPanel && !comparisonResult && (
          <div style={{ position: "sticky", bottom: 0, padding: "0 16px 16px", background: "linear-gradient(transparent, rgba(9,9,11,0.95) 8px)" }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                width: "100%", height: 44, background: "rgba(9,9,11,0.8)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                color: "#71717a", fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 150ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#a1a1aa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(9,9,11,0.8)"; e.currentTarget.style.color = "#71717a"; }}
            >
              <RotateCcw size={14} />
              Analyze another creative
            </button>
          </div>
        )}
      </div>

      {/* History drawer */}
      <HistoryDrawer
        open={historyOpen}
        entries={historyEntries}
        onClose={() => setHistoryOpen(false)}
        onSelect={(entry) => setLoadedEntry(entry)}
        onDelete={deleteHistoryEntry}
        onClearAll={clearAllHistory}
        isDark={true}
      />

      {/* Toasts */}
      {shareToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]"
        >
          Link copied to clipboard
        </div>
      )}
      {rateLimitError && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs font-mono text-red-400 shadow-lg z-[100]"
        >
          {rateLimitError}
        </div>
      )}
      {infoToast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]">
          {infoToast}
        </div>
      )}
    </div>
  );
}
