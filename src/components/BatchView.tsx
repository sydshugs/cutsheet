// BatchView.tsx — Batch analysis mode: multi-file upload, queue, sequential run, summary table + verdict

import { useState, useRef, useCallback } from "react";
import { BatchTable } from "./BatchTable";
import { analyzeVideo, generateBatchVerdict, recalculateOverallScore, type AnalysisResult } from "../services/analyzerService";
import type { ThemeTokens } from "../theme";

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_FILES = 10;
const MAX_SIZE_MB = 200;

type BatchItemStatus = "pending" | "analyzing" | "complete" | "error";

interface BatchItem {
  id: string;
  file: File;
  status: BatchItemStatus;
  result: AnalysisResult | null;
  error: string | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

interface BatchViewProps {
  isDark: boolean;
  apiKey: string;
  addHistoryEntry: (entry: { fileName: string; timestamp: string; scores: AnalysisResult["scores"]; markdown: string }) => void;
  t: ThemeTokens;
}

export function BatchView({
  isDark,
  apiKey,
  addHistoryEntry,
  t,
}: BatchViewProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completed = items.filter((i) => i.status === "complete" && i.result?.scores);
  const allDone = items.length > 0 && items.every((i) => i.status === "complete" || i.status === "error");
  const totalCount = items.length;
  const currentRunningIndex = items.findIndex((i) => i.status === "analyzing");

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Unsupported format. Use MP4, WebM, or MOV.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Max ${MAX_SIZE_MB}MB.`;
    return null;
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      setItems((prev) => {
        let next = [...prev];
        for (const file of list) {
          if (next.length >= MAX_FILES) break;
          const err = validateFile(file);
          if (err) continue; // skip invalid
          if (next.some((i) => i.file.name === file.name && i.file.size === file.size)) continue;
          next.push({
            id: crypto.randomUUID(),
            file,
            status: "pending",
            result: null,
            error: null,
          });
        }
        return next.slice(0, MAX_FILES);
      });
      setVerdict(null);
      setVerdictError(null);
    },
    [validateFile]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setVerdict(null);
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setVerdict(null);
    setVerdictError(null);
    setVerdictLoading(false);
  }, []);

  const runBatch = useCallback(async () => {
    if (items.length === 0 || isRunning) return;
    setIsRunning(true);
    setVerdict(null);
    setVerdictError(null);

    for (let i = 0; i < items.length; i++) {
      setCurrentIndex(i);
      const item = items[i];
      if (item.status !== "pending") continue;

      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: "analyzing" as BatchItemStatus } : x))
      );

      try {
        const result = await analyzeVideo(item.file, apiKey, () => {});
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id
              ? { ...x, status: "complete" as BatchItemStatus, result, error: null }
              : x
          )
        );
        addHistoryEntry({
          fileName: result.fileName,
          timestamp: result.timestamp.toISOString(),
          scores: result.scores,
          markdown: result.markdown,
        });
        // Batch bypasses usage limit — no increment/onLimitReached
      } catch (err) {
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id
              ? {
                  ...x,
                  status: "error" as BatchItemStatus,
                  error: err instanceof Error ? err.message : "Analysis failed",
                }
              : x
          )
        );
      }
    }

    setCurrentIndex(0);
    setIsRunning(false);
  }, [items, isRunning, apiKey, addHistoryEntry]);

  const fetchVerdict = useCallback(async () => {
    const withScores = items
      .filter((i) => i.status === "complete" && i.result?.scores)
      .map((i) => ({ fileName: i.result!.fileName, scores: i.result!.scores }));
    if (withScores.length === 0) return;
    setVerdictLoading(true);
    setVerdictError(null);
    try {
      const text = await generateBatchVerdict(withScores, apiKey);
      setVerdict(text);
    } catch (err) {
      setVerdictError(err instanceof Error ? err.message : "Failed to generate verdict.");
    } finally {
      setVerdictLoading(false);
    }
  }, [items, apiKey]);

  const exportCsv = useCallback(() => {
    const escape = (v: string | number) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const headers = [
      "Filename",
      "Hook",
      "Message Clarity",
      "CTA",
      "Production",
      "Overall",
    ];
    const rows = items
      .filter((i) => i.status === "complete" && i.result?.scores)
      .map((i) => {
        const original = i.result!.scores!;
        const s = recalculateOverallScore(original) ?? original;
        return [
          escape(i.result!.fileName),
          s.hook,
          s.clarity,
          s.cta,
          s.production,
          s.overall,
        ];
      });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Screen label */}
      <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--label)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
        Batch
      </div>

      {/* Multi-file dropzone — prototype batch-dropzone */}
      <div
        onClick={() => !isRunning && fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          if (isRunning) return;
          addFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "1.5px dashed rgba(99,102,241,0.3)",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          padding: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          cursor: isRunning ? "not-allowed" : "pointer",
          transition: "all var(--duration-fast) var(--ease-out)",
        }}
        onMouseEnter={(e) => {
          if (isRunning) return;
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.55)";
          e.currentTarget.style.background = "rgba(99,102,241,0.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
          e.currentTarget.style.background = "var(--surface)";
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files;
            if (f) addFiles(f);
            e.target.value = "";
          }}
        />
        <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Add more files to batch</div>
          <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>Drop multiple files or paste URLs — up to {MAX_FILES} per batch</div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.3)", cursor: "pointer", fontFamily: "var(--sans)" }}
        >
          Browse
        </button>
      </div>

      {/* Queue grid — prototype queue-grid */}
      {items.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Processing Queue</span>
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>{items.length} files · {items.filter((i) => i.status === "analyzing").length} analyzing</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {items.map((item) => {
              const isDone = item.status === "complete";
              const isAnalyzingItem = item.status === "analyzing";
              const progressPct = isDone ? 100 : isAnalyzingItem ? 60 : 0;
              const overallScore = item.result?.scores?.overall;
              return (
                <div
                  key={item.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: 16,
                    transition: "transform var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
                    cursor: "pointer",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.file.name}</span>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background: isDone ? "rgba(16,185,129,0.1)" : isAnalyzingItem ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.05)",
                        border: isDone ? "1px solid rgba(16,185,129,0.25)" : isAnalyzingItem ? "1px solid rgba(99,102,241,0.25)" : "1px solid var(--border)",
                        color: isDone ? "var(--success)" : isAnalyzingItem ? "var(--accent)" : "var(--ink-muted)",
                      }}
                    >
                      {isAnalyzingItem && <span style={{ display: "inline-block", width: 8, height: 8, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 4, verticalAlign: "middle" }} />}
                      {item.status === "pending" && "Pending"}
                      {item.status === "analyzing" && "Analyzing"}
                      {item.status === "complete" && "Done"}
                      {item.status === "error" && "Error"}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 80, background: "var(--surface-el)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(99,102,241,0.1), transparent)" }} />
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)" style={{ position: "relative", zIndex: 1 }}><path d="M5 3l14 9-14 9V3z"/></svg>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${progressPct}%`, background: isDone ? "var(--success)" : "var(--accent)", borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-muted)" }}>
                    {isDone && overallScore != null ? `Score: ${overallScore} · ${formatSize(item.file.size)}` : isAnalyzingItem ? `${progressPct}% · ${formatSize(item.file.size)}` : `Queued · ${formatSize(item.file.size)}`}
                  </div>
                  {!isRunning && item.status !== "analyzing" && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} style={{ marginTop: 8, background: "none", border: "none", color: "var(--ink-muted)", cursor: "pointer", fontSize: 11, padding: "2px 0" }}>Remove</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action bar: Run Batch + Clear */}
          {!isRunning && items.length > 0 && (
            <div style={{ marginTop: 24, display: "flex", gap: 16, alignItems: "center" }}>
              <button
                type="button"
                onClick={clearAll}
                style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--ink-muted)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--sans)" }}
              >
                Clear Queue
              </button>
              <button
                type="button"
                onClick={runBatch}
                disabled={items.every((i) => i.status !== "pending")}
                style={{
                  padding: "7px 14px",
                  background: items.every((i) => i.status !== "pending") ? "var(--surface-el)" : "var(--grad)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  color: items.every((i) => i.status !== "pending") ? "var(--ink-muted)" : "#fff",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "var(--sans)",
                  cursor: items.every((i) => i.status !== "pending") ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isRunning && <span style={{ width: 14, height: 14, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
                {items.every((i) => i.status !== "pending") ? "No pending" : isRunning ? `Analyzing ${currentRunningIndex + 1}/${totalCount}` : "Run Batch Analysis"}
              </button>
            </div>
          )}

          {/* Progress text */}
          {isRunning && (
            <div style={{ marginTop: 12, fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink-muted)" }}>
              Analyzing {currentRunningIndex + 1} of {totalCount}…
            </div>
          )}
        </>
      )}

      {/* Batch Results Table */}
      {allDone && completed.length > 0 && (() => {
        const withScores = completed
          .map((item) => {
            const s = item.result!.scores!;
            const norm = recalculateOverallScore(s) ?? s;
            return { item, overall: norm.overall };
          })
          .sort((a, b) => b.overall - a.overall);
        const batchResults = withScores.map(({ item }, idx) => {
          const s = item.result!.scores!;
          const norm = recalculateOverallScore(s) ?? s;
          return {
            id: idx,
            rank: idx + 1,
            filename: item.result!.fileName,
            hook: s.hook,
            clarity: s.clarity,
            cta: s.cta,
            retention: s.production,
            overall: norm.overall,
            wouldScale: norm.overall >= 7,
          };
        });
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Batch Results</span>
              <button type="button" onClick={exportCsv} style={{ padding: "5px 10px", fontSize: 12, background: "transparent", color: "var(--ink-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--sans)" }}>Export CSV</button>
            </div>
            <BatchTable results={batchResults} />
          </div>
        );
      })()}

      {/* AI Ranking block — prototype ai-ranking-block */}
      {allDone && completed.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.18em" }}>// AI Ranking Rationale</span>
          </div>
          {!verdict && !verdictLoading && (
            <button type="button" onClick={fetchVerdict} style={{ padding: "8px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", color: "var(--accent)", fontSize: 12, fontWeight: 500, fontFamily: "var(--sans)", cursor: "pointer" }}>Generate ranking</button>
          )}
          {verdictLoading && <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>Generating verdict…</div>}
          {verdictError && <div style={{ padding: 10, background: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-sm)", color: "var(--error)", fontSize: 12 }}>{verdictError}</div>}
          {verdict && <p style={{ fontSize: 13.5, color: "var(--ink-muted)", lineHeight: 1.65, margin: 0 }}>{verdict}</p>}
        </div>
      )}
    </div>
  );
}
