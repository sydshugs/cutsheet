// Full scorecard for a single ranked creative — Figma 286-1217 (Paid-style two-column result)

import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ChevronLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useRankBatch, type RankPlatform } from "../../context/RankBatchContext";
import { AnalyzerView } from "../../components/AnalyzerView";
import type { AppSharedContext } from "../../components/AppLayout";
import { useThumbnail } from "../../hooks/useThumbnail";
import { useVisualize } from "../../hooks/useVisualize";
import { getUserContext, formatUserContextBlock } from "../../services/userContextService";
import { getSessionMemory } from "@/src/lib/userMemoryService";
import { generatePrediction, type PredictionResult } from "../../services/predictionService";
import { generateBudgetRecommendation, type EngineBudgetRecommendation } from "../../services/budgetService";
import { type YouTubeFormat } from "../../components/YouTubeFormatSelector";
import { generateFixIt, type FixItResult } from "../../services/fixItService";
import { runPolicyCheck, type PolicyCheckResult } from "../../lib/policyCheckService";
import {
  generateSecondEyeReview,
  generateStaticSecondEye,
  generateImprovements,
  generatePlatformScore,
  type SecondEyeResult,
  type StaticSecondEyeResult,
  type PlatformScore,
} from "../../services/claudeService";
import { SafeZoneModal } from "../../components/SafeZoneModal";
import { VisualizePanel } from "../../components/VisualizePanel";
import { RankScorecardPanel } from "../../components/rank/RankScorecardPanel";
import { cn } from "@/src/lib/utils";

function rankPlatformToInitial(rp: RankPlatform): string {
  return rp === "all" ? "all" : rp;
}

export default function RankScorecardPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { items, ranked, previewUrls, rankPlatform, rankTestType } = useRankBatch();
  const { onUpgradeRequired, registerCallbacks, isPro, addSwipeItem } = useOutletContext<AppSharedContext>();

  const item = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);
  const result = item?.result;
  const file = item?.file ?? null;
  const format = item?.format ?? "video";

  const rankIndex = useMemo(() => {
    if (!itemId) return 0;
    const i = ranked.findIndex((r) => r.item.id === itemId);
    return i >= 0 ? i + 1 : 0;
  }, [ranked, itemId]);
  const totalRanked = ranked.length;

  const [userContext, setUserContext] = useState("");
  const [rawUserContext, setRawUserContext] = useState<{ niche: string; platform: string } | null>(null);
  const derivedPlatform = useMemo(
    () => (format === "static" ? "Meta" : rankPlatformToInitial(rankPlatform)),
    [format, rankPlatform],
  );
  const [platform, setPlatform] = useState(derivedPlatform);
  const [youtubeFormat, setYoutubeFormat] = useState<YouTubeFormat>("skippable");
  const [ctaFree, setCtaFree] = useState(false);

  const [secondEyeOutput, setSecondEyeOutput] = useState<SecondEyeResult | null>(null);
  const [secondEyeLoading, setSecondEyeLoading] = useState(false);
  const [staticSecondEyeResult, setStaticSecondEyeResult] = useState<StaticSecondEyeResult | null>(null);
  const [staticSecondEyeLoading, setStaticSecondEyeLoading] = useState(false);
  const [engineBudget, setEngineBudget] = useState<EngineBudgetRecommendation | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [fixItResult, setFixItResult] = useState<FixItResult | null>(null);
  const [fixItLoading, setFixItLoading] = useState(false);
  const [policyResult, setPolicyResult] = useState<PolicyCheckResult | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [improvementsLoading, setImprovementsLoading] = useState(false);
  const [platformImprovements, setPlatformImprovements] = useState<string[] | null>(null);
  const [platformScoreResult, setPlatformScoreResult] = useState<PlatformScore | null>(null);
  const [isPlatformSwitching, setIsPlatformSwitching] = useState(false);
  const platformAbortRef = useRef<AbortController | null>(null);
  const [safeZoneOpen, setSafeZoneOpen] = useState(false);

  const sessionMemoryRef = useRef("");
  const postFiredRef = useRef<string | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);

  const blobUrl = itemId ? previewUrls[itemId] : null;
  const thumbnailDataUrl = useThumbnail(file, blobUrl);

  // ── useVisualize — replaces 5 useState + handleVisualize ─────────────────
  const {
    visualizeOpen,
    setVisualizeOpen,
    visualizeStatus,
    setVisualizeStatus,
    visualizeResult,
    setVisualizeResult,
    visualizeError,
    setVisualizeError,
    visualizeCreditData,
    setVisualizeCreditData,
    visualizeMode,
    handleVisualize,
    resetVisualize,
  } = useVisualize({
    file,
    format,
    platform,
    thumbnailDataUrl,
    activeResult: result ?? null,
    userContext,
    onUpgradeRequired,
  });

  useEffect(() => {
    getUserContext().then((ctx) => {
      setUserContext(formatUserContextBlock(ctx));
      setRawUserContext({ niche: ctx.niche, platform: ctx.platform });
    });
  }, []);

  useEffect(() => {
    getSessionMemory()
      .then((m) => {
        sessionMemoryRef.current = m.text;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    registerCallbacks({
      onNewAnalysis: () => navigate("/app/batch"),
      onHistoryOpen: () => {},
      hasResult: true,
    });
    return () => registerCallbacks(null);
  }, [navigate, registerCallbacks]);

  useEffect(() => {
    setPlatform(derivedPlatform);
  }, [derivedPlatform]);

  useEffect(() => {
    postFiredRef.current = null;
  }, [itemId]);

  const analysisKey = result && itemId ? `${itemId}-${result.timestamp.toISOString()}` : null;

  useEffect(() => {
    if (!result?.scores || !analysisKey) return;
    if (postFiredRef.current === analysisKey) return;
    postFiredRef.current = analysisKey;

    const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "Other";
    setEngineBudget(generateBudgetRecommendation(result.scores.overall, platform, niche, format));

    if (result.scores) {
      setPredictionLoading(true);
      generatePrediction(
        result.markdown,
        result.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        format,
        rawUserContext?.niche,
      )
        .then(setPrediction)
        .catch(() => {})
        .finally(() => setPredictionLoading(false));
    }

    if (format === "video") {
      setSecondEyeLoading(true);
      setSecondEyeOutput(null);
      generateSecondEyeReview(
        result.markdown,
        result.fileName,
        result.scores ? { hook: result.scores.hook, overall: result.scores.overall } : undefined,
        result.improvements,
        userContext || undefined,
        sessionMemoryRef.current,
      )
        .then(setSecondEyeOutput)
        .catch(() => setSecondEyeOutput(null))
        .finally(() => setSecondEyeLoading(false));
    }

    if (format === "static") {
      setStaticSecondEyeLoading(true);
      setStaticSecondEyeResult(null);
      generateStaticSecondEye(
        result.markdown,
        result.fileName,
        result.scores ? { overall: result.scores.overall, cta: result.scores.cta } : undefined,
        result.improvements,
        userContext || undefined,
        sessionMemoryRef.current,
      )
        .then(setStaticSecondEyeResult)
        .catch(() => setStaticSecondEyeResult(null))
        .finally(() => setStaticSecondEyeLoading(false));
    }
  }, [analysisKey, result, userContext, platform, format, rawUserContext?.niche, rawUserContext?.platform]);

  useEffect(() => {
    if (!result?.scores) return;
    const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "Other";
    setEngineBudget(generateBudgetRecommendation(result.scores.overall, platform, niche, format));
  }, [platform, result?.scores, format, userContext]);

  const handlePlatformSwitch = useCallback(
    async (newPlatform: string) => {
      setPlatform(newPlatform);
      if (newPlatform !== "Meta") setCtaFree(false);
      if (!result?.markdown || !result.scores) return;
      if (newPlatform === "all") {
        setPlatformScoreResult(null);
        setPlatformImprovements(null);
        return;
      }
      platformAbortRef.current?.abort();
      platformAbortRef.current = new AbortController();
      setIsPlatformSwitching(true);
      setImprovementsLoading(true);
      try {
        const [imps, pScore] = await Promise.all([
          generateImprovements(result.markdown, result.scores, userContext || undefined, newPlatform, sessionMemoryRef.current),
          generatePlatformScore(newPlatform, { markdown: result.markdown, scores: result.scores ?? { overall: 0 } }, result.fileName, format, userContext || undefined, rawUserContext?.niche),
        ]);
        setPlatformImprovements(imps);
        setPlatformScoreResult(pScore);
      } catch {
        setPlatformImprovements(null);
      } finally {
        setIsPlatformSwitching(false);
        setImprovementsLoading(false);
      }
    },
    [result, userContext, format, rawUserContext?.niche],
  );

  const handleFixIt = async () => {
    if (!result?.markdown || !result.scores || fixItLoading) return;
    setFixItLoading(true);
    try {
      const r = await generateFixIt(
        result.markdown,
        result.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        rawUserContext?.niche,
        undefined,
        format,
        undefined,
        ctaFree,
      );
      setFixItResult(r);
    } catch {
      /* silent */
    } finally {
      setFixItLoading(false);
    }
  };

  const handleCheckPolicies = async () => {
    if (!result || policyLoading) return;
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      const policyPlatform = platform === "Meta" ? "meta" : platform === "TikTok" ? "tiktok" : "both";
      const r = await runPolicyCheck({
        platform: policyPlatform,
        adType: format,
        niche: userContext ? "from user context" : "unknown",
        adCopy: result.markdown,
        existingAnalysis: result.scores as unknown as object,
      });
      setPolicyResult(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Policy check failed";
      setPolicyError(msg);
    } finally {
      setPolicyLoading(false);
    }
  };

  if (!itemId || !item || item.status !== "complete" || !result?.scores) {
    return <Navigate to="/app/batch" replace />;
  }

  const fn = result.fileName || file?.name || "";
  const testLabel =
    rankTestType === "hook" ? "Hook Battle" : rankTestType === "cta" ? "CTA Showdown" : "Full Creative";

  // result.scores is confirmed non-null past the guard above
  const safeResult = result as typeof result & { scores: NonNullable<typeof result.scores> };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[color:var(--bg)]" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>{fn} — Rank scorecard — Cutsheet</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <p className="sr-only">Full scorecard for {fn} from Rank Creatives.</p>

      {/* Figma 286-1217 — back row + rank badge */}
      <div className="shrink-0 border-b border-[color:var(--border)] px-4 py-3 md:px-8">
        <Link
          to="/app/batch"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--ink-muted)] transition-[color,opacity] duration-150 hover:text-[color:var(--ink)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:opacity-90"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          Back to Rankings
        </Link>
        {totalRanked > 0 && rankIndex > 0 && (
          <div className="mt-3">
            <span
              className={cn(
                "inline-flex h-[28px] items-center rounded-full border border-[color:var(--border-strong)] px-3 text-[12px] font-semibold",
                "bg-[color:var(--surface-el)] text-[color:var(--warn)]",
              )}
            >
              #{rankIndex} of {totalRanked} creatives
            </span>
            <span className="ml-2 text-[11px] text-[color:var(--ink-muted)]">· {testLabel}</span>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left panel — AnalyzerView or VisualizePanel */}
        <div ref={leftPanelRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="relative flex flex-1 flex-col px-4 py-6 md:px-8">
            <div className="pointer-events-none absolute right-0 top-0 size-[min(600px,80vw)] rounded-full bg-[color:var(--accent)]/10 blur-[120px]" aria-hidden />
            <div className="pointer-events-none absolute bottom-0 left-0 size-[min(500px,70vw)] rounded-full bg-violet-600/[0.08] blur-[100px]" aria-hidden />
            <div className="relative flex min-h-0 flex-1 flex-col">
              {visualizeOpen || visualizeStatus !== "idle" ? (
                <motion.div
                  key="visualize"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col flex-1"
                >
                  <VisualizePanel
                    status={visualizeStatus}
                    result={visualizeResult}
                    originalImageUrl={thumbnailDataUrl ?? null}
                    error={visualizeError}
                    creditData={visualizeCreditData}
                    format={format}
                    onBack={resetVisualize}
                    onClose={resetVisualize}
                    onUpgrade={onUpgradeRequired}
                    visualizeMode={visualizeMode}
                  />
                </motion.div>
              ) : (
                <AnalyzerView
                  file={file}
                  status="complete"
                  statusMessage="Analysis complete"
                  result={result}
                  error={null}
                  thumbnailDataUrl={result.thumbnailDataUrl ?? thumbnailDataUrl ?? undefined}
                  fileObjectUrl={blobUrl}
                  format={format}
                  onFileSelect={() => {}}
                  onAnalyze={() => {}}
                  onReset={() => navigate("/app/batch")}
                  onGenerateBrief={() => {}}
                  onAddToSwipeFile={() => {
                    if (!result) return;
                    addSwipeItem({
                      fileName: result.fileName,
                      timestamp: result.timestamp.toISOString(),
                      scores: result.scores,
                      markdown: result.markdown,
                      brand: "",
                      format: "",
                      niche: "",
                      platform: "",
                      tags: [],
                      notes: "",
                    });
                  }}
                  platform={platform !== "all" ? platform : rawUserContext?.platform}
                  icon={Zap}
                  niche={rawUserContext?.niche}
                  onFixIt={handleFixIt}
                  onVisualize={handleVisualize}
                  onCheckPolicies={handleCheckPolicies}
                  onSafeZone={format === "static" && (thumbnailDataUrl || blobUrl) ? () => setSafeZoneOpen(true) : undefined}
                  onCompare={() => navigate("/app/competitor")}
                  fixItLoading={fixItLoading}
                  fixItResult={fixItResult}
                  policyLoading={policyLoading}
                  policyResult={policyResult}
                  visualizeLoading={false}
                  visualizeResult={
                    visualizeResult?.generatedImageUrl || visualizeResult?.originalImageUrl
                      ? {
                          url: visualizeResult.generatedImageUrl ?? visualizeResult.originalImageUrl,
                          type: "image" as const,
                        }
                      : null
                  }
                  designReviewData={
                    staticSecondEyeResult
                      ? {
                          flags: staticSecondEyeResult.flags ?? [],
                          topIssue: staticSecondEyeResult.topIssue,
                          overallDesignVerdict: staticSecondEyeResult.overallDesignVerdict,
                        }
                      : undefined
                  }
                  secondEyeResult={secondEyeOutput}
                  secondEyeLoading={secondEyeLoading || staticSecondEyeLoading}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right panel — extracted ScoreCard column */}
        <RankScorecardPanel
          result={safeResult}
          format={format}
          platform={platform}
          onPlatformSwitch={handlePlatformSwitch}
          isPlatformSwitching={isPlatformSwitching}
          platformScoreResult={platformScoreResult}
          youtubeFormat={youtubeFormat}
          onYoutubeFormatChange={setYoutubeFormat}
          ctaFree={ctaFree}
          onCtaFreeChange={setCtaFree}
          engineBudget={engineBudget}
          platformImprovements={platformImprovements}
          improvementsLoading={improvementsLoading}
          prediction={prediction}
          predictionLoading={predictionLoading}
          fixItResult={fixItResult}
          fixItLoading={fixItLoading}
          onFixIt={handleFixIt}
          visualizeStatus={visualizeStatus}
          onVisualize={handleVisualize}
          rawUserContextNiche={rawUserContext?.niche}
          rawUserContextPlatform={rawUserContext?.platform}
          isPro={isPro}
          onUpgradeRequired={onUpgradeRequired}
        />
      </div>

      <SafeZoneModal
        open={safeZoneOpen}
        onClose={() => setSafeZoneOpen(false)}
        thumbnailSrc={thumbnailDataUrl ?? blobUrl ?? undefined}
        mode="paid"
      />
    </div>
  );
}
