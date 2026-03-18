// src/pages/app/CompetitorAnalyzer.tsx — Step-based competitor analysis

import { Helmet } from "react-helmet-async";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Swords, Upload, Search, ExternalLink, Music2, AlertCircle,
  Check, ChevronLeft, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CompetitorResultPanel } from "../../components/CompetitorResult";
import { analyzeCompetitor, type CompetitorResult } from "../../services/competitorService";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const META_TOKEN = import.meta.env.VITE_META_ACCESS_TOKEN ?? "";

const PLATFORMS = ["all", "Meta", "TikTok", "Google", "YouTube"] as const;
const FORMATS = ["video", "static"] as const;
type Platform = (typeof PLATFORMS)[number];
type Format = (typeof FORMATS)[number];
type Step = 0 | 1 | 2 | 3 | 4; // 0=intro, 1=your ad, 2=competitor, 3=config+compare, 4=results

const STEP_LABELS = ["Intro", "Your Ad", "Competitor", "Compare", "Results"];
const SLIDE = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } };

// ─── STEP INDICATOR ─────────────────────────────────────────────────────────

function StepIndicator({ step, yourFile, competitorFile }: { step: Step; yourFile: File | null; competitorFile: File | null }) {
  if (step === 0) return null;
  const steps = [
    { num: 1, label: "Your Ad", done: !!yourFile },
    { num: 2, label: "Competitor", done: !!competitorFile },
    { num: 3, label: "Compare", done: step > 3 },
    { num: 4, label: "Results", done: false },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "16px 24px 0" }}>
      {steps.map((s, i) => {
        const active = step === s.num;
        const completed = s.done && step > s.num;
        return (
          <div key={s.num} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
                background: completed ? "#10b981" : active ? "#6366f1" : "rgba(255,255,255,0.04)",
                border: `1px solid ${completed ? "#10b981" : active ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                color: completed || active ? "white" : "#52525b",
                transition: "all 200ms",
              }}>
                {completed ? <Check size={12} /> : s.num}
              </div>
              <span style={{ fontSize: 12, color: active ? "#f4f4f5" : "#52525b", fontWeight: active ? 500 : 400, transition: "all 200ms" }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 40, height: 1, background: completed ? "#10b981" : "rgba(255,255,255,0.06)", margin: "0 8px", transition: "background 200ms" }} />
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
    <div>
      <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", background: "#09090b", display: "flex", justifyContent: "center", maxHeight: 240 }}>
        {isImage
          ? <img src={url} alt={file.name} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
          : <video src={url} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
        }
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "var(--font-mono, monospace)" }}>
            {file.name.length > 30 ? file.name.slice(0, 27) + "..." : file.name}
          </span>
          <span style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.04)", borderRadius: 9999, padding: "2px 8px" }}>
            {file.type.startsWith("video/") ? "Video" : "Static"}
          </span>
        </div>
        <button type="button" onClick={onRemove} style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Change
        </button>
      </div>
    </div>
  );
}

// ─── DROPZONE ───────────────────────────────────────────────────────────────

function DropZone({ onFileSelect, height = 240 }: { onFileSelect: (f: File) => void; height?: number }) {
  return (
    <div
      style={{
        height, border: "2px dashed rgba(255,255,255,0.08)", borderRadius: 16,
        background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "all 150ms",
      }}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file"; input.accept = "video/*,image/*";
        input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onFileSelect(f); };
        input.click();
      }}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
      onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); }}
    >
      <Upload size={28} color="#52525b" />
      <span style={{ fontSize: 14, color: "#71717a" }}>Drop your creative or click to browse</span>
      <span style={{ fontSize: 11, color: "#52525b" }}>Video or static image</span>
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
    if (!query.trim() || searching || !META_TOKEN) return;
    setSearching(true); setSearchError(null); setResults([]); setHasSearched(true);
    try {
      const url = new URL("https://graph.facebook.com/v19.0/ads_archive");
      url.searchParams.append("access_token", META_TOKEN);
      url.searchParams.append("ad_reached_countries", "US");
      url.searchParams.append("search_terms", query.trim());
      url.searchParams.append("ad_type", "ALL");
      url.searchParams.append("publisher_platforms", "facebook");
      url.searchParams.append("publisher_platforms", "instagram");
      url.searchParams.append("fields", "id,ad_creative_bodies,ad_creative_link_titles,ad_snapshot_url,page_name");
      url.searchParams.append("limit", "12");
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || data.error) {
        console.error("Meta API error:", JSON.stringify(data.error, null, 2));
        throw new Error(data.error?.message || "Meta API request failed");
      }
      setResults(data.data || []);
    } catch (err) { setSearchError(err instanceof Error ? err.message : "Search failed"); }
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
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          placeholder="Search a brand — e.g. Nike, Cloaked, SKIMS..."
          style={{ flex: 1, height: 40, padding: "0 14px", fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f4f4f5", outline: "none" }}
        />
        <button type="button" onClick={handleSearch} disabled={searching || !query.trim()}
          style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "#6366f1", color: "white", fontSize: 13, fontWeight: 500, cursor: searching ? "wait" : "pointer", opacity: !query.trim() ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
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
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, cursor: "pointer", transition: "all 150ms", display: "flex", flexDirection: "column", gap: 6 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
              {ad.ad_snapshot_url && (
                <div style={{ width: "100%", height: 80, borderRadius: 6, overflow: "hidden", background: "#18181b" }}>
                  <img src={ad.ad_snapshot_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              {ad.page_name && <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.page_name}</span>}
              {ad.ad_creative_bodies?.[0] && <span style={{ fontSize: 11, color: "#71717a", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{ad.ad_creative_bodies[0].slice(0, 80)}</span>}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                <ExternalLink size={10} color="#6366f1" /><span style={{ fontSize: 10, color: "#6366f1" }}>Use this ad</span>
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

// ─── LOADING CARD ───────────────────────────────────────────────────────────

const STATUS_MSGS = ["Analyzing your ad...", "Analyzing competitor ad...", "Running gap analysis...", "Building action plan..."];

function LoadingCard({ yourName, compName, statusMsg }: { yourName: string; compName: string; statusMsg: string }) {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setMsgIdx(i => (i + 1) % STATUS_MSGS.length), 3000); return () => clearInterval(t); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 14, color: "#a1a1aa", fontFamily: "var(--font-mono, monospace)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{yourName}</span>
        <Swords size={20} color="#6366f1" />
        <span style={{ fontSize: 14, color: "#a1a1aa", fontFamily: "var(--font-mono, monospace)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{compName}</span>
      </div>
      <div style={{ width: 240, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: "40%", borderRadius: 2, background: "#6366f1", animation: "progressSlide 1.5s ease-in-out infinite" }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={msgIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
          style={{ fontSize: 13, color: "#71717a", margin: 0 }}>
          {statusMsg || STATUS_MSGS[msgIdx]}
        </motion.p>
      </AnimatePresence>
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
  const [showManualUpload, setShowManualUpload] = useState(false);
  const [adTab, setAdTab] = useState<"meta" | "tiktok">("meta");

  const handleReset = useCallback(() => {
    setStep(0); setYourFile(null); setCompetitorFile(null);
    setStatus("idle"); setStatusMsg(""); setResult(null); setError(null);
    setShowManualUpload(false);
  }, []);

  useEffect(() => {
    registerCallbacks({ onNewAnalysis: handleReset, onHistoryOpen: () => {}, hasResult: step === 4 });
  }, [registerCallbacks, handleReset, step]);

  const handleAnalyze = async () => {
    if (!yourFile || !competitorFile || !canAnalyze) return;
    setStatus("analyzing"); setError(null); setResult(null); setStep(3);
    try {
      const r = await analyzeCompetitor(yourFile, competitorFile, API_KEY, platform, format, (m) => setStatusMsg(m));
      setResult(r); setStatus("complete"); setStep(4);
      const c = increment(); if (c >= FREE_LIMIT && !isPro) onUpgradeRequired();
    } catch (err) { setStatus("error"); setError(err instanceof Error ? err.message : "Analysis failed"); }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Competitor Analysis — Cutsheet</title>
        <meta name="description" content="Upload two ads. Get a scored gap analysis and action plan." />
        <link rel="canonical" href="https://cutsheet.xyz/app/competitor" />
      </Helmet>

      <StepIndicator step={step} yourFile={yourFile} competitorFile={competitorFile} />

      <div className="flex-1 overflow-auto">
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "24px 16px" }}>
          <AnimatePresence mode="wait">

            {/* ── STEP 0: INTRO ──────────────────────────────────── */}
            {step === 0 && (
              <motion.div key="s0" {...SLIDE} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 16 }}>
                <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Swords size={28} color="#6366f1" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>Head-to-head ad comparison</h2>
                <p style={{ fontSize: 14, color: "#71717a", textAlign: "center", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
                  Upload your ad and a competitor's. Get a scored gap analysis and an exact action plan.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {["Scores compared", "Gap analysis", "Action plan"].map(p => (
                    <span key={p} style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 9999, padding: "4px 12px" }}>{p}</span>
                  ))}
                </div>
                <button type="button" onClick={() => setStep(1)}
                  style={{ marginTop: 24, height: 48, padding: "0 32px", borderRadius: 9999, border: "none", background: "#6366f1", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 150ms" }}>
                  Start comparison <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 1: YOUR AD ─────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" {...SLIDE} style={{ paddingTop: 32 }}>
                <button type="button" onClick={() => setStep(0)} style={{ background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", margin: "0 0 4px" }}>Upload your ad</h3>
                <p style={{ fontSize: 13, color: "#71717a", margin: "0 0 20px" }}>The creative you want to benchmark.</p>
                {yourFile ? (
                  <>
                    <FilePreview file={yourFile} onRemove={() => setYourFile(null)} />
                    <button type="button" onClick={() => setStep(2)}
                      style={{ width: "100%", height: 48, marginTop: 20, borderRadius: 9999, border: "none", background: "#6366f1", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      Next — add competitor <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <DropZone onFileSelect={(f) => { setYourFile(f); setStep(2); }} />
                )}
              </motion.div>
            )}

            {/* ── STEP 2: COMPETITOR AD ───────────────────────────── */}
            {step === 2 && (
              <motion.div key="s2" {...SLIDE} style={{ paddingTop: 32 }}>
                <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", margin: "0 0 4px" }}>Find a competitor's ad</h3>
                <p style={{ fontSize: 13, color: "#71717a", margin: "0 0 20px" }}>Search the Meta Ad Library or upload directly.</p>

                {competitorFile ? (
                  <>
                    <FilePreview file={competitorFile} onRemove={() => setCompetitorFile(null)} />
                    <button type="button" onClick={() => setStep(3)}
                      style={{ width: "100%", height: 48, marginTop: 20, borderRadius: 9999, border: "none", background: "#6366f1", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      Next — configure & compare <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Tab pills: Meta | TikTok */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                      {(["meta", "tiktok"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setAdTab(tab)}
                          style={{
                            height: 28, padding: "0 14px", borderRadius: 9999, fontSize: 12,
                            cursor: "pointer", fontWeight: 500, transition: "all 150ms",
                            background: adTab === tab ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${adTab === tab ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                            color: adTab === tab ? "#f4f4f5" : "#71717a",
                          }}
                        >
                          {tab === "meta" ? "Meta" : "TikTok"}
                        </button>
                      ))}
                    </div>

                    {/* Meta tab */}
                    {adTab === "meta" && (
                      <MetaSearch onFileSelect={(f) => { setCompetitorFile(f); setStep(3); }} />
                    )}

                    {/* TikTok tab */}
                    {adTab === "tiktok" && (
                      <div style={{
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12, padding: 16, marginBottom: 12,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <Music2 size={14} color="#71717a" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Find TikTok competitor ads</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, margin: "0 0 12px" }}>
                          TikTok's Creative Center shows the top performing ads on the platform right now. Find a competitor's ad, download it, then upload it below.
                        </p>
                        <button
                          type="button"
                          onClick={() => window.open("https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en", "_blank")}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
                            color: "#818cf8", fontSize: 13, fontWeight: 500,
                            borderRadius: 9999, padding: "8px 16px", cursor: "pointer", marginBottom: 10,
                            transition: "all 150ms",
                          }}
                        >
                          Open TikTok Creative Center ↗
                        </button>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                          {["Search by brand", "Filter by industry", "Download video"].map((tip) => (
                            <span key={tip} style={{
                              fontSize: 11, color: "#52525b",
                              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: 9999, padding: "3px 10px",
                            }}>
                              {tip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manual upload toggle — shared across both tabs */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px" }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                      <span style={{ fontSize: 11, color: "#52525b" }}>
                        {adTab === "tiktok" ? "then upload it here" : "or upload manually"}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                    </div>
                    <button type="button" onClick={() => setShowManualUpload(!showManualUpload)}
                      style={{ background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer", width: "100%", textAlign: "center", padding: "4px 0 8px" }}>
                      {showManualUpload ? "Hide" : "Upload file"}
                    </button>
                    {showManualUpload && <DropZone onFileSelect={(f) => { setCompetitorFile(f); setStep(3); }} height={160} />}
                  </>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: CONFIGURE + COMPARE ────────────────────── */}
            {step === 3 && status !== "analyzing" && status !== "complete" && (
              <motion.div key="s3" {...SLIDE} style={{ paddingTop: 32 }}>
                <button type="button" onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", margin: "0 0 16px" }}>Configure & compare</h3>

                {/* Both file previews side by side */}
                <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                  {[{ label: "Your Ad", file: yourFile }, { label: "Competitor", file: competitorFile }].map(({ label, file: f }) => (
                    <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 10 }}>
                      <p style={{ fontSize: 11, color: "#52525b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                      <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "var(--font-mono, monospace)" }}>
                        {f ? (f.name.length > 20 ? f.name.slice(0, 17) + "..." : f.name) : "—"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Platform + format selectors */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "#52525b", marginBottom: 8 }}>Platform</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {PLATFORMS.map((p) => (
                      <button key={p} type="button" onClick={() => setPlatform(p)}
                        style={{ height: 32, padding: "0 14px", borderRadius: 9999, fontSize: 13, cursor: "pointer", background: platform === p ? "#6366f1" : "rgba(255,255,255,0.04)", border: `1px solid ${platform === p ? "#6366f1" : "rgba(255,255,255,0.08)"}`, color: platform === p ? "white" : "#71717a", fontWeight: platform === p ? 500 : 400, transition: "all 150ms" }}>
                        {p === "all" ? "All" : p}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 12, color: "#52525b", marginBottom: 8 }}>Format</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {FORMATS.map((f) => (
                      <button key={f} type="button" onClick={() => setFormat(f)}
                        style={{ height: 32, padding: "0 14px", borderRadius: 9999, fontSize: 13, cursor: "pointer", background: format === f ? "#6366f1" : "rgba(255,255,255,0.04)", border: `1px solid ${format === f ? "#6366f1" : "rgba(255,255,255,0.08)"}`, color: format === f ? "white" : "#71717a", fontWeight: format === f ? 500 : 400, transition: "all 150ms" }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{error}</p>
                  </div>
                )}

                <button type="button" onClick={handleAnalyze} disabled={!yourFile || !competitorFile || !canAnalyze}
                  style={{ width: "100%", height: 52, borderRadius: 9999, border: "none", background: "#6366f1", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 150ms" }}>
                  <Swords size={18} /> Compare Ads
                </button>
              </motion.div>
            )}

            {/* ── ANALYZING ──────────────────────────────────────── */}
            {status === "analyzing" && (
              <motion.div key="loading" {...SLIDE}>
                <LoadingCard yourName={yourFile?.name ?? "Your Ad"} compName={competitorFile?.name ?? "Competitor"} statusMsg={statusMsg} />
              </motion.div>
            )}

            {/* ── STEP 4: RESULTS ─────────────────────────────────── */}
            {step === 4 && result && (
              <motion.div key="s4" {...SLIDE} style={{ paddingTop: 16 }}>
                <button type="button" onClick={handleReset} style={{ background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
                  <ChevronLeft size={14} /> Compare another
                </button>
                <CompetitorResultPanel result={result} yourFileName={yourFile?.name ?? "Your Ad"} competitorFileName={competitorFile?.name ?? "Competitor"} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes progressSlide { 0% { transform: translateX(-100%) } 100% { transform: translateX(350%) } }
      `}</style>
    </div>
  );
}
