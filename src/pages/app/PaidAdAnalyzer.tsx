// src/pages/app/PaidAdAnalyzer.tsx
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { RotateCcw, Upload, Sparkles, Lock, Zap, Lightbulb, DollarSign, Film, TrendingUp, ShieldCheck, Hash } from "lucide-react";
import { Toast } from "../../components/Toast";
import { AnalyzerView } from "../../components/AnalyzerView";
import { ScoreCard } from "../../components/ScoreCard";
import { VideoDropzone } from "../../components/VideoDropzone";
import { ToolSheet } from "../../components/ToolSheet";
import { ActionStrip } from "../../components/ActionStrip";
import { QuickWins } from "../../components/QuickWins";
import { ScoreHero } from "../../components/ScoreHero";
import { HookDetailCard } from "../../components/scorecard/HookDetailCard";
import { BudgetCard } from "../../components/scorecard/BudgetCard";
import SceneBreakdown from "../../components/SceneBreakdown";
import { StaticAdChecks } from "../../components/StaticAdChecks";
import PredictedPerformanceCard from "../../components/PredictedPerformanceCard";
import { CollapsibleSection } from "../../components/ui/CollapsibleSection";
import { getScoreColor } from "../../lib/scoreColors";
import { getBenchmark } from "../../lib/benchmarks";
import { HistoryDrawer } from "../../components/HistoryDrawer";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { motion, AnimatePresence } from "framer-motion";
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
  generateStaticSecondEye, generateImprovements, generatePlatformScore,
  type SecondEyeResult,
  type StaticSecondEyeResult,
  type PlatformScore,
} from "../../services/claudeService";
import { PlatformSwitcher, PAID_AD_PLATFORMS, PAID_STATIC_PLATFORMS, VIDEO_ONLY_PLATFORMS } from "../../components/PlatformSwitcher";
import { generateFixIt, type FixItResult } from "../../services/fixItService";
import { generatePrediction, type PredictionResult } from "../../services/predictionService";
import { SecondEyePanel } from "../../components/SecondEyePanel";
import { VisualizePanel } from "../../components/VisualizePanel";
import { visualizeAd } from "../../lib/visualizeService";
import { uploadImageToStorage, removeFromStorage } from "../../lib/storageService";
import type { VisualizeResult, VisualizeStatus } from "../../types/visualize";
import { StaticSecondEyePanel } from "../../components/StaticSecondEyePanel";
import { PolicyCheckPanel } from "../../components/PolicyCheckPanel";
import { runPolicyCheck, type PolicyCheckResult } from "../../lib/policyCheckService";
import { BeforeAfterComparison } from "../../components/BeforeAfterComparison";
import { generateComparison, type ComparisonResult } from "../../services/claudeService";
import { createShare } from "../../services/shareService";
import { saveAnalysis } from "../../services/historyService";
import type { AnalysisRecord } from "../../services/historyService";
import { checkShareLimit, incrementShareCount } from "../../utils/rateLimiter";
import { getUserContext, formatUserContextBlock } from "../../services/userContextService";
import { getSessionMemory } from "@/src/lib/userMemoryService";
import { generateBudgetRecommendation, type EngineBudgetRecommendation } from "../../services/budgetService";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze

const PLATFORMS = ["all", "Meta", "TikTok", "Google", "YouTube"] as const;
type Platform = (typeof PLATFORMS)[number] | "Google" | "Instagram" | "Facebook";
type Format = "video" | "static";

const STATUS_COPY = {
  uploading: "Reading video...",
  processing: "Gemini is analyzing your creative...",
  complete: "Analysis complete",
  error: "Something went wrong",
  idle: "",
} as const;

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
      {/* Section icon */}
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Zap size={28} color="var(--accent)" />
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", marginTop: 20, marginBottom: 0 }}>
        Score your paid ad
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-muted)", textAlign: "center", maxWidth: 320, marginTop: 10, lineHeight: 1.6 }}>
        Upload a video or static creative. Get a full AI breakdown in 30 seconds.
      </p>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
        {PILLS.map((pill) => (
          <span key={pill} style={{ fontSize: 12, color: "var(--accent-text)", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 9999, padding: "4px 12px" }}>
            {pill}
          </span>
        ))}
      </div>

      {/* Dropzone */}
      <div style={{ width: "100%", maxWidth: 520, marginTop: 32 }}>
        <VideoDropzone onFileSelect={onFileSelect} file={null} onUrlSubmit={onUrlSubmit} acceptImages />
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PaidAdAnalyzer() {
  const {
    addHistoryEntry, historyEntries, deleteHistoryEntry, clearAllHistory,
    addSwipeItem, canAnalyze, isPro, increment, FREE_LIMIT, usageCount,
    onUpgradeRequired, registerCallbacks,
  } = useOutletContext<AppSharedContext>();
  const navigate = useNavigate();

  // ── User context for personalized AI ──────────────────────────────────────
  const [userContext, setUserContext] = useState<string>('')
  const [rawUserContext, setRawUserContext] = useState<{ niche: string; platform: string } | null>(null)
  useEffect(() => {
    getUserContext().then(ctx => {
      setUserContext(formatUserContextBlock(ctx))
      setRawUserContext({ niche: ctx.niche, platform: ctx.platform })
    })
  }, [])

  // ── Platform / format state ─────────────────────────────────────────────────
  const [platform, setPlatform] = useState<Platform>("all");
  const [format, setFormat] = useState<Format>("video");
  // Second Eye + Design Review always on — no toggles
  const secondEye = true;
  const staticSecondEye = true;
  const [secondEyeOutput, setSecondEyeOutput] = useState<SecondEyeResult | null>(null);
  const [secondEyeLoading, setSecondEyeLoading] = useState(false);
  const [staticSecondEyeResult, setStaticSecondEyeResult] = useState<StaticSecondEyeResult | null>(null);
  const [staticSecondEyeLoading, setStaticSecondEyeLoading] = useState(false);
  const [engineBudget, setEngineBudget] = useState<EngineBudgetRecommendation | null>(null);
  // ── Before/After re-analysis state
  const [reanalyzeMode, setReanalyzeMode] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [originalScoresSnapshot, setOriginalScoresSnapshot] = useState<{ overall: number; hook: number; cta: number; clarity: number; production: number } | null>(null);
  const [originalImprovementsSnapshot, setOriginalImprovementsSnapshot] = useState<string[]>([]);
  // ── Visualize It state
  const [visualizeOpen, setVisualizeOpen] = useState(false);
  const [visualizeStatus, setVisualizeStatus] = useState<VisualizeStatus>("idle");
  const [visualizeResult, setVisualizeResult] = useState<VisualizeResult | null>(null);
  const [visualizeError, setVisualizeError] = useState<string | null>(null);
  const [visualizeCreditData, setVisualizeCreditData] = useState<import("../../types/visualize").VisualizeCreditData | null>(null);

  // ── Local analyzer state ───────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState<HistoryEntry | null>(null);
  const [toolSheet, setToolSheet] = useState<null | "fixit" | "brief" | "policy">(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const [ctaRewrites, setCtaRewrites] = useState<string[] | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [policyResult, setPolicyResult] = useState<PolicyCheckResult | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [infoToast, setInfoToast] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [loadedFromHistory, setLoadedFromHistory] = useState<AnalysisRecord | null>(null);
  const [confirmStartOver, setConfirmStartOver] = useState(false);

  const [improvementsLoading, setImprovementsLoading] = useState(false);
  const [platformImprovements, setPlatformImprovements] = useState<string[] | null>(null);
  const [platformScoreResult, setPlatformScoreResult] = useState<PlatformScore | null>(null);
  const [isPlatformSwitching, setIsPlatformSwitching] = useState(false);
  const platformAbortRef = useRef<AbortController | null>(null);

  // ── Fix It For Me state ──────────────────────────────────────────────────
  const [fixItResult, setFixItResult] = useState<FixItResult | null>(null);
  const [fixItLoading, setFixItLoading] = useState(false);

  // ── Predicted Performance state ──────────────────────────────────────────
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const prevPlatformRef = useRef<Platform>(platform);
  const sessionMemoryRef = useRef<string>('');

  const { status, statusMessage, result, error, analysisError, analyze, download, copy, reset } = useVideoAnalyzer();
  const thumbnailDataUrl = useThumbnail(file);

  const isAnalyzing = status === "uploading" || status === "processing";

  // ── Register TopBar callbacks ──────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setFile(null);
    setLoadedEntry(null);
    setLoadedFromHistory(null);
    reset();
    setBrief(null);
    setBriefError(null);
    setBriefLoading(false);
    setCtaRewrites(null);
    setCtaLoading(false);
    setToolSheet(null);
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
    setPolicyResult(null);
    setPolicyLoading(false);
    setPolicyError(null);
    setVisualizeOpen(false);
    setVisualizeStatus("idle");
    setVisualizeResult(null);
    setVisualizeError(null);
    setFixItResult(null);
    setFixItLoading(false);
    setPrediction(null);
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
      const improvedResult = await analyze(improvedFile, API_KEY, contextPrefix, userContext || undefined, sessionMemoryRef.current);
      // Now generate comparison
      if (improvedResult?.scores && originalScoresSnapshot) {
        const comp = await generateComparison(
          originalScoresSnapshot,
          improvedResult.scores,
          originalImprovementsSnapshot,
          userContext || undefined,
          sessionMemoryRef.current
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
      ? `This is a PAID ${format} ad for ${platform}.\nScore and optimize specifically for ${platform} performance.\nApply ${platform}-specific improvement suggestions.\nFocus on CTR, ROAS, and conversion potential.`
      : `This is a PAID ${format} ad.\nScore for performance marketing metrics: CTR, ROAS, conversion potential, and ad spend efficiency.\nApply cross-platform best practices.`;

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "complete") setAnalysisCompletedAt(new Date());
  }, [status]);

  // Mobile: scroll to ScoreCard when analysis completes
  useEffect(() => {
    if (status === "complete" && window.innerWidth < 768) {
      setTimeout(() => {
        scorecardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [status]);

  // History save effect — kept separate due to different dependencies
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
        if (newCount >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");
        // Fire and forget — do not await, do not block UI
        saveAnalysis({
          file_name: result.fileName,
          file_type: format === 'video' ? 'video' : 'static',
          mode: 'paid',
          platform: platform || 'all',
          overall_score: result.scores?.overall ?? 0,
          scores: {
            hook: result.scores?.hook ?? 0,
            clarity: result.scores?.clarity ?? 0,
            cta: result.scores?.cta ?? 0,
            production: result.scores?.production ?? 0,
          },
          improvements: result.improvements ?? [],
          cta_rewrite: Array.isArray(ctaRewrites) && ctaRewrites.length > 0 ? ctaRewrites[0] : undefined,
          budget_recommendation: result.budget?.verdict ?? undefined,
        });
        setHistoryRefreshKey(k => k + 1);
      }
    }
  }, [status, result, addHistoryEntry, increment, isPro, FREE_LIMIT, onUpgradeRequired, thumbnailDataUrl]); // eslint-disable-line

  // Combined post-analysis effect — runs all post-analysis jobs in parallel
  useEffect(() => {
    if (status !== "complete" || !result) return;

    // Budget — synchronous, fire immediately
    if (result.scores) {
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || 'Other';
      setEngineBudget(generateBudgetRecommendation(result.scores.overall, platform, niche, format));
    }

    // Async operations — fire in parallel
    const promises: Promise<void>[] = [];

    // Second Eye (video only)
    if (secondEye && format === 'video' && !secondEyeLoading) {
      promises.push(
        (async () => {
          setSecondEyeLoading(true);
          setSecondEyeOutput(null);
          try {
            const output = await generateSecondEyeReview(
              result.markdown,
              result.fileName,
              result.scores ? { hook: result.scores.hook, overall: result.scores.overall } : undefined,
              result.improvements,
              userContext || undefined,
              sessionMemoryRef.current
            );
            setSecondEyeOutput(output);
          } catch (err) {
            console.error('Second Eye failed:', err);
            setSecondEyeOutput(null);
          } finally {
            setSecondEyeLoading(false);
          }
        })()
      );
    }

    // Static Second Eye (static only)
    if (staticSecondEye && format === 'static' && !staticSecondEyeLoading) {
      promises.push(
        (async () => {
          setStaticSecondEyeLoading(true);
          setStaticSecondEyeResult(null);
          try {
            const output = await generateStaticSecondEye(
              result.markdown,
              result.fileName,
              result.scores ? { overall: result.scores.overall, cta: result.scores.cta } : undefined,
              result.improvements,
              userContext || undefined,
              sessionMemoryRef.current
            );
            setStaticSecondEyeResult(output);
          } catch (err) {
            console.error('Static Second Eye failed:', err);
            setStaticSecondEyeResult(null);
          } finally {
            setStaticSecondEyeLoading(false);
          }
        })()
      );
    }

    if (promises.length > 0) {
      Promise.allSettled(promises);
    }
  }, [status, result]); // eslint-disable-line

  // Platform switch: re-generate improvements + platform score when platform changes
  const handlePlatformSwitch = useCallback(async (newPlatform: string) => {
    setPlatform(newPlatform as Platform);
    if (status !== "complete" || !result?.markdown || !result?.scores) return;
    if (newPlatform === "all") {
      setPlatformScoreResult(null);
      setPlatformImprovements(null);
      return;
    }

    // Cancel any in-flight platform score request
    platformAbortRef.current?.abort();
    platformAbortRef.current = new AbortController();

    setIsPlatformSwitching(true);
    setImprovementsLoading(true);

    try {
      const [imps, pScore] = await Promise.all([
        generateImprovements(result.markdown, result.scores, userContext || undefined, newPlatform, sessionMemoryRef.current),
        generatePlatformScore(newPlatform, result, result.fileName, format as 'video' | 'static', userContext || undefined),
      ]);
      setPlatformImprovements(imps);
      setPlatformScoreResult(pScore);
    } catch {
      setPlatformImprovements(null);
      // Keep existing platform score on error
    } finally {
      setIsPlatformSwitching(false);
      setImprovementsLoading(false);
    }
  }, [status, result, userContext, format]); // eslint-disable-line

  useEffect(() => {
    if (status === "uploading") {
      setLoadedEntry(null);
      setPlatformImprovements(null);
      setBrief(null);
      setBriefError(null);
      setToolSheet(null);
      setSecondEyeOutput(null);
      setStaticSecondEyeResult(null);
    }
  }, [status]);

  // ── Auto-reset platform when format switches and current platform is invalid ──
  useEffect(() => {
    if (format === "static" && VIDEO_ONLY_PLATFORMS.has(platform)) {
      setPlatform("Meta" as Platform);
      setInfoToast("TikTok and YouTube don't support static ads — switched to Meta");
      setTimeout(() => setInfoToast(null), 3000);
    }
    if (format === "static" && platform === "all") {
      setPlatform("Meta" as Platform);
    }
  }, [format]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-detect format on file drop (no modal) ──────────────────────────
  const handleFileWithFormatCheck = useCallback((f: File | null) => {
    if (!f) { handleReset(); return; }

    const fileIsVideo = f.type.startsWith("video/") || [".mp4", ".mov", ".webm"].some(e => f.name.toLowerCase().endsWith(e));
    const fileIsImage = f.type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].some(e => f.name.toLowerCase().endsWith(e));

    // Auto-switch format silently + show toast
    if (fileIsImage && format !== "static") {
      setFormat("static" as Format);
      setInfoToast("Detected static image — analyzing as Static");
      setTimeout(() => setInfoToast(null), 3000);
    } else if (fileIsVideo && format !== "video") {
      setFormat("video" as Format);
      setInfoToast("Detected video — analyzing as Video");
      setTimeout(() => setInfoToast(null), 3000);
    }

    setFile(f);
    reset();
  }, [format, handleReset, reset]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!file || isAnalyzing || !canAnalyze) return;
    let sessionMemory = '';
    try {
      ({ text: sessionMemory } = await getSessionMemory());
    } catch { /* non-critical — proceed without memory */ }
    sessionMemoryRef.current = sessionMemory;
    await analyze(file, API_KEY, contextPrefix, userContext || undefined, sessionMemory);
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

  const activeResult: AnalysisResult | null = loadedFromHistory
    ? {
        markdown: '',
        scores: loadedFromHistory.scores as AnalysisResult['scores'],
        improvements: loadedFromHistory.improvements ?? [],
        budget: loadedFromHistory.budget_recommendation
          ? { verdict: loadedFromHistory.budget_recommendation as import('../../services/analyzerService').BudgetRecommendation['verdict'], platform: '', daily: '', duration: '', reason: '' }
          : null,
        hashtags: undefined,
        fileName: loadedFromHistory.file_name,
        timestamp: loadedFromHistory.created_at ? new Date(loadedFromHistory.created_at) : new Date(),
      }
    : loadedEntry
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

  const effectiveStatus = (loadedEntry || loadedFromHistory) ? ("complete" as const) : status;
  const hasResult = effectiveStatus === "complete" && activeResult !== null;

  // Report hasResult to TopBar via AppLayout
  useEffect(() => {
    registerCallbacks({
      onNewAnalysis: handleReset,
      onHistoryOpen: () => setHistoryOpen(true),
      hasResult,
    });
  }, [registerCallbacks, handleReset, hasResult]);

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
    setToolSheet("brief");
    setBriefLoading(true);
    setBriefError(null);
    try {
      const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName, userContext || undefined, sessionMemoryRef.current);
      setBrief(r);
    } catch {
      try {
        const r = await generateBrief(activeResult.markdown, API_KEY);
        setBrief(r);
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
      const rewrites = await generateCTARewrites(ctaSection, activeResult.fileName, userContext || undefined, sessionMemoryRef.current);
      setCtaRewrites(rewrites);
    } catch { /* silent */ }
    finally { setCtaLoading(false); }
  };

  const handleCheckPolicies = async () => {
    if (!activeResult || policyLoading) return;
    setToolSheet("policy");
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      // Determine policy platform from current platform selection
      const policyPlatform =
        platform === "Meta" ? "meta"
        : platform === "TikTok" ? "tiktok"
        : "both";

      const r = await runPolicyCheck({
        platform: policyPlatform,
        adType: format,
        niche: userContext ? "from user context" : "unknown",
        adCopy: activeResult.markdown,
        existingAnalysis: activeResult.scores as unknown as object,
      });
      setPolicyResult(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Policy check failed";
      if (msg.startsWith("RATE_LIMITED")) {
        const time = msg.split(":")[1] ?? "24h";
        setPolicyError(`Daily limit reached. Resets in ${time}. Upgrade to Pro for unlimited checks.`);
      } else {
        setPolicyError(msg);
      }
    } finally {
      setPolicyLoading(false);
    }
  };

  // ── Fix It For Me handler ──────────────────────────────────────────────────
  const handleFixIt = async () => {
    if (fixItResult) {
      setToolSheet("fixit");
      return;
    }
    if (!activeResult?.markdown || !activeResult?.scores || fixItLoading) return;
    setToolSheet("fixit");
    setFixItLoading(true);
    try {
      const result = await generateFixIt(
        activeResult.markdown,
        activeResult.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        rawUserContext?.niche,
        undefined, // intent
        format as 'video' | 'static',
      );
      setFixItResult(result);
    } catch (err) {
      console.error('Fix It failed:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.startsWith('RATE_LIMITED')) {
        setInfoToast('Fix It limit reached. Try again later.');
        setTimeout(() => setInfoToast(null), 3000);
      }
    } finally {
      setFixItLoading(false);
    }
  };

  // ── Predicted Performance — auto-fire on analysis complete ────────────────
  useEffect(() => {
    if (status === "complete" && result?.markdown && result?.scores && !prediction) {
      generatePrediction(
        result.markdown,
        result.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        format as 'video' | 'static',
        rawUserContext?.niche,
      ).then(setPrediction).catch((err) => {
        console.error('Prediction failed (silent):', err);
        // Silently omit — spec says never show error for this
      });
    }
  }, [status, result]); // eslint-disable-line

  const handleVisualize = async () => {
    if (!activeResult?.scores || !file) return;
    setVisualizeOpen(true);
    setVisualizeStatus("loading");
    // Scroll left panel to top so VisualizePanel is visible immediately
    setTimeout(() => leftPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 100);
    setVisualizeResult(null);
    setVisualizeError(null);
    try {
      const { signedUrl: imageStorageUrl, storagePath } = await uploadImageToStorage(file, 1200, 0.85);
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "general";
      const result = await visualizeAd({
        imageStorageUrl,
        imageMediaType: "image/jpeg",
        analysisResult: {
          scores: activeResult.scores as Record<string, number>,
          improvements: activeResult.improvements ?? [],
          markdown: activeResult.markdown,
        },
        platform: platform === "all" ? "general" : platform,
        niche,
        adType: "static",
      });
      setVisualizeResult(result);
      setVisualizeStatus("complete");
      removeFromStorage(storagePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "PRO_REQUIRED") {
        setVisualizeOpen(false);
        setVisualizeStatus("idle");
        onUpgradeRequired("visualize");
        return;
      }
      if (msg === "CREDIT_LIMIT_REACHED" && err && typeof err === "object" && "creditData" in err) {
        const creditErr = err as Error & { creditData: import("../../types/visualize").VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        return;
      }
      setVisualizeError(msg.includes("RATE_LIMITED") ? "RATE_LIMITED" : msg);
      setVisualizeStatus("error");
    }
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
    setInfoToast("Saved to your library");
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
    // SSRF protection: only allow https and block private/internal IPs
    if (parsed.protocol !== "https:") { setUrlError("Only HTTPS URLs are allowed."); return; }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" || host === "127.0.0.1" || host === "[::1]" ||
      host.endsWith(".local") || host.endsWith(".internal") ||
      /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.)/.test(host) ||
      host === "metadata.google.internal" || host === "169.254.169.254"
    ) { setUrlError("This URL is not allowed."); return; }
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
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Paid Ad Analyzer — Cutsheet</title>
        <meta name="description" content="Score Meta, TikTok, Google, and YouTube ads. Get hook strength, CTA score, and budget recommendations in 30 seconds." />
        <link rel="canonical" href="https://cutsheet.xyz/app/paid" />
      </Helmet>
      {/* Accessibility */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</p>
      <div className="sr-only" aria-live="assertive">
        {status === "complete" && result?.scores ? `Analysis complete. Your ad scored ${result.scores.overall} out of 10.` : ""}
      </div>

      {/* Single column layout */}
      <div ref={leftPanelRef} className="flex-1 overflow-auto">
        {status === "idle" && !loadedEntry ? (
          <PaidEmptyState
            onFileSelect={(f) => handleFileWithFormatCheck(f)}
            onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
          />
        ) : (status !== "idle" || loadedEntry) ? (
          <div className="max-w-[680px] mx-auto w-full px-4 py-6">

            {/* 1. Platform Switcher */}
            {status === "complete" && activeResult?.scores && (
              <div className="mb-4">
                <PlatformSwitcher
                  platforms={format === "static" ? PAID_STATIC_PLATFORMS : PAID_AD_PLATFORMS}
                  selected={platform}
                  onChange={handlePlatformSwitch}
                  isSwitching={isPlatformSwitching}
                  disabled={status !== "complete"}
                />
                {/* Platform score verdict badge */}
                {platformScoreResult && platform !== "all" && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                      style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
                      <span className="font-mono font-bold" style={{ color: 'var(--accent-text)' }}>{platformScoreResult.score}/10</span>
                      <span style={{ color: 'var(--ink-muted)' }}>{platformScoreResult.verdict}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. ScoreHero — the FIRST thing you see */}
            {status === "complete" && activeResult?.scores && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div ref={scorecardRef}>
                  <ScoreHero
                    score={activeResult.scores.overall}
                    verdict={activeResult.scores.overall >= 8 ? "Strong" : activeResult.scores.overall >= 4 ? "Average" : "Needs Work"}
                    benchmark={getBenchmark(rawUserContext?.niche ?? '', rawUserContext?.platform ?? '', format === 'video' ? 'video' : 'static').averageScore}
                    platform={platform !== "all" ? platform : (rawUserContext?.platform ?? undefined)}
                    format={format}
                    dimensions={[
                      { name: "Hook", score: activeResult.scores.hook },
                      { name: "Copy", score: activeResult.scores.clarity },
                      { name: "Visual", score: activeResult.scores.production },
                      { name: "CTA", score: activeResult.scores.cta },
                    ]}
                  />
                </div>
              </motion.div>
            )}

            {/* 3. ActionStrip — immediately actionable */}
            {status === "complete" && activeResult?.scores && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4"
              >
                <ActionStrip
                  overallScore={activeResult.scores.overall}
                  onFixIt={handleFixIt}
                  onGenerateBrief={handleGenerateBrief}
                  onCheckPolicies={handleCheckPolicies}
                  onShare={handleCopy}
                  onVisualize={handleVisualize}
                  fixItLoading={fixItLoading}
                  briefLoading={briefLoading}
                  policyLoading={policyLoading}
                  visualizeLoading={visualizeStatus === "loading"}
                  canVisualize={format === "static"}
                  isPro={isPro}
                  onUpgradeRequired={onUpgradeRequired}
                />
              </motion.div>
            )}

            {/* 4. QuickWins — top improvements always visible */}
            {status === "complete" && activeResult?.scores && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4"
              >
                <QuickWins
                  improvements={platformScoreResult?.improvements ?? platformImprovements ?? activeResult.improvements ?? []}
                  loading={improvementsLoading}
                />
              </motion.div>
            )}

            {/* 5. Media Preview + AnalyzerView */}
            <div className="mt-6">
              {status === "complete" && format === "static" && (visualizeOpen || visualizeStatus !== "idle") ? (
                <motion.div
                  key="visualize"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <VisualizePanel
                    status={visualizeStatus}
                    result={visualizeResult}
                    originalImageUrl={thumbnailDataUrl ?? null}
                    error={visualizeError}
                    creditData={visualizeCreditData}
                    onBack={() => { setVisualizeOpen(false); setVisualizeStatus("idle"); setVisualizeResult(null); setVisualizeError(null); setVisualizeCreditData(null); }}
                    onClose={() => { setVisualizeOpen(false); setVisualizeStatus("idle"); setVisualizeResult(null); setVisualizeError(null); setVisualizeCreditData(null); }}
                    onAnalyzeVersion={handleReanalyze}
                    onUpgrade={onUpgradeRequired}
                  />
                </motion.div>
              ) : (
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
                  platform={platform !== "all" ? platform : (rawUserContext?.platform ?? undefined)}
                  icon={Zap}
                />
              )}
            </div>

            {/* 6. Deep Analysis — collapsible sections */}
            {status === "complete" && activeResult?.scores && (
              <div className="mt-6 flex flex-col gap-3">
                {/* Hook Analysis */}
                {activeResult.hookDetail && (
                  <div className="cs-card p-5">
                    <CollapsibleSection
                      title="Hook Analysis"
                      icon={<Lightbulb size={14} />}
                      trailing={<span className="text-[10px] font-mono" style={{ color: getScoreColor(activeResult.scores.hook) }}>{activeResult.scores.hook}/10</span>}
                    >
                      <HookDetailCard hookDetail={activeResult.hookDetail} format={format} />
                    </CollapsibleSection>
                  </div>
                )}

                {/* Budget Recommendation */}
                {(engineBudget || activeResult.budget) && (
                  <div className="cs-card p-5">
                    <CollapsibleSection title="Budget Recommendation" icon={<DollarSign size={14} />}>
                      <BudgetCard engineBudget={engineBudget} budget={activeResult.budget} onNavigateSettings={() => navigate('/settings')} />
                    </CollapsibleSection>
                  </div>
                )}

                {/* Scene Breakdown — video only */}
                {format === "video" && activeResult.scenes && activeResult.scenes.length > 0 && (
                  <div className="cs-card p-5">
                    <CollapsibleSection title="Scene Breakdown" icon={<Film size={14} />}
                      trailing={<span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>{activeResult.scenes.length} scenes</span>}>
                      <SceneBreakdown scenes={activeResult.scenes} />
                    </CollapsibleSection>
                  </div>
                )}

                {/* Predicted Performance */}
                {prediction && (
                  <div className="cs-card p-5">
                    <CollapsibleSection title="Predicted Performance" icon={<TrendingUp size={14} />}>
                      <PredictedPerformanceCard prediction={prediction} platform={platform} niche={rawUserContext?.niche} />
                    </CollapsibleSection>
                  </div>
                )}

                {/* Hashtags */}
                {activeResult.hashtags && (activeResult.hashtags.tiktok.length > 0 || activeResult.hashtags.meta.length > 0 || activeResult.hashtags.instagram.length > 0) && (
                  <div className="cs-card p-5">
                    <CollapsibleSection
                      title="Recommended Hashtags"
                      icon={<Hash size={14} />}
                      trailing={
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>
                            {[activeResult.hashtags.tiktok, activeResult.hashtags.meta, activeResult.hashtags.instagram].reduce((n, t) => n + t.length, 0)} tags
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const allTags = [
                                ...activeResult.hashtags!.tiktok.map((t: string) => `#${t}`),
                                ...activeResult.hashtags!.meta.map((t: string) => `#${t}`),
                                ...activeResult.hashtags!.instagram.map((t: string) => `#${t}`),
                              ];
                              navigator.clipboard.writeText(allTags.join(' '));
                            }}
                            className="text-[10px] transition-colors"
                            style={{ color: 'var(--accent-text)' }}
                          >
                            Copy all
                          </button>
                        </div>
                      }
                    >
                      {([["TikTok", activeResult.hashtags.tiktok], ["Meta", activeResult.hashtags.meta], ["Instagram", activeResult.hashtags.instagram]] as const).map(
                        ([plat, tags]) =>
                          tags.length > 0 && (
                            <div key={plat} className="mb-3">
                              <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--ink-faint)' }}>{plat}</span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {tags.map((tag) => (
                                  <button key={tag} className="cs-chip"
                                    onClick={() => navigator.clipboard.writeText(`#${tag}`)}>
                                    #{tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                      )}
                    </CollapsibleSection>
                  </div>
                )}

                {/* Static Ad Checks — static only */}
                {format === "static" && activeResult.scores && (
                  <div className="cs-card p-5">
                    <CollapsibleSection title="Ad Quality Checks" icon={<ShieldCheck size={14} />}>
                      <StaticAdChecks scores={activeResult.scores} />
                    </CollapsibleSection>
                  </div>
                )}
              </div>
            )}

            {/* 7. Second Eye / Design Review */}
            {status === "complete" && (
              <div className="mt-4">
                {format === "video" && <SecondEyePanel result={secondEyeOutput} loading={secondEyeLoading} />}
                {format === "static" && <StaticSecondEyePanel result={staticSecondEyeResult} loading={staticSecondEyeLoading} />}
              </div>
            )}

            {/* 8. Re-analyze section */}
            {status === "complete" && activeResult?.scores && !comparisonResult && (
              <div className="mt-4">
                {!reanalyzeMode ? (
                  <button type="button" onClick={() => setReanalyzeMode(true)}
                    className="cs-btn-ghost w-full justify-center h-10"
                    style={{ borderRadius: 'var(--radius-full)' }}>
                    <RotateCcw size={14} /> Re-analyze improved version
                  </button>
                ) : (
                  <div className="cs-card p-4">
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Upload your improved version</p>
                    <p className="text-xs mb-3" style={{ color: 'var(--ink-faint)' }}>We'll score it and compare against your original.</p>
                    {comparisonLoading ? (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                          style={{ borderColor: 'var(--accent-bg)', borderTopColor: 'var(--accent)' }} />
                        <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>Analyzing improved version...</span>
                      </div>
                    ) : (
                      <div className="h-16 border border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                        style={{ borderColor: 'var(--accent-border)' }}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file"; input.accept = "video/*,image/*";
                          input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleReanalyze(f); };
                          input.click();
                        }}
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleReanalyze(f); }}
                      >
                        <Upload size={14} style={{ color: 'var(--accent)' }} />
                        <span className="text-xs" style={{ color: 'var(--accent)' }}>Drop improved version here</span>
                      </div>
                    )}
                    <button type="button" onClick={() => setReanalyzeMode(false)}
                      className="text-[11px] mt-2 w-full text-center bg-transparent border-none cursor-pointer"
                      style={{ color: 'var(--ink-tertiary)' }}>
                      ← Keep original
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Before/After comparison */}
            {comparisonResult && originalScoresSnapshot && activeResult?.scores && (
              <div className="mt-4">
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

          </div>
        ) : null}
      </div>

      {/* ── Tool Sheets (overlay) ── */}
      <ToolSheet open={toolSheet === "fixit"} onClose={() => setToolSheet(null)} title="Fix This Ad">
        {fixItResult ? (
          <FixItPanel result={fixItResult} />
        ) : fixItLoading ? (
          <div className="flex items-center gap-3 py-8">
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--accent-bg)', borderTopColor: 'var(--accent)' }} />
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Rewriting your ad...</span>
          </div>
        ) : null}
      </ToolSheet>

      <ToolSheet open={toolSheet === "brief"} onClose={() => setToolSheet(null)} title="Creative Brief">
        {brief ? (
          <>
            <div className="flex flex-col gap-0.5">
              {brief.split("\n").map((line, i) => {
                const t = line.trim();
                if (!t) return null;
                if (t.startsWith("## ")) return (
                  <p key={i} className="text-xs font-semibold mt-4 mb-1" style={{ color: 'var(--ink)' }}>
                    {t.replace(/^##\s*/, "")}
                  </p>
                );
                const boldMatch = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                if (boldMatch) return (
                  <div key={i} className="mb-3">
                    <p className="text-xs font-medium" style={{ color: 'var(--ink-faint)' }}>{boldMatch[1]}</p>
                    {boldMatch[2] && <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--ink-muted)' }}>{boldMatch[2]}</p>}
                  </div>
                );
                if (t.startsWith("- ") || t.startsWith("* ")) return (
                  <div key={i} className="flex gap-2 items-start ml-1 mb-1">
                    <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{t.replace(/^[-*]\s*/, "")}</span>
                  </div>
                );
                if (t === "---") return <div key={i} className="my-3" style={{ borderTop: '1px solid var(--border-subtle)' }} />;
                return <p key={i} className="text-xs leading-relaxed mb-1" style={{ color: 'var(--ink-muted)' }}>{t}</p>;
              })}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button type="button" onClick={handleBriefCopy} className="cs-btn-ghost w-full justify-center">
                {briefCopied ? "Copied!" : "Copy Brief"}
              </button>
            </div>
          </>
        ) : briefLoading ? (
          <div className="flex items-center gap-3 py-8">
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--accent-bg)', borderTopColor: 'var(--accent)' }} />
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Writing your creative brief...</span>
          </div>
        ) : briefError ? (
          <p className="text-xs" style={{ color: 'var(--error)' }}>{briefError}</p>
        ) : null}
      </ToolSheet>

      <ToolSheet open={toolSheet === "policy"} onClose={() => setToolSheet(null)} title="Ad Policy Check">
        {policyResult ? (
          <PolicyCheckPanel result={policyResult} onClose={() => setToolSheet(null)} />
        ) : policyLoading ? (
          <div className="flex items-center gap-3 py-8">
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--score-average-bg)', borderTopColor: 'var(--warn)' }} />
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Checking ad policies...</span>
          </div>
        ) : policyError ? (
          <p className="text-xs" style={{ color: 'var(--error)' }}>{policyError}</p>
        ) : null}
      </ToolSheet>

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
        <div role="status" aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono shadow-lg z-[100]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
          Link copied to clipboard
        </div>
      )}
      {rateLimitError && (
        <div role="alert" aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono shadow-lg z-[100]"
          style={{ background: 'var(--score-weak-bg)', border: '1px solid var(--score-weak-border)', color: 'var(--error)' }}>
          {rateLimitError}
        </div>
      )}
      {infoToast && (
        <div role="status" aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono shadow-lg z-[100]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
          {infoToast}
        </div>
      )}

      <AlertDialog
        open={confirmStartOver}
        onClose={() => setConfirmStartOver(false)}
        onConfirm={handleReset}
        title="Start over?"
        description="This will clear your current analysis. You can find it in History."
        confirmLabel="Start Over"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
}
