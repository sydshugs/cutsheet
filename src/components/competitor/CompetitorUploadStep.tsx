// src/components/competitor/CompetitorUploadStep.tsx
// Step 0 — dual-upload idle state for CompetitorAnalyzer

import { useMemo, useEffect } from "react";
import { Swords, Music2, Check, X, Search, ExternalLink, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { VideoDropzone } from "../VideoDropzone";
import { sanitizeSearchQuery, sanitizeFileName } from "../../utils/sanitize";
import { cn } from "@/src/lib/utils";

const META_TOKEN = import.meta.env.VITE_META_ACCESS_TOKEN ?? "";

const SLIDE = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

// ─── FILE PREVIEW ────────────────────────────────────────────────────────────

export function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
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

// ─── META AD TYPE ─────────────────────────────────────────────────────────────

interface MetaAd {
  id: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_snapshot_url?: string;
}

// ─── META SEARCH ─────────────────────────────────────────────────────────────

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
    } finally {
      setSearching(false);
    }
  };

  const handleUseAd = async (ad: MetaAd) => {
    if (!ad.ad_snapshot_url) return;
    try {
      const res = await fetch(ad.ad_snapshot_url);
      const blob = await res.blob();
      onFileSelect(new File([blob], `${ad.page_name || "competitor"}-ad.png`, { type: blob.type || "image/png" }));
    } catch {
      window.open(ad.ad_snapshot_url, "_blank");
    }
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
          <input
            type="text"
            value={query}
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
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 500, cursor: searching ? "wait" : "pointer", opacity: !query.trim() ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Search size={14} />{searching ? "Searching..." : "Search"}
        </button>
      </div>
      {searchError && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{searchError}</p>}
      {searching && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 100, borderRadius: 10, background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
      )}
      {!searching && results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 300, overflowY: "auto" }}>
          {results.map((ad) => (
            <div
              key={ad.id}
              onClick={() => handleUseAd(ad)}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, cursor: "pointer", transition: "border-color 150ms", display: "flex", flexDirection: "column", gap: 6 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
            >
              {ad.ad_snapshot_url && (
                <div style={{ width: "100%", height: 80, borderRadius: 6, overflow: "hidden", background: "#18181b" }}>
                  <img src={ad.ad_snapshot_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              {ad.page_name && <span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.page_name}</span>}
              {ad.ad_creative_bodies?.[0] && (
                <span style={{ fontSize: 11, color: "#71717a", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                  {ad.ad_creative_bodies[0].slice(0, 80)}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                <ExternalLink size={10} style={{ color: "var(--accent-light)" }} />
                <span style={{ fontSize: 10, color: "var(--accent-light)" }}>Use this ad</span>
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

// ─── UPLOAD STEP ─────────────────────────────────────────────────────────────

interface CompetitorUploadStepProps {
  yourFile: File | null;
  competitorFile: File | null;
  onYourFileSelect: (f: File) => void;
  onCompetitorFileSelect: (f: File) => void;
  onYourFileRemove: () => void;
  onCompetitorFileRemove: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export function CompetitorUploadStep({
  yourFile,
  competitorFile,
  onYourFileSelect,
  onCompetitorFileSelect,
  onYourFileRemove,
  onCompetitorFileRemove,
  error,
  onRetry,
}: CompetitorUploadStepProps) {
  return (
    <motion.div
      key="upload"
      {...SLIDE}
      className="relative flex w-full max-w-[724px] flex-col items-center overflow-hidden rounded-none"
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

      <div className="relative z-[1] flex w-full flex-col items-center">
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

        <div className="mt-8 grid w-full grid-cols-1 gap-[19px] md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-[26px]">
            <p className="text-center text-[9.6px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
              Your ad
            </p>
            {yourFile ? (
              <FilePreview file={yourFile} onRemove={onYourFileRemove} />
            ) : (
              <VideoDropzone
                file={null}
                onFileSelect={(f) => { if (f) onYourFileSelect(f); }}
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
              <FilePreview file={competitorFile} onRemove={onCompetitorFileRemove} />
            ) : (
              <VideoDropzone
                file={null}
                onFileSelect={(f) => { if (f) onCompetitorFileSelect(f); }}
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
          {error && (
            <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[color:var(--error)]/20 bg-[color:var(--error)]/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-[color:var(--error)]" />
                <span className="text-[13px] text-[color:var(--error)]">{error}</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="shrink-0 text-[12px] font-medium text-[color:var(--error)] underline underline-offset-2 hover:opacity-80 focus-visible:outline-none"
                >
                  Try again
                </button>
              )}
            </div>
          )}

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
              <MetaSearch onFileSelect={onCompetitorFileSelect} />
            </>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
