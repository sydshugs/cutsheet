// src/pages/app/PaidAdAnalyzer.tsx
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { RotateCcw, Upload, Sparkles, Lock, Zap, Copy, FileDown, Share2 } from "lucide-react";
import { Toast } from "../../components/Toast";
import { AnalyzerView } from "../../components/AnalyzerView";
import { BriefResultView, type BriefSection } from "../../components/BriefResultView";
import { ScoreCard } from "../../components/ScoreCard";
import { VideoDropzone } from "../../components/VideoDropzone";
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
import { extractRightPanelSections } from "../../components/ReportCards";
import { YouTubeFormatSelector, type YouTubeFormat } from "../../components/YouTubeFormatSelector";
import { generateFixIt, type FixItResult } from "../../services/fixItService";
import FixItPanel from "../../components/FixItPanel";
import { generatePrediction, type PredictionResult } from "../../services/predictionService";
import { SecondEyePanel } from "../../components/SecondEyePanel";
import { VisualizePanel } from "../../components/VisualizePanel";
import { visualizeAd } from "../../lib/visualizeService";
import { animateImage } from "../../lib/visualizeVideoService";
import { uploadImageToStorage, uploadDataUriToStorage, removeFromStorage } from "../../lib/storageService";
import type { VisualizeResult, VisualizeStatus } from "../../types/visualize";
import { StaticSecondEyePanel } from "../../components/StaticSecondEyePanel";
import { PolicyCheckPanel } from "../../components/PolicyCheckPanel";
import { runPolicyCheck, type PolicyCheckResult } from "../../lib/policyCheckService";
import { SafeZoneModal } from "../../components/SafeZoneModal";
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", minHeight: "calc(100vh - 120px)" }}>
      {/* Section icon */}
      <div style={{ width: 73, height: 73, borderRadius: 15, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Zap size={28} color="#6366f1" />
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginTop: 20, marginBottom: 0 }}>
        Score your paid ad
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 320, marginTop: 10, lineHeight: 1.6 }}>
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
  const [youtubeFormat, setYoutubeFormat] = useState<YouTubeFormat>("skippable");
  const [ctaFree, setCtaFree] = useState(false);
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

  // ── Motion Preview (Kling animation) state
  const [motionVideoUrl, setMotionVideoUrl] = useState<string | null>(null);
  const [motionLoading, setMotionLoading] = useState(false);
  const [motionError, setMotionError] = useState<string | null>(null);
  const [motionSource, setMotionSource] = useState<"improved" | "original" | null>(null);

  // ── Local analyzer state ───────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState<HistoryEntry | null>(null);
  const [rightTab, setRightTab] = useState<"analysis" | "brief" | "policy" | "ai_rewrite">("analysis");
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
  const [fileError, setFileError] = useState<string | null>(null);

  const [improvementsLoading, setImprovementsLoading] = useState(false);
  const [platformImprovements, setPlatformImprovements] = useState<string[] | null>(null);
  const [platformScoreResult, setPlatformScoreResult] = useState<PlatformScore | null>(null);
  const [isPlatformSwitching, setIsPlatformSwitching] = useState(false);
  const platformAbortRef = useRef<AbortController | null>(null);

  // ── Saved analysis ID — for suggestion_feedback FK ───────────────────────
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  // ── Fix It For Me state ──────────────────────────────────────────────────
  const [fixItResult, setFixItResult] = useState<FixItResult | null>(null);
  const [fixItLoading, setFixItLoading] = useState(false);

  // ── Safe Zone state ───────────────────────────────────────────────────────
  const [safeZoneOpen, setSafeZoneOpen] = useState(false);

  // ── Predicted Performance state ──────────────────────────────────────────
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
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
    setPredictionLoading(false);
  }, [reset]);

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

  // ── Consolidated post-analysis: fires ALL secondary calls in parallel ──
  const postAnalysisFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "complete" || !result) return;
    const key = `${result.fileName}-${result.timestamp.toISOString()}`;
    if (postAnalysisFiredRef.current === key) return;
    postAnalysisFiredRef.current = key;

    // Synchronous: budget recommendation + history
    if (result.scores) {
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || 'Other';
      setEngineBudget(generateBudgetRecommendation(result.scores.overall, platform, niche, format));
    }
    addHistoryEntry({
      fileName: result.fileName, timestamp: result.timestamp.toISOString(),
      scores: result.scores, markdown: result.markdown, thumbnailDataUrl: thumbnailDataUrl ?? undefined,
    });
    const newCount = increment();
    if (newCount >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");
    saveAnalysis({
      file_name: result.fileName, file_type: format === 'video' ? 'video' : 'static',
      mode: 'paid', platform: platform || 'all', overall_score: result.scores?.overall ?? 0,
      scores: { hook: result.scores?.hook ?? 0, clarity: result.scores?.clarity ?? 0, cta: result.scores?.cta ?? 0, production: result.scores?.production ?? 0 },
      improvements: result.improvements ?? [],
      cta_rewrite: Array.isArray(ctaRewrites) && ctaRewrites.length > 0 ? ctaRewrites[0] : undefined,
      budget_recommendation: result.budget?.verdict ?? undefined,
    }).then(id => { if (id) setSavedAnalysisId(id); });
    setHistoryRefreshKey(k => k + 1);

    // Async parallel: Second Eye (video) + Static Design Review + Prediction
    if (secondEye && format === "video") {
      setSecondEyeLoading(true);
      setSecondEyeOutput(null);
      generateSecondEyeReview(
        result.markdown, result.fileName,
        result.scores ? { hook: result.scores.hook, overall: result.scores.overall } : undefined,
        result.improvements, userContext || undefined, sessionMemoryRef.current
      ).then(setSecondEyeOutput).catch(() => setSecondEyeOutput(null)).finally(() => setSecondEyeLoading(false));
    }

    if (staticSecondEye && format === "static") {
      setStaticSecondEyeLoading(true);
      setStaticSecondEyeResult(null);
      generateStaticSecondEye(
        result.markdown, result.fileName,
        result.scores ? { overall: result.scores.overall, cta: result.scores.cta } : undefined,
        result.improvements, userContext || undefined, sessionMemoryRef.current
      ).then(setStaticSecondEyeResult).catch(() => setStaticSecondEyeResult(null)).finally(() => setStaticSecondEyeLoading(false));
    }

    if (result.scores) {
      setPredictionLoading(true);
      generatePrediction(
        result.markdown, result.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        format as 'video' | 'static', rawUserContext?.niche,
      ).then(r => { setPrediction(r); setPredictionLoading(false); })
       .catch((err) => { console.error('Prediction failed (silent):', err); setPredictionLoading(false); });
    }
  }, [status, result]); // eslint-disable-line

  // Platform switch: re-generate improvements + platform score when platform changes
  const handlePlatformSwitch = useCallback(async (newPlatform: string) => {
    setPlatform(newPlatform as Platform);
    // Reset ctaFree when switching away from Meta
    if (newPlatform !== "Meta") setCtaFree(false);
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
        generatePlatformScore(newPlatform, result, result.fileName, format as 'video' | 'static', userContext || undefined, rawUserContext?.niche),
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
      const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName, userContext || undefined, sessionMemoryRef.current, format, platform);
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
    setRightTab("ai_rewrite");
    try {
      const result = await generateFixIt(
        activeResult.markdown,
        activeResult.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        rawUserContext?.niche,
        undefined, // intent
        format as 'video' | 'static',
        undefined, // isOrganic
        ctaFree,
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
  // Prediction is now fired in the consolidated post-analysis useEffect above

  const handleVisualize = async () => {
    if (!activeResult?.scores || !file) return;
    setVisualizeOpen(true);
    setVisualizeStatus("loading");
    // Scroll left panel to top so VisualizePanel is visible immediately
    setTimeout(() => leftPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 100);
    setVisualizeResult(null);
    setVisualizeError(null);
    try {
      // For video: use thumbnail (hook frame) as the creative input
      let imageFile: File = file;
      if (format === "video") {
        if (!thumbnailDataUrl) {
          setVisualizeError("Could not extract a frame from this video.");
          setVisualizeStatus("error");
          return;
        }
        const blob = await fetch(thumbnailDataUrl).then(r => r.blob());
        imageFile = new File([blob], "hook-frame.jpg", { type: "image/jpeg" });
      }
      const { signedUrl: imageStorageUrl, storagePath } = await uploadImageToStorage(imageFile, 1200, 0.85);
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "general";
      // Meta static ads use platform-native CTA — exclude CTA from generated creative
      const isMetaStatic = platform === "Meta" && format === "static";
      const cleanPlatform = platform === "all" ? "general" : platform;
      const result = await visualizeAd({
        imageStorageUrl,
        imageMediaType: "image/jpeg",
        analysisResult: {
          scores: activeResult.scores as Record<string, number>,
          improvements: activeResult.improvements ?? [],
          markdown: activeResult.markdown,
        },
        platform: cleanPlatform,
        niche,
        adType: "static",
        excludeCta: isMetaStatic,
        visualizeContext: {
          adType: "paid",
          format: format as "static" | "video",
          platform: cleanPlatform,
          excludeCta: isMetaStatic,
        },
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

  // Motion Preview: animates the ORIGINAL uploaded image (no Gemini edit)
  const handleMotionPreview = async () => {
    if (!file || motionLoading) return; // guard against double-clicks
    setMotionLoading(true);
    setMotionError(null);
    setMotionVideoUrl(null);

    try {
      // Upload original image to get a URL for Kling
      const { signedUrl } = await uploadImageToStorage(file, 1024, 0.85);

      let aspectRatio: "9:16" | "4:5" | "16:9" = "9:16";
      const img = new Image();
      const ratio = await new Promise<number>((resolve) => {
        img.onload = () => resolve(img.width / img.height);
        img.onerror = () => resolve(1);
        img.src = URL.createObjectURL(file);
      });
      if (ratio > 1.2) aspectRatio = "16:9";
      else if (ratio > 0.9) aspectRatio = "4:5";

      const result = await animateImage({ imageUrl: signedUrl, aspectRatio });
      setMotionVideoUrl(result.videoUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "PRO_REQUIRED") { onUpgradeRequired("visualize_video"); return; }
      if (msg === "CREDIT_LIMIT_REACHED" && err && typeof err === "object" && "creditData" in err) {
        const creditErr = err as Error & { creditData: import("../../types/visualize").VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        setVisualizeOpen(true);
        return;
      }
      setMotionError(msg);
    } finally {
      setMotionLoading(false);
    }
  };

  // Animate Visualized: uses Gemini-improved image from Visualize v2
  const handleAnimateVisualized = async () => {
    if (motionLoading) return; // guard against double-clicks
    const seedDataUri = visualizeResult?.generatedImageUrl;
    if (!seedDataUri) return;

    setMotionLoading(true);
    setMotionError(null);
    setMotionVideoUrl(null);
    setMotionSource("improved");

    let tempStoragePath: string | undefined;
    try {
      // Gemini returns a data: URI — Kling needs a public URL.
      // Upload to Supabase temp storage first.
      const { signedUrl, storagePath } = await uploadDataUriToStorage(seedDataUri);
      tempStoragePath = storagePath;

      // Detect aspect ratio from the original file dimensions (default 9:16 for vertical)
      let aspectRatio: "9:16" | "4:5" | "16:9" = "9:16";
      if (file) {
        const img = new Image();
        const ratio = await new Promise<number>((resolve) => {
          img.onload = () => resolve(img.width / img.height);
          img.onerror = () => resolve(1);
          img.src = URL.createObjectURL(file);
        });
        if (ratio > 1.2) aspectRatio = "16:9";
        else if (ratio > 0.9) aspectRatio = "4:5";
      }

      const result = await animateImage({ imageUrl: signedUrl, aspectRatio });
      setMotionVideoUrl(result.videoUrl);

      // Cleanup temp image from Supabase
      if (tempStoragePath) removeFromStorage(tempStoragePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "PRO_REQUIRED") {
        onUpgradeRequired("visualize_video");
        return;
      }
      if (msg === "CREDIT_LIMIT_REACHED" && err && typeof err === "object" && "creditData" in err) {
        const creditErr = err as Error & { creditData: import("../../types/visualize").VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        return;
      }
      setMotionError(msg);
    } finally {
      setMotionLoading(false);
      // Cleanup on error too
      if (tempStoragePath) removeFromStorage(tempStoragePath);
    }
  };

  // Animate Original from Visualize panel: uses original uploaded image
  const handleAnimateOriginalFromPanel = async () => {
    if (!file || motionLoading) return; // guard against double-clicks
    setMotionLoading(true);
    setMotionError(null);
    setMotionVideoUrl(null);
    setMotionSource("original");

    try {
      const { signedUrl } = await uploadImageToStorage(file, 1024, 0.85);
      let aspectRatio: "9:16" | "4:5" | "16:9" = "9:16";
      const img = new Image();
      const ratio = await new Promise<number>((resolve) => {
        img.onload = () => resolve(img.width / img.height);
        img.onerror = () => resolve(1);
        img.src = URL.createObjectURL(file);
      });
      if (ratio > 1.2) aspectRatio = "16:9";
      else if (ratio > 0.9) aspectRatio = "4:5";

      const result = await animateImage({ imageUrl: signedUrl, aspectRatio });
      setMotionVideoUrl(result.videoUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "PRO_REQUIRED") { onUpgradeRequired("visualize_video"); return; }
      if (msg === "CREDIT_LIMIT_REACHED" && err && typeof err === "object" && "creditData" in err) {
        const creditErr = err as Error & { creditData: import("../../types/visualize").VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        return;
      }
      setMotionError(msg);
    } finally {
      setMotionLoading(false);
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
    <div className="flex h-full" style={{ minHeight: "calc(100vh - 56px)" }}>
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
                      onBack={() => { setVisualizeOpen(false); setVisualizeStatus("idle"); setVisualizeResult(null); setVisualizeError(null); setVisualizeCreditData(null); setMotionVideoUrl(null); setMotionLoading(false); setMotionError(null); setMotionSource(null); }}
                      onClose={() => { setVisualizeOpen(false); setVisualizeStatus("idle"); setVisualizeResult(null); setVisualizeError(null); setVisualizeCreditData(null); setMotionVideoUrl(null); setMotionLoading(false); setMotionError(null); setMotionSource(null); }}
                      videoUrl={motionVideoUrl}
                      videoLoading={motionLoading}
                      videoError={motionError}
                      videoSource={motionSource}
                      onAnimate={handleAnimateVisualized}
                      onAnimateOriginal={handleAnimateOriginalFromPanel}
                      onAnalyzeVersion={handleReanalyze}
                      onUpgrade={onUpgradeRequired}
                      format={format}
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
                        thumbnailDataUrl={activeResult?.thumbnailDataUrl ?? thumbnailDataUrl}
                        fileObjectUrl={fileObjectUrl}
                        format={format}
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
                        niche={rawUserContext?.niche}
                        onFixIt={handleFixIt}
                        onVisualize={handleVisualize}
                        onMotionPreview={handleMotionPreview}
                        motionVideoUrl={motionVideoUrl}
                        motionLoading={motionLoading}
                        motionError={motionError}
                        onCheckPolicies={handleCheckPolicies}
                        onSafeZone={() => setSafeZoneOpen(true)}
                        onCompare={() => navigate('/app/competitor')}
                        fixItLoading={fixItLoading}
                        fixItResult={fixItResult}
                        policyLoading={policyLoading}
                        policyResult={policyResult}
                        visualizeLoading={visualizeStatus === 'loading'}
                        visualizeResult={visualizeResult ? { url: visualizeResult.imageUrl ?? visualizeResult.videoUrl, type: visualizeResult.videoUrl ? 'video' : 'image' } : null}
                        designReviewData={staticSecondEyeResult ? {
                          flags: staticSecondEyeResult.flags ?? [],
                          topIssue: staticSecondEyeResult.topIssue,
                          overallDesignVerdict: staticSecondEyeResult.overallDesignVerdict,
                        } : undefined}
                        secondEyeResult={secondEyeOutput}
                        secondEyeLoading={secondEyeLoading}
                        secondEyeSlot={
                          status === "complete" && format === "video" && secondEye ? (
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

      {/* Right panel — ScoreCard */}
      <div
        className={`shrink-0 bg-[#111113] border-l border-white/[0.06] overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/[0.06] relative ${showRightPanel ? "w-[350px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"}`}
      >
        <div className="p-[24px] pb-[72px] flex flex-col gap-[16px]">
        <AnimatePresence mode="wait">
        {showRightPanel && activeResult?.scores && rightTab === "analysis" && !(reanalyzeMode && !comparisonResult) && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-[16px]"
          >
            {/* Platform Switcher + YouTube format moved inside ScoreCard */}
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
                scoreRange={activeResult.scores ? {
                  low:  Math.max(0,  Math.round((activeResult.scores.overall - 0.65) * 10) / 10),
                  high: Math.min(10, Math.round((activeResult.scores.overall + 0.65) * 10) / 10),
                } : undefined}
                overallDelta={scoreDelta?.overall}
                overallDeltaLabel={scoreDelta?.label}
                dimensionDeltas={scoreDelta?.dims}
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
                onReanalyze={() => { setComparisonResult(null); setRightTab("analysis"); setReanalyzeMode(true); }}
                onStartOver={() => setConfirmStartOver(true)}
                onCheckPolicies={handleCheckPolicies}
                policyLoading={policyLoading}
                niche={rawUserContext?.niche}
                platform={platform !== "all" ? platform : rawUserContext?.platform}
                youtubeFormat={(platform === "YouTube" || platform === "Shorts") ? youtubeFormat : undefined}
                platformScore={platform !== "all" && platformScoreResult ? platformScoreResult.score : undefined}
                onFixIt={handleFixIt}
                fixItResult={fixItResult}
                fixItLoading={fixItLoading}
                prediction={prediction}
                predictionLoading={predictionLoading}
                onCompare={() => navigate('/app/competitor')}
                onVisualize={handleVisualize}
                visualizeLoading={visualizeStatus === "loading"}
                canVisualize={true}
                isPro={isPro}
                briefLoading={briefLoading}
                hasBrief={!!brief}
                verdict={activeResult.verdict}
                platformCta={activeResult.platformCta}
                analysisSections={extractRightPanelSections(activeResult.markdown)}
                platformSwitcher={
                  <>
                    <PlatformSwitcher
                      platforms={format === "static" ? PAID_STATIC_PLATFORMS : PAID_AD_PLATFORMS}
                      selected={platform}
                      onChange={handlePlatformSwitch}
                      isSwitching={isPlatformSwitching}
                      disabled={status !== "complete"}
                    />
                    {(platform === "YouTube" || platform === "Shorts") && format === "video" && (
                      <div className="mt-1">
                        <YouTubeFormatSelector
                          selected={youtubeFormat}
                          onChange={setYoutubeFormat}
                          disabled={status !== "complete"}
                        />
                      </div>
                    )}
                    {platform === "Meta" && format === "video" && (
                      <label className="flex items-center gap-2 mt-2 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          id="cta-free"
                          checked={ctaFree}
                          onChange={(e) => setCtaFree(e.target.checked)}
                          className="rounded border-zinc-600 accent-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-opacity leading-tight">
                          Uses Meta's native CTA button (no CTA in creative)
                        </span>
                      </label>
                    )}
                    {platformScoreResult && platform !== "all" && (
                      <div className="mt-1.5 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
                      >
                        <span className="font-mono font-bold text-indigo-400">{platformScoreResult.score}/10</span>
                        <span className="text-zinc-400">{platformScoreResult.verdict}</span>
                      </div>
                    )}
                  </>
                }
                onUpgradeRequired={onUpgradeRequired}
              />
            </div>
            {/* Design Review + Second Eye moved to center column */}
            {/* Visualize It moved to left panel (below creative) */}
          </motion.div>

        )}

        {showRightPanel && rightTab === "brief" && (
          <motion.div
            key="brief"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col h-full"
          >
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
                {(() => {
                  // Parse brief into BriefSection format for new component
                  const sections: BriefSection[] = [];
                  let current: BriefSection | null = null;
                  for (const line of brief.split("\n")) {
                    const t = line.trim();
                    if (!t || t === "---" || t.startsWith("## ")) continue;
                    const boldMatch = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                    if (boldMatch) {
                      if (current) sections.push(current);
                      const content = boldMatch[2];
                      current = { 
                        label: boldMatch[1].replace(/:$/, ''), 
                        content: content || undefined,
                        items: content ? undefined : []
                      };
                    } else if (current) {
                      const cleanLine = t.replace(/^[-*]\s*/, '');
                      if (!current.items) {
                        current.items = [];
                      }
                      current.items.push(cleanLine);
                    }
                  }
                  if (current) sections.push(current);

                  return (
                    <BriefResultView 
                      sections={sections}
                      platform={platform !== "all" ? platform : "Meta"}
                      adFormat={format === "static" ? "Static" : "Video"}
                      onBack={() => setRightTab("analysis")}
                    />
                  );
                })()}
              </>
            )}
          </motion.div>
        )}

        {/* Policy Check panel */}
        {showRightPanel && rightTab === "policy" && (
          <motion.div
            key="policy"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col h-full"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRightTab("analysis")}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5 bg-transparent border-none"
              >
                ← Back to Scores
              </button>
              <span className="text-xs text-zinc-600 font-mono">Claude Sonnet</span>
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
          </motion.div>
        )}

        {/* AI Rewrite panel — uses FixItPanel component */}
        {showRightPanel && rightTab === "ai_rewrite" && (
          <motion.div
            key="ai_rewrite"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col h-full"
          >
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRightTab("analysis")}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5 bg-transparent border-none"
              >
                ← Back to Scores
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {fixItLoading && !fixItResult && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-[13px] text-zinc-400">Rewriting your ad...</span>
                </div>
              )}
              {fixItResult && !fixItLoading && (
                <FixItPanel
                  result={fixItResult}
                  mediaType={format as "static" | "video"}
                  analysisId={savedAnalysisId ?? undefined}
                  platform={platform !== "all" ? platform : (rawUserContext?.platform ?? undefined)}
                  niche={rawUserContext?.niche}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Re-analyze upload — replaces entire right panel */}
        {showRightPanel && reanalyzeMode && !comparisonResult && (
          <motion.div
            key="reanalyze-upload"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col h-full"
          >
            <div className="p-5 border-b border-white/5">
              <button
                type="button"
                onClick={() => setReanalyzeMode(false)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                ← Back to Scores
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
              {comparisonLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-sm text-zinc-500">Analyzing improved version...</span>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-zinc-100">Upload your improved version</p>
                  <p className="text-xs text-zinc-500 -mt-2">We'll score it and compare against your original.</p>
                  <div
                    className="w-full max-w-[320px] h-[140px] border-2 border-dashed border-indigo-500/25 hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file"; input.accept = "video/*,image/*";
                      input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleReanalyze(f); };
                      input.click();
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-500/50", "bg-indigo-500/5"); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove("border-indigo-500/50", "bg-indigo-500/5"); }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-indigo-500/50", "bg-indigo-500/5"); const f = e.dataTransfer.files[0]; if (f) handleReanalyze(f); }}
                  >
                    <Upload size={20} className="text-indigo-400" />
                    <span className="text-xs text-indigo-400 font-medium">Drop improved version here</span>
                    <span className="text-[11px] text-zinc-600">or click to browse</span>
                  </div>
                  <span className="text-[11px] text-zinc-600">PNG, JPG, MP4 supported</span>
                </>
              )}
            </div>
          </motion.div>
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

        </AnimatePresence>
        </div>

        {/* Bottom bar — Copy, PDF, Share */}
        {showRightPanel && (
          <div className="sticky bottom-0 w-full h-[48px] bg-[#111113] border-t border-white/[0.06] flex items-center justify-end px-6 gap-[12px]">
            <button
              onClick={handleCopy}
              className="h-8 px-[12px] rounded-lg border border-white/[0.06] bg-transparent text-zinc-400 flex items-center gap-1.5 text-[13px] font-medium hover:text-zinc-300 hover:bg-white/[0.02] transition-colors"
            >
              <Copy size={14} />
              Copy
            </button>
            <button
              onClick={() => {}}
              className="h-8 px-[12px] rounded-lg border border-white/[0.06] bg-transparent text-zinc-400 flex items-center gap-1.5 text-[13px] font-medium hover:text-zinc-300 hover:bg-white/[0.02] transition-colors"
            >
              <FileDown size={14} />
              PDF
            </button>
            <button
              onClick={handleShareLink}
              className="h-8 px-[12px] rounded-lg bg-[#6366f1] text-white flex items-center gap-1.5 text-[13px] font-medium hover:bg-[#4f46e5] transition-colors"
            >
              <Share2 size={14} />
              Share
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
