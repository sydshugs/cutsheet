// src/pages/app/CompetitorAnalyzer.tsx — Head-to-head competitor analysis

import { Helmet } from "react-helmet-async";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Swords, Upload, Search, ExternalLink, Music2, AlertCircle } from "lucide-react";
import { CompetitorResultPanel } from "../../components/CompetitorResult";
import { analyzeCompetitor, type CompetitorResult } from "../../services/competitorService";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const META_TOKEN = import.meta.env.VITE_META_ACCESS_TOKEN ?? "";

const PLATFORMS = ["all", "Meta", "TikTok", "Google", "YouTube"] as const;
const FORMATS = ["video", "static"] as const;
type Platform = (typeof PLATFORMS)[number];
type Format = (typeof FORMATS)[number];

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState() {
  const PILLS = ["Head-to-head scores", "Gap analysis", "Action plan to win"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 16 }}>
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Swords size={28} color="#6366f1" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>Competitor Analysis</h2>
      <p style={{ fontSize: 14, color: "#71717a", textAlign: "center", maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
        Upload your ad and a competitor's. Get a scored gap analysis and an exact action plan to outperform them.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {PILLS.map((p) => (
          <span key={p} style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 9999, padding: "4px 12px" }}>
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── UPLOAD BOX ──────────────────────────────────────────────────────────────

function UploadBox({
  label,
  file,
  onFileSelect,
}: {
  label: string;
  file: File | null;
  onFileSelect: (f: File | null) => void;
}) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const isImage = file?.type.startsWith("image/");

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>{label}</p>

      {file && previewUrl ? (
        <div style={{ position: "relative" }}>
          <div style={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
            background: "#09090b",
            display: "flex",
            justifyContent: "center",
            maxHeight: 200,
          }}>
            {isImage ? (
              <img src={previewUrl} alt={file.name} style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
            ) : (
              <video src={previewUrl} style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "#52525b", fontFamily: "var(--font-mono, monospace)" }}>
              {file.name.length > 25 ? file.name.slice(0, 22) + "..." : file.name}
            </span>
            <button
              type="button"
              onClick={() => onFileSelect(null)}
              style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            height: 200,
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            transition: "all 150ms",
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "video/*,image/*";
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) onFileSelect(f);
            };
            input.click();
          }}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); }}
        >
          <Upload size={24} color="#52525b" />
          <span style={{ fontSize: 13, color: "#52525b" }}>Drop video or image</span>
        </div>
      )}
    </div>
  );
}

// ─── META AD SEARCH ─────────────────────────────────────────────────────────

interface MetaAd {
  id: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_snapshot_url?: string;
  ad_delivery_start_time?: string;
}

function CompetitorSearchBox({
  file,
  onFileSelect,
}: {
  file: File | null;
  onFileSelect: (f: File | null) => void;
}) {
  const [adTab, setAdTab] = useState<"meta" | "tiktok">("meta");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MetaAd[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const isImage = file?.type.startsWith("image/");

  const handleSearch = async () => {
    if (!query.trim() || searching) return;
    if (!META_TOKEN) { setSearchError("Meta API token not configured"); return; }
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        access_token: META_TOKEN,
        ad_reached_countries: '["US"]',
        search_terms: query.trim(),
        ad_type: "ALL",
        fields: "id,ad_creative_bodies,ad_creative_link_titles,ad_snapshot_url,page_name,ad_delivery_start_time",
        limit: "12",
      });
      const res = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${res.status}`);
      }
      const json = await res.json();
      setResults(json.data || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleUseAd = async (ad: MetaAd) => {
    if (!ad.ad_snapshot_url) return;
    try {
      const res = await fetch(ad.ad_snapshot_url);
      const blob = await res.blob();
      const ext = blob.type.includes("video") ? "mp4" : "png";
      const name = `${ad.page_name || "competitor"}-ad.${ext}`;
      onFileSelect(new File([blob], name, { type: blob.type || "image/png" }));
    } catch {
      // Fallback: open snapshot URL in new tab for manual download
      window.open(ad.ad_snapshot_url, "_blank");
    }
  };

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Competitor's Ad</p>

      {/* If file is already selected, show preview */}
      {file && previewUrl ? (
        <div style={{ position: "relative" }}>
          <div style={{
            borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden", background: "#09090b",
            display: "flex", justifyContent: "center", maxHeight: 200,
          }}>
            {isImage ? (
              <img src={previewUrl} alt={file.name} style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
            ) : (
              <video src={previewUrl} style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "#52525b", fontFamily: "var(--font-mono, monospace)" }}>
              {file.name.length > 25 ? file.name.slice(0, 22) + "..." : file.name}
            </span>
            <button type="button" onClick={() => onFileSelect(null)}
              style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab pills: Meta | TikTok */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {(["meta", "tiktok"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAdTab(tab)}
                style={{
                  height: 28, padding: "0 14px", borderRadius: 9999, fontSize: 12, cursor: "pointer",
                  fontWeight: 500, transition: "all 150ms",
                  background: adTab === tab ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${adTab === tab ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                  color: adTab === tab ? "#f4f4f5" : "#71717a",
                }}
              >
                {tab === "meta" ? "Meta" : "TikTok"}
              </button>
            ))}
          </div>

          {/* ── META TAB ─────────────────────────────────────────────────── */}
          {adTab === "meta" && (
            <>
              {/* Missing token warning — only on Meta tab */}
              {!META_TOKEN && (
                <div style={{
                  background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#f59e0b" }}>
                    Meta search requires VITE_META_ACCESS_TOKEN in Vercel env vars
                  </span>
                </div>
              )}

              {/* Meta Ad Library search */}
              {META_TOKEN && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "#52525b", marginBottom: 6 }}>Search a competitor on Meta & Instagram</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                      placeholder="e.g. Nike, Cloaked, SKIMS..."
                      style={{
                        flex: 1, height: 34, padding: "0 10px", fontSize: 12,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8, color: "#f4f4f5", outline: "none",
                      }}
                    />
                    <button type="button" onClick={handleSearch} disabled={searching || !query.trim()}
                      style={{
                        height: 34, padding: "0 12px", borderRadius: 8, border: "none",
                        background: "#6366f1", color: "white", fontSize: 12, fontWeight: 500,
                        cursor: searching || !query.trim() ? "not-allowed" : "pointer",
                        opacity: searching || !query.trim() ? 0.5 : 1,
                        display: "flex", alignItems: "center", gap: 4, transition: "all 150ms",
                      }}>
                      <Search size={12} />
                      {searching ? "..." : "Search"}
                    </button>
                  </div>

                  {searchError && (
                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>{searchError}</p>
                  )}

                  {searching && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                      {[0,1,2,3].map(i => (
                        <div key={i} style={{
                          height: 100, borderRadius: 10,
                          background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.5s infinite",
                        }} />
                      ))}
                    </div>
                  )}

                  {!searching && results.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10, maxHeight: 280, overflowY: "auto" }}>
                      {results.map((ad) => (
                        <div key={ad.id} style={{
                          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 6,
                          cursor: "pointer", transition: "all 150ms",
                        }}
                        onClick={() => handleUseAd(ad)}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                        >
                          {ad.ad_snapshot_url && (
                            <div style={{ width: "100%", height: 80, borderRadius: 6, overflow: "hidden", background: "#18181b" }}>
                              <img src={ad.ad_snapshot_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                          )}
                          {ad.page_name && (
                            <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 500,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ad.page_name}
                            </span>
                          )}
                          {ad.ad_creative_bodies?.[0] && (
                            <span style={{ fontSize: 11, color: "#71717a", lineHeight: 1.3,
                              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                              {ad.ad_creative_bodies[0].slice(0, 60)}{ad.ad_creative_bodies[0].length > 60 ? "..." : ""}
                            </span>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                            <ExternalLink size={10} color="#6366f1" />
                            <span style={{ fontSize: 10, color: "#6366f1" }}>Use this ad</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!searching && hasSearched && results.length === 0 && !searchError && (
                    <p style={{ fontSize: 12, color: "#71717a", marginTop: 10, textAlign: "center" }}>
                      No active ads found for "{query}"
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                    <span style={{ fontSize: 11, color: "#52525b" }}>or upload manually</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── TIKTOK TAB ───────────────────────────────────────────────── */}
          {adTab === "tiktok" && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: 16, marginBottom: 12,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Music2 size={14} color="#71717a" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Find TikTok competitor ads</span>
              </div>
              {/* Body */}
              <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, margin: "0 0 12px" }}>
                TikTok's Creative Center shows the top performing ads on the platform right now. Find a competitor's ad, download it, then upload it below.
              </p>
              {/* CTA button */}
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
              {/* Quick tip pills */}
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

          {/* Divider — TikTok: "then upload it here"; Meta no-token: "or upload manually".
              Skipped when Meta+TOKEN because the search section renders its own "or upload manually". */}
          {!(adTab === "meta" && !!META_TOKEN) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 11, color: "#52525b" }}>
                {adTab === "tiktok" ? "then upload it here" : "or upload manually"}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
          )}

          {/* Manual upload dropzone */}
          <div
            style={{
              height: 100,
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 12, background: "rgba(255,255,255,0.02)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 6, cursor: "pointer", transition: "all 150ms",
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "video/*,image/*";
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) onFileSelect(f);
              };
              input.click();
            }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); }}
          >
            <Upload size={20} color="#52525b" />
            <span style={{ fontSize: 12, color: "#52525b" }}>Drop video or image</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function CompetitorAnalyzer() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, onUpgradeRequired, registerCallbacks } =
    useOutletContext<AppSharedContext>();

  const [platform, setPlatform] = useState<Platform>("all");
  const [format, setFormat] = useState<Format>("video");
  const [yourFile, setYourFile] = useState<File | null>(null);
  const [competitorFile, setCompetitorFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setYourFile(null);
    setCompetitorFile(null);
    setStatus("idle");
    setStatusMsg("");
    setResult(null);
    setError(null);
  }, []);

  useEffect(() => {
    registerCallbacks({
      onNewAnalysis: handleReset,
      onHistoryOpen: () => {},
      hasResult: status === "complete",
    });
  }, [registerCallbacks, handleReset, status]);

  const handleAnalyze = async () => {
    if (!yourFile || !competitorFile || !canAnalyze) return;
    setStatus("analyzing");
    setError(null);
    setResult(null);

    try {
      const r = await analyzeCompetitor(
        yourFile,
        competitorFile,
        API_KEY,
        platform,
        format,
        (msg) => setStatusMsg(msg)
      );
      setResult(r);
      setStatus("complete");
      const count = increment();
      if (count >= FREE_LIMIT && !isPro) onUpgradeRequired();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  const bothLoaded = yourFile !== null && competitorFile !== null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Competitor Analysis — Cutsheet</title>
        <meta name="description" content="Upload two ads. Get a scored gap analysis and action plan to outperform your competitor." />
        <link rel="canonical" href="https://cutsheet.xyz/app/competitor" />
      </Helmet>

      {/* Intent header */}
      <div style={{
        padding: "12px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 13, color: "#52525b", flexShrink: 0 }}>Comparing on:</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              style={{
                height: 30, padding: "0 12px", borderRadius: 9999, fontSize: 13, cursor: "pointer",
                background: platform === p ? "#6366f1" : "rgba(255,255,255,0.04)",
                border: `1px solid ${platform === p ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                color: platform === p ? "white" : "#71717a",
                fontWeight: platform === p ? 500 : 400,
                transition: "all 150ms",
              }}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              style={{
                height: 30, padding: "0 12px", borderRadius: 9999, fontSize: 13, cursor: "pointer",
                background: format === f ? "#6366f1" : "rgba(255,255,255,0.04)",
                border: `1px solid ${format === f ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                color: format === f ? "white" : "#71717a",
                fontWeight: format === f ? 500 : 400,
                transition: "all 150ms",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

          {status === "idle" && !bothLoaded && <EmptyState />}

          {/* Upload area */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch", marginTop: status === "idle" && !bothLoaded ? 0 : 0 }}>
            <UploadBox label="Your Ad" file={yourFile} onFileSelect={setYourFile} />

            {/* VS divider */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 60, flexShrink: 0 }}>
              <div style={{ flex: 1, width: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 20, fontWeight: 600, color: "#52525b", padding: "8px 0" }}>VS</span>
              <div style={{ flex: 1, width: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            <CompetitorSearchBox file={competitorFile} onFileSelect={setCompetitorFile} />
          </div>

          {/* Analyze button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!bothLoaded || status === "analyzing" || !canAnalyze}
            style={{
              width: "100%",
              height: 52,
              marginTop: 20,
              borderRadius: 9999,
              border: "none",
              background: bothLoaded ? "#6366f1" : "rgba(99,102,241,0.3)",
              color: "white",
              fontSize: 15,
              fontWeight: 600,
              cursor: bothLoaded && status !== "analyzing" ? "pointer" : "not-allowed",
              opacity: bothLoaded ? 1 : 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 150ms",
            }}
          >
            {status === "analyzing" ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                {statusMsg || "Analyzing both ads..."}
              </>
            ) : (
              <>
                <Swords size={18} />
                Compare Ads
              </>
            )}
          </button>

          {/* Error */}
          {status === "error" && error && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>
              <button
                type="button"
                onClick={() => { setStatus("idle"); setError(null); }}
                style={{ fontSize: 12, color: "#71717a", background: "none", border: "none", cursor: "pointer", marginTop: 6, textDecoration: "underline" }}
              >
                Try again
              </button>
            </div>
          )}

          {/* Results */}
          {status === "complete" && result && (
            <div style={{ marginTop: 24 }}>
              <CompetitorResultPanel
                result={result}
                yourFileName={yourFile?.name ?? "Your Ad"}
                competitorFileName={competitorFile?.name ?? "Competitor"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}
