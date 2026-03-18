// src/pages/app/CompetitorAnalyzer.tsx — Head-to-head competitor analysis

import { Helmet } from "react-helmet-async";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Swords, Upload } from "lucide-react";
import { CompetitorResultPanel } from "../../components/CompetitorResult";
import { analyzeCompetitor, type CompetitorResult } from "../../services/competitorService";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

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

            <UploadBox label="Competitor's Ad" file={competitorFile} onFileSelect={setCompetitorFile} />
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
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
