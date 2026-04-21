// src/pages/app/DisplayAnalyzer.tsx — Display & Banner Ad Analyzer

import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Monitor, Upload } from "lucide-react";
import { VideoDropzone } from "../../components/VideoDropzone";
import { ProgressCard } from "../../components/ProgressCard";
import { sanitizeFileName } from "../../utils/sanitize";
import type { DisplayResult } from "../../types/display";
import { runPolicyCheck, type PolicyCheckResult } from "../../lib/policyCheckService";
import { getImageDimensions, detectDisplayFormat, getFormatGuidance, type DisplayFormat } from "../../utils/displayAdUtils";
import { generateDisplayMockup, generateSuiteMockup } from "../../services/mockupService";
import { analyzeVideo, generateBrief } from "../../services/analyzerService";
import { analyzeSuiteCohesion, generateCTARewrites, type SuiteCohesionResult } from "../../services/claudeService";
import { getUserContext, formatUserContextBlock } from "../../services/userContextService";
import { AnimateToHtml5Takeover } from "../../components/AnimateToHtml5Takeover";
import { visualizeAd } from "../../lib/visualizeService";
import { uploadImageToStorage, removeFromStorage } from "../../lib/storageService";
import type { VisualizeResult, VisualizeStatus, VisualizeCreditData } from "../../types/visualize";
import { getSessionMemory } from "@/src/lib/userMemoryService";
import { generatePrediction, type PredictionResult } from "../../services/predictionService";
import { generateBudgetRecommendation, type EngineBudgetRecommendation } from "../../services/budgetService";
import type { AppSharedContext } from "../../components/AppLayout";
import { cn } from "../../lib/utils";
import { DisplayRightPanel } from "../../components/display/DisplayRightPanel";
import { DisplaySuiteView, type SuiteBanner } from "../../components/display/DisplaySuiteView";
import { DisplaySingleResults } from "../../components/display/DisplaySingleResults";

type Mode = "single" | "suite";

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze

const NETWORKS = [
  { value: "google", label: "Google Display" },
  { value: "affiliate", label: "Affiliate / Direct" },
  { value: "all", label: "All Networks" },
] as const;

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState({ onFileSelect }: { onFileSelect: (f: File | null) => void }) {
  const PILLS = ["Format detection", "Placement mockup", "GDN compliance"];
  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-[62px] min-h-[min(100%,calc(100vh-120px))]"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--analyzer-idle-ambient-display)" }}
        aria-hidden
      />

      <div className="relative z-[1] flex w-full max-w-[731px] flex-col items-center gap-[22px]">
        {/* Icon tile */}
        <div
          className="flex size-[76px] shrink-0 items-center justify-center rounded-[16px] border"
          style={{ background: "rgba(14,165,233,0.1)", borderColor: "rgba(14,165,233,0.2)" }}
        >
          <Monitor className="size-[31px] text-[color:var(--display-accent)]" strokeWidth={1.75} aria-hidden />
        </div>

        {/* Heading + subtitle + pills */}
        <div className="flex flex-col items-center gap-[12px]">
          <div className="flex flex-col items-center gap-[6px]">
            <h1 className="m-0 text-center text-[19px] font-semibold leading-tight text-[color:var(--ink)]">
              Score your display ad
            </h1>
            <p className="m-0 max-w-[325px] text-center text-[13.5px] leading-[1.6] text-[color:var(--ink-muted)]">
              Upload a banner ad. Get format detection, placement scoring, and a real-life mockup in 30 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded-full border px-3 py-1 text-[11.5px] font-normal leading-[15px]"
                style={{
                  background: "rgba(14,165,233,0.15)",
                  borderColor: "rgba(14,165,233,0.25)",
                  color: "#0ea5e9",
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div className="w-full">
          <VideoDropzone
            onFileSelect={onFileSelect}
            file={null}
            acceptImages
            heading="Drop your banner here"
            formatHint="JPG · PNG · GIF · HTML5 · up to 500MB"
            layoutVariant="hero"
            heroAccent="display"
            wrapperClassName="max-w-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function DisplayAnalyzer() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, onUpgradeRequired, registerCallbacks } =
    useOutletContext<AppSharedContext>();

  const [mode, setMode] = useState<Mode>("single");
  const [network, setNetwork] = useState<string>("google");
  // ── Single ad state
  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<DisplayFormat | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [engineBudget, setEngineBudget] = useState<EngineBudgetRecommendation | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefMarkdown, setBriefMarkdown] = useState<string | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [mockupLoading, setMockupLoading] = useState(false);
  const [userContext, setUserContext] = useState("");
  const [policyResult, setPolicyResult] = useState<PolicyCheckResult | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const sessionMemoryRef = useRef<string>('');
  // ── Suite state
  const [suiteBanners, setSuiteBanners] = useState<SuiteBanner[]>([]);
  const [suiteStatus, setSuiteStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle");
  const [suiteCohesion, setSuiteCohesion] = useState<SuiteCohesionResult | null>(null);
  const [suiteCohesionError, setSuiteCohesionError] = useState(false);
  const [suiteMockupUrl, setSuiteMockupUrl] = useState<string | null>(null);
  const [suiteMockupLoading, setSuiteMockupLoading] = useState(false);

  // ── AI Rewrite state
  const [ctaRewrites, setCtaRewrites] = useState<string[] | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);

  // ── Animate to HTML5 state
  const [showAnimateTakeover, setShowAnimateTakeover] = useState(false);

  // ── Visualize It state (single mode only)
  const [visualizeOpen, setVisualizeOpen] = useState(false);
  const [visualizeStatus, setVisualizeStatus] = useState<VisualizeStatus>("idle");
  const [visualizeResult, setVisualizeResult] = useState<VisualizeResult | null>(null);
  const [visualizeError, setVisualizeError] = useState<string | null>(null);
  const [visualizeCreditData, setVisualizeCreditData] = useState<VisualizeCreditData | null>(null);
  const [confirmStartOverDisplay, setConfirmStartOverDisplay] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

  useEffect(() => { getUserContext().then((ctx) => setUserContext(formatUserContextBlock(ctx))); }, []);

  const handleReset = useCallback(() => {
    setFile(null); setDimensions(null); setDetectedFormat(null);
    setStatus("idle"); setStatusMsg(""); setResult(null); setError(null);
    setMockupUrl(null); setMockupLoading(false);
    setSuiteBanners([]); setSuiteStatus("idle"); setSuiteCohesion(null); setSuiteCohesionError(false);
    setSuiteMockupUrl(null); setSuiteMockupLoading(false);
    setPolicyResult(null); setPolicyLoading(false); setPolicyError(null);
    setPrediction(null);
    setEngineBudget(null);
    setBriefMarkdown(null); setBriefLoading(false); setBriefError(null);
    setShowAnimateTakeover(false);
    setVisualizeOpen(false); setVisualizeStatus("idle"); setVisualizeResult(null); setVisualizeError(null); setVisualizeCreditData(null);
  }, []);

  const isComplete = mode === "single" ? status === "complete" : suiteStatus === "complete";
  useEffect(() => {
    registerCallbacks({ onNewAnalysis: handleReset, onHistoryOpen: () => {}, hasResult: isComplete });
  }, [registerCallbacks, handleReset, isComplete]);

  // ── Suite handlers
  const addSuiteBanner = async (f: File) => {
    if (suiteBanners.length >= 8) return;
    const dims = await getImageDimensions(f);
    const fmt = detectDisplayFormat(dims.width, dims.height);
    setSuiteBanners((prev) => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file: f, format: fmt, dimensions: dims, status: "pending", result: null,
    }]);
  };

  const removeSuiteBanner = (id: string) => {
    setSuiteBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSuiteAnalyze = async () => {
    if (suiteBanners.length < 2 || !canAnalyze) return;
    let sessionMemory = '';
    try {
      ({ text: sessionMemory } = await getSessionMemory());
    } catch { /* non-critical — proceed without memory */ }
    sessionMemoryRef.current = sessionMemory;
    setSuiteStatus("analyzing");
    setSuiteCohesion(null);
    setSuiteMockupUrl(null);

    // Analyze each banner in parallel
    const updated = [...suiteBanners].map((b) => ({ ...b, status: "analyzing" as const }));
    setSuiteBanners(updated);

    const results = await Promise.allSettled(
      updated.map(async (banner) => {
        const formatName = banner.format?.name ?? "Custom";
        const formatKey = banner.format?.key ?? `${banner.dimensions.width}x${banner.dimensions.height}`;
        const placement = banner.format?.placement ?? "Unknown";
        const guidance = banner.format ? getFormatGuidance(banner.format) : "Non-standard format.";

        const displayPrompt = `You are a display advertising expert scoring a ${formatName} banner ad (${formatKey}).
FORMAT-SPECIFIC: ${guidance}
Placement: ${placement}
Score on: VISUAL HIERARCHY, CTA VISIBILITY, BRAND CLARITY, MESSAGE CLARITY, VISUAL CONTRAST (each 0-10, whole numbers).
Estimate TEXT-TO-IMAGE RATIO. Flag if over 30%.
Return JSON only:
{"overallScore":<n>,"scores":{"hierarchy":<n>,"ctaVisibility":<n>,"brandClarity":<n>,"messageClarity":<n>,"visualContrast":<n>},"textToImageRatio":"<str>","textRatioFlag":<bool>,"improvements":[{"fix":"<text>","category":"hierarchy|typography|layout|contrast","severity":"high|medium|low"}],"formatNotes":"<str>","verdict":"<str>","placementRisk":"low"|"medium"|"high","placementRiskNote":"<str>"}`;

        const rawResult = await analyzeVideo(banner.file, API_KEY, undefined, displayPrompt, userContext);
        const jsonMatch = rawResult.markdown.match(/\{[\s\S]*"overallScore"[\s\S]*\}/);
        let displayResult: DisplayResult | null = null;
        if (jsonMatch) {
          try {
            displayResult = JSON.parse(jsonMatch[0]);
            // Runtime guard: AI may return plain strings instead of objects
            if (displayResult?.improvements?.length && typeof displayResult.improvements[0] === 'string') {
              displayResult.improvements = (displayResult.improvements as unknown as string[]).map((imp, i) => ({
                fix: imp, category: 'layout', severity: i === 0 ? 'high' : i < 3 ? 'medium' : 'low',
              }));
            }
          } catch { /* fallback */ }
        }
        if (!displayResult) {
          displayResult = {
            overallScore: rawResult.scores?.overall ?? 5,
            scores: { hierarchy: 5, ctaVisibility: 5, brandClarity: 5, messageClarity: 5, visualContrast: 5 },
            textToImageRatio: "~Unknown", textRatioFlag: false,
            improvements: (rawResult.improvements ?? []).map((imp: string, i: number) => ({
              fix: imp, category: 'layout', severity: i === 0 ? 'high' : i < 3 ? 'medium' : 'low',
            })), formatNotes: "", verdict: "Fallback scoring.",
            placementRisk: "medium", placementRiskNote: "Could not determine.",
          };
        }
        return { id: banner.id, result: displayResult };
      })
    );

    // Update banners with results
    setSuiteBanners((prev) =>
      prev.map((b) => {
        const settled = results.find((r) => r.status === "fulfilled" && r.value.id === b.id);
        if (settled?.status === "fulfilled") {
          return { ...b, status: "complete" as const, result: settled.value.result };
        }
        return { ...b, status: "error" as const };
      })
    );

    // Run suite cohesion analysis
    const completedBanners = results
      .filter((r): r is PromiseFulfilledResult<{ id: string; result: DisplayResult }> => r.status === "fulfilled")
      .map((r) => {
        const banner = updated.find((b) => b.id === r.value.id)!;
        return {
          format: banner.format?.name ?? `${banner.dimensions.width}x${banner.dimensions.height}`,
          fileName: banner.file.name,
          overallScore: r.value.result.overallScore,
          improvements: r.value.result.improvements.map(i => i.fix),
        };
      });

    if (completedBanners.length >= 2) {
      try {
        setSuiteCohesionError(false);
        const cohesion = await analyzeSuiteCohesion(completedBanners, userContext, sessionMemoryRef.current);
        setSuiteCohesion(cohesion);
      } catch (e) {
        console.error("Suite cohesion failed:", e);
        setSuiteCohesionError(true);
      }
    } else {
      setSuiteCohesionError(true);
    }

    setSuiteStatus("complete");
    const c = increment();
    if (c >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");

    // Generate suite mockup
    setSuiteMockupLoading(true);
    const bannersWithResults = suiteBanners.map((b) => {
      const settled = results.find((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<{ id: string; result: DisplayResult }>).value.id === b.id);
      return {
        file: b.file,
        format: b.format,
        score: settled?.status === "fulfilled" ? (settled as PromiseFulfilledResult<{ id: string; result: DisplayResult }>).value.result.overallScore : undefined,
      };
    });
    generateSuiteMockup(bannersWithResults)
      .then((url) => { setSuiteMockupUrl(url); setSuiteMockupLoading(false); })
      .catch(() => setSuiteMockupLoading(false));
  };

  const handleRetryCoheison = async () => {
    setSuiteCohesionError(false);
    try {
      const bannerData = suiteBanners.filter((b) => b.result).map((b) => ({
        format: b.format?.name ?? "Custom",
        fileName: b.file.name,
        overallScore: b.result!.overallScore,
        improvements: b.result!.improvements.map((i) => i.fix),
      }));
      const cohesion = await analyzeSuiteCohesion(bannerData, userContext, sessionMemoryRef.current);
      setSuiteCohesion(cohesion);
    } catch {
      setSuiteCohesionError(true);
    }
  };

  // Format detection on file drop
  const handleFileSelect = async (f: File | null) => {
    if (!f) {
      setFile(null);
      setDimensions(null);
      setDetectedFormat(null);
      setResult(null);
      setMockupUrl(null);
      setError(null);
      setStatus("idle");
      return;
    }

    // Size validation — display banners are images only, 10MB max
    const MAX_IMAGE_SIZE_MB = 10;
    const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (f.size > MAX_IMAGE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB for display banner images.`);
      setStatus("error");
      return;
    }

    setFile(f);
    setResult(null);
    setMockupUrl(null);
    setError(null);
    try {
      const dims = await getImageDimensions(f);
      setDimensions(dims);
      const fmt = detectDisplayFormat(dims.width, dims.height);
      setDetectedFormat(fmt);
    } catch {
      setDimensions(null);
      setDetectedFormat(null);
    }
  };

  // Auto-analyze when file + dimensions are ready (no manual button needed)
  const autoAnalyzeRef = useRef(false);
  useEffect(() => {
    if (file && dimensions && status === "idle" && canAnalyze && !autoAnalyzeRef.current) {
      autoAnalyzeRef.current = true;
      handleAnalyze();
    }
    if (!file) autoAnalyzeRef.current = false;
  }, [file, dimensions, status, canAnalyze]); // eslint-disable-line react-hooks/exhaustive-deps

  // Analyze
  const handleAnalyze = async () => {
    if (!file || !canAnalyze || !dimensions) return;
    setStatus("analyzing");
    setError(null);
    setResult(null);
    setMockupUrl(null);

    const formatName = detectedFormat?.name ?? "Custom";
    const formatKey = detectedFormat?.key ?? `${dimensions.width}x${dimensions.height}`;
    const placement = detectedFormat?.placement ?? "Unknown placement";
    const guidance = detectedFormat ? getFormatGuidance(detectedFormat) : "Non-standard format. Apply general display best practices.";

    const displayPrompt = `CRITICAL CONTEXT: This is a GOOGLE DISPLAY NETWORK (GDN) static banner ad — NOT a social media ad, video ad, or native ad. It appears as a fixed-size banner on third-party websites while the viewer is reading unrelated content. The viewer has no purchase intent and will see this ad for 1-2 seconds at most. Do NOT apply social media metrics (scroll-stop, hook strength, native feel, watch time, retention) to this evaluation.

You are a display advertising expert scoring a ${formatName} banner ad (${formatKey}) for ${network} networks.

${userContext}

DISPLAY AD CONTEXT:
- Format: ${formatName} (${formatKey})
- Placement: ${placement}
- Network: ${network}
- Viewer has no intent — this ad appears while they are reading content
- The ad must communicate its message in 1-2 seconds

FORMAT-SPECIFIC: ${guidance}

SCORING RULES — DETERMINISTIC:
You are a scoring engine. Apply criteria mechanically and consistently.
For the same input, always produce the same score. Scores must be integers 1-10. No decimals. No ranges.
1-3: Significant problems. 4-6: Functional but weak. 7-8: Solid. 9-10: Excellent.

Score this ad on these DISPLAY-SPECIFIC criteria (each 1-10, whole numbers only):
1. VISUAL HIERARCHY (25% weight) — Does the eye flow: headline → image → CTA instantly?
2. CTA CLARITY (20% weight) — Is the CTA immediately visible? Action-oriented and specific? Display ads REQUIRE an in-creative CTA.
3. BRAND VISIBILITY (15% weight) — Logo/brand mark visible at first glance without hunting?
4. MESSAGE CLARITY (15% weight) — Can you understand the full offer in 1-2 seconds flat?
5. TEXT-TO-IMAGE RATIO (15% weight) — Is text within acceptable limits? Flag if >30% text area.
6. CONTRAST & VISIBILITY (10% weight) — Does the ad stand out against a typical white/grey webpage background?

Do NOT score for: hook strength, scroll-stop power, native feel, sound-off, retention, shareability, or any social media metrics.
Do NOT suggest removing the CTA — display ads REQUIRE an in-creative CTA. The advertiser cannot add a CTA externally like on Meta.

Return JSON only — no prose:
{
  "overallScore": <1-10>,
  "scores": { "hierarchy": <n>, "ctaVisibility": <n>, "brandClarity": <n>, "messageClarity": <n>, "textRatio": <n>, "visualContrast": <n> },
  "textToImageRatio": "<e.g. ~25% text>",
  "textRatioFlag": <true if over 30%>,
  "improvements": [{"fix":"<improvement text>","category":"hierarchy|typography|layout|contrast","severity":"high|medium|low"}],
  "formatNotes": "<format-specific observations>",
  "verdict": "<one sentence honest assessment>",
  "placementRisk": "low" | "medium" | "high",
  "placementRiskNote": "<why the ad might get lost>"
}`;

    try {
      setStatusMsg("Analyzing display ad...");
      const rawResult = await analyzeVideo(file, API_KEY, undefined, displayPrompt, userContext);

      // Parse the display-specific JSON from the markdown
      let displayResult: DisplayResult | null = null;
      const jsonMatch = rawResult.markdown.match(/\{[\s\S]*"overallScore"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          displayResult = JSON.parse(jsonMatch[0]) as DisplayResult;
          // Runtime guard: AI may return plain strings instead of objects
          if (displayResult?.improvements?.length && typeof displayResult.improvements[0] === 'string') {
            displayResult.improvements = (displayResult.improvements as unknown as string[]).map((imp, i) => ({
              fix: imp,
              category: 'layout',
              severity: i === 0 ? 'high' : i < 3 ? 'medium' : 'low',
            }));
          }
        } catch { /* fallback below */ }
      }

      if (!displayResult) {
        // Fallback: map standard scores to display scores
        displayResult = {
          overallScore: rawResult.scores?.overall ?? 5,
          scores: {
            hierarchy: rawResult.scores?.production ?? 5,
            ctaVisibility: rawResult.scores?.cta ?? 5,
            brandClarity: rawResult.scores?.clarity ?? 5,
            messageClarity: rawResult.scores?.clarity ?? 5,
            visualContrast: rawResult.scores?.hook ?? 5,
          },
          textToImageRatio: "~Unknown",
          textRatioFlag: false,
          improvements: (rawResult.improvements ?? []).map((imp: string, i: number) => ({
            fix: imp, category: 'layout', severity: i === 0 ? 'high' : i < 3 ? 'medium' : 'low',
          })),
          formatNotes: "",
          verdict: "Analysis completed with fallback scoring.",
          placementRisk: "medium",
          placementRiskNote: "Could not determine display-specific placement risk.",
        };
      }

      setResult(displayResult);
      setStatus("complete");
      const c = increment();
      if (c >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");

      // Generate mockup (async, non-blocking)
      setMockupLoading(true);
      generateDisplayMockup(file, detectedFormat, dimensions.width, dimensions.height)
        .then((url) => { setMockupUrl(url); setMockupLoading(false); })
        .catch(() => setMockupLoading(false));

      // Generate prediction + budget (async, non-blocking)
      if (displayResult.scores) {
        const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "general";
        const predScores = {
          hook: displayResult.scores.hierarchy,
          clarity: displayResult.scores.messageClarity,
          cta: displayResult.scores.ctaVisibility,
          production: displayResult.scores.brandClarity,
          overall: displayResult.overallScore,
        };
        generatePrediction(
          rawResult.markdown, predScores,
          'google_display', 'static', niche,
        ).then(setPrediction).catch((err) => console.error('Display prediction failed (silent):', err));
        setEngineBudget(generateBudgetRecommendation(displayResult.overallScore, "google", niche, "static"));
      }

    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
      autoAnalyzeRef.current = false; // allow retry after error
    }
  };

  const handleCTARewrite = async () => {
    if (!result || ctaLoading) return;
    setCtaLoading(true);
    try {
      const ctaContext = `CTA Visibility: ${result.scores.ctaVisibility}/10. Verdict: ${result.verdict}. Improvements: ${result.improvements.map(i => i.fix).join("; ")}`;
      const rewrites = await generateCTARewrites(ctaContext, file?.name ?? "display-ad", userContext || undefined, sessionMemoryRef.current);
      setCtaRewrites(rewrites);
    } catch { /* silent */ }
    finally { setCtaLoading(false); }
  };

  const handleGenerateBrief = async () => {
    if (!result || briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "general";
      const platform = network === "google" ? "Google Display" : network === "affiliate" ? "Affiliate" : "All Networks";
      const scores = { hook: result.scores.hierarchy, clarity: result.scores.messageClarity, cta: result.scores.ctaVisibility, production: result.scores.brandClarity, overall: result.overallScore };
      const md = await generateBrief(result.verdict + "\n\n" + result.improvements.map(i => i.fix).join("\n"), API_KEY, platform, niche, scores, undefined);
      setBriefMarkdown(md);
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : "Brief generation failed");
    } finally {
      setBriefLoading(false);
    }
  };

  const handleVisualize = async () => {
    if (!result || !file) return;
    setVisualizeOpen(true);
    setVisualizeStatus("loading");
    setVisualizeResult(null);
    setVisualizeError(null);
    try {
      const { signedUrl: imageStorageUrl, storagePath } = await uploadImageToStorage(file, 1200, 0.85);
      const niche = userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "general";
      const vizResult = await visualizeAd({
        imageStorageUrl,
        imageMediaType: "image/jpeg",
        analysisResult: {
          scores: result.scores as unknown as Record<string, number>,
          improvements: (result.improvements ?? []).map(i => i.fix),
        },
        platform: network === "google" ? "Google Display" : network === "affiliate" ? "Affiliate" : "general",
        niche,
        adType: "display",
      });
      setVisualizeResult(vizResult);
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
        const creditErr = err as Error & { creditData: VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        return;
      }
      setVisualizeError(msg.includes("RATE_LIMITED") ? "RATE_LIMITED" : msg);
      setVisualizeStatus("error");
    }
  };

  const handleCheckPolicies = async () => {
    if (!result || policyLoading) return;
    setPolicyLoading(true);
    setPolicyError(null);
    setPolicyResult(null);
    try {
      const r = await runPolicyCheck({
        platform: "both",
        adType: "display",
        niche: "display advertising",
        adCopy: result.improvements?.map(i => i.fix).join(". ") ?? "",
        existingAnalysis: result as unknown as object,
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

  return (
    <div className="relative flex h-full min-h-0">
      <Helmet>
        <title>Display Ad Analyzer — Cutsheet</title>
        <meta name="description" content="Score Google Display and affiliate banner ads. Auto-detect format, display-specific scoring, real-life placement mockup." />
        <link rel="canonical" href="https://cutsheet.xyz/app/display" />
      </Helmet>

      {/* Animate to HTML5 — full-page takeover */}
      {showAnimateTakeover && file && detectedFormat && (
        <AnimateToHtml5Takeover
          onClose={() => setShowAnimateTakeover(false)}
          imageSrc={previewUrl ?? ""}
          imageFile={file}
          format={detectedFormat.key}
          formatLabel={detectedFormat.name}
          fileName={file.name}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Intent header removed */}

        <div className="flex-1 flex flex-col overflow-auto">
          {/* ── SUITE MODE ──────────────────────────────────────────── */}
          {mode === "suite" && (
            <DisplaySuiteView
              suiteBanners={suiteBanners}
              suiteStatus={suiteStatus}
              suiteCohesion={suiteCohesion}
              suiteCohesionError={suiteCohesionError}
              suiteMockupUrl={suiteMockupUrl}
              suiteMockupLoading={suiteMockupLoading}
              canAnalyze={canAnalyze}
              onAddBanners={(files) => files.forEach((f) => addSuiteBanner(f))}
              onRemoveBanner={removeSuiteBanner}
              onAnalyzeSuite={handleSuiteAnalyze}
              onRetryCoheison={handleRetryCoheison}
              onReset={handleReset}
            />
          )}

          {/* ── SINGLE MODE ─────────────────────────────────────────── */}
          {mode === "single" && status === "idle" && !file && <EmptyState onFileSelect={handleFileSelect} />}

          {mode === "single" && (file || status !== "idle") && (
          /* Upload + preview area — only when file is loaded or analysis in progress */
          <div className={`relative flex flex-col ${"px-4 py-6 md:px-8 min-h-full"}`}>


            <div className={`relative flex flex-col flex-1 ${status === "analyzing" ? "justify-center" : ""}`} style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
              {/* Dropzone or preview */}
              {!file && status === "idle" && (
                <div
                  style={{
                    height: 280, border: "2px dashed rgba(255,255,255,0.08)", borderRadius: 16,
                    background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "border-color 150ms, background-color 150ms",
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/jpeg,image/png,image/webp,image/gif";
                    input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFileSelect(f); };
                    input.click();
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileSelect(f);
                  }}
                >
                  <Upload size={28} color="#71717a" />
                  <span style={{ fontSize: 14, color: "#a1a1aa" }}>Drop your banner ad or click to browse</span>
                  <span style={{ fontSize: 11, color: "#71717a" }}>JPG, PNG, WEBP, or GIF</span>
                </div>
              )}

              {file && previewUrl && status !== "complete" && status !== "analyzing" && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "center", background: "var(--bg)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 16 }}>
                    <img src={previewUrl} alt={sanitizeFileName(file.name)} style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "var(--font-mono, monospace)" }}>
                        {(() => { const n = sanitizeFileName(file.name); return n.length > 35 ? n.slice(0, 32) + "..." : n; })()}
                      </span>
                      {dimensions ? (
                        <span style={{ fontSize: 10, color: "#52525b" }}>{dimensions.width}×{dimensions.height}</span>
                      ) : (
                        <span style={{ fontSize: 10, color: "#52525b" }}>Reading file...</span>
                      )}
                    </div>
                    <button type="button" onClick={handleReset} style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                      Change
                    </button>
                  </div>

                  {/* Format badge */}
                  {detectedFormat && (
                    <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 10, background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                      <Monitor size={14} color="#06b6d4" />
                      <span style={{ fontSize: 13, color: "#06b6d4" }}>
                        {detectedFormat.key} · {detectedFormat.name} · {detectedFormat.placement}{detectedFormat.note ? ` · ${detectedFormat.note.replace(/^Matched to \S+ /, '')}` : ''}
                      </span>
                    </div>
                  )}
                  {dimensions && !detectedFormat && (
                    <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                      <Monitor size={14} color="#f59e0b" />
                      <span style={{ fontSize: 13, color: "#f59e0b" }}>
                        Custom size: {dimensions.width}×{dimensions.height} — Non-standard display format
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Analysis auto-triggers on file drop via useEffect */}

              {/* Loading — unified ProgressCard */}
              {status === "analyzing" && file && (
                <ProgressCard
                  file={file}
                  status="processing"
                  statusMessage={statusMsg || "Analyzing display ad..."}
                  onCancel={handleReset}
                  format="static"
                  icon={Monitor}
                  title="Analyzing your display ad"
                />
              )}

              {/* Error */}
              {status === "error" && error && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>
                  <button type="button" onClick={() => { setStatus("idle"); setError(null); }}
                    style={{ fontSize: 12, color: "#71717a", background: "none", border: "none", cursor: "pointer", marginTop: 6, textDecoration: "underline" }}>
                    Try again
                  </button>
                </div>
              )}

              {/* ── RESULTS ─────────────────────────────────────────── */}
              {status === "complete" && result && dimensions && (
                <DisplaySingleResults
                  result={result}
                  previewUrl={previewUrl}
                  mockupUrl={mockupUrl}
                  detectedFormat={detectedFormat}
                  ctaRewrites={ctaRewrites}
                  ctaLoading={ctaLoading}
                  policyLoading={policyLoading}
                  onSwitchToSuite={() => { setMode("suite" as Mode); handleReset(); }}
                  onCTARewrite={handleCTARewrite}
                  onCheckPolicies={handleCheckPolicies}
                  onAnimate={() => setShowAnimateTakeover(true)}
                />
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Right panel — scores sidebar (Single mode only, when complete) */}
      {mode === "single" && status === "complete" && result && (
        <DisplayRightPanel
          show={true}
          result={result}
          fileName={file?.name}
          previewUrl={previewUrl}
          niche={userContext.match(/Niche:\s*(.+)/)?.[1]?.trim()}
          engineBudget={engineBudget}
          prediction={prediction}
          briefLoading={briefLoading}
          briefMarkdown={briefMarkdown}
          briefError={briefError}
          policyResult={policyResult}
          policyLoading={policyLoading}
          policyError={policyError}
          visualizeOpen={visualizeOpen}
          visualizeStatus={visualizeStatus}
          visualizeResult={visualizeResult}
          visualizeError={visualizeError}
          visualizeCreditData={visualizeCreditData}
          confirmStartOver={confirmStartOverDisplay}
          isPro={isPro}
          onGenerateBrief={handleGenerateBrief}
          onCheckPolicies={handleCheckPolicies}
          onVisualize={handleVisualize}
          onReanalyze={handleReset}
          onStartOver={() => setConfirmStartOverDisplay(true)}
          onConfirmStartOver={() => { setConfirmStartOverDisplay(false); handleReset(); }}
          onCancelStartOver={() => setConfirmStartOverDisplay(false)}
          onClosePolicyResult={() => setPolicyResult(null)}
          onCloseVisualize={() => {
            setVisualizeOpen(false);
            setVisualizeStatus("idle");
            setVisualizeResult(null);
            setVisualizeError(null);
            setVisualizeCreditData(null);
          }}
          onUpgradeRequired={onUpgradeRequired}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  );
}
