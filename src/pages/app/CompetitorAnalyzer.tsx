// src/pages/app/CompetitorAnalyzer.tsx — Step-based competitor analysis
// Redesigned to match consistent page style

import { Helmet } from "react-helmet-async";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Swords, Search, ExternalLink, Music2, AlertCircle,
  Check, ChevronLeft, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CompetitorResultPanel } from "../../components/CompetitorResult";
import { CompetitorLoadingView } from "../../components/CompetitorLoadingView";
import { analyzeCompetitor, type CompetitorResult } from "../../services/competitorService";
import type { AppSharedContext } from "../../components/AppLayout";
import { VideoDropzone } from "../../components/VideoDropzone";

import { sanitizeSearchQuery, sanitizeFileName } from "../../utils/sanitize";
import { cn } from "@/src/lib/utils";

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze
const META_TOKEN = import.meta.env.VITE_META_ACCESS_TOKEN ?? "";

// Primary actions / selectors — indigo tokens
const BRAND_COLOR = "var(--accent)";

const PLATFORMS = ["all", "Meta", "TikTok", "Google", "YouTube"] as const;
const FORMATS = ["video", "static"] as const;
type Platform = (typeof PLATFORMS)[number];
type Format = (typeof FORMATS)[number];
/** 0 = dual upload (Figma 263-1483), 2 = configure + run, 3 = results */
type Step = 0 | 2 | 3;

const SLIDE = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } };
const FEATURE_PILLS = ["Gap analysis", "Win probability", "Action plan"];

// ─── STEP INDICATOR ─────────────────────────────────────────────────────────

function StepIndicator({ step, yourFile, competitorFile, onStepClick }: { step: Step; yourFile: File | null; competitorFile: File | null; onStepClick: (s: Step) => void }) {
  const steps: { num: Step; label: string; displayIndex: number; done: boolean }[] = [
    { num: 0, label: "Upload", displayIndex: 1, done: step >= 2 && !!yourFile && !!competitorFile },
    { num: 2, label: "Compare", displayIndex: 2, done: step > 2 },
    { num: 3, label: "Results", displayIndex: 3, done: false },
  ];
  return (
    <div className="flex items-center justify-center gap-0 px-6 pt-5">
      {steps.map((s, i) => {
        const active = step === s.num;
        const completed = s.done && step > s.num;
        const clickable = completed;
        return (
          <div key={s.num} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1 transition-[background-color] duration-150",
                clickable && "cursor-pointer hover:bg-[color:var(--surface-raised)]",
              )}
              onClick={clickable ? () => onStepClick(s.num) : undefined}
            >
              <div
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-semibold transition-[background-color,border-color,color] duration-200"
                style={{
                  background: completed ? "var(--success)" : active ? "var(--accent)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${completed ? "var(--success)" : active ? "var(--accent)" : "rgba(255,255,255,0.08)"}`,
                  color: completed || active ? "white" : "#52525b",
                }}
              >
                {completed ? <Check size={12} /> : s.displayIndex}
              </div>
              <span
                className={cn(
                  "text-xs transition-colors duration-200",
                  active && "font-semibold text-[color:var(--ink)]",
                  !active && completed && "text-[color:var(--success)]",
                  !active && !completed && "text-[color:var(--ink-muted)]",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="mx-1.5 h-px w-8 transition-colors duration-200"
                style={{ background: completed ? "var(--success)" : "rgba(255,255,255,0.06)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── FILE PREVIEW ───────────────────────────────────────────────────────────

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const isImage = file.type.startsWith("image/");
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "center", background: "#0a0a0b", maxHeight: 200 }}>
        {isImage
          ? <img src={url} alt={sanitizeFileName(file.name)} style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
          : <video src={url} style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
        }
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={14} color="#10b981" />
          <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "var(--font-mono, monospace)" }}>
            {(() => { const n = sanitizeFileName(file.name); return n.length > 26 ? n.slice(0, 23) + "..." : n; })()}
          </span>
          <span style={{ fontSize: 10, color: "#71717a", background: "rgba(255,255,255,0.05)", borderRadius: 9999, padding: "2px 8px" }}>
            {file.type.startsWith("video/") ? "Video" : "Static"}
          </span>
        </div>
        <button type="button" onClick={onRemove} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer" }}>
          <X size={12} /> Remove
        </button>
      </div>
    </div>
  );
}



// ─── META SEARCH ────────────────────────────────────────────────────────────

interface MetaAd {
  id: string; page_name?: string; ad_creative_bodies?: string[];
  ad_snapshot_url?: string;
}

function MetaSearch({ onFileSelect }: { onFileSelect: (f: File) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MetaAd[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const cleanQuery = sanitizeSearchQuery(query);
    if (!cleanQuery || cleanQuery.length < 2) {
      setSearchError("Enter at least 2 characters to search");
      return;
    }
    if (searching || !META_TOKEN) return;
    setSearching(true); setSearchError(null); setResults([]); setHasSearched(true);
    try {
      const url = new URL("https://graph.facebook.com/v19.0/ads_archive");
      url.searchParams.append("access_token", META_TOKEN);
      url.searchParams.append("ad_reached_countries", "US");
      url.searchParams.append("search_terms", cleanQuery);
      url.searchParams.append("ad_type", "ALL");
      url.searchParams.append("publisher_platforms", "facebook");
      url.searchParams.append("publisher_platforms", "instagram");
      url.searchParams.append("fields", "id,ad_creative_bodies,ad_creative_link_titles,ad_snapshot_url,page_name");
      url.searchParams.append("limit", "12");
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || data.error) {
        console.error("Meta API error:", JSON.stringify(data.error, null, 2));
        const code = data.error?.code ?? res.status;
        const errMsg = data.error?.message ?? "";
        if (code === 190 || errMsg.includes("expired") || errMsg.includes("session")) {
          throw new Error("token_expired");
        } else if (code === 429 || errMsg.includes("limit")) {
          throw new Error("rate_limit");
        } else if (code === 10 || errMsg.includes("permission")) {
          throw new Error("permission_denied");
        } else {
          throw new Error("unavailable");
        }
      }
      setResults(data.data || []);
    } catch (err) {
      const errKey = err instanceof Error ? err.message : "unavailable";
      const errorMap: Record<string, string> = {
        token_expired: "Meta search needs to be reconnected — your access token expired",
        rate_limit: "Too many searches — wait a minute, then try again. Or upload manually below",
        permission_denied: "Meta search doesn't have the right permissions — check ads_read in your Facebook app",
        unavailable: "Meta Ad Library search is temporarily unavailable — upload a competitor ad manually",
      };
      setSearchError(errorMap[errKey] ?? errorMap.unavailable);
    }
    finally { setSearching(false); }
  };

  const handleUseAd = async (ad: MetaAd) => {
    if (!ad.ad_snapshot_url) return;
    try {
      const res = await fetch(ad.ad_snapshot_url);
      const blob = await res.blob();
      onFileSelect(new File([blob], `${ad.page_name || "competitor"}-ad.png`, { type: blob.type || "image/png" }));
    } catch { window.open(ad.ad_snapshot_url, "_blank"); }
  };

  if (!META_TOKEN) return (
    <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
      <AlertCircle size={14} color="#f59e0b" />
      <span style={{ fontSize: 12, color: "#f59e0b" }}>Meta search requires VITE_META_ACCESS_TOKEN</span>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input type="text" value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 100))}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            maxLength={100}
            placeholder="Search a brand — e.g. Nike, Cloaked, SKIMS..."
            style={{ width: "100%", height: 40, padding: "0 14px", paddingRight: query.length >= 80 ? 52 : 14, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f4f4f5", outline: "none", boxSizing: "border-box" }}
          />
          {query.length >= 80 && (
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: query.length >= 95 ? "#f59e0b" : "#52525b", pointerEvents: "none" }}>
              {query.length}/100
            </span>
          )}
        </div>
        <button type="button" onClick={handleSearch} disabled={searching || !query.trim()}
          style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 500, cursor: searching ? "wait" : "pointer", opacity: !query.trim() ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
          <Search size={14} />{searching ? "Searching..." : "Search"}
        </button>
      </div>
      {searchError && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{searchError}</p>}
      {searching && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ height: 100, borderRadius: 10, background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />)}
        </div>
      )}
      {!searching && results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 300, overflowY: "auto" }}>
          {results.map((ad) => (
            <div key={ad.id} onClick={() => handleUseAd(ad)}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, cursor: "pointer", transition: "border-color 150ms", display: "flex", flexDirection: "column", gap: 6 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
              {ad.ad_snapshot_url && (
                <div style={{ width: "100%", height: 80, borderRadius: 6, overflow: "hidden", background: "#18181b" }}>
                  <img src={ad.ad_snapshot_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              {ad.page_name && <span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.page_name}</span>}
              {ad.ad_creative_bodies?.[0] && <span style={{ fontSize: 11, color: "#71717a", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{ad.ad_creative_bodies[0].slice(0, 80)}</span>}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                <ExternalLink size={10} style={{ color: "var(--accent-light)" }} /><span style={{ fontSize: 10, color: "var(--accent-light)" }}>Use this ad</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!searching && hasSearched && results.length === 0 && !searchError && (
        <p style={{ fontSize: 12, color: "#71717a", textAlign: "center", padding: "16px 0" }}>No active ads found for "{query}"</p>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function CompetitorAnalyzer() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, onUpgradeRequired, registerCallbacks } =
    useOutletContext<AppSharedContext>();

  const [step, setStep] = useState<Step>(0);
  const [platform, setPlatform] = useState<Platform>("all");
  const [format, setFormat] = useState<Format>("video");
  const [yourFile, setYourFile] = useState<File | null>(null);
  const [competitorFile, setCompetitorFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleReset = useCallback(() => {
    setStep(0); setYourFile(null); setCompetitorFile(null);
    setStatus("idle"); setStatusMsg(""); setResult(null); setError(null);
  }, []);

  useEffect(() => {
    registerCallbacks({ onNewAnalysis: handleReset, onHistoryOpen: () => {}, hasResult: step === 3 });
  }, [registerCallbacks, handleReset, step]);

  const handleAnalyze = async () => {
    if (!yourFile || !competitorFile || !canAnalyze) return;
    setStatus("analyzing"); setError(null); setResult(null); setStep(2);
    try {
      const r = await analyzeCompetitor(yourFile, competitorFile, API_KEY, platform, format, (m) => setStatusMsg(m));
      setResult(r); setStatus("complete"); setStep(3);
      const c = increment(); if (c >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const handleRetry = () => {
    setStatus("idle"); setError(null); setResult(null);
    handleAnalyze();
  };

  const isAnalyzing = status === "analyzing" && !!yourFile && !!competitorFile;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Competitor Analysis — Cutsheet</title>
        <meta name="description" content="Upload two ads. Get a scored gap analysis and action plan." />
        <link rel="canonical" href="https://cutsheet.xyz/app/competitor" />
      </Helmet>

      {!isAnalyzing ? (
        <StepIndicator step={step} yourFile={yourFile} competitorFile={competitorFile} onStepClick={(s) => { setStatus("idle"); setStep(s); }} />
      ) : null}

      <div className="flex-1 overflow-auto">
        {isAnalyzing ? (
          <motion.div
            key="competitor-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative flex min-h-[calc(100vh-100px)] flex-col bg-[color:var(--bg)]"
          >
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                backgroundImage: "var(--competitor-upload-ambient)",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 65%",
              }}
              aria-hidden
            />
            <div className="relative z-[1] flex flex-1 flex-col">
              <CompetitorLoadingView
                yourFile={yourFile}
                competitorFile={competitorFile}
                format={format}
                statusMessage={statusMsg || "Analyzing both ads..."}
                onCancel={handleReset}
              />
            </div>
          </motion.div>
        ) : (
        <div className={cn(step === 0 ? "w-full px-6 py-8" : "mx-auto max-w-[760px] px-5 py-8 sm:px-6 sm:py-10")}>
          <AnimatePresence mode="wait">

            {/* ── UPLOAD — Figma 263-1483 (dual dropzones + Analyze Gap) ───────────────── */}
            {step === 0 && (
              <motion.div
                key="upload"
                {...SLIDE}
                className="relative flex min-h-[min(100%,560px)] flex-col items-center overflow-hidden rounded-none"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <div
                  className="pointer-events-none absolute inset-0 z-0"
                  style={{
                    backgroundImage: "var(--competitor-upload-ambient)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                  }}
                  aria-hidden
                />

                <div className="relative z-[1] flex w-full max-w-[724px] flex-col items-center">
                  <div
                    className="flex size-[73px] shrink-0 items-center justify-center rounded-[15px] border"
                    style={{
                      background: "var(--competitor-tile-bg)",
                      borderColor: "var(--competitor-tile-border)",
                    }}
                  >
                    <Swords
                      className="size-[31px] text-[color:var(--competitor-tile-icon)]"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>

                  <h1 className="mt-[23px] text-center text-[23px] font-bold leading-tight tracking-[-0.025em] text-[color:var(--ink)]">
                    Competitor Analysis
                  </h1>
                  <p className="mt-2.5 max-w-[340px] text-center text-[13.5px] leading-[1.6] text-[color:var(--ink-muted)]">
                    Upload your ad and a competitor&apos;s. AI finds the gap and builds your win strategy.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {FEATURE_PILLS.map((pill) => (
                      <span
                        key={pill}
                        className="rounded-full border px-3 py-1 text-[11.5px] font-normal leading-[15px]"
                        style={{
                          background: "var(--competitor-pill-bg)",
                          borderColor: "var(--competitor-pill-border)",
                          color: "var(--competitor-pill-text)",
                        }}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 grid w-full grid-cols-1 gap-[19px] md:grid-cols-2">
                    <div className="flex min-w-0 flex-col gap-[26px]">
                      <p className="text-center text-[9.6px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
                        Your ad
                      </p>
                      {yourFile ? (
                        <FilePreview file={yourFile} onRemove={() => setYourFile(null)} />
                      ) : (
                        <VideoDropzone
                          file={null}
                          onFileSelect={(f) => {
                            if (f) setYourFile(f);
                          }}
                          acceptImages
                          heading="Drop your creative here"
                          formatHint="MP4 · MOV · JPG"
                          layoutVariant="competitor"
                          wrapperClassName="max-w-none"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col gap-[26px]">
                      <p className="text-center text-[9.6px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
                        Competitor ad
                      </p>
                      {competitorFile ? (
                        <FilePreview file={competitorFile} onRemove={() => setCompetitorFile(null)} />
                      ) : (
                        <VideoDropzone
                          file={null}
                          onFileSelect={(f) => {
                            if (f) setCompetitorFile(f);
                          }}
                          acceptImages
                          heading="Drop your creative here"
                          formatHint="MP4 · MOV · JPG"
                          layoutVariant="competitor"
                          wrapperClassName="max-w-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex w-full max-w-[724px] flex-col gap-4">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!yourFile || !competitorFile}
                      className={cn(
                        "flex h-[44px] min-w-[121px] items-center justify-center rounded-full px-8 text-[12.5px] font-medium transition-[background-color,border-color,color,transform,opacity] duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.99]",
                        yourFile && competitorFile
                          ? "bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)]"
                          : "cursor-not-allowed border border-[color:var(--ab-run-disabled-border)] bg-[color:var(--ab-run-disabled-bg)] text-[color:var(--decon-url-pill-mono)]",
                      )}
                    >
                      Analyze Gap
                    </button>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => window.open("https://ads.tiktok.com/business/creativecenter/inspiration/topads", "_blank")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        window.open("https://ads.tiktok.com/business/creativecenter/inspiration/topads", "_blank");
                      }
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2.5 transition-[border-color] duration-150 hover:border-[color:var(--border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)]"
                  >
                    <div className="flex items-center gap-1.5">
                      <Music2 className="h-3.5 w-3.5 text-[color:var(--ink-muted)]" aria-hidden />
                      <span className="text-[13px] text-[color:var(--ink-secondary)]">Find TikTok ads</span>
                    </div>
                    <span className="text-xs text-[color:var(--accent-light)]">Creative Center ↗</span>
                  </div>
                  <p className="text-center text-[11px] text-[color:var(--ink-muted)]">
                    Download from TikTok Creative Center, then upload in Competitor ad
                  </p>

                  {META_TOKEN ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-[color:var(--border)]" />
                        <span className="text-[11px] text-[color:var(--ink-muted)]">or search Meta Ad Library</span>
                        <div className="h-px flex-1 bg-[color:var(--border)]" />
                      </div>
                      <MetaSearch onFileSelect={(f) => setCompetitorFile(f)} />
                    </>
                  ) : null}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: CONFIGURE + COMPARE ────────────────────── */}
            {step === 2 && status !== "analyzing" && status !== "complete" && (
              <motion.div key="s2" {...SLIDE} style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24 }}>
                <button type="button" onClick={() => setStep(0)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", margin: "0 0 20px", textAlign: "center" }}>Ready to compare</h3>

                <div style={{ width: "100%", maxWidth: 520 }}>
                  {/* Both file previews side by side — with thumbnails */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                    {[
                      { label: "Your Ad",    file: yourFile,       onRemove: () => { setYourFile(null); setStep(0); } },
                      { label: "Competitor", file: competitorFile, onRemove: () => { setCompetitorFile(null); setStep(0); } },
                    ].map(({ label, file: f, onRemove }) => (
                      <div key={label} style={{ flex: 1 }}>
                        <p style={{ fontSize: 10, color: "#52525b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{label}</p>
                        {f ? (
                          <FilePreview file={f} onRemove={onRemove} />
                        ) : (
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 12 }}>
                            <span style={{ fontSize: 12, color: "#52525b" }}>—</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Platform + format selectors */}
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: "#52525b", marginBottom: 8, fontWeight: 500 }}>Platform</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {PLATFORMS.map((p) => (
                        <button key={p} type="button" onClick={() => setPlatform(p)}
                          style={{ height: 34, padding: "0 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", background: platform === p ? BRAND_COLOR : "rgba(255,255,255,0.03)", border: `1px solid ${platform === p ? BRAND_COLOR : "rgba(255,255,255,0.08)"}`, color: platform === p ? "white" : "#71717a", fontWeight: platform === p ? 500 : 400, transition: "background-color 150ms, border-color 150ms, color 150ms" }}>
                          {p === "all" ? "All" : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 11, color: "#52525b", marginBottom: 8, fontWeight: 500 }}>Format</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {FORMATS.map((f) => (
                        <button key={f} type="button" onClick={() => setFormat(f)}
                          style={{ height: 34, padding: "0 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", background: format === f ? BRAND_COLOR : "rgba(255,255,255,0.03)", border: `1px solid ${format === f ? BRAND_COLOR : "rgba(255,255,255,0.08)"}`, color: format === f ? "white" : "#71717a", fontWeight: format === f ? 500 : 400, transition: "background-color 150ms, border-color 150ms, color 150ms" }}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 16 }}>
                      <p style={{ fontSize: 12, color: "#ef4444", margin: 0, lineHeight: 1.5 }}>{error}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button type="button" onClick={handleRetry}
                          style={{ height: 32, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "background-color 150ms, border-color 150ms" }}>
                          Retry
                        </button>
                        <button type="button" onClick={handleReset}
                          style={{ height: 32, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#71717a", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "background-color 150ms, border-color 150ms" }}>
                          Start over
                        </button>
                      </div>
                    </div>
                  )}

                  <button type="button" onClick={handleAnalyze} disabled={!yourFile || !competitorFile || !canAnalyze}
                    style={{ width: "100%", height: 50, borderRadius: 9999, border: "none", background: BRAND_COLOR, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background-color 150ms, opacity 150ms" }}>
                    <Swords size={18} /> Compare Ads
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: RESULTS ─────────────────────────────────── */}
            {step === 3 && result && (
              <motion.div key="s3" {...SLIDE} className="pt-5">
                <CompetitorResultPanel
                  result={result}
                  yourFileName={yourFile?.name ?? "Your Ad"}
                  competitorFileName={competitorFile?.name ?? "Competitor"}
                  yourFile={yourFile ?? undefined}
                  competitorFile={competitorFile ?? undefined}
                  onStartOver={handleReset}
                  onReanalyze={() => {
                    setResult(null);
                    setStatus("idle");
                    setError(null);
                    setStep(2);
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes progressSlide { 0% { transform: translateX(-100%) } 100% { transform: translateX(350%) } }
      `}</style>
    </div>
  );
}
