// src/pages/app/PaidAdAnalyzer.tsx
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { RotateCcw, Upload, Sparkles, Lock, Zap } from "lucide-react";
import PaidRightPanel, { type PaidRightPanelHandle } from "../../components/paid/PaidRightPanel";
import { Toast } from "../../components/Toast";
import { AnalyzerView } from "../../components/AnalyzerView";
import { ScoreCard } from "../../components/ScoreCard";
import { VideoDropzone } from "../../components/VideoDropzone";
import { HistoryDrawer } from "../../components/HistoryDrawer";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { motion, AnimatePresence } from "framer-motion";
import { useVideoAnalyzer } from "../../hooks/useVideoAnalyzer";
import { type HistoryEntry } from "../../hooks/useHistory";
import { useThumbnail } from "../../hooks/useThumbnail";
import {
  downloadMarkdown, copyToClipboard,
  parseImprovements, parseBudget, parseHashtags,
  type AnalysisResult,
} from "../../services/analyzerService";
import { VIDEO_ONLY_PLATFORMS } from "../../components/PlatformSwitcher";
import { type YouTubeFormat } from "../../components/YouTubeFormatSelector";
import { VisualizePanel } from "../../components/VisualizePanel";
import { useVisualize } from "../../hooks/useVisualize";
import { SafeZoneModal } from "../../components/SafeZoneModal";
import { getImageDimensions, getImageDimensionsFromSrc } from "../../utils/getImageDimensions";
import { generateComparison, type ComparisonResult } from "../../services/claudeService";
import type { AnalysisRecord } from "../../services/historyService";
import { getUserContext, formatUserContextBlock } from "../../services/userContextService";
import { getSessionMemory } from "@/src/lib/userMemoryService";
import type { AppSharedContext } from "../../components/AppLayout";
import { cn } from "../../lib/utils";
import { usePostAnalysis } from "../../hooks/usePostAnalysis";

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze

const PLATFORMS = ["all", "Meta", "TikTok", "Google", "YouTube"] as const;
type Platform = (typeof PLATFORMS)[number] | "Google" | "Instagram" | "Facebook" | "Shorts" | "Reels";
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
  const PILLS = ["Score any format", "Platform benchmarks", "Priority fix list"];
  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8",
        "min-h-[min(100%,calc(100vh-120px))]"
      )}
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--analyzer-idle-ambient-paid)" }}
        aria-hidden
      />
      <div className="relative z-[1] flex w-full max-w-[731px] flex-col items-center">
        {/* Icon tile — Figma 216:137 */}
        <div
          className={cn(
            "flex size-[73px] shrink-0 items-center justify-center rounded-[15px] border border-[color:var(--accent-border)]",
            "bg-[var(--accent-subtle)]"
          )}
        >
          <Zap className="size-[27px] text-[color:var(--accent)]" strokeWidth={1.75} aria-hidden />
        </div>

        <h1 className="mt-[23px] mb-0 text-center text-[19px] font-semibold leading-tight text-[color:var(--ink)]">
          Score your paid ad
        </h1>
        <p className="mt-2.5 mb-0 max-w-[276px] text-center text-[13.5px] leading-[1.6] text-[color:var(--ink-muted)]">
          Upload a video or static creative. Get a full AI breakdown in 30 seconds.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className={cn(
                "rounded-full border border-[color:var(--accent-border)] bg-[var(--accent-subtle)]",
                "px-3 py-1 text-[11.5px] font-normal leading-[15px] text-[color:var(--accent-light)]"
              )}
            >
              {pill}
            </span>
          ))}
        </div>

        <div className="mt-8 w-full max-w-[731px]">
          <VideoDropzone
            onFileSelect={onFileSelect}
            file={null}
            onUrlSubmit={onUrlSubmit}
            acceptImages
            layoutVariant="hero"
            wrapperClassName="max-w-none"
          />
        </div>
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
  const [youtubeFormat, setYoutubeFormat] = useState<YouTubeFormat>("skippable");
  const [ctaFree, setCtaFree] = useState(false);
  // ── Before/After re-analysis state
  const [reanalyzeMode, setReanalyzeMode] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [originalScoresSnapshot, setOriginalScoresSnapshot] = useState<{ overall: number; hook: number; cta: number; clarity: number; production: number } | null>(null);
  const [originalImprovementsSnapshot, setOriginalImprovementsSnapshot] = useState<string[]>([]);
  // ── Local analyzer state ───────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState<HistoryEntry | null>(null);
  // rightTab state lives inside PaidRightPanel — use ref to drive it from outside
  const rightPanelRef = useRef<PaidRightPanelHandle | null>(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const [rateLimitError] = useState<string | null>(null);
  const [localInfoToast, setLocalInfoToast] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [loadedFromHistory, setLoadedFromHistory] = useState<AnalysisRecord | null>(null);
  const [confirmStartOver, setConfirmStartOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // ── Safe Zone state ───────────────────────────────────────────────────────
  const [safeZoneOpen, setSafeZoneOpen] = useState(false);
  const [staticImageDims, setStaticImageDims] = useState<{ width: number; height: number } | null>(null);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number } | null>(null);

  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const prevPlatformRef = useRef<Platform>(platform);
  const sessionMemoryRef = useRef<string>('');

  const { status, statusMessage, result, error, analysisError, analyze, download, copy, reset } = useVideoAnalyzer();
  const fileObjectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => { if (fileObjectUrl) URL.revokeObjectURL(fileObjectUrl); };
  }, [fileObjectUrl]);
  const thumbnailDataUrl = useThumbnail(file, fileObjectUrl);

  const isAnalyzing = status === "uploading" || status === "processing";

  // ── Derived: liveResult + activeResult (needed before hook calls) ─────────
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

  // Re-analyze handler: upload improved version, score, compare
  const handleReanalyze = async (improvedFile: File) => {
    if (!activeResult?.scores) return;
    // Capture snapshot locally — setState is async so we can't read it back immediately
    const origScores = originalScoresSnapshot ?? { ...activeResult.scores };
    const origImprovements = originalImprovementsSnapshot ?? (activeResult.improvements ?? []);
    if (!originalScoresSnapshot) {
      setOriginalScoresSnapshot(origScores);
      setOriginalImprovementsSnapshot(origImprovements);
    }
    setComparisonLoading(true);
    setComparisonResult(null);
    try {
      const improvedResult = await analyze(improvedFile, API_KEY, contextPrefix, userContext || undefined, sessionMemoryRef.current);
      // Generate comparison using local snapshot (not state which may not have updated yet)
      if (improvedResult?.scores) {
        const comp = await generateComparison(
          origScores,
          improvedResult.scores,
          origImprovements,
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
  const contextPrefix = (() => {
    const base = platform !== "all"
      ? `This is a PAID ${format} ad for ${platform}.\nScore and optimize specifically for ${platform} performance.\nApply ${platform}-specific improvement suggestions.\nFocus on CTR, ROAS, and conversion potential.`
      : `This is a PAID ${format} ad.\nScore for performance marketing metrics: CTR, ROAS, conversion potential, and ad spend efficiency.\nApply cross-platform best practices.`;

    // Meta static: remove CTA requirement, score visual signals only
    if (platform === "Meta" && format === "static") {
      return base + `\n\nThis is a META PAID STATIC AD (image creative only).
IMPORTANT: Meta's ad unit places the CTA button, primary text, and headline OUTSIDE this image in Ads Manager.
Do NOT penalize the absence of in-creative CTA text — it is intentionally absent in most static ads.
Do NOT score copy depth — the primary copy lives in Ads Manager fields, not in the image.
Score only what is IN the image: visual thumb-stop power, message clarity at a glance, visual hierarchy, and brand recognition.
The question is: does this image stop the scroll and communicate the offer before the viewer moves on?
If a CTA IS present inside the creative, note it as a positive signal ("In-creative CTA detected — complements Meta's native button") but do not penalize its absence.
For "CTA Effectiveness" scoring: score the image's ability to drive action through visual urgency, offer clarity, and desire — NOT the presence of CTA text.
Meta's Andromeda algorithm uses the creative as the targeting signal — visual relevance and thumb-stop power directly impact delivery efficiency.`;
    }

    // YouTube format-specific prompt context
    if ((platform === "YouTube" || platform === "Shorts") && format === "video") {
      const ytPrompts: Record<YouTubeFormat, string> = {
        skippable: `This is a YouTube SKIPPABLE IN-STREAM ad. Viewers can skip after 5 seconds.
The first 5 seconds are the most critical — brand must be visible and value prop clear before the skip button appears.
Target VTR: 35%+. Average is 31.9%. Score accordingly.
CTA should appear before expected drop-off point, not only at the end.
Score dimensions: Pre-Skip Hook (brand visible + value prop in first 5s), Watch-Through (will viewers stay past 5s?), Message Arc (does story build for viewers who stay?), CTA Timing (CTA placed before expected drop-off).`,
        non_skippable: `This is a YouTube NON-SKIPPABLE ad (7–15 seconds). Viewers cannot skip.
One idea. One visual. One takeaway. No wasted moments.
Brand must be unmistakable within 3 seconds.
CTA must land within 12 seconds.
Score dimensions: Message Clarity (single idea in 15s), Brand Visibility (unmistakable within 3s), CTA Efficiency (clear action within 12s), Visual Impact (commands attention).`,
        bumper: `This is a YouTube BUMPER AD (max 6 seconds, non-skippable).
No narrative is possible in 6 seconds. Score only on brand recall and impression strength.
Do NOT score for CTA, copy depth, or story arc — these are impossible in this format.
The only question: will this 6-second exposure be remembered?
Score dimensions: Brand Recall (will this be remembered?), Visual Simplicity (one image, no competing elements), Message (single idea communicated instantly), Audio Branding (sonic identity that reinforces recall).`,
        shorts: `This is a YouTube SHORTS AD (vertical 9:16, non-skippable, under 60s).
Behavior is similar to TikTok: hold rate and completion are the primary algorithm signals.
Vertical format and mobile-first composition are required, not optional.
Score dimensions: Hook (stops scroll in first 3s), Hold Rate (will viewers watch to end?), Format Fit (native 9:16, properly composed for vertical), End Action (drives subscribe, click, or next-video).`,
        in_feed: `This is a YouTube IN-FEED (Discovery) ad. Users choose to click based on thumbnail + title.
This is intent-based — the viewer chose to watch. Score for delivering on the implicit promise.
Thumbnail appeal and title strength matter more here than for any other YouTube format.
Score dimensions: Thumbnail Appeal (would this get clicked?), Title Strength (creates curiosity or answers search intent?), First 5 Seconds (delivers on thumbnail/title promise?), Watch-Worthiness (worth spending time on?).`,
      };
      return base + '\n\n' + ytPrompts[youtubeFormat];
    }

    // Sound-off check for Meta video
    if (platform === "Meta" && format === "video") {
      const soundOff = `\n\nSOUND-OFF CHECK: A significant portion of Meta feed is watched muted.
Evaluate whether this ad communicates its full message when watched muted.
Are captions or text overlays present and readable? Does the visual storytelling convey the narrative without sound?
Would a muted viewer understand the hook, offer, and CTA?
Score "Message Clarity" as a sound-off readability signal — a great Meta video ad works with AND without sound.
8-10: Full captions + strong visual narrative. Works perfectly muted.
5-7: Partial captions or text overlays. Message partially survives mute.
1-4: Audio-dependent. Muted viewer would miss the core message.`;

      const ctaFreeContext = ctaFree ? `\n\nCTA-FREE AD: The advertiser has confirmed this Meta video ad intentionally has no in-creative CTA — it relies on Meta's native CTA button displayed below the ad in Ads Manager.
Do NOT penalize the absence of in-creative CTA text, button, or verbal call-to-action.
For "CTA Effectiveness" scoring: score the creative's ability to communicate the offer clearly and generate desire for action — NOT the presence of CTA copy inside the frame. An ad that makes the viewer instinctively want to click IS effective, even without saying "Shop Now."
Do NOT include any suggestion to "add a CTA," "include a call-to-action," or "add a Shop Now button" in the IMPROVEMENTS section.` : "";

      return base + soundOff + ctaFreeContext;
    }

    // Sound-off + audio strategy for TikTok
    if (platform === "TikTok" && format === "video") {
      return base + `\n\nAUDIO & CAPTIONS CHECK: TikTok users frequently watch with phone on silent.
Evaluate TWO aspects of the audio dimension:
1. AUDIO STRATEGY: Is the sound on-trend? Trending audio, branded sound, voice, or music quality.
2. SOUND-OFF VIABILITY: Does the ad work muted? Are captions or text overlays present? Does visual storytelling carry the narrative without audio?
Score "Sound" considering both audio quality AND sound-off viability — a great TikTok ad works with AND without sound.
8-10: Strong audio strategy + full captions/visual narrative. Works perfectly muted.
5-7: Decent audio but partial caption coverage. Message partially survives mute.
1-4: Audio-dependent with no captions. Muted viewer misses the core message.`;
    }

    return base;
  })();

  // ── Post-analysis hook — all secondary calls after primary analysis ──────────
  const {
    secondEyeOutput,
    secondEyeLoading,
    staticSecondEyeResult,
    staticSecondEyeLoading,
    engineBudget,
    prediction,
    predictionLoading,
    brief,
    briefLoading,
    briefError,
    setBrief,
    setBriefError,
    ctaRewrites,
    ctaLoading,
    policyResult,
    policyLoading,
    policyError,
    fixItResult,
    fixItLoading,
    savedAnalysisId,
    platformImprovements,
    improvementsLoading,
    platformScoreResult,
    isPlatformSwitching,
    analysisCompletedAt,
    infoToast: postAnalysisInfoToast,
    handleGenerateBrief,
    handleCTARewrite,
    handleCheckPolicies,
    handleFixIt,
    handlePlatformSwitch: handlePlatformSwitchInternal,
    resetPostAnalysis,
  } = usePostAnalysis({
    status,
    result,
    activeResult,
    format,
    platform,
    userContext,
    rawUserContext,
    sessionMemoryRef,
    thumbnailDataUrl,
    ctaFree,
    addHistoryEntry,
    increment,
    isPro,
    FREE_LIMIT,
    onUpgradeRequired,
    rightPanelRef,
  });

  // ── Effects ───────────────────────────────────────────────────────────────

  // Mobile: scroll to ScoreCard when analysis completes
  useEffect(() => {
    if (status === "complete" && window.innerWidth < 768) {
      setTimeout(() => {
        scorecardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [status]);

  // Platform switch: update platform state then delegate secondary calls to hook
  const handlePlatformSwitch = useCallback(async (newPlatform: string) => {
    setPlatform(newPlatform as Platform);
    // Reset ctaFree when switching away from Meta
    if (newPlatform !== "Meta") setCtaFree(false);
    await handlePlatformSwitchInternal(newPlatform);
  }, [handlePlatformSwitchInternal]);

  useEffect(() => {
    if (status === "uploading") {
      setLoadedEntry(null);
      rightPanelRef.current?.setTab("analysis");
    }
  }, [status]);

  // ── Auto-reset platform when format switches and current platform is invalid ──
  useEffect(() => {
    if (format === "static" && VIDEO_ONLY_PLATFORMS.has(platform)) {
      setPlatform("Meta" as Platform);
      setLocalInfoToast("TikTok and YouTube don't support static ads — switched to Meta");
      setTimeout(() => setLocalInfoToast(null), 3000);
    }
    if (format === "static" && platform === "all") {
      setPlatform("Meta" as Platform);
    }
  }, [format]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Visualize It + Motion Preview — delegated to useVisualize ─────────────
  const {
    visualizeOpen, setVisualizeOpen,
    visualizeStatus, setVisualizeStatus,
    visualizeResult, setVisualizeResult,
    visualizeError, setVisualizeError,
    visualizeCreditData, setVisualizeCreditData,
    motionVideoUrl, setMotionVideoUrl,
    motionLoading, setMotionLoading,
    motionError, setMotionError,
    motionSource, setMotionSource,
    visualizeMode,
    handleVisualize,
    handleMotionPreview,
    handleAnimateVisualized,
    handleAnimateOriginalFromPanel,
    resetVisualize,
  } = useVisualize({
    file,
    format,
    platform,
    thumbnailDataUrl,
    activeResult,
    userContext,
    onUpgradeRequired,
  });

  // ── Register TopBar callbacks — declared here so resetPostAnalysis + resetVisualize are in scope ──
  const handleReset = useCallback(() => {
    setFile(null);
    setLoadedEntry(null);
    setLoadedFromHistory(null);
    reset();
    resetPostAnalysis();
    rightPanelRef.current?.setTab("analysis");
    setReanalyzeMode(false);
    setComparisonResult(null);
    setComparisonLoading(false);
    setOriginalScoresSnapshot(null);
    setOriginalImprovementsSnapshot([]);
    resetVisualize();
    setStaticImageDims(null);
    setVideoDims(null);
  }, [reset, resetPostAnalysis, resetVisualize]);

  // ── Auto-detect format on file drop (no modal) ──────────────────────────
  const handleFileWithFormatCheck = useCallback((f: File | null) => {
    if (!f) { handleReset(); return; }

    // P2-4: Empty file guard
    if (f.size === 0) {
      setFileError("This file appears to be empty. Please select a valid file.");
      return;
    }

    const mimeIsVideo = f.type.startsWith("video/");
    const mimeIsImage = f.type.startsWith("image/");
    const extIsVideo = [".mp4", ".mov", ".webm"].some(e => f.name.toLowerCase().endsWith(e));
    const extIsImage = [".jpg", ".jpeg", ".png", ".webp"].some(e => f.name.toLowerCase().endsWith(e));

    // P2-4: MIME/extension mismatch guard
    if ((mimeIsVideo && extIsImage) || (mimeIsImage && extIsVideo)) {
      setFileError("File type mismatch — the file extension doesn't match its content. Please re-export or re-save the file.");
      return;
    }

    const fileIsVideo = mimeIsVideo || extIsVideo;
    const fileIsImage = mimeIsImage || extIsImage;

    // Size validation before sending to API
    const MAX_IMAGE_SIZE_MB = 10;
    const MAX_VIDEO_SIZE_MB = 100;
    const maxSize = fileIsVideo ? MAX_VIDEO_SIZE_MB * 1024 * 1024 : MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const maxSizeMB = fileIsVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
    if (f.size > maxSize) {
      setFileError(`File too large. Maximum size is ${maxSizeMB}MB for ${fileIsVideo ? "video" : "image"} files.`);
      return;
    }

    // Clear any prior file error — this file passed validation
    setFileError(null);

    // Auto-switch format silently + show toast
    if (fileIsImage && format !== "static") {
      setFormat("static" as Format);
      setLocalInfoToast("Detected static image — analyzing as Static");
      setTimeout(() => setLocalInfoToast(null), 3000);
    } else if (fileIsVideo && format !== "video") {
      setFormat("video" as Format);
      setLocalInfoToast("Detected video — analyzing as Video");
      setTimeout(() => setLocalInfoToast(null), 3000);
    }

    setFile(f);
    reset();
  }, [format, handleReset, reset]);

  // ── Read static image dimensions from file (stable deps — won't cancel on thumbnail changes) ──
  useEffect(() => {
    if (format !== "static") {
      setStaticImageDims(null);
      return;
    }
    if (file && file.type.startsWith("image/")) {
      let cancelled = false;
      getImageDimensions(file)
        .then((d) => {
          if (!cancelled) setStaticImageDims(d);
        })
        .catch(() => {
          if (!cancelled) setStaticImageDims(null);
        });
      return () => {
        cancelled = true;
      };
    }
    // No file — dims will be set by the thumbnail fallback effect below
  }, [format, file]);

  // ── Fallback: read dims from thumbnail when loading from history (no file) ──
  useEffect(() => {
    if (format !== "static" || (file && file.type.startsWith("image/"))) return;
    const thumb = activeResult?.thumbnailDataUrl ?? thumbnailDataUrl;
    if (thumb) {
      let cancelled = false;
      getImageDimensionsFromSrc(thumb)
        .then((d) => {
          if (!cancelled) setStaticImageDims(d);
        })
        .catch(() => {
          if (!cancelled) setStaticImageDims(null);
        });
      return () => {
        cancelled = true;
      };
    }
    setStaticImageDims(null);
    return undefined;
  }, [format, file, activeResult?.thumbnailDataUrl, thumbnailDataUrl]);

  // ── Read video dimensions on file select ──────────────────────────────────
  useEffect(() => {
    if (format !== "video" || !file || !file.type.startsWith("video/")) {
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
  }, [format, file]);

  const showSafeZone = useMemo(() => {
    const isPortrait = (w: number, h: number) => Math.abs((w / h) - (9 / 16)) < 0.05;
    if (format === "static" && staticImageDims) {
      return isPortrait(staticImageDims.width, staticImageDims.height);
    }
    if (format === "video" && videoDims) {
      return isPortrait(videoDims.width, videoDims.height);
    }
    return false;
  }, [format, staticImageDims, videoDims]);

  const effectiveStatus = (loadedEntry || loadedFromHistory) ? ("complete" as const) : status;
  const showRightPanel = effectiveStatus === "complete" && activeResult !== null;

  // ── Score delta vs previous analysis ─────────────────────────────────────
  const scoreDelta = useMemo(() => {
    if (loadedEntry) return null; // don't show delta when viewing a loaded history entry
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
        'Hook':   Math.round((currentScores.hook       - prevEntry.scores.hook)       * 10) / 10,
        'Copy':   Math.round((currentScores.clarity    - prevEntry.scores.clarity)    * 10) / 10,
        'Visual': Math.round((currentScores.production - prevEntry.scores.production) * 10) / 10,
        'CTA':    Math.round((currentScores.cta        - prevEntry.scores.cta)        * 10) / 10,
      },
    };
  }, [activeResult?.scores, historyEntries, loadedEntry]);

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
  };

  const handleDownload = () => {
    if (activeResult) downloadMarkdown(activeResult);
    else download();
  };
  void handleDownload;

  // Thin wrapper: scroll left panel to top before delegating to the hook handler
  const handleVisualizeWithScroll = async () => {
    setTimeout(() => leftPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 100);
    await handleVisualize();
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
    setLocalInfoToast("Saved to your library");
    setTimeout(() => setLocalInfoToast(null), 2500);
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
    <div className="flex h-full min-h-0">
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
              {fileError && (
                <div style={{ margin: "16px 16px 0", padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{fileError}</p>
                  <button type="button" onClick={() => setFileError(null)} style={{ fontSize: 12, color: "#71717a", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Dismiss</button>
                </div>
              )}
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
                {status === "complete" && (visualizeOpen || visualizeStatus !== "idle") ? (
                  <motion.div
                    key="visualize"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col flex-1"
                  >
                    <VisualizePanel
                      status={visualizeStatus}
                      result={visualizeResult}
                      originalImageUrl={thumbnailDataUrl ?? null}
                      error={visualizeError}
                      creditData={visualizeCreditData}
                      onBack={resetVisualize}
                      onClose={resetVisualize}
                      videoUrl={motionVideoUrl}
                      videoLoading={motionLoading}
                      videoError={motionError}
                      videoSource={motionSource}
                      onAnimate={handleAnimateVisualized}
                      onAnimateOriginal={handleAnimateOriginalFromPanel}
                      onAnalyzeVersion={handleReanalyze}
                      onUpgrade={onUpgradeRequired}
                      format={format}
                      visualizeMode={visualizeMode}
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
                        thumbnailDataUrl={activeResult?.thumbnailDataUrl ?? thumbnailDataUrl ?? undefined}
                        fileObjectUrl={fileObjectUrl ?? undefined}
                        format={format}
                        onFileSelect={(f) => handleFileWithFormatCheck(f)}
                        onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
                        onAnalyze={handleAnalyze}
                        onReset={handleReset}
                        onGenerateBrief={handleGenerateBrief}
                        onAddToSwipeFile={handleAddToSwipeFile}
                        historyEntries={historyEntries}
                        onHistoryEntryClick={(entry) => setLoadedEntry(entry)}
                        platform={platform !== "all" ? platform : (rawUserContext?.platform ?? undefined)}
                        icon={Zap}
                        niche={rawUserContext?.niche}
                        onFixIt={handleFixIt}
                        onVisualize={handleVisualizeWithScroll}
                        onMotionPreview={handleMotionPreview}
                        motionVideoUrl={motionVideoUrl}
                        motionLoading={motionLoading}
                        motionError={motionError}
                        onCheckPolicies={handleCheckPolicies}
                        onSafeZone={showSafeZone ? () => setSafeZoneOpen(true) : undefined}
                        onCompare={() => navigate('/app/competitor')}
                        fixItLoading={fixItLoading}
                        fixItResult={fixItResult}
                        policyLoading={policyLoading}
                        policyResult={policyResult}
                        visualizeLoading={visualizeStatus === 'loading'}
                        visualizeResult={visualizeResult ? { url: visualizeResult.generatedImageUrl, type: 'image' } : null}
                        designReviewData={staticSecondEyeResult ? {
                          flags: staticSecondEyeResult.flags ?? [],
                          topIssue: staticSecondEyeResult.topIssue,
                          overallDesignVerdict: staticSecondEyeResult.overallDesignVerdict,
                        } : undefined}
                        secondEyeResult={secondEyeOutput}
                        secondEyeLoading={secondEyeLoading}
                        secondEyeSlot={
                          status === "complete" && format === "video" ? (
                            <div className="mt-3">
                              {/* SecondEyePanel now rendered inside CreativeVerdictAndSecondEye */}
                            </div>
                          ) : undefined
                        }
                      />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right panel — extracted to PaidRightPanel */}
      <PaidRightPanel
        ref={rightPanelRef}
        showRightPanel={showRightPanel}
        activeResult={activeResult}
        analysisCompletedAt={analysisCompletedAt}
        platform={platform}
        format={format}
        youtubeFormat={youtubeFormat}
        ctaFree={ctaFree}
        isPro={isPro}
        scoreDelta={scoreDelta}
        platformScoreResult={platformScoreResult}
        platformImprovements={platformImprovements}
        improvementsLoading={improvementsLoading}
        isPlatformSwitching={isPlatformSwitching}
        brief={brief}
        briefLoading={briefLoading}
        briefError={briefError}
        ctaRewrites={ctaRewrites}
        ctaLoading={ctaLoading}
        policyResult={policyResult}
        policyLoading={policyLoading}
        policyError={policyError}
        fixItResult={fixItResult}
        fixItLoading={fixItLoading}
        prediction={prediction}
        predictionLoading={predictionLoading}
        engineBudget={engineBudget}
        reanalyzeMode={reanalyzeMode}
        comparisonResult={comparisonResult}
        comparisonLoading={comparisonLoading}
        originalScoresSnapshot={originalScoresSnapshot}
        savedAnalysisId={savedAnalysisId}
        rawUserContext={rawUserContext}
        visualizeLoading={visualizeStatus === "loading"}
        onGenerateBrief={handleGenerateBrief}
        onAddToSwipeFile={handleAddToSwipeFile}
        onCTARewrite={handleCTARewrite}
        onShare={handleCopy}
        onCheckPolicies={handleCheckPolicies}
        onFixIt={handleFixIt}
        onVisualize={handleVisualizeWithScroll}
        onNavigateSettings={() => navigate('/settings')}
        onReanalyzeAgain={() => { setComparisonResult(null); setReanalyzeMode(true); }}
        onStartFresh={handleReset}
        onStartOver={() => setConfirmStartOver(true)}
        onCompare={() => navigate('/app/competitor')}
        onPlatformSwitch={handlePlatformSwitch}
        onSetYoutubeFormat={setYoutubeFormat}
        onSetCtaFree={setCtaFree}
        onSetReanalyzeMode={setReanalyzeMode}
        onSetComparisonResult={setComparisonResult}
        onReanalyze={handleReanalyze}
        onUpgradeRequired={onUpgradeRequired}
      />

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
      {rateLimitError && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs font-mono text-red-400 shadow-lg z-[100]"
        >
          {rateLimitError}
        </div>
      )}
      {(localInfoToast || postAnalysisInfoToast) && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]">
          {localInfoToast ?? postAnalysisInfoToast}
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

      <SafeZoneModal
        open={safeZoneOpen}
        onClose={() => setSafeZoneOpen(false)}
        thumbnailSrc={thumbnailDataUrl ?? undefined}
        mode="paid"
      />
    </div>
  );
}
