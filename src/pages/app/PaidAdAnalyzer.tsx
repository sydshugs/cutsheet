// src/pages/app/PaidAdAnalyzer.tsx
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { RotateCcw, Upload, Sparkles, Lock, Zap } from "lucide-react";
import { Toast } from "../../components/Toast";
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
  generateStaticSecondEye, generateImprovements, generatePlatformScore,
  type SecondEyeResult,
  type StaticSecondEyeResult,
  type PlatformScore,
} from "../../services/claudeService";
import { PlatformSwitcher, PAID_AD_PLATFORMS } from "../../components/PlatformSwitcher";
import { generateFixIt, type FixItResult } from "../../services/fixItService";
import { generatePrediction, type PredictionResult } from "../../services/predictionService";
import { SecondEyePanel } from "../../components/SecondEyePanel";
import { VisualizePanel } from "../../components/VisualizePanel";
import { visualizeAd, fileToBase64, getMediaType } from "../../lib/visualizeService";
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
type Platform = (typeof PLATFORMS)[number];
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
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Zap size={28} color="#6366f1" />
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
  const [rightTab, setRightTab] = useState<"analysis" | "brief" | "policy">("analysis");
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
      ? `Analyzing as ${format} ad for ${platform}.\nScore and optimize specifically for ${platform} performance.\nApply ${platform}-specific improvement suggestions.`
      : undefined;

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
      };
      run();
    }
  }, [status, result, staticSecondEye, format]); // eslint-disable-line

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
      setRightTab("analysis");
      setSecondEyeOutput(null);
      setStaticSecondEyeResult(null);
    }
  }, [status]);

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
      const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName, userContext || undefined, sessionMemoryRef.current);
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
      const rewrites = await generateCTARewrites(ctaSection, activeResult.fileName, userContext || undefined, sessionMemoryRef.current);
      setCtaRewrites(rewrites);
    } catch { /* silent */ }
    finally { setCtaLoading(false); }
  };

  const handleCheckPolicies = async () => {
    if (!activeResult || policyLoading) return;
    setPolicyLoading(true);
    setPolicyError(null);
    setRightTab("policy");
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
    if (!activeResult?.markdown || !activeResult?.scores || fixItLoading) return;
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
      const imageBase64 = await fileToBase64(file);
      const mediaType = getMediaType(file);
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "general";
      const result = await visualizeAd({
        imageBase64,
        imageMediaType: mediaType,
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
        {/* IntentHeader removed — platform pills and toggles stripped */}

        <div ref={leftPanelRef} className="flex-1 flex flex-col overflow-auto">
          {status === "idle" && !loadedEntry ? (
            <>
              <PaidEmptyState
                onFileSelect={(f) => handleFileWithFormatCheck(f)}
                onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
              />
            </>
          ) : (status !== "idle" || loadedEntry) ? (
            <div className="relative px-4 py-6 md:px-8 flex-1 flex flex-col">
              {/* Ambient glow */}
              <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
              <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />
              <div className="relative flex flex-col flex-1">
                {/* Show VisualizePanel IN PLACE OF AnalyzerView when visualize is active */}
                {status === "complete" && format === "static" && (visualizeOpen || visualizeStatus !== "idle") ? (
                  <motion.div
                    key="visualize"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col flex-1"
                  >
                    {/* Back to analysis link */}
                    <button
                      type="button"
                      onClick={() => { setVisualizeOpen(false); setVisualizeStatus("idle"); setVisualizeResult(null); setVisualizeError(null); setVisualizeCreditData(null); }}
                      className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors"
                      style={{ color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-muted)"; }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                      Back to analysis
                    </button>
                    <VisualizePanel
                      status={visualizeStatus}
                      result={visualizeResult}
                      originalImageUrl={thumbnailDataUrl ?? null}
                      error={visualizeError}
                      creditData={visualizeCreditData}
                      onClose={() => { setVisualizeOpen(false); setVisualizeStatus("idle"); setVisualizeResult(null); setVisualizeError(null); setVisualizeCreditData(null); }}
                      onAnalyzeVersion={handleReanalyze}
                      onUpgrade={onUpgradeRequired}
                    />
                  </motion.div>
                ) : (
                  <div className="flex flex-col flex-1">
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
                      />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right panel — ScoreCard */}
      <div
        className={`shrink-0 bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/5 ${showRightPanel ? "w-[440px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"}`}
      >
        {showRightPanel && activeResult?.scores && rightTab === "analysis" && (
          <>
            {/* Platform Switcher */}
            <div className="px-4 pt-3 pb-1">
              <PlatformSwitcher
                platforms={PAID_AD_PLATFORMS}
                selected={platform}
                onChange={handlePlatformSwitch}
                isSwitching={isPlatformSwitching}
                disabled={status !== "complete"}
              />
            </div>
            {/* Platform score verdict badge */}
            {platformScoreResult && platform !== "all" && (
              <div className="px-4 pb-2">
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
                >
                  <span className="font-mono font-bold text-indigo-400">{platformScoreResult.score}/10</span>
                  <span className="text-zinc-400">{platformScoreResult.verdict}</span>
                </div>
              </div>
            )}
            <div ref={scorecardRef}>
              <ScoreCard
                scores={activeResult.scores}
                hookDetail={activeResult.hookDetail}
                improvements={platformScoreResult?.improvements ?? platformImprovements ?? activeResult.improvements}
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
                onReanalyze={() => setReanalyzeMode(true)}
                onStartOver={handleReset}
                onCheckPolicies={handleCheckPolicies}
                policyLoading={policyLoading}
                niche={rawUserContext?.niche}
                platform={rawUserContext?.platform}
                onFixIt={handleFixIt}
                fixItResult={fixItResult}
                fixItLoading={fixItLoading}
                prediction={prediction}
                onCompare={() => navigate('/app/competitor')}
                onVisualize={handleVisualize}
                visualizeLoading={visualizeStatus === "loading"}
                canVisualize={format === "static"}
                isPro={isPro}
                onUpgradeRequired={onUpgradeRequired}
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
            {/* Visualize It moved to left panel (below creative) */}
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
              <span className="text-xs text-zinc-500 font-mono">Claude Sonnet</span>
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

        {/* Policy Check panel */}
        {showRightPanel && rightTab === "policy" && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRightTab("analysis")}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                ← Back to Scores
              </button>
              <span className="text-xs text-zinc-500 font-mono">Claude Sonnet</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {policyLoading && !policyResult && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
                  <div style={{ width: 20, height: 20, border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#71717a" }}>Checking policies...</span>
                  <span style={{ fontSize: 11, color: "#52525b" }}>Evaluating Meta & TikTok compliance</span>
                </div>
              )}
              {policyError && (
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#ef4444" }}>
                  {policyError}
                </div>
              )}
              {policyResult && !policyLoading && (
                <PolicyCheckPanel result={policyResult} onClose={() => setRightTab("analysis")} />
              )}
            </div>
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
