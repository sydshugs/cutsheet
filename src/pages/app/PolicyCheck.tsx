// src/pages/app/PolicyCheck.tsx — Standalone Policy Checker page

import { Helmet } from "react-helmet-async";
import { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { ShieldCheck, Upload, X } from "lucide-react";
import { runPolicyCheck, type PolicyCheckResult, type PolicyCheckParams } from "../../lib/policyCheckService";
import { PolicyCheckPanel } from "../../components/PolicyCheckPanel";
import type { AppSharedContext } from "../../components/AppLayout";

type Platform = "meta" | "tiktok" | "both";
type AdType = "video" | "static" | "display";

const PILLS = ["Meta policy", "TikTok policy", "Rejection prevention", "Appeal language"];

/** Resize image client-side to stay under Vercel's 4.5MB body limit */
function resizeImageToDataUrl(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/** Extract a single frame (at 1s or 0s) from a video file as a JPEG data URL. */
function extractVideoFrame(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      // Seek to 1s or 0 if shorter
      video.currentTime = Math.min(1, video.duration || 0);
    };

    video.onseeked = () => {
      let { videoWidth: width, videoHeight: height } = video;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error("Canvas not supported")); }
      ctx.drawImage(video, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load video")); };
  });
}

/** Convert any media file (image or video) to a resized JPEG data URL. */
function fileToMediaDataUrl(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  if (file.type.startsWith("video/")) return extractVideoFrame(file, maxDim, quality);
  return resizeImageToDataUrl(file, maxDim, quality);
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({
  onFileSelect,
}: {
  onFileSelect: (f: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "32px 24px", minHeight: "calc(100vh - 120px)",
      }}
    >
      <div
        style={{
          width: 76, height: 76, borderRadius: 14,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <ShieldCheck size={28} color="#f59e0b" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginTop: 20, marginBottom: 0 }}>
        Check ad policies before launch
      </h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 360, marginTop: 10, lineHeight: 1.6 }}>
        Scan your creative against Meta and TikTok policies. Catch rejections before they cost you ad spend.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
        {PILLS.map((pill) => (
          <span
            key={pill}
            style={{
              fontSize: 12, color: "#d97706", background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.15)", borderRadius: 9999, padding: "4px 12px",
            }}
          >
            {pill}
          </span>
        ))}
      </div>
      <div style={{ width: "100%", maxWidth: 520, marginTop: 32 }}>
        <div
          style={{
            height: 160, border: "2px dashed rgba(245,158,11,0.2)", borderRadius: 16,
            background: "rgba(245,158,11,0.03)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer",
            transition: "all 150ms",
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)";
            e.currentTarget.style.background = "rgba(245,158,11,0.06)";
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
            e.currentTarget.style.background = "rgba(245,158,11,0.03)";
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
            e.currentTarget.style.background = "rgba(245,158,11,0.03)";
            const f = e.dataTransfer.files[0];
            if (f) onFileSelect(f);
          }}
        >
          <Upload size={24} color="#d97706" />
          <span style={{ fontSize: 14, color: "#a16207" }}>Upload your ad creative (optional)</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Video, JPG, PNG, WebP — or skip and use copy only</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelect(f);
          }}
        />
        <p style={{ textAlign: "center", fontSize: 11, color: "#3f3f46", marginTop: 8 }}>
          Skip upload and paste copy below to run a text-only check
        </p>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function PolicyCheck() {
  const { isPro } = useOutletContext<AppSharedContext>();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("both");
  const [adType, setAdType] = useState<AdType>("video");
  const [niche, setNiche] = useState("");
  const [adCopy, setAdCopy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PolicyCheckResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    // Auto-detect ad type from mime
    if (f.type.startsWith("video/")) setAdType("video");
    else if (f.type.startsWith("image/")) setAdType("static");
    setResult(null);
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleRun = async () => {
    if (!niche.trim()) {
      setError("Add your niche for more accurate policy assessment");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert file to base64 data URL, resized to fit serverless body limit
      let mediaDataUrl: string | undefined;
      if (file) {
        mediaDataUrl = await fileToMediaDataUrl(file, 1200, 0.8);
      }

      const params: PolicyCheckParams = {
        platform,
        adType,
        niche: niche.trim(),
        adCopy: adCopy.trim() || undefined,
        mediaDataUrl,
      };

      if (!file && !adCopy.trim()) {
        setError("Upload a creative or paste your ad copy for a text-only check");
        setLoading(false);
        return;
      }

      const r = await runPolicyCheck(params);
      setResult(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Policy check failed";
      if (msg.startsWith("RATE_LIMITED")) {
        const time = msg.split(":")[1] ?? "24h";
        setError(`Daily limit reached. Resets in ${time}. Upgrade to Pro for unlimited checks.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasInput = file || adCopy.trim().length > 0;

  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Ad Policy Check — Cutsheet</title>
        <meta name="description" content="Check your ad creative against Meta and TikTok advertising policies before launch. Catch rejections before they cost you ad spend." />
        <link rel="canonical" href="https://cutsheet.xyz/app/policy-check" />
      </Helmet>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Intent header removed */}

        <div className="flex-1 overflow-auto">
          {!result ? (
            <>
              {!hasInput && !file ? (
                <EmptyState onFileSelect={handleFileSelect} />
              ) : null}

              {/* Input form — only when user has started interacting */}
              {(hasInput || file) && (
              <div className="relative px-4 py-6 md:px-8">
                <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-amber-600/5 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-amber-600/[0.04] blur-[100px]" />

                <div className="relative" style={{ maxWidth: 640, margin: "0 auto" }}>
                  {/* File upload zone (visible after selection OR as primary CTA if no file) */}
                  {!file ? (
                    <div
                      style={{
                        height: 120, border: "1px dashed rgba(245,158,11,0.2)", borderRadius: 12,
                        background: "rgba(245,158,11,0.02)", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 10, cursor: "pointer", marginBottom: 16,
                        transition: "all 150ms",
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)"; }}
                      onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
                        const f = e.dataTransfer.files[0];
                        if (f) handleFileSelect(f);
                      }}
                    >
                      <Upload size={18} color="#a16207" />
                      <span style={{ fontSize: 13, color: "#71717a" }}>Upload creative for visual policy scan (optional)</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)",
                        borderRadius: 10, marginBottom: 16,
                      }}
                    >
                      {previewUrl && file.type.startsWith("image/") && (
                        <img src={previewUrl} alt="" style={{ width: 44, height: 30, objectFit: "contain", borderRadius: 4, background: "#09090b" }} />
                      )}
                      {file.type.startsWith("video/") && (
                        <div style={{ width: 44, height: 30, borderRadius: 4, background: "#18181b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Upload size={14} color="#f59e0b" />
                        </div>
                      )}
                      <span style={{ fontSize: 13, color: "#a1a1aa", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", padding: 2 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                  />

                  {/* Niche input */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: "#71717a", display: "block", marginBottom: 6 }}>
                      Niche <span style={{ color: "#ef4444" }}>*</span>
                      <span style={{ color: "#52525b", marginLeft: 4 }}>— used for niche-specific policy risk assessment</span>
                    </label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g. weight loss supplement, DTC skincare, crypto investing, SaaS"
                      style={{
                        width: "100%", height: 40, padding: "0 14px", borderRadius: 10,
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f4f4f5", fontSize: 13, outline: "none", boxSizing: "border-box",
                        transition: "border-color 150ms",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(245,158,11,0.4)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    />
                  </div>

                  {/* Ad copy textarea */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: "#71717a", display: "block", marginBottom: 6 }}>
                      Ad copy / script
                      <span style={{ color: "#52525b", marginLeft: 4 }}>— paste for deeper text analysis</span>
                    </label>
                    <textarea
                      value={adCopy}
                      onChange={(e) => setAdCopy(e.target.value)}
                      placeholder="Paste your ad copy, headline, body text, or full script here..."
                      rows={5}
                      style={{
                        width: "100%", padding: "12px 14px", borderRadius: 10,
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f4f4f5", fontSize: 13, outline: "none", resize: "vertical",
                        fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
                        transition: "border-color 150ms",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(245,158,11,0.4)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      style={{
                        padding: "10px 14px", borderRadius: 10, marginBottom: 16,
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        fontSize: 13, color: "#ef4444",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={loading || (!file && !adCopy.trim())}
                    style={{
                      width: "100%", height: 52, borderRadius: 9999, border: "none",
                      background: loading || (!file && !adCopy.trim())
                        ? "rgba(245,158,11,0.3)"
                        : "linear-gradient(135deg, #d97706, #f59e0b)",
                      color: "white", fontSize: 15, fontWeight: 600,
                      cursor: loading || (!file && !adCopy.trim()) ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 150ms",
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                        Checking policies...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Run Policy Check
                      </>
                    )}
                  </button>
                </div>
              </div>
              )}
            </>
          ) : (
            /* Results */
            <div className="relative px-4 py-6 md:px-8">
              <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-amber-600/5 blur-[120px]" />
              <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-amber-600/[0.04] blur-[100px]" />
              <div className="relative" style={{ maxWidth: 720, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={16} color="#f59e0b" />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5" }}>Policy Check Results</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    style={{
                      fontSize: 13, color: "#6366f1", background: "none", border: "none",
                      cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2,
                    }}
                  >
                    Run another check
                  </button>
                </div>
                <PolicyCheckPanel result={result} />
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
