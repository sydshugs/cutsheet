// src/pages/app/OrganicAnalyzer.tsx
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { AnalyzerView } from "../../components/AnalyzerView";
import { HistoryDrawer } from "../../components/HistoryDrawer";
import { OrganicEmptyState } from "../../components/organic/OrganicEmptyState";
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
  generatePlatformScore, generateStaticSecondEye,
  type PlatformScore, type SecondEyeResult, type StaticSecondEyeResult,
} from "../../services/claudeService";
import { SafeZoneModal } from "../../components/SafeZoneModal";
import { getImageDimensions, getImageDimensionsFromSrc } from "../../utils/getImageDimensions";
import { VIDEO_ONLY_PLATFORMS } from "../../components/PlatformSwitcher";
import { generateFixIt, type FixItResult } from "../../services/fixItService";
import { generatePrediction, type PredictionResult } from "../../services/predictionService";
import { saveAnalysis } from "../../services/historyService";
import type { AnalysisRecord } from "../../services/historyService";
import { getUserContext, formatUserContextBlock } from "../../services/userContextService";
import { getSessionMemory } from "@/src/lib/userMemoryService";
import type { AppSharedContext } from "../../components/AppLayout";
import { OrganicRightPanel, type OrganicRightPanelHandle } from "../../components/organic/OrganicRightPanel";
import { getOrganicContextPrefix } from "../../components/organic/organicContextPrefix";

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze

const PLATFORM_SERVICE_MAP = {
  'TikTok': 'tiktok',
  'Instagram Reels': 'reels',
  'YouTube Shorts': 'shorts',
} as const;

const PLATFORMS = ["all", "TikTok", "Instagram Reels", "YouTube Shorts"] as const;
type Platform = (typeof PLATFORMS)[number];

const STATUS_COPY = {
  uploading: "Reading video...",
  processing: "Gemini is analyzing your organic content...",
  complete: "Analysis complete",
  error: "Something went wrong",
  idle: "",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OrganicAnalyzer() {
  const {
    addHistoryEntry, historyEntries, deleteHistoryEntry, clearAllHistory,
    addSwipeItem, canAnalyze, isPro, increment, FREE_LIMIT,
    onUpgradeRequired, registerCallbacks,
  } = useOutletContext<AppSharedContext>();
  const navigate = useNavigate();
  void navigate; // used inside OrganicRightPanel via its own hook

  const [organicFormat, setOrganicFormat] = useState<"video" | "static">("video");
  const [imageMismatch, setImageMismatch] = useState(false);

  // ── User context ─────────────────────────────────────────────────────────────
  const [userContext, setUserContext] = useState<string>('')
  const [rawUserContext, setRawUserContext] = useState<{ niche: string; platform: string } | null>(null)
  useEffect(() => {
    getUserContext().then(ctx => {
      setUserContext(formatUserContextBlock(ctx))
      setRawUserContext({ niche: ctx.niche, platform: ctx.platform })
    })
  }, [])

  const [platform, setPlatform] = useState<Platform>("all");
  const [secondEyeOutput, setSecondEyeOutput] = useState<SecondEyeResult | null>(null);
  const [secondEyeLoading, setSecondEyeLoading] = useState(false);
  const [designReviewResult, setDesignReviewResult] = useState<StaticSecondEyeResult | null>(null);
  const [designReviewLoading, setDesignReviewLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState<HistoryEntry | null>(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const [ctaRewrites, setCtaRewrites] = useState<string[] | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [infoToast, setInfoToast] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [platformScores, setPlatformScores] = useState<PlatformScore[]>([]);
  const [platformScoresLoading, setPlatformScoresLoading] = useState(false);
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);
  const [loadedFromHistory, setLoadedFromHistory] = useState<AnalysisRecord | null>(null);
  const [fixItResult, setFixItResult] = useState<FixItResult | null>(null);
  const [fixItLoading, setFixItLoading] = useState(false);
  const [safeZoneOpen, setSafeZoneOpen] = useState(false);
  const [staticImageDims, setStaticImageDims] = useState<{ width: number; height: number } | null>(null);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number } | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const rightPanelRef = useRef<OrganicRightPanelHandle>(null);
  const lastSavedRef = useRef<string | null>(null);
  const sessionMemoryRef = useRef<string>('');

  const { status, statusMessage, result, error, analysisError, analyze, download, copy, reset } = useVideoAnalyzer();
  const fileObjectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => { if (fileObjectUrl) URL.revokeObjectURL(fileObjectUrl); };
  }, [fileObjectUrl]);
  const thumbnailDataUrl = useThumbnail(file, fileObjectUrl);
  const isAnalyzing = status === "uploading" || status === "processing";

  // ── Organic context prefix ────────────────────────────────────────────────────
  const platformLabel = platform === "all" ? "all platforms" : platform;
  const contextPrefix = getOrganicContextPrefix(organicFormat, platformLabel);

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
    setSecondEyeOutput(null);
    setSecondEyeLoading(false);
    setDesignReviewResult(null);
    setDesignReviewLoading(false);
    setPlatformScores([]);
    setPlatformScoresLoading(false);
    setImageMismatch(false);
    setFixItResult(null);
    setFixItLoading(false);
    setPrediction(null);
    setStaticImageDims(null);
    setVideoDims(null);
  }, [reset]);

  // ── Auto-reset platform when format switches to static ──
  useEffect(() => {
    if (organicFormat === "static" && VIDEO_ONLY_PLATFORMS.has(platform)) {
      setPlatform("all" as Platform);
    }
  }, [organicFormat]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileWithCheck = useCallback((f: File | null) => {
    if (!f) { handleReset(); return; }
    setImageMismatch(false);
    const isImage = f.type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].some(e => f.name.toLowerCase().endsWith(e));
    const isVideo = f.type.startsWith("video/") || [".mp4", ".mov", ".webm"].some(e => f.name.toLowerCase().endsWith(e));

    if (isImage && organicFormat !== "static") {
      setOrganicFormat("static");
      setInfoToast("Detected static image — analyzing as Static");
      setTimeout(() => setInfoToast(null), 3000);
    } else if (isVideo && organicFormat !== "video") {
      setOrganicFormat("video");
      setInfoToast("Detected video — analyzing as Video");
      setTimeout(() => setInfoToast(null), 3000);
    }

    setFile(f); reset();
  }, [handleReset, reset, organicFormat]);

  useEffect(() => {
    if (status === "complete") setAnalysisCompletedAt(new Date());
  }, [status]);

  // ── Consolidated post-analysis: fires ALL secondary API calls in parallel ──
  const postAnalysisFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "complete" || !result) return;
    const key = `${result.fileName}-${result.timestamp.toISOString()}`;
    if (postAnalysisFiredRef.current === key) return;
    postAnalysisFiredRef.current = key;

    if (organicFormat === "video") {
      setSecondEyeLoading(true);
      setSecondEyeOutput(null);
      generateSecondEyeReview(
        result.markdown, result.fileName,
        result.scores ? { hook: result.scores.hook, overall: result.scores.overall } : undefined,
        result.improvements, userContext || undefined, sessionMemoryRef.current, true,
      ).then(setSecondEyeOutput).catch(() => setSecondEyeOutput(null)).finally(() => setSecondEyeLoading(false));
    }

    if (organicFormat === "static") {
      setDesignReviewLoading(true);
      setDesignReviewResult(null);
      generateStaticSecondEye(
        result.markdown, result.fileName,
        result.scores ? { overall: result.scores.overall, cta: result.scores.cta } : undefined,
        result.improvements, userContext || undefined, sessionMemoryRef.current, true,
      ).then(setDesignReviewResult).catch(() => setDesignReviewResult(null)).finally(() => setDesignReviewLoading(false));
    }

    setPlatformScoresLoading(true);
    setPlatformScores([]);
    (async () => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Platform scoring timeout (55s)')), 55000)
      );
      try {
        if (platform === 'all') {
          const videoPlatforms = ['tiktok', 'reels', 'shorts'];
          const staticPlatforms = ['meta', 'instagram', 'pinterest'];
          const plats = organicFormat === 'static' ? staticPlatforms : videoPlatforms;
          const results = await Promise.race([
            Promise.all(plats.map(p => generatePlatformScore(p, { markdown: result.markdown, scores: result.scores ?? { overall: 0 } }, result.fileName, organicFormat, userContext || undefined, rawUserContext?.niche, true))),
            timeout,
          ]);
          setPlatformScores(results);
        } else {
          const k = PLATFORM_SERVICE_MAP[platform as keyof typeof PLATFORM_SERVICE_MAP];
          if (k) {
            const score = await Promise.race([
              generatePlatformScore(k, { markdown: result.markdown, scores: result.scores ?? { overall: 0 } }, result.fileName, organicFormat, userContext || undefined, rawUserContext?.niche, true),
              timeout,
            ]);
            setPlatformScores([score]);
          }
        }
      } catch (err) { console.warn('Platform scoring timed out or failed:', err); }
      finally { setPlatformScoresLoading(false); }
    })();

    if (result.scores) {
      setPredictionLoading(true);
      generatePrediction(
        result.markdown, result.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        organicFormat, rawUserContext?.niche, undefined, true
      ).then(setPrediction).catch((err) => { console.error('Prediction failed:', err); setPrediction(null); }).finally(() => setPredictionLoading(false));
    }

  }, [status, result]); // eslint-disable-line

  useEffect(() => {
    if (status === "complete" && result) {
      const key = `${result.fileName}-${result.timestamp.toISOString()}`;
      if (lastSavedRef.current !== key) {
        lastSavedRef.current = key;
        addHistoryEntry({ fileName: result.fileName, timestamp: result.timestamp.toISOString(), scores: result.scores, markdown: result.markdown, thumbnailDataUrl: thumbnailDataUrl ?? undefined });
        const newCount = increment();
        if (newCount >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");
        saveAnalysis({
          file_name: result.fileName,
          file_type: organicFormat === 'static' ? 'static' : 'video',
          mode: 'organic',
          platform: platform || 'all',
          overall_score: result.scores?.overall ?? 0,
          scores: {
            hook: result.scores?.hook ?? 0,
            clarity: result.scores?.clarity ?? 0,
            cta: result.scores?.cta ?? 0,
            production: result.scores?.production ?? 0,
          },
          improvements: result.improvements ?? [],
          budget_recommendation: result.budget?.verdict ?? undefined,
        }).catch(console.error);
      }
    }
  }, [status, result, addHistoryEntry, increment, isPro, FREE_LIMIT, onUpgradeRequired, thumbnailDataUrl]); // eslint-disable-line

  useEffect(() => {
    if (status === "uploading") {
      setLoadedEntry(null);
      setBrief(null);
      setBriefError(null);
      setSecondEyeOutput(null);
      setPlatformScores([]);
      setPlatformScoresLoading(false);
    }
  }, [status]);

  const handleAnalyze = useCallback(async () => {
    if (!file || isAnalyzing || !canAnalyze) return;
    let sessionMemory = '';
    try {
      ({ text: sessionMemory } = await getSessionMemory());
    } catch { /* non-critical */ }
    sessionMemoryRef.current = sessionMemory;
    await analyze(file, API_KEY, contextPrefix, userContext || undefined, sessionMemory, "organic");
  }, [file, isAnalyzing, canAnalyze, analyze, contextPrefix]);

  useEffect(() => {
    if (file && status === "idle" && canAnalyze) handleAnalyze();
  }, [file]); // eslint-disable-line

  // ── Build activeResult ────────────────────────────────────────────────────────
  const liveResult: AnalysisResult | null = result
    ? { ...result, thumbnailDataUrl: thumbnailDataUrl ?? result.thumbnailDataUrl }
    : null;

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

  // ── Read static image dimensions from file (stable deps — won't cancel on thumbnail changes) ──
  useEffect(() => {
    if (organicFormat !== "static") {
      setStaticImageDims(null);
      return;
    }
    if (file && file.type.startsWith("image/")) {
      let cancelled = false;
      getImageDimensions(file)
        .then((d) => { if (!cancelled) setStaticImageDims(d); })
        .catch(() => { if (!cancelled) setStaticImageDims(null); });
      return () => { cancelled = true; };
    }
    // No file — dims will be set by the thumbnail fallback effect below
  }, [organicFormat, file]);

  // ── Fallback: read dims from thumbnail when loading from history (no file) ──
  useEffect(() => {
    if (organicFormat !== "static" || (file && file.type.startsWith("image/"))) return;
    const thumb = activeResult?.thumbnailDataUrl ?? thumbnailDataUrl;
    if (thumb) {
      let cancelled = false;
      getImageDimensionsFromSrc(thumb)
        .then((d) => { if (!cancelled) setStaticImageDims(d); })
        .catch(() => { if (!cancelled) setStaticImageDims(null); });
      return () => { cancelled = true; };
    }
    setStaticImageDims(null);
    return undefined;
  }, [organicFormat, file, activeResult?.thumbnailDataUrl, thumbnailDataUrl]);

  // ── Read video dimensions on file select ──────────────────────────────────
  useEffect(() => {
    if (organicFormat !== "video" || !file || !file.type.startsWith("video/")) {
      setVideoDims(null);
      return;
    }
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (!cancelled) setVideoDims({ width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      if (!cancelled) setVideoDims(null);
    };
    video.src = url;
    return () => { cancelled = true; };
  }, [organicFormat, file]);

  const showSafeZone = useMemo(() => {
    const isPortrait = (w: number, h: number) => Math.abs((w / h) - (9 / 16)) < 0.05;
    if (organicFormat === "static" && staticImageDims) {
      return isPortrait(staticImageDims.width, staticImageDims.height);
    }
    if (organicFormat === "video" && videoDims) {
      return isPortrait(videoDims.width, videoDims.height);
    }
    return false;
  }, [organicFormat, staticImageDims, videoDims]);

  const effectiveStatus = (loadedEntry || loadedFromHistory) ? "complete" : status;
  const showRightPanel = effectiveStatus === "complete" && activeResult !== null;

  // ── Score delta vs previous analysis ─────────────────────────────────────
  // Mirrors PaidAdAnalyzer.tsx:664-690. See plan §13 item 3 — extract to
  // src/hooks/useScoreDelta.ts during the shared-component pass.
  // Dims keys use ORGANIC_DIMENSIONS labels (Hook/Message/Visual/Brand) which
  // ScoreHero.tsx:71 maps to the {hook, clarity, production, cta} score fields.
  const scoreDelta = useMemo(() => {
    if (loadedEntry) return null;
    const currentScores = activeResult?.scores;
    if (!currentScores) return null;
    const prevEntry = historyEntries.find(e => e.scores != null);
    if (!prevEntry?.scores) return null;
    const overall = Math.round((currentScores.overall - prevEntry.scores.overall) * 10) / 10;
    const diffMs = Date.now() - new Date(prevEntry.timestamp).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const label = diffDays >= 1
      ? `vs ${diffDays} day${diffDays === 1 ? '' : 's'} ago`
      : diffHours >= 1 ? `vs ${diffHours}h ago`
      : diffMins >= 1  ? `vs ${diffMins}m ago`
      : 'vs last analysis';
    return {
      overall,
      label,
      dims: {
        'Hook':    Math.round((currentScores.hook       - prevEntry.scores.hook)       * 10) / 10,
        'Message': Math.round((currentScores.clarity    - prevEntry.scores.clarity)    * 10) / 10,
        'Visual':  Math.round((currentScores.production - prevEntry.scores.production) * 10) / 10,
        'Brand':   Math.round((currentScores.cta        - prevEntry.scores.cta)        * 10) / 10,
      },
    };
  }, [activeResult?.scores, historyEntries, loadedEntry]);

  useEffect(() => {
    registerCallbacks({
      onNewAnalysis: handleReset,
      onHistoryOpen: () => setHistoryOpen(true),
      hasResult: showRightPanel,
    });
  }, [registerCallbacks, handleReset, showRightPanel]);

  const handleCopy = async () => {
    if (loadedEntry) await copyToClipboard(loadedEntry.markdown); else await copy();
  };

  const handleDownload = () => {
    if (activeResult) downloadMarkdown(activeResult); else download();
  };
  void handleDownload;

  const handleGenerateBrief = async () => {
    if (!activeResult || briefLoading) return;
    setBriefLoading(true); setBriefError(null);
    try {
      const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName, userContext || undefined, sessionMemoryRef.current, organicFormat, platform, true);
      setBrief(r);
      rightPanelRef.current?.setTab("brief");
    } catch {
      try {
        const r = await generateBrief(activeResult.markdown, API_KEY, undefined, undefined, undefined, undefined, undefined, true);
        setBrief(r);
        rightPanelRef.current?.setTab("brief");
      } catch (err) {
        setBriefError(err instanceof Error ? err.message : "Failed to generate brief.");
        rightPanelRef.current?.setTab("brief");
      }
    } finally { setBriefLoading(false); }
  };

  const handleCTARewrite = async () => {
    if (!activeResult || ctaLoading) return;
    setCtaLoading(true);
    try {
      const ctaSection = activeResult.markdown.match(/CTA[\s\S]*?(?=\n##|\n---)/i)?.[0] ?? "";
      setCtaRewrites(await generateCTARewrites(ctaSection, activeResult.fileName, userContext || undefined, sessionMemoryRef.current, "organic"));
    } catch (err) {
      console.error('CTA rewrite failed:', err);
      setRateLimitError('CTA rewrite failed. Please try again.');
      setTimeout(() => setRateLimitError(null), 5000);
    } finally { setCtaLoading(false); }
  };

  const handleBriefCopy = async () => {
    if (!brief) return;
    await copyToClipboard(brief); setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 2000);
  };
  void handleBriefCopy; void briefCopied;

  const handleAddToSwipeFile = () => {
    if (!activeResult) return;
    addSwipeItem({ fileName: activeResult.fileName, timestamp: activeResult.timestamp.toISOString(), scores: activeResult.scores, markdown: activeResult.markdown, brand: "", format: "", niche: "", platform: "", tags: [], notes: "" });
    setInfoToast("Saved to your library");
    setTimeout(() => setInfoToast(null), 2500);
  };

  const handleFixIt = async () => {
    if (!activeResult?.markdown || !activeResult?.scores || fixItLoading) return;
    setFixItLoading(true);
    try {
      const r = await generateFixIt(
        activeResult.markdown, activeResult.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        rawUserContext?.niche, undefined, organicFormat, true,
      );
      setFixItResult(r);
    } catch (err) {
      console.error("Fix It failed:", err);
      setRateLimitError(err instanceof Error ? err.message : "Fix It failed. Please try again.");
      setTimeout(() => setRateLimitError(null), 5000);
    } finally { setFixItLoading(false); }
  };

  const importFromUrl = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed || isAnalyzing || isImporting) return;
    let parsed: URL;
    try { parsed = new URL(trimmed); } catch { setUrlError("Enter a valid URL."); return; }
    if (parsed.protocol !== "https:") { setUrlError("Only HTTPS URLs are allowed."); return; }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" || host === "127.0.0.1" || host === "[::1]" ||
      host.endsWith(".local") || host.endsWith(".internal") ||
      /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.)/.test(host) ||
      host === "metadata.google.internal" || host === "169.254.169.254"
    ) { setUrlError("This URL is not allowed."); return; }
    setIsImporting(true); setUrlError(null);
    try {
      const res = await fetch(trimmed);
      if (!res.ok) { setUrlError("Could not fetch video from this URL."); return; }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("video/")) { setUrlError("This link does not appear to be a direct video URL."); return; }
      const blob = await res.blob();
      const guessedName = parsed.pathname.split("/").filter(Boolean).pop() || "video-from-url.mp4";
      setFile(new File([blob], guessedName, { type: contentType || "video/mp4" })); reset();
    } catch { setUrlError("Could not fetch video from this URL."); }
    finally { setIsImporting(false); }
  };
  void urlInput; void urlError; void isImporting;
  void imageMismatch; void secondEyeOutput; void secondEyeLoading;
  void designReviewResult; void designReviewLoading;

  return (
    <div className="flex h-full min-h-0">
      <Helmet>
        <title>Organic Content Analyzer — Cutsheet</title>
        <meta name="description" content="Score TikTok, Instagram Reels, and YouTube Shorts for retention, shareability, and algorithm signals." />
        <link rel="canonical" href="https://cutsheet.xyz/app/organic" />
      </Helmet>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-auto">
          {status === "idle" && !loadedEntry ? (
            <OrganicEmptyState
              onFileSelect={(f) => handleFileWithCheck(f)}
              onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
            />
          ) : (
            <div className={`relative flex flex-col ${(effectiveStatus === "uploading" || effectiveStatus === "processing") ? "h-full" : "px-4 py-6 md:px-8 min-h-full"}`}>
              {effectiveStatus !== "uploading" && effectiveStatus !== "processing" && (
                <>
                  <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
                  <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />
                </>
              )}
              <div className="relative flex flex-col flex-1">
                <AnalyzerView
                  file={file}
                  status={effectiveStatus}
                  statusMessage={statusMessage || STATUS_COPY[status]}
                  result={activeResult}
                  error={error}
                  analysisError={analysisError}
                  thumbnailDataUrl={activeResult?.thumbnailDataUrl ?? thumbnailDataUrl ?? undefined}
                  fileObjectUrl={fileObjectUrl ?? undefined}
                  onFileSelect={(f) => handleFileWithCheck(f)}
                  onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
                  onAnalyze={handleAnalyze}
                  onReset={handleReset}
                  onGenerateBrief={handleGenerateBrief}
                  onAddToSwipeFile={handleAddToSwipeFile}
                  historyEntries={historyEntries}
                  onHistoryEntryClick={(entry) => setLoadedEntry(entry)}
                  icon={TrendingUp}
                  format={organicFormat}
                  isOrganic
                  designReviewData={designReviewResult ? {
                    flags: designReviewResult.flags ?? [],
                    topIssue: designReviewResult.topIssue,
                    overallDesignVerdict: designReviewResult.overallDesignVerdict,
                  } : undefined}
                  secondEyeResult={secondEyeOutput ? {
                    scrollMoment: secondEyeOutput.scrollMoment,
                    flags: secondEyeOutput.flags,
                    whatItCommunicates: secondEyeOutput.whatItCommunicates,
                    whatItFails: secondEyeOutput.whatItFails,
                  } : undefined}
                  secondEyeLoading={secondEyeLoading}
                  platformScores={platformScores}
                  platformScoresLoading={platformScoresLoading}
                  onSafeZone={showSafeZone ? () => setSafeZoneOpen(true) : undefined}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <OrganicRightPanel
        ref={rightPanelRef}
        showRightPanel={showRightPanel}
        activeResult={activeResult}
        analysisCompletedAt={analysisCompletedAt}
        platform={platform}
        organicFormat={organicFormat}
        isPro={isPro}
        platformScores={platformScores}
        platformScoresLoading={platformScoresLoading}
        onPlatformChange={(p) => setPlatform(p)}
        brief={brief}
        briefLoading={briefLoading}
        briefError={briefError}
        ctaRewrites={ctaRewrites}
        ctaLoading={ctaLoading}
        fixItResult={fixItResult}
        fixItLoading={fixItLoading}
        prediction={prediction}
        predictionLoading={predictionLoading}
        scoreDelta={scoreDelta}
        rawUserContext={rawUserContext}
        onGenerateBrief={handleGenerateBrief}
        onAddToSwipeFile={handleAddToSwipeFile}
        onCTARewrite={handleCTARewrite}
        onShare={handleCopy}
        onFixIt={handleFixIt}
        onReset={handleReset}
        onUpgradeRequired={onUpgradeRequired}
      />

      <HistoryDrawer
        open={historyOpen}
        entries={historyEntries}
        onClose={() => setHistoryOpen(false)}
        onSelect={(entry) => setLoadedEntry(entry)}
        onDelete={deleteHistoryEntry}
        onClearAll={clearAllHistory}
        isDark={true}
      />

      {rateLimitError && (
        <div role="alert" aria-live="assertive" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs font-mono text-red-400 shadow-lg z-[100]">
          {rateLimitError}
        </div>
      )}
      {infoToast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]">
          {infoToast}
        </div>
      )}

      <SafeZoneModal
        open={safeZoneOpen}
        onClose={() => setSafeZoneOpen(false)}
        thumbnailSrc={thumbnailDataUrl ?? undefined}
        mode="organic"
      />
    </div>
  );
}
