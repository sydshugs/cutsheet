// src/components/display/DisplaySuiteView.tsx
// Suite mode UI extracted from DisplayAnalyzer — pure presentation, no logic changes.

import { Monitor, Eye, Download, X, Plus, CheckCircle } from "lucide-react";
import { SuiteCohesionCard } from "../SuiteCohesionCard";
import { sanitizeFileName } from "../../utils/sanitize";
import type { DisplayFormat } from "../../utils/displayAdUtils";
import type { DisplayResult } from "../../types/display";
import type { SuiteCohesionResult } from "../../services/claudeService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuiteBanner {
  id: string;
  file: File;
  format: DisplayFormat | null;
  dimensions: { width: number; height: number };
  status: "pending" | "analyzing" | "complete" | "error";
  result: DisplayResult | null;
}

export interface DisplaySuiteViewProps {
  suiteBanners: SuiteBanner[];
  suiteStatus: "idle" | "analyzing" | "complete" | "error";
  suiteCohesion: SuiteCohesionResult | null;
  suiteCohesionError: boolean;
  suiteMockupUrl: string | null;
  suiteMockupLoading: boolean;
  canAnalyze: boolean;
  onAddBanners: (files: File[]) => void;
  onRemoveBanner: (id: string) => void;
  onAnalyzeSuite: () => void;
  onRetryCoheison: () => void;
  onReset: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DisplaySuiteView({
  suiteBanners,
  suiteStatus,
  suiteCohesion,
  suiteCohesionError,
  suiteMockupUrl,
  suiteMockupLoading,
  canAnalyze,
  onAddBanners,
  onRemoveBanner,
  onAnalyzeSuite,
  onRetryCoheison,
  onReset,
}: DisplaySuiteViewProps) {
  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) onAddBanners(Array.from(files));
    };
    input.click();
  };

  return (
    <div className="relative px-4 py-6 md:px-8 min-h-full flex flex-col">
      <div className="relative flex flex-col flex-1" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>

        {/* ── Idle: upload + configure ── */}
        {suiteStatus === "idle" && (
          <>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", margin: "0 0 4px" }}>Ad Suite Analysis</h3>
            <p style={{ fontSize: 13, color: "#71717a", margin: "0 0 20px" }}>
              Upload 2-8 banners from the same campaign. Get individual scores + suite consistency analysis.
            </p>

            {/* Banner list */}
            {suiteBanners.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {suiteBanners.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ width: 60, height: 40, borderRadius: 6, overflow: "hidden", background: "var(--bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={URL.createObjectURL(b.file)} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: "#a1a1aa", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(() => { const n = sanitizeFileName(b.file.name); return n.length > 24 ? n.slice(0, 21) + "..." : n; })()}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: b.format ? "#06b6d4" : "#f59e0b",
                        background: b.format ? "rgba(6,182,212,0.1)" : "rgba(245,158,11,0.1)",
                        borderRadius: 9999, padding: "1px 6px",
                      }}>
                        {b.format ? `${b.format.key} ${b.format.name}` : `${b.dimensions.width}×${b.dimensions.height} Custom`}
                      </span>
                    </div>
                    {b.status === "analyzing" && (
                      <div style={{ width: 14, height: 14, border: "2px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    )}
                    {b.status === "complete" && b.result && (
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono, monospace)", color: b.result.overallScore >= 7 ? "#10b981" : b.result.overallScore >= 5 ? "#f59e0b" : "#ef4444" }}>
                        {b.result.overallScore}/10
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveBanner(b.id)}
                      style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", padding: 2 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Max-8 warning */}
            {suiteBanners.length >= 8 && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#f59e0b" }}>Maximum 8 banners per suite. Remove one to add another.</span>
              </div>
            )}

            {/* Drop zone */}
            {suiteBanners.length < 8 && (
              <div
                style={{
                  height: 100, border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12,
                  background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, cursor: "pointer", transition: "transform,opacity 150ms", marginBottom: 16,
                }}
                onClick={openFilePicker}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  onAddBanners(Array.from(e.dataTransfer.files));
                }}
              >
                <Plus size={16} color="#52525b" />
                <span style={{ fontSize: 13, color: "#71717a" }}>
                  {suiteBanners.length === 0 ? "Drop banner ads or click to browse" : "Add more banners"}
                </span>
              </div>
            )}

            {/* Cohesion hint */}
            {suiteBanners.filter((b) => b.status === "complete").length < 3 && suiteBanners.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--ink-muted, #71717a)", margin: "0 0 12px", textAlign: "center" }}>
                {(() => {
                  const need = 3 - suiteBanners.filter((b) => b.status === "complete").length;
                  return `Add ${need} more banner${need === 1 ? "" : "s"} to unlock suite cohesion analysis.`;
                })()}
              </p>
            )}

            {/* Analyze button */}
            <button
              type="button"
              onClick={onAnalyzeSuite}
              disabled={suiteBanners.length < 2 || !canAnalyze}
              style={{
                width: "100%", height: 52, borderRadius: 9999, border: "none",
                background: suiteBanners.length >= 2 ? "#6366f1" : "rgba(99,102,241,0.3)",
                color: "white", fontSize: 15, fontWeight: 600,
                cursor: suiteBanners.length >= 2 ? "pointer" : "not-allowed",
                opacity: suiteBanners.length >= 2 ? 1 : 0.4,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Monitor size={18} /> Analyze Suite ({suiteBanners.length} banners)
            </button>
          </>
        )}

        {/* ── Analyzing ── */}
        {suiteStatus === "analyzing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 16 }}>
            <div style={{ width: 24, height: 24, border: "2px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            <span style={{ fontSize: 13, color: "#71717a" }}>Analyzing {suiteBanners.length} banners...</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {suiteBanners.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {b.status === "analyzing" && (
                    <div style={{ width: 10, height: 10, border: "1.5px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  )}
                  {b.status === "complete" && <CheckCircle size={10} color="#10b981" />}
                  <span style={{ fontSize: 11, color: "#52525b" }}>{b.format?.name ?? "Custom"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {suiteStatus === "complete" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Suite mockup */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Eye size={14} color="#71717a" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Suite placement preview</span>
              </div>
              {suiteMockupLoading && (
                <div style={{ height: 240, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, color: "#52525b" }}>Generating suite mockup...</span>
                </div>
              )}
              {!suiteMockupLoading && suiteMockupUrl && (
                <>
                  <img src={suiteMockupUrl} alt="Suite mockup" style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }} />
                  <button
                    type="button"
                    onClick={() => { const a = document.createElement("a"); a.href = suiteMockupUrl; a.download = "cutsheet-suite-mockup.png"; a.click(); }}
                    style={{ marginTop: 8, width: "100%", height: 36, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#71717a", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Download size={12} /> Download suite mockup
                  </button>
                </>
              )}

              {/* Individual banner scores */}
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Individual scores</p>
                {suiteBanners.filter((b) => b.result).map((b, i) => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < suiteBanners.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 600, width: 16 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: "#a1a1aa", flex: 1 }}>{b.format?.name ?? "Custom"}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono, monospace)", color: (b.result?.overallScore ?? 0) >= 7 ? "#10b981" : (b.result?.overallScore ?? 0) >= 5 ? "#f59e0b" : "#ef4444" }}>
                      {b.result?.overallScore}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suite cohesion */}
            <div>
              <SuiteCohesionCard result={suiteCohesion} loading={!suiteCohesion && !suiteCohesionError} />
              {suiteCohesionError && !suiteCohesion && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#f59e0b" }}>
                    Couldn't analyze suite consistency. This usually means the banners are too different in style. Try uploading banners from the same campaign.
                  </span>
                  <button
                    type="button"
                    onClick={onRetryCoheison}
                    style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Retry
                  </button>
                </div>
              )}
              {suiteCohesion && (
                <button
                  type="button"
                  onClick={onReset}
                  style={{ width: "100%", height: 40, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#71717a", fontSize: 12, cursor: "pointer", marginTop: 14 }}
                >
                  Analyze another suite
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
