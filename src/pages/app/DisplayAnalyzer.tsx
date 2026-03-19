// src/pages/app/DisplayAnalyzer.tsx — Display & Banner Ad Analyzer

import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Monitor, Upload, Eye, Download } from "lucide-react";
import { DisplayScoreCard, type DisplayResult } from "../../components/DisplayScoreCard";
import { getImageDimensions, detectDisplayFormat, getFormatGuidance, type DisplayFormat } from "../../utils/displayAdUtils";
import { generateDisplayMockup } from "../../services/mockupService";
import { analyzeVideo } from "../../services/analyzerService";
import { getUserContext, formatUserContextBlock } from "../../services/userContextService";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

const NETWORKS = [
  { value: "google", label: "Google Display" },
  { value: "affiliate", label: "Affiliate / Direct" },
  { value: "all", label: "All Networks" },
] as const;

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState() {
  const PILLS = ["Format detection", "Placement scoring", "Real-life mockup"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 16 }}>
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Monitor size={28} color="#6366f1" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>Display & Banner Analysis</h2>
      <p style={{ fontSize: 14, color: "#71717a", textAlign: "center", maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
        Upload a Google Display or affiliate banner ad. Auto-detects format. Scored against display-specific criteria. See how it competes in a real website context.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {PILLS.map((p) => (
          <span key={p} style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 9999, padding: "4px 12px" }}>{p}</span>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function DisplayAnalyzer() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, onUpgradeRequired, registerCallbacks } =
    useOutletContext<AppSharedContext>();

  const [network, setNetwork] = useState<string>("google");
  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<DisplayFormat | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [mockupLoading, setMockupLoading] = useState(false);
  const [userContext, setUserContext] = useState("");

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

  useEffect(() => { getUserContext().then((ctx) => setUserContext(formatUserContextBlock(ctx))); }, []);

  const handleReset = useCallback(() => {
    setFile(null); setDimensions(null); setDetectedFormat(null);
    setStatus("idle"); setStatusMsg(""); setResult(null); setError(null);
    setMockupUrl(null); setMockupLoading(false);
  }, []);

  useEffect(() => {
    registerCallbacks({ onNewAnalysis: handleReset, onHistoryOpen: () => {}, hasResult: status === "complete" });
  }, [registerCallbacks, handleReset, status]);

  // Format detection on file drop
  const handleFileSelect = async (f: File) => {
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

    const displayPrompt = `You are a display advertising expert scoring a ${formatName} banner ad (${formatKey}) for ${network} networks.

${userContext}

DISPLAY AD CONTEXT:
- Format: ${formatName} (${formatKey})
- Placement: ${placement}
- Network: ${network}
- Viewer has no intent — this ad appears while they are reading content
- The ad must communicate its message in 1-2 seconds

FORMAT-SPECIFIC: ${guidance}

Score this ad on these DISPLAY-SPECIFIC criteria (each 0-10, whole numbers only):
1. VISUAL HIERARCHY — Does the eye flow: Brand → Offer → CTA in under 2 seconds?
2. CTA VISIBILITY — Is there a clear, visible CTA button/text at first glance?
3. BRAND CLARITY — Is the brand/logo immediately identifiable?
4. MESSAGE CLARITY — Can you understand the offer in under 3 seconds?
5. VISUAL CONTRAST — Does the ad stand out against a white editorial background?

Also estimate the TEXT-TO-IMAGE RATIO. Google policy: ads should not be predominantly text. Flag if text exceeds ~30%.

Scoring rubric:
1-3: Fundamentally broken  4-5: Below average  6-7: Average  8-9: Strong  10: Exceptional

Return JSON only — no prose:
{
  "overallScore": <1-10>,
  "scores": { "hierarchy": <n>, "ctaVisibility": <n>, "brandClarity": <n>, "messageClarity": <n>, "visualContrast": <n> },
  "textToImageRatio": "<e.g. ~25% text>",
  "textRatioFlag": <true if over 30%>,
  "improvements": ["<5 display-specific improvements>"],
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
          improvements: rawResult.improvements ?? [],
          formatNotes: "",
          verdict: "Analysis completed with fallback scoring.",
          placementRisk: "medium",
          placementRiskNote: "Could not determine display-specific placement risk.",
        };
      }

      setResult(displayResult);
      setStatus("complete");
      const c = increment();
      if (c >= FREE_LIMIT && !isPro) onUpgradeRequired();

      // Generate mockup (async, non-blocking)
      setMockupLoading(true);
      generateDisplayMockup(file, detectedFormat, dimensions.width, dimensions.height)
        .then((url) => { setMockupUrl(url); setMockupLoading(false); })
        .catch(() => setMockupLoading(false));

    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Display Ad Analyzer — Cutsheet</title>
        <meta name="description" content="Score Google Display and affiliate banner ads. Auto-detect format, display-specific scoring, real-life placement mockup." />
        <link rel="canonical" href="https://cutsheet.xyz/app/display" />
      </Helmet>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Intent header */}
        <div style={{
          padding: "12px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, color: "#52525b", flexShrink: 0 }}>Analyzing for:</span>
          <div style={{ display: "flex", gap: 6 }}>
            {NETWORKS.map((n) => (
              <button
                key={n.value}
                type="button"
                onClick={() => setNetwork(n.value)}
                style={{
                  height: 30, padding: "0 12px", borderRadius: 9999, fontSize: 13, cursor: "pointer",
                  background: network === n.value ? "#6366f1" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${network === n.value ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                  color: network === n.value ? "white" : "#71717a",
                  fontWeight: network === n.value ? 500 : 400,
                  transition: "all 150ms",
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
          {detectedFormat && (
            <>
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.1)", borderRadius: 9999, padding: "3px 10px" }}>
                {detectedFormat.key} · {detectedFormat.name}{detectedFormat.note ? ` (${detectedFormat.note.replace(/^Matched to \S+ /, '')})` : ''}
              </span>
            </>
          )}
          {dimensions && !detectedFormat && (
            <>
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: "#f59e0b", background: "rgba(245,158,11,0.1)", borderRadius: 9999, padding: "3px 10px" }}>
                {dimensions.width}×{dimensions.height} · Custom
              </span>
            </>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {status === "idle" && !file && <EmptyState />}

          {/* Upload + preview area */}
          <div className="relative px-4 py-6 md:px-8 min-h-full flex flex-col">
            <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />

            <div className="relative flex flex-col flex-1" style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
              {/* Dropzone or preview */}
              {!file && status === "idle" && (
                <div
                  style={{
                    height: 280, border: "2px dashed rgba(255,255,255,0.08)", borderRadius: 16,
                    background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "all 150ms",
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
                  <Upload size={28} color="#52525b" />
                  <span style={{ fontSize: 14, color: "#71717a" }}>Drop your banner ad or click to browse</span>
                  <span style={{ fontSize: 11, color: "#52525b" }}>JPG, PNG, WEBP, or GIF</span>
                </div>
              )}

              {file && previewUrl && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "center", background: "#09090b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 16 }}>
                    <img src={previewUrl} alt={file.name} style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "var(--font-mono, monospace)" }}>
                        {file.name.length > 35 ? file.name.slice(0, 32) + "..." : file.name}
                      </span>
                      {dimensions && (
                        <span style={{ fontSize: 10, color: "#52525b" }}>{dimensions.width}×{dimensions.height}</span>
                      )}
                    </div>
                    <button type="button" onClick={handleReset} style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                      Change
                    </button>
                  </div>

                  {/* Format badge */}
                  {detectedFormat && (
                    <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                      <Monitor size={14} color="#818cf8" />
                      <span style={{ fontSize: 13, color: "#818cf8" }}>
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

              {/* Analyze button */}
              {file && status === "idle" && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  style={{
                    width: "100%", height: 52, borderRadius: 9999, border: "none",
                    background: "#6366f1", color: "white", fontSize: 15, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 150ms", marginBottom: 24,
                  }}
                >
                  <Monitor size={18} /> Analyze Display Ad
                </button>
              )}

              {/* Loading */}
              {status === "analyzing" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 16 }}>
                  <div style={{ width: 24, height: 24, border: "2px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#71717a" }}>{statusMsg || "Analyzing display ad..."}</span>
                </div>
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

              {/* ── RESULTS: Two-column layout ─────────────────────── */}
              {status === "complete" && result && dimensions && (
                <div style={{ display: "flex", gap: 24, marginTop: 8, alignItems: "flex-start" }} className="max-lg:flex-col">
                  {/* LEFT — Mockup (hero) */}
                  <div style={{ flex: "0 0 42%", minWidth: 0 }} className="max-lg:w-full">
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Eye size={14} color="#71717a" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Real-life placement preview</span>
                    </div>

                    {detectedFormat && (
                      <span style={{ fontSize: 11, color: "#818cf8", background: "rgba(99,102,241,0.1)", borderRadius: 9999, padding: "3px 10px", display: "inline-block", marginBottom: 10 }}>
                        {detectedFormat.key} · {detectedFormat.name}
                      </span>
                    )}

                    {mockupLoading && (
                      <div style={{ height: 240, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 12, color: "#52525b" }}>Generating placement preview...</span>
                      </div>
                    )}

                    {!mockupLoading && mockupUrl && (
                      <>
                        <img src={mockupUrl} alt="Placement mockup" style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }} />
                        <button
                          type="button"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = mockupUrl;
                            a.download = `cutsheet-mockup-${detectedFormat?.key ?? "display"}.png`;
                            a.click();
                          }}
                          style={{
                            marginTop: 8, width: "100%", height: 36, background: "transparent",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                            color: "#71717a", fontSize: 12, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            transition: "all 150ms",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#a1a1aa"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#71717a"; }}
                        >
                          <Download size={12} /> Download mockup
                        </button>
                      </>
                    )}

                    {/* Actual banner below mockup */}
                    {previewUrl && (
                      <div style={{ marginTop: 20 }}>
                        <p style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Your ad</p>
                        <div style={{ display: "flex", justifyContent: "center", background: "#09090b", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: 10 }}>
                          <img src={previewUrl} alt={file?.name} style={{ maxWidth: "100%", maxHeight: 160, objectFit: "contain" }} />
                        </div>
                      </div>
                    )}

                    <p style={{ fontSize: 11, color: "#52525b", textAlign: "center", marginTop: 10 }}>
                      Editorial content shown in gray. Real websites may look different.
                    </p>
                  </div>

                  {/* RIGHT — Scores */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <DisplayScoreCard
                      result={result}
                      format={detectedFormat}
                      network={network}
                      mockupUrl={null}
                      mockupLoading={false}
                      dimensions={dimensions}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  );
}
