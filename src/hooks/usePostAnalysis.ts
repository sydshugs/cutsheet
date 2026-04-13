// src/hooks/usePostAnalysis.ts
//
// Consolidates all state and logic that fires AFTER the primary analysis completes.
// Extracted from PaidAdAnalyzer.tsx to keep that component focused on layout/render.

import { useState, useRef, useEffect, useCallback } from "react";
import type React from "react";
import {
  generateBriefWithClaude, generateCTARewrites, generateSecondEyeReview,
  generateStaticSecondEye, generateImprovements, generatePlatformScore,
  type SecondEyeResult,
  type StaticSecondEyeResult,
  type PlatformScore,
} from "../services/claudeService";
import { generateBrief, type AnalysisResult } from "../services/analyzerService";
import { generateFixIt, type FixItResult } from "../services/fixItService";
import { generatePrediction, type PredictionResult } from "../services/predictionService";
import { runPolicyCheck, type PolicyCheckResult } from "../lib/policyCheckService";
import { generateBudgetRecommendation, type EngineBudgetRecommendation } from "../services/budgetService";
import { saveAnalysis } from "../services/historyService";
import { generateSoundOffCheck, type SoundOffResult } from "../services/soundOffService";
import type { HistoryEntry } from "../hooks/useHistory";
import type { PaidRightPanelHandle } from "../components/paid/PaidRightPanel";

// Re-export so callers can reference via the hook module if needed
export type { SecondEyeResult, StaticSecondEyeResult, PlatformScore };

type AnalysisStatus = "idle" | "uploading" | "processing" | "complete" | "error";

const API_KEY = ""; // Gemini calls are server-side

export interface UsePostAnalysisParams {
  status: AnalysisStatus;
  result: AnalysisResult | null;
  activeResult: AnalysisResult | null;
  format: string;
  platform: string;
  userContext: string;
  rawUserContext: { niche: string; platform: string } | null;
  sessionMemoryRef: React.MutableRefObject<string>;
  thumbnailDataUrl: string | null;
  ctaFree: boolean;
  // AppLayout callbacks
  addHistoryEntry: (entry: HistoryEntry) => void;
  increment: () => number;
  isPro: boolean;
  FREE_LIMIT: number;
  onUpgradeRequired: (feature: string) => void;
  // Tab switching
  rightPanelRef: React.RefObject<PaidRightPanelHandle | null>;
}

export interface UsePostAnalysisReturn {
  // State
  secondEyeOutput: SecondEyeResult | null;
  secondEyeLoading: boolean;
  staticSecondEyeResult: StaticSecondEyeResult | null;
  staticSecondEyeLoading: boolean;
  engineBudget: EngineBudgetRecommendation | null;
  prediction: PredictionResult | null;
  predictionLoading: boolean;
  soundOffResult: SoundOffResult | null;
  soundOffLoading: boolean;
  brief: string | null;
  briefLoading: boolean;
  briefError: string | null;
  ctaRewrites: string[] | null;
  ctaLoading: boolean;
  policyResult: PolicyCheckResult | null;
  policyLoading: boolean;
  policyError: string | null;
  fixItResult: FixItResult | null;
  fixItLoading: boolean;
  savedAnalysisId: string | null;
  platformImprovements: string[] | null;
  improvementsLoading: boolean;
  platformScoreResult: PlatformScore | null;
  isPlatformSwitching: boolean;
  analysisCompletedAt: Date | null;
  infoToast: string | null;

  // Setters exposed for callers that need direct access
  setBrief: React.Dispatch<React.SetStateAction<string | null>>;
  setBriefError: React.Dispatch<React.SetStateAction<string | null>>;

  // Handlers
  handleGenerateBrief: () => Promise<void>;
  handleCTARewrite: () => Promise<void>;
  handleCheckPolicies: () => Promise<void>;
  handleFixIt: () => Promise<void>;
  handlePlatformSwitch: (newPlatform: string) => Promise<void>;
  resetPostAnalysis: () => void;
}

export function usePostAnalysis(params: UsePostAnalysisParams): UsePostAnalysisReturn {
  const {
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
  } = params;

  // ── State ──────────────────────────────────────────────────────────────────
  const [secondEyeOutput, setSecondEyeOutput] = useState<SecondEyeResult | null>(null);
  const [secondEyeLoading, setSecondEyeLoading] = useState(false);
  const [staticSecondEyeResult, setStaticSecondEyeResult] = useState<StaticSecondEyeResult | null>(null);
  const [staticSecondEyeLoading, setStaticSecondEyeLoading] = useState(false);
  const [engineBudget, setEngineBudget] = useState<EngineBudgetRecommendation | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [soundOffResult, setSoundOffResult] = useState<SoundOffResult | null>(null);
  const [soundOffLoading, setSoundOffLoading] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [ctaRewrites, setCtaRewrites] = useState<string[] | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [policyResult, setPolicyResult] = useState<PolicyCheckResult | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [fixItResult, setFixItResult] = useState<FixItResult | null>(null);
  const [fixItLoading, setFixItLoading] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [platformImprovements, setPlatformImprovements] = useState<string[] | null>(null);
  const [improvementsLoading, setImprovementsLoading] = useState(false);
  const [platformScoreResult, setPlatformScoreResult] = useState<PlatformScore | null>(null);
  const [isPlatformSwitching, setIsPlatformSwitching] = useState(false);
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);
  const [infoToast, setInfoToast] = useState<string | null>(null);

  const platformAbortRef = useRef<AbortController | null>(null);
  const postAnalysisFiredRef = useRef<string | null>(null);

  // ── Effect: stamp completedAt ──────────────────────────────────────────────
  useEffect(() => {
    if (status === "complete") setAnalysisCompletedAt(new Date());
  }, [status]);

  // ── Consolidated post-analysis: fires ALL secondary calls in parallel ──────
  useEffect(() => {
    if (status !== "complete" || !result) return;
    const key = `${result.fileName}-${result.timestamp.toISOString()}`;
    if (postAnalysisFiredRef.current === key) return;
    postAnalysisFiredRef.current = key;

    // Synchronous: budget recommendation + history
    if (result.scores) {
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "Other";
      setEngineBudget(generateBudgetRecommendation(result.scores.overall, platform, niche, format as "video" | "static"));
    }
    addHistoryEntry({
      id: crypto.randomUUID(),
      fileName: result.fileName,
      timestamp: result.timestamp.toISOString(),
      scores: result.scores,
      markdown: result.markdown,
      thumbnailDataUrl: thumbnailDataUrl ?? undefined,
    });
    const newCount = increment();
    if (newCount >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");

    saveAnalysis({
      file_name: result.fileName,
      file_type: format === "video" ? "video" : "static",
      mode: "paid",
      platform: platform || "all",
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
    }).then((id) => {
      if (id) setSavedAnalysisId(id);
    });

    // Async parallel: Second Eye (video) + Static Design Review + Prediction
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

    if (result.scores) {
      setPredictionLoading(true);
      generatePrediction(
        result.markdown,
        result.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        format as "video" | "static",
        rawUserContext?.niche,
      )
        .then((r) => {
          setPrediction(r);
          setPredictionLoading(false);
        })
        .catch((err) => {
          console.error("Prediction failed (silent):", err);
          setPredictionLoading(false);
        });
    }

    // Sound-Off Readability — video only, 0 credits, silent fail
    if (format === "video") {
      setSoundOffLoading(true);
      setSoundOffResult(null);
      generateSoundOffCheck(
        result.markdown,
        platform === "all" ? (rawUserContext?.platform || "all") : platform,
      )
        .then(setSoundOffResult)
        .catch(() => setSoundOffResult(null))
        .finally(() => setSoundOffLoading(false));
    }
  }, [status, result]); // eslint-disable-line

  // ── handleGenerateBrief ────────────────────────────────────────────────────
  const handleGenerateBrief = useCallback(async () => {
    if (!activeResult || briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const r = await generateBriefWithClaude(
        activeResult.markdown,
        activeResult.fileName,
        userContext || undefined,
        sessionMemoryRef.current,
        format,
        platform,
      );
      setBrief(r);
      rightPanelRef.current?.setTab("brief");
    } catch {
      try {
        const r = await generateBrief(activeResult.markdown, API_KEY);
        setBrief(r);
        rightPanelRef.current?.setTab("brief");
      } catch (err) {
        setBriefError(err instanceof Error ? err.message : "Failed to generate brief.");
      }
    } finally {
      setBriefLoading(false);
    }
  }, [activeResult, briefLoading, userContext, sessionMemoryRef, format, platform, rightPanelRef]);

  // ── handleCTARewrite ───────────────────────────────────────────────────────
  const handleCTARewrite = useCallback(async () => {
    if (!activeResult || ctaLoading) return;
    setCtaLoading(true);
    try {
      const ctaSection = activeResult.markdown.match(/CTA[\s\S]*?(?=\n##|\n---)/i)?.[0] ?? "";
      const rewrites = await generateCTARewrites(
        ctaSection,
        activeResult.fileName,
        userContext || undefined,
        sessionMemoryRef.current,
      );
      setCtaRewrites(rewrites);
    } catch {
      /* silent */
    } finally {
      setCtaLoading(false);
    }
  }, [activeResult, ctaLoading, userContext, sessionMemoryRef]);

  // ── handleCheckPolicies ────────────────────────────────────────────────────
  const handleCheckPolicies = useCallback(async () => {
    if (!activeResult || policyLoading) return;
    setPolicyLoading(true);
    setPolicyError(null);
    rightPanelRef.current?.setTab("policy");
    try {
      const policyPlatform =
        platform === "Meta" ? "meta" : platform === "TikTok" ? "tiktok" : "both";
      const r = await runPolicyCheck({
        platform: policyPlatform,
        adType: format as "video" | "static" | "display",
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
  }, [activeResult, policyLoading, platform, format, userContext, rightPanelRef]);

  // ── handleFixIt ────────────────────────────────────────────────────────────
  const handleFixIt = useCallback(async () => {
    if (!activeResult?.markdown || !activeResult?.scores || fixItLoading) return;
    setFixItLoading(true);
    rightPanelRef.current?.setTab("ai_rewrite");
    try {
      const fixResult = await generateFixIt(
        activeResult.markdown,
        activeResult.scores,
        platform === "all" ? rawUserContext?.platform : platform,
        rawUserContext?.niche,
        undefined, // intent
        format as "video" | "static",
        undefined, // isOrganic
        ctaFree,
      );
      setFixItResult(fixResult);
    } catch (err) {
      console.error("Fix It failed:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.startsWith("RATE_LIMITED")) {
        setInfoToast("Fix It limit reached. Try again later.");
        setTimeout(() => setInfoToast(null), 3000);
      }
    } finally {
      setFixItLoading(false);
    }
  }, [activeResult, fixItLoading, platform, rawUserContext, format, ctaFree, rightPanelRef]);

  // ── handlePlatformSwitch ───────────────────────────────────────────────────
  const handlePlatformSwitch = useCallback(
    async (newPlatform: string) => {
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
          generateImprovements(
            result.markdown,
            result.scores,
            userContext || undefined,
            newPlatform,
            sessionMemoryRef.current,
          ),
          generatePlatformScore(
            newPlatform,
            { markdown: result.markdown, scores: result.scores ?? { overall: 0 } },
            result.fileName,
            format as "video" | "static",
            userContext || undefined,
            rawUserContext?.niche,
          ),
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
    },
    [status, result, userContext, sessionMemoryRef, format, rawUserContext],
  );

  // ── resetPostAnalysis ──────────────────────────────────────────────────────
  const resetPostAnalysis = useCallback(() => {
    setSecondEyeOutput(null);
    setSecondEyeLoading(false);
    setStaticSecondEyeResult(null);
    setStaticSecondEyeLoading(false);
    setEngineBudget(null);
    setPrediction(null);
    setPredictionLoading(false);
    setSoundOffResult(null);
    setSoundOffLoading(false);
    setBrief(null);
    setBriefError(null);
    setBriefLoading(false);
    setCtaRewrites(null);
    setCtaLoading(false);
    setPolicyResult(null);
    setPolicyLoading(false);
    setPolicyError(null);
    setFixItResult(null);
    setFixItLoading(false);
    setSavedAnalysisId(null);
    setPlatformImprovements(null);
    setImprovementsLoading(false);
    setPlatformScoreResult(null);
    setIsPlatformSwitching(false);
    setAnalysisCompletedAt(null);
    postAnalysisFiredRef.current = null;
  }, []);

  return {
    // State
    secondEyeOutput,
    secondEyeLoading,
    staticSecondEyeResult,
    staticSecondEyeLoading,
    engineBudget,
    prediction,
    predictionLoading,
    soundOffResult,
    soundOffLoading,
    brief,
    briefLoading,
    briefError,
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
    infoToast,

    // Setters
    setBrief,
    setBriefError,

    // Handlers
    handleGenerateBrief,
    handleCTARewrite,
    handleCheckPolicies,
    handleFixIt,
    handlePlatformSwitch,
    resetPostAnalysis,
  };
}
