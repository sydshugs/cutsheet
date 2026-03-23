// src/pages/app/OrganicAnalyzer.tsx
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { TrendingUp, RotateCcw } from "lucide-react";
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
  generatePlatformScore, type PlatformScore,
  type SecondEyeResult,
} from "../../services/claudeService";
import { SecondEyePanel } from "../../components/SecondEyePanel";
import PlatformScoreCard from "../../components/PlatformScoreCard";
import { ORGANIC_STATIC_PLATFORMS, VIDEO_ONLY_PLATFORMS } from "../../components/PlatformSwitcher";
import { generateFixIt, type FixItResult } from "../../services/fixItService";
import { generatePrediction, type PredictionResult } from "../../services/predictionService";
import { createShare } from "../../services/shareService";
import { saveAnalysis } from "../../services/historyService";
import type { AnalysisRecord } from "../../services/historyService";
import { checkShareLimit, incrementShareCount } from "../../utils/rateLimiter";
import { getUserContext, formatUserContextBlock } from "../../services/userContextService";
import { getSessionMemory } from "@/src/lib/userMemoryService";
import type { AppSharedContext } from "../../components/AppLayout";

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

// IntentHeader removed — platform defaults to "all", auto-detected post-analysis

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function OrganicEmptyState({
  onFileSelect, onUrlSubmit,
}: {
  onFileSelect: (f: File | null) => void;
  onUrlSubmit?: (url: string) => void;
}) {
  const PILLS = ["Retention score", "Platform fit", "Shareability"];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", minHeight: "calc(100vh - 120px)" }}>
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TrendingUp size={28} color="#10b981" />
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginTop: 20, marginBottom: 0 }}>
        Score your organic content
      </h1>
      <p style={{ fontSize: 14, color: "#a1a1aa", textAlign: "center", maxWidth: 320, marginTop: 10, lineHeight: 1.6 }}>
        Upload a video or static creative. Get a full AI breakdown in 30 seconds.
      </p>

      {/* Feature pills — green styled like paid page purple */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
        {PILLS.map((pill) => (
          <span key={pill} style={{ fontSize: 12, color: "#34d399", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 9999, padding: "4px 12px" }}>
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

export default function OrganicAnalyzer() {
  const {
    addHistoryEntry, historyEntries, deleteHistoryEntry, clearAllHistory,
    addSwipeItem, canAnalyze, isPro, increment, FREE_LIMIT,
    onUpgradeRequired, registerCallbacks,
  } = useOutletContext<AppSharedContext>();
  const navigate = useNavigate();

  const [organicFormat, setOrganicFormat] = useState<"video" | "static">("video");
  const [imageMismatch, setImageMismatch] = useState(false);

  // ── User context for personalized AI ──────────────────────────────────────
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
  const [platformScores, setPlatformScores] = useState<PlatformScore[]>([]);
  const [platformScoresLoading, setPlatformScoresLoading] = useState(false);
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [loadedFromHistory, setLoadedFromHistory] = useState<AnalysisRecord | null>(null);
  const [fixItResult, setFixItResult] = useState<FixItResult | null>(null);
  const [fixItLoading, setFixItLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const sessionMemoryRef = useRef<string>('');

  const { status, statusMessage, result, error, analysisError, analyze, download, copy, reset } = useVideoAnalyzer();
  const thumbnailDataUrl = useThumbnail(file);
  const isAnalyzing = status === "uploading" || status === "processing";

  // ── Organic context prefix (always prepended) ─────────────────────────────
  const platformLabel = platform === "all" ? "all platforms" : platform;
  const contextPrefix = organicFormat === "static"
    ? `This is an ORGANIC static image post (not a paid ad, not a video).\nScore for: visual stopping power in a feed scroll, caption hook effectiveness, save-worthiness, shareability, and platform-native feel for ${platformLabel}.\nDo NOT apply paid ad or video scoring criteria.\nThere is no retention curve or scene breakdown for static content.\nDo NOT include a budget recommendation. This is organic content — there is no ad spend.`
    : `This is an ORGANIC content video (not a paid ad).\nScore for: entertainment value, native feel, retention curve, shareability, and algorithm signals for ${platformLabel}.\nDo NOT apply paid ad scoring criteria.\nScore as if a viewer found this organically on their feed.\nDo NOT include a budget recommendation. This is organic content — there is no ad spend.`;

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
    setPlatformScores([]);
    setPlatformScoresLoading(false);
    setImageMismatch(false);
    setFixItResult(null);
    setFixItLoading(false);
    setPrediction(null);
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

    // Auto-switch format silently + show toast (same as Paid Ad)
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

  // Fresh Viewer Review: fires automatically when analysis completes
  useEffect(() => {
    if (status === "complete" && result) {
      if (secondEyeLoading) return; // guard: prevent concurrent calls
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
  }, [status, result]); // eslint-disable-line

  // Platform scoring: fires after analysis completes
  useEffect(() => {
    if (status !== 'complete' || !result) return;
    if (platformScoresLoading) return;

    const run = async () => {
      setPlatformScoresLoading(true);
      setPlatformScores([]);
      try {
        if (platform === 'all') {
          const [t, r, s] = await Promise.all([
            generatePlatformScore('tiktok', result, result.fileName),
            generatePlatformScore('reels', result, result.fileName),
            generatePlatformScore('shorts', result, result.fileName),
          ]);
          setPlatformScores([t, r, s]);
        } else {
          const key = PLATFORM_SERVICE_MAP[platform as keyof typeof PLATFORM_SERVICE_MAP];
          if (!key) return;
          const score = await generatePlatformScore(key, result, result.fileName);
          setPlatformScores([score]);
        }
      } catch (err) {
        console.error('Platform scoring failed:', err);
      } finally {
        setPlatformScoresLoading(false);
      }
    };
    run();
  }, [status, result, platform]); // eslint-disable-line

  useEffect(() => {
    if (status === "complete" && result) {
      const key = `${result.fileName}-${result.timestamp.toISOString()}`;
      if (lastSavedRef.current !== key) {
        lastSavedRef.current = key;
        addHistoryEntry({ fileName: result.fileName, timestamp: result.timestamp.toISOString(), scores: result.scores, markdown: result.markdown, thumbnailDataUrl: thumbnailDataUrl ?? undefined });
        const newCount = increment();
        if (newCount >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");
        // Fire and forget — do not await, do not block UI
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
          second_eye_review: secondEyeOutput ? JSON.stringify(secondEyeOutput) : undefined,
        });
        setHistoryRefreshKey(k => k + 1);
      }
    }
  }, [status, result, addHistoryEntry, increment, isPro, FREE_LIMIT, onUpgradeRequired, thumbnailDataUrl]); // eslint-disable-line

  useEffect(() => {
    if (status === "uploading") {
      setLoadedEntry(null);
      setBrief(null);
      setBriefError(null);
      setRightTab("analysis");
      setSecondEyeOutput(null);
      setPlatformScores([]);
      setPlatformScoresLoading(false);
    }
  }, [status]);

  // NOTE: handleAnalyze declared before the auto-analyze useEffect
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
    if (file && status === "idle" && canAnalyze) handleAnalyze();
  }, [file]); // eslint-disable-line

  // Build activeResult
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

  const effectiveStatus = (loadedEntry || loadedFromHistory) ? "complete" : status;
  const showRightPanel = effectiveStatus === "complete" && activeResult !== null;

  useEffect(() => {
    registerCallbacks({
      onNewAnalysis: handleReset,
      onHistoryOpen: () => setHistoryOpen(true),
      hasResult: showRightPanel,
    });
  }, [registerCallbacks, handleReset, showRightPanel]);

  const handleCopy = async () => {
    if (loadedEntry) await copyToClipboard(loadedEntry.markdown); else await copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (activeResult) downloadMarkdown(activeResult); else download();
  };
  void handleDownload;

  const handleExportPdf = async () => {
    setInfoToast("PDF export coming soon — we're working on it.");
    setTimeout(() => setInfoToast(null), 3000);
  };

  const handleGenerateBrief = async () => {
    if (!activeResult || briefLoading) return;
    setBriefLoading(true); setBriefError(null);
    try {
      const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName, userContext || undefined, sessionMemoryRef.current);
      setBrief(r); setRightTab("brief");
    } catch {
      try { const r = await generateBrief(activeResult.markdown, API_KEY); setBrief(r); setRightTab("brief"); }
      catch (err) { setBriefError(err instanceof Error ? err.message : "Failed to generate brief."); }
    } finally { setBriefLoading(false); }
  };

  const handleCTARewrite = async () => {
    if (!activeResult || ctaLoading) return;
    setCtaLoading(true);
    try {
      const ctaSection = activeResult.markdown.match(/CTA[\s\S]*?(?=\n##|\n---)/i)?.[0] ?? "";
      setCtaRewrites(await generateCTARewrites(ctaSection, activeResult.fileName, userContext || undefined, sessionMemoryRef.current));
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
      const result = await generateFixIt(
        activeResult.markdown,
        activeResult.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        rawUserContext?.niche,
        undefined,
        "video",
      );
      setFixItResult(result);
    } catch (err) {
      console.error("Fix It failed:", err);
      setRateLimitError(err instanceof Error ? err.message : "Fix It failed. Please try again.");
      setTimeout(() => setRateLimitError(null), 5000);
    } finally {
      setFixItLoading(false);
    }
  };

  // Auto-fire prediction when analysis completes
  useEffect(() => {
    if (status === "complete" && result?.markdown && result?.scores && !prediction) {
      generatePrediction(
        result.markdown,
        result.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        "video",
        rawUserContext?.niche,
      ).then(setPrediction).catch(console.error);
    }
  }, [status, result, prediction, platform, rawUserContext]);

  const handleShareLink = async () => {
    if (!activeResult || shareLoading) return;
    const { allowed, resetAt } = checkShareLimit();
    if (!allowed) { setRateLimitError(`Share limit reached. Resets at ${resetAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`); setTimeout(() => setRateLimitError(null), 5000); return; }
    setShareLoading(true); setRateLimitError(null);
    try {
      const slug = await createShare({ file_name: activeResult.fileName, scores: activeResult.scores, markdown: activeResult.markdown });
      await navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
      incrementShareCount(); setShareToast(true); setTimeout(() => setShareToast(false), 3000);
    } catch (err) { setRateLimitError(err instanceof Error ? err.message : "Failed to create share link"); setTimeout(() => setRateLimitError(null), 5000); }
    finally { setShareLoading(false); }
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

  return (
    <div className="flex h-full" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Organic Content Analyzer — Cutsheet</title>
        <meta name="description" content="Score TikTok, Instagram Reels, and YouTube Shorts for retention, shareability, and algorithm signals." />
        <link rel="canonical" href="https://cutsheet.xyz/app/organic" />
      </Helmet>
      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* IntentHeader removed — platform defaults to "all" */}
        <div className="flex-1 flex flex-col overflow-auto">
          {status === "idle" && !loadedEntry ? (
            <OrganicEmptyState
              onFileSelect={(f) => handleFileWithCheck(f)}
              onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
            />
          ) : (
            <div className={`relative flex flex-col ${(effectiveStatus === "uploading" || effectiveStatus === "processing") ? "h-full" : "px-4 py-6 md:px-8 min-h-full"}`}>
              <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[120px]" />
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
                  onFileSelect={(f) => handleFileWithCheck(f)}
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
                  icon={TrendingUp}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className={`shrink-0 bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/5 ${showRightPanel ? "w-[440px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"}`}>
        {showRightPanel && activeResult?.scores && rightTab === "analysis" && (
          <>
            <div ref={scorecardRef}>
              <ScoreCard
                scores={activeResult.scores}
                hookDetail={activeResult.hookDetail}
                improvements={activeResult.improvements}
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
                format={organicFormat}
                isOrganic={true}
                niche={rawUserContext?.niche}
                platform={rawUserContext?.platform}
                onFixIt={handleFixIt}
                fixItResult={fixItResult}
                fixItLoading={fixItLoading}
                prediction={prediction}
                onStartOver={handleReset}
                canVisualize={false}
              />
            </div>
            {/* Second Eye output below scorecard */}
            {(secondEyeOutput || secondEyeLoading) && (
              <SecondEyePanel result={secondEyeOutput} loading={secondEyeLoading} />
            )}
            <PlatformScoreCard
              scores={platformScores}
              loading={platformScoresLoading}
              platform={platform}
            />
          </>
        )}

        {showRightPanel && rightTab === "brief" && (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <button type="button" onClick={() => setRightTab("analysis")} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">← Back to Scores</button>
              <span className="text-xs text-zinc-600 font-mono">Claude Sonnet</span>
            </div>
            {briefLoading && !brief && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs text-zinc-500">Generating creative brief...</span>
              </div>
            )}
            {briefError && <div className="px-5 py-4"><p className="text-xs text-red-400">{briefError}</p></div>}
            {brief && (
              <>
                <div className="px-5 pt-5 pb-2 flex-1 overflow-y-auto">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Creative Brief</p>
                  <div className="flex flex-col gap-0.5">
                    {brief.split("\n").map((line, i) => {
                      const t = line.trim();
                      if (!t) return null;
                      if (t.startsWith("## ")) return <p key={i} className="text-xs font-semibold text-white mt-4 mb-1">{t.replace(/^##\s*/, "")}</p>;
                      const boldMatch = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                      if (boldMatch) return <div key={i} className="mb-3"><p className="text-xs text-zinc-500 font-medium">{boldMatch[1]}</p>{boldMatch[2] && <p className="text-xs text-zinc-300 leading-relaxed mt-0.5">{boldMatch[2]}</p>}</div>;
                      if (t.startsWith("- ") || t.startsWith("* ")) return <div key={i} className="flex gap-2 items-start ml-1 mb-1"><span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-zinc-400 leading-relaxed">{t.replace(/^[-*]\s*/, "")}</span></div>;
                      if (t === "---") return <div key={i} className="border-t border-white/5 my-3" />;
                      return <p key={i} className="text-xs text-zinc-300 leading-relaxed mb-1">{t}</p>;
                    })}
                  </div>
                </div>
                <div className="p-5 border-t border-white/5">
                  <button type="button" onClick={handleBriefCopy} className="w-full py-2 px-3 bg-transparent border border-white/10 rounded-lg text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-150 cursor-pointer">
                    {briefCopied ? "Copied!" : "Copy Brief"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Analyze another — sticky at bottom of right panel */}
        {showRightPanel && (
          <div style={{ position: "sticky", bottom: 0, padding: "0 16px 16px", background: "linear-gradient(transparent, rgba(9,9,11,0.95) 8px)" }}>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Analyze another creative"
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

      <HistoryDrawer open={historyOpen} entries={historyEntries} onClose={() => setHistoryOpen(false)} onSelect={(entry) => setLoadedEntry(entry)} onDelete={deleteHistoryEntry} onClearAll={clearAllHistory} isDark={true} />

      {shareToast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]">
          Link copied to clipboard
        </div>
      )}
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
    </div>
  );
}
