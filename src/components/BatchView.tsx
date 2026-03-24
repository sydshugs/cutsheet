// BatchView.tsx — Rank Creatives: multi-file upload, parallel analysis, ranked leaderboard

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Trophy, Upload, Zap, X, ChevronDown, Square } from "lucide-react";
import { sanitizeFileName } from "../utils/sanitize";
import { AnimatePresence, motion } from "framer-motion";
import { analyzeVideo, recalculateOverallScore, type AnalysisResult } from "../services/analyzerService";
import { ScoreCard } from "./ScoreCard";
import { UpgradeModal } from "./UpgradeModal";
import { Toast } from "./Toast";
import { AlertDialog } from "./ui/AlertDialog";
import { AnalysisProgressCard } from "./AnalysisProgressCard";
import type { ThemeTokens } from "../theme";

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 10;
const MAX_SIZE_MB = 200;

type BatchItemStatus = "pending" | "analyzing" | "complete" | "error";

interface BatchItem {
  id: string;
  file: File;
  format: "video" | "static";
  status: BatchItemStatus;
  result: AnalysisResult | null;
  error: string | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function scoreColor(score: number): string {
  if (score >= 8) return "#10b981";
  if (score >= 5) return "#f59e0b";
  return "#ef4444";
}

function rankStyle(rank: number): { bg: string; color: string } {
  if (rank === 1) return { bg: "rgba(250,204,21,0.15)", color: "#fbbf24" };
  if (rank === 2) return { bg: "rgba(168,162,158,0.15)", color: "#a8a29e" };
  if (rank === 3) return { bg: "rgba(180,83,9,0.15)", color: "#d97706" };
  return { bg: "rgba(255,255,255,0.04)", color: "#52525b" };
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function RankEmptyState({ onStart, onFileDrop }: { onStart: () => void; onFileDrop: (files: FileList) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const steps = [
    { icon: Upload, label: "Upload 5-10 creative variations" },
    { icon: Zap, label: "Cutsheet scores them all in parallel" },
    { icon: Trophy, label: "Get a ranked list — test the top 2-3" },
  ];
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files.length > 0) onFileDrop(e.dataTransfer.files); }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 16, flex: 1,
        border: isDragOver ? "2px dashed var(--accent, #6366f1)" : "2px dashed transparent",
        background: isDragOver ? "rgba(99,102,241,0.04)" : "transparent",
        borderRadius: 16, transition: "border-color 150ms, background 150ms",
      }}
    >
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Trophy size={28} color="#6366f1" />
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>Rank your creatives</h1>
      <p style={{ fontSize: 14, color: "#71717a", textAlign: "center", maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
        Upload up to 10 ad variations. Cutsheet scores them all and ranks them — so you know which 2-3 to actually test before spending a dollar.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
        {["Score all at once", "Ranked by strength", "Know before you spend"].map((p) => (
          <span key={p} style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 9999, padding: "4px 12px" }}>{p}</span>
        ))}
      </div>
      {/* Step explanation */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span style={{ color: "#52525b", fontSize: 14 }}>→</span>}
              <Icon size={18} color="#6366f1" />
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>{s.label}</span>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onStart}
        style={{ marginTop: 28, height: 52, padding: "0 32px", borderRadius: 9999, border: "none", background: "#6366f1", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        Upload creatives to rank <Trophy size={16} />
      </button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

interface BatchViewProps {
  isDark: boolean;
  apiKey: string;
  addHistoryEntry: (entry: { fileName: string; timestamp: string; scores: AnalysisResult["scores"]; markdown: string }) => void;
  t: ThemeTokens;
  canAnalyze: boolean;
  isPro: boolean;
  increment: () => number;
  FREE_LIMIT: number;
}

export function BatchView({ apiKey, addHistoryEntry, t, canAnalyze, isPro, increment, FREE_LIMIT }: BatchViewProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [rejectionToast, setRejectionToast] = useState<{ message: string } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const stopRequestedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allDone = items.length > 0 && items.every((i) => i.status === "complete" || i.status === "error");
  const completed = items.filter((i) => i.status === "complete" && i.result?.scores);

  const ranked = useMemo(() => {
    return completed
      .map((item) => {
        const s = item.result!.scores!;
        const norm = recalculateOverallScore(s) ?? s;
        return { item, overall: norm.overall, scores: norm };
      })
      .sort((a, b) => b.overall - a.overall);
  }, [completed]);

  const detectFormat = (file: File): "video" | "static" => {
    return file.type.startsWith("video/") ? "video" : "static";
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    let skippedFormat = 0;
    let skippedSize = 0;

    setItems((prev) => {
      let next = [...prev];
      for (const file of Array.from(files)) {
        if (next.length >= MAX_FILES) break;
        if (!ACCEPTED_TYPES.includes(file.type)) { skippedFormat++; continue; }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) { skippedSize++; continue; }
        if (next.some((i) => i.file.name === file.name && i.file.size === file.size)) continue;
        next.push({
          id: crypto.randomUUID(),
          file,
          format: detectFormat(file),
          status: "pending",
          result: null,
          error: null,
        });
      }
      return next.slice(0, MAX_FILES);
    });

    // Surface rejection feedback via toast
    const parts: string[] = [];
    if (skippedFormat > 0) parts.push(`${skippedFormat} file${skippedFormat > 1 ? "s" : ""} skipped: unsupported format`);
    if (skippedSize > 0) parts.push(`${skippedSize} file${skippedSize > 1 ? "s" : ""} skipped: exceeds ${MAX_SIZE_MB}MB limit`);
    if (parts.length > 0) {
      setRejectionToast({ message: parts.join(". ") });
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const runBatch = useCallback(async () => {
    if (items.length === 0 || isRunning) return;
    if (!canAnalyze && !isPro) { setShowUpgradeModal(true); return; }

    setIsRunning(true);
    stopRequestedRef.current = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status !== "pending") continue;

      // Check if stop was requested before starting next item
      if (stopRequestedRef.current) break;

      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "analyzing" as const } : x)));

      try {
        const contextPrefix = item.format === "static"
          ? "This is a STATIC image ad. Analyze as a single-frame visual creative. Do NOT provide scene breakdown or timestamps."
          : undefined;
        const result = await analyzeVideo(item.file, apiKey, undefined, contextPrefix);
        setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "complete" as const, result, error: null } : x)));
        addHistoryEntry({ fileName: result.fileName, timestamp: result.timestamp.toISOString(), scores: result.scores, markdown: result.markdown });
        const newCount = increment();
        if (newCount >= FREE_LIMIT && !isPro) { setShowUpgradeModal(true); break; }
      } catch (err) {
        setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "error" as const, error: err instanceof Error ? err.message : "Failed" } : x)));
      }
    }

    stopRequestedRef.current = false;
    setIsRunning(false);
  }, [items, isRunning, apiKey, addHistoryEntry, canAnalyze, isPro, increment, FREE_LIMIT]);

  // Preview URLs
  const previewUrls = useMemo(() => {
    const map: Record<string, string> = {};
    items.forEach((item) => { map[item.id] = URL.createObjectURL(item.file); });
    return map;
  }, [items]);
  useEffect(() => { return () => Object.values(previewUrls).forEach(URL.revokeObjectURL); }, [previewUrls]);

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (items.length === 0 && !showUpload) {
    return (
      <>
        <RankEmptyState onStart={() => setShowUpload(true)} onFileDrop={(files) => { addFiles(files); setShowUpload(true); }} />
        {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={t} />}
      </>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* Upload section */}
      {!allDone && (
        <>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", margin: "0 0 4px" }}>
            {items.length === 0 ? "Upload creatives to rank" : `${items.length} creative${items.length > 1 ? "s" : ""} queued`}
          </h3>
          <p style={{ fontSize: 13, color: "#71717a", margin: "0 0 20px" }}>
            {items.length === 0 ? "Drop up to 10 video or static ad files." : isRunning ? `Analyzing ${items.filter((i) => i.status === "analyzing").length > 0 ? items.findIndex((i) => i.status === "analyzing") + 1 : ""}...` : "Add more or start analysis."}
          </p>

          {/* Batch progress counter */}
          {isRunning && (() => {
            const analyzingIdx = items.findIndex((i) => i.status === "analyzing");
            const currentNum = analyzingIdx >= 0 ? analyzingIdx + 1 : items.filter((i) => i.status === "complete" || i.status === "error").length;
            return (
              <p style={{ fontSize: 13, color: "var(--ink-muted, #71717a)", margin: "0 0 8px" }}>
                Analyzing {currentNum} of {items.length}...
              </p>
            );
          })()}

          {/* File list */}
          {items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {items.map((item) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
                }}>
                  <div style={{ width: 48, height: 32, borderRadius: 6, overflow: "hidden", background: "#09090b", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.format === "static"
                      ? <img src={previewUrls[item.id]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      : <video src={previewUrls[item.id]} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    }
                  </div>
                  <span style={{ fontSize: 12, color: "#a1a1aa", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(() => { const n = sanitizeFileName(item.file.name); return n.length > 28 ? n.slice(0, 25) + "..." : n; })()}
                  </span>
                  <span style={{ fontSize: 10, color: item.format === "video" ? "#818cf8" : "#f59e0b", background: item.format === "video" ? "rgba(99,102,241,0.1)" : "rgba(245,158,11,0.1)", borderRadius: 9999, padding: "1px 6px" }}>
                    {item.format === "video" ? "Video" : "Static"}
                  </span>
                  {item.status === "analyzing" && <div style={{ width: 12, height: 12, border: "2px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
                  {item.status === "complete" && item.result?.scores && (
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono, monospace)", color: scoreColor(item.result.scores.overall) }}>
                      {(recalculateOverallScore(item.result.scores) ?? item.result.scores).overall}/10
                    </span>
                  )}
                  {item.status === "error" && <span style={{ fontSize: 10, color: "#ef4444" }}>Error</span>}
                  {!isRunning && <button type="button" onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", padding: 2 }}><X size={14} /></button>}
                </div>
              ))}
            </div>
          )}

          {/* Dropzone */}
          {items.length < MAX_FILES && !isRunning && (
            <div
              style={{ height: 80, border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", transition: "all 150ms", marginBottom: 16 }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; addFiles(e.dataTransfer.files); }}
            >
              <Upload size={16} color="#52525b" />
              <span style={{ fontSize: 13, color: "#71717a" }}>{items.length === 0 ? "Drop creatives or click to browse" : "Add more"}</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(",")} multiple style={{ display: "none" }}
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />

          {/* Analyze button */}
          {items.length >= 2 && !isRunning && (
            <button type="button" onClick={runBatch}
              disabled={items.every((i) => i.status !== "pending")}
              style={{
                width: "100%", height: 52, borderRadius: 9999, border: "none",
                background: items.some((i) => i.status === "pending") ? "#6366f1" : "rgba(99,102,241,0.3)",
                color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              <Zap size={18} /> Rank {items.filter((i) => i.status === "pending").length} Creatives
            </button>
          )}

          {/* Progress card while analyzing */}
          {isRunning && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginTop: 24 }}
            >
              <AnalysisProgressCard
                pageType="rank-creative"
                files={items.filter(i => i.file).map(i => i.file as File)}
                statusMessage={`Analyzing creative ${items.filter(i => i.status === "complete" || i.status === "analyzing").length + 1} of ${items.length}`}
                currentIndex={items.findIndex(i => i.status === "analyzing")}
                totalCount={items.length}
                onCancel={() => { stopRequestedRef.current = true; }}
              />
            </motion.div>
          )}

          {/* Stop after current button */}
          {isRunning && !stopRequestedRef.current && (
            <button
              type="button"
              onClick={() => { stopRequestedRef.current = true; }}
              style={{
                width: "100%", marginTop: 8, background: "none", border: "none",
                color: "var(--ink-muted, #71717a)", fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "8px 0",
              }}
            >
              <Square size={14} /> Stop after current
            </button>
          )}
        </>
      )}

      {/* ── RESULTS: Ranked Leaderboard ────────────────────────────────────── */}
      {allDone && ranked.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>{ranked.length} creatives ranked</h3>
              <p style={{ fontSize: 13, color: "#71717a", margin: "2px 0 0" }}>Based on overall ad strength</p>
            </div>
            <button type="button" onClick={() => setConfirmResetOpen(true)}
              style={{ fontSize: 12, color: "#71717a", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
              Rank more →
            </button>
          </div>

          {/* Top 2 recommendation */}
          {ranked.length >= 2 && (
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Trophy size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>
                  Test these two: {ranked[0].item.result!.fileName.split(".")[0]} and {ranked[1].item.result!.fileName.split(".")[0]}
                </p>
                <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0" }}>They scored highest across hook, CTA, and clarity.</p>
              </div>
            </div>
          )}

          {/* Ranked list */}
          {ranked.map(({ item, overall, scores }, idx) => {
            const rank = idx + 1;
            const rs = rankStyle(rank);
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: isExpanded ? "12px 12px 0 0" : 12, cursor: "pointer", transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  {/* Rank badge */}
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: rs.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: rs.color }}>#{rank}</span>
                  </div>

                  {/* Thumbnail */}
                  <div style={{ width: 48, height: 32, borderRadius: 6, overflow: "hidden", background: "#09090b", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.format === "static"
                      ? <img src={previewUrls[item.id]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      : <video src={previewUrls[item.id]} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    }
                  </div>

                  {/* Name + format */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: "#f4f4f5", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.result!.fileName.length > 28 ? item.result!.fileName.slice(0, 25) + "..." : item.result!.fileName}
                    </span>
                    <span style={{ fontSize: 10, color: item.format === "video" ? "#818cf8" : "#f59e0b" }}>
                      {item.format === "video" ? "Video" : "Static"}
                    </span>
                  </div>

                  {/* Mini score bars */}
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 20 }}>
                    {([scores.hook, scores.cta, scores.clarity, scores.production] as number[]).map((s, j) => (
                      <div key={j} style={{ width: 4, height: `${Math.max(4, s * 2)}px`, borderRadius: 1, background: scoreColor(s) }} />
                    ))}
                  </div>

                  {/* Overall score */}
                  <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", color: scoreColor(overall), width: 50, textAlign: "right" }}>
                    {overall}
                  </span>

                  <ChevronDown size={14} color="#52525b" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
                </div>

                {/* Expanded scorecard */}
                <AnimatePresence>
                  {isExpanded && item.result?.scores && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 12px 12px" }}
                    >
                      <ScoreCard
                        scores={item.result.scores}
                        improvements={item.result.improvements}
                        budget={item.result.budget}
                        hashtags={item.result.hashtags}
                        fileName={item.result.fileName}
                        isDark
                        format={item.format}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Bottom 2 warning */}
          {ranked.length >= 4 && ranked[ranked.length - 1].overall <= 5 && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <X size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
                  Don't spend on #{ranked.length}{ranked.length >= 5 ? ` or #${ranked.length - 1}` : ""}
                </span>
                <p style={{ fontSize: 11, color: "#71717a", margin: "2px 0 0" }}>Score too low to justify ad spend. Fix improvements first.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={t} />}

      {/* Rejection toast */}
      {rejectionToast && (
        <Toast
          message={rejectionToast.message}
          variant="warning"
          duration={4000}
          onClose={() => setRejectionToast(null)}
        />
      )}

      {/* Confirm reset dialog */}
      <AlertDialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={() => { setItems([]); setExpandedId(null); setShowUpload(true); }}
        title="Start a new batch?"
        description="Your current rankings will be cleared. Consider exporting first."
        confirmLabel="Clear & Start Over"
        variant="default"
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
