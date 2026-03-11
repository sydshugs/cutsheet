// App.tsx — Full wired app
// src/App.tsx

import { useState, useRef, useEffect, Fragment, Children, type ReactNode } from "react";
import html2canvas from "html2canvas";
import { VideoDropzone } from "./components/VideoDropzone";
import { ScoreCard, getScoreColorByValue } from "./components/ScoreCard";
import { Sidebar, type SidebarMode } from "./components/Sidebar";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { CompareView } from "./components/CompareView";
import { BatchView } from "./components/BatchView";
import { SwipeFileView } from "./components/SwipeFileView";
import { PreFlightView } from "./components/PreFlightView";
import { useVideoAnalyzer } from "./hooks/useVideoAnalyzer";
import { useHistory, type HistoryEntry } from "./hooks/useHistory";
import { useSwipeFile } from "./hooks/useSwipeFile";
import { useUsage } from "./hooks/useUsage";
import { downloadMarkdown, copyToClipboard, generateBrief } from "./services/analyzerService";
import { createShare } from "./services/shareService";
import { exportToPdf } from "./utils/pdfExport";
import { UpgradeModal } from "./components/UpgradeModal";
import { checkShareLimit, incrementShareCount } from "./utils/rateLimiter";
import { themes, type ThemeTokens, THEME_KEY } from "./theme";
import ReactMarkdown from "react-markdown";

// ─── GOOGLE FONTS ─────────────────────────────────────────────────────────────
// Add to your index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

// ─── STATUS MESSAGES ──────────────────────────────────────────────────────────
const STATUS_COPY = {
  uploading: "Reading video...",
  processing: "Gemini is analyzing your creative...",
  complete: "Analysis complete",
  error: "Something went wrong",
  idle: "",
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return "1w ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString();
}

// ─── LOADING INDICATOR ────────────────────────────────────────────────────────
function AnalyzingState({ message, t }: { message: string; t: ThemeTokens }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: "20px",
      }}
    >
      <style>{`
        @keyframes analyzing-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes analyzing-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes analyzing-ripple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <div style={{ position: "relative", width: "80px", height: "80px",
        display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Outer rotating ring */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "var(--accent)",
          borderRightColor: "rgba(99,102,241,0.3)",
          animation: "analyzing-ring 1.8s linear infinite" }} />

        {/* Inner counter-rotating ring */}
        <div style={{ position: "absolute", inset: "10px", borderRadius: "50%",
          border: "1.5px solid transparent",
          borderBottomColor: "rgba(139,92,246,0.7)",
          borderLeftColor: "rgba(139,92,246,0.2)",
          animation: "analyzing-ring 1.3s linear infinite reverse" }} />

        {/* Ripple */}
        <div style={{ position: "absolute", inset: "15px", borderRadius: "50%",
          border: "1px solid rgba(99,102,241,0.4)",
          animation: "analyzing-ripple 2s ease-out infinite" }} />

        {/* Center dot */}
        <div style={{ width: "12px", height: "12px", borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 16px rgba(99,102,241,0.6)",
          animation: "analyzing-pulse 2s ease-in-out infinite" }} />
      </div>

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "13px",
            fontFamily: "'JetBrains Mono', monospace",
            color: t.spinnerText,
            letterSpacing: "0.06em",
          }}
        >
          {message}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            color: t.spinnerSub,
            marginTop: "6px",
          }}
        >
          This takes 30–90 seconds depending on video length
        </div>
      </div>
    </div>
  );
}

// ─── MARKDOWN OUTPUT ──────────────────────────────────────────────────────────
function renderTextWithTimestamps(text: string, onSeekTo?: (seconds: number) => void) {
  const parts = text.split(/(\[\d{1,2}:\d{2}\])/g);
  return parts.map((part, idx) => {
    const match = part.match(/^\[(\d{1,2}):(\d{2})\]$/);
    if (match && onSeekTo) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const totalSeconds = minutes * 60 + seconds;
      return (
        <button
          key={idx}
          onClick={() => onSeekTo(totalSeconds)}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            margin: 0,
            color: "var(--accent)",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.9em",
            textDecoration: "underline",
          }}
        >
          {part}
        </button>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

function renderNodesWithTimestamps(children: ReactNode, onSeekTo?: (seconds: number) => void) {
  return Children.toArray(children).map((child, idx) => {
    if (typeof child === "string") {
      return <Fragment key={idx}>{renderTextWithTimestamps(child, onSeekTo)}</Fragment>;
    }
    return <Fragment key={idx}>{child}</Fragment>;
  });
}

function AnalysisOutput({ markdown, onSeekTo, t }: { markdown: string; onSeekTo?: (seconds: number) => void; t: ThemeTokens }) {
  return (
    <div
      style={{
        fontFamily: "'Outfit', sans-serif",
        color: t.markdownText,
        fontSize: "14px",
        lineHeight: 1.7,
      }}
    >
      <style>{`
        .analysis-output h2 {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          margin: 28px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(99,102,241,0.2);
        }
        .analysis-output h3, .analysis-output h4 {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: ${t.h3Color};
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 16px 0 6px;
        }
        .analysis-output p {
          margin: 8px 0;
          color: ${t.pColor};
        }
        .analysis-output strong {
          color: ${t.strongColor};
          font-weight: 600;
        }
        .analysis-output ul, .analysis-output ol {
          padding-left: 18px;
          margin: 8px 0;
        }
        .analysis-output li {
          margin: 4px 0;
          color: ${t.liColor};
        }
        .analysis-output code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          background: ${t.codeBg};
          padding: 2px 6px;
          border-radius: 3px;
          color: ${t.codeColor};
        }
        .analysis-output hr {
          border: none;
          border-top: 1px solid ${t.hrColor};
          margin: 20px 0;
        }
        .analysis-output blockquote {
          border-left: 2px solid var(--accent);
          padding-left: 12px;
          margin: 12px 0;
          color: ${t.blockquoteColor};
          font-style: italic;
        }
      `}</style>
      <div className="analysis-output">
        <ReactMarkdown
          components={{
            p({ children }) {
              return <p>{renderNodesWithTimestamps(children, onSeekTo)}</p>;
            },
            li({ children }) {
              return <li>{renderNodesWithTimestamps(children, onSeekTo)}</li>;
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // Single dark mode — no theme toggle
  const t = themes.dark;
  const isDark = true;
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const [mode, setMode] = useState<SidebarMode>("single");

  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState<HistoryEntry | null>(null);
  const [rightTab, setRightTab] = useState<"analysis" | "brief">("analysis");
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const { status, statusMessage, result, error, analyze, download, copy, reset } = useVideoAnalyzer();
  const { entries: historyEntries, addEntry, deleteEntry, clearAll } = useHistory();
  const { addItem: addSwipeItem } = useSwipeFile();
  const [previousResult, setPreviousResult] = useState<HistoryEntry | null>(null);
  const { usageCount, isPro, canAnalyze, increment, FREE_LIMIT } = useUsage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isAnalyzing = status === "uploading" || status === "processing";

  // Save completed analyses to history and track usage for paywall
  useEffect(() => {
    if (status === "complete" && result) {
      const key = `${result.fileName}-${result.timestamp.toISOString()}`;
      if (lastSavedRef.current !== key) {
        lastSavedRef.current = key;
        addEntry({
          fileName: result.fileName,
          timestamp: result.timestamp.toISOString(),
          scores: result.scores,
          markdown: result.markdown,
        });
        const newCount = increment();
        if (newCount >= FREE_LIMIT && !isPro) setShowUpgradeModal(true);
      }
    }
  }, [status, result, addEntry, increment, isPro, FREE_LIMIT]);

  // Clear loaded history entry and brief when a new analysis starts
  useEffect(() => {
    if (status === "uploading") {
      setLoadedEntry(null);
      setBrief(null);
      setBriefError(null);
      setRightTab("analysis");
    }
  }, [status]);

  // Unified display result — history load takes precedence over live result
  const activeResult = loadedEntry
    ? {
        markdown: loadedEntry.markdown,
        scores: loadedEntry.scores,
        fileName: loadedEntry.fileName,
        timestamp: new Date(loadedEntry.timestamp),
      }
    : result;

  const handleAnalyze = async () => {
    if (!file || isAnalyzing || !canAnalyze) return;
    // Capture previous live result for diffing (re-analyze flow)
    if (!loadedEntry && result) {
      setPreviousResult({
        id: crypto.randomUUID(),
        fileName: result.fileName,
        timestamp: result.timestamp.toISOString(),
        scores: result.scores,
        markdown: result.markdown,
      });
    } else if (!result) {
      setPreviousResult(null);
    }
    await analyze(file, API_KEY);
  };

  const handleCopy = async () => {
    if (loadedEntry) {
      await copyToClipboard(loadedEntry.markdown);
    } else {
      await copy();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (loadedEntry) {
      downloadMarkdown({
        markdown: loadedEntry.markdown,
        scores: loadedEntry.scores,
        timestamp: new Date(loadedEntry.timestamp),
        fileName: loadedEntry.fileName,
      });
    } else {
      download();
    }
  };

  const handleExportPdf = async () => {
    if (!activeResult) return;
    try {
      await exportToPdf(activeResult);
    } catch {
      // silent fail
    }
  };

  const handleReset = () => {
    setFile(null);
    setLoadedEntry(null);
    setPreviousResult(null);
    reset();
    setBrief(null);
    setBriefError(null);
    setBriefLoading(false);
    setRightTab("analysis");
  };

  const handleGenerateBrief = async () => {
    if (!activeResult || briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const result = await generateBrief(activeResult.markdown, API_KEY);
      setBrief(result);
      setRightTab("brief");
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : "Failed to generate brief.");
    } finally {
      setBriefLoading(false);
    }
  };

  const handleBriefCopy = async () => {
    if (!brief) return;
    await copyToClipboard(brief);
    setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 2000);
  };

  const handleBriefDownload = () => {
    if (!brief || !activeResult) return;
    const filename = activeResult.fileName.replace(/\.[^/.]+$/, "") + "_brief.md";
    const blob = new Blob([brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromUrl = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed || isAnalyzing || isImporting) return;

    try {
      let parsed: URL;
      try {
        parsed = new URL(trimmed);
      } catch {
        setUrlError("Enter a valid URL.");
        return;
      }

      setIsImporting(true);
      setUrlError(null);

      const res = await fetch(trimmed);
      if (!res.ok) {
        setUrlError("Could not fetch video from this URL.");
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("video/")) {
        setUrlError("This link does not appear to be a direct video URL.");
        return;
      }

      const blob = await res.blob();
      const pathname = parsed.pathname || "";
      const guessedName =
        pathname.split("/").filter(Boolean).pop() || "video-from-url.mp4";

      const importedFile = new File([blob], guessedName, {
        type: contentType || "video/mp4",
      });

      setFile(importedFile);
      reset();
    } catch {
      setUrlError("Could not fetch video from this URL.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSeekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      if (videoRef.current.paused) {
        void videoRef.current.play();
      }
    }
  };

  const handleShareAsImage = async () => {
    if (!scorecardRef.current || !activeResult) return;
    try {
      const canvas = await html2canvas(scorecardRef.current, {
        backgroundColor: t.scorecardBg,
        scale: 2,
        useCORS: true,
      });
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = (activeResult.fileName.replace(/\.[^/.]+$/, "") || "scorecard") + "_cutsheet.png";
      a.click();
    } catch {
      // fallback silent
    }
  };

  const handleShareLink = async () => {
    if (!activeResult || shareLoading) return;

    // Check rate limit
    const { allowed, remaining, resetAt } = checkShareLimit();
    if (!allowed) {
      const resetTime = resetAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setRateLimitError(`Share limit reached (10/hour). Resets at ${resetTime}`);
      setTimeout(() => setRateLimitError(null), 5000);
      return;
    }

    setShareLoading(true);
    setRateLimitError(null);
    try {
      const slug = await createShare({
        file_name: activeResult.fileName,
        scores: activeResult.scores,
        markdown: activeResult.markdown,
      });
      const url = `${window.location.origin}/s/${slug}`;
      await navigator.clipboard.writeText(url);
      
      // Increment share count after successful share
      incrementShareCount();
      
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create share link";
      setRateLimitError(errorMsg);
      setTimeout(() => setRateLimitError(null), 5000);
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--sans)",
        display: "flex",
        overflowX: "hidden",
      }}
    >
      <Sidebar
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
        }}
        isPro={isPro}
        onNewAnalysis={handleReset}
        onHistoryOpen={() => setHistoryOpen(true)}
        userName="User"
        userPlan={isPro ? "Pro Plan" : "Free"}
      />

      <main className="main-content">

      {/* Compare mode */}
      {mode === "compare" && (
        <CompareView
          isDark={isDark}
          apiKey={API_KEY}
        />
      )}

      {/* Batch mode */}
      {mode === "batch" && (
        <BatchView
          isDark={isDark}
          apiKey={API_KEY}
          addHistoryEntry={addEntry}
          t={t}
        />
      )}

      {/* Pre-Flight mode */}
      {mode === "preflight" && (
        <PreFlightView
          isDark={isDark}
          apiKey={API_KEY}
        />
      )}

      {/* Swipe file mode */}
      {mode === "swipe" && (
        <SwipeFileView
          isDark={isDark}
        />
      )}

      {/* Main layout — single mode */}
      <div
        style={{
          display: mode === "compare" || mode === "batch" || mode === "swipe" || mode === "preflight" ? "none" : "block",
          flex: 1,
        }}
      >
        {/* Results action bar */}
        {(activeResult || (isAnalyzing && file)) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg)",
              position: "sticky",
              top: 0,
              zIndex: 40,
            }}
          >
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-muted)", marginRight: "auto" }}>
              Analyzing: <span style={{ color: "var(--ink)", fontWeight: 500 }}>{activeResult?.fileName ?? file?.name ?? ""}</span>
            </span>
            {activeResult && (
              <>
                <button type="button" onClick={handleReset} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--ink-muted)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--sans)" }}>Re-analyze</button>
                <button type="button" onClick={handleExportPdf} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--ink-muted)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--sans)" }}>Export PDF</button>
                <button type="button" onClick={handleShareLink} disabled={shareLoading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--ink-muted)", border: "1px solid var(--border)", cursor: shareLoading ? "not-allowed" : "pointer", fontFamily: "var(--sans)" }}>{shareLoading ? "Creating…" : "Share"}</button>
                <button type="button" onClick={handleGenerateBrief} disabled={briefLoading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, background: "var(--grad)", color: "#fff", border: "none", cursor: briefLoading ? "not-allowed" : "pointer", fontFamily: "var(--sans)" }}>Generate Brief</button>
              </>
            )}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: activeResult ? "1fr 1fr" : "1fr",
            gap: 0,
            maxWidth: "1400px",
            margin: "0 auto",
            minHeight: activeResult || isAnalyzing ? "calc(100vh - 60px)" : "auto",
          }}
        >
        {/* LEFT — Upload + Controls */}
        <div
          style={{
            padding: "32px 24px",
            borderRight: activeResult ? `1px solid ${t.border}` : "none",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: activeResult ? "100%" : "560px",
            margin: activeResult ? "0" : "0 auto",
            width: "100%",
          }}
        >
          {/* Section label */}
          <div
            style={{
              fontSize: "10px",
              fontFamily: "var(--mono)",
              color: "var(--ink-faint)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            01 / Upload Creative
          </div>

          {/* Welcome state — shown when no file, no result, no history */}
          {!file && !activeResult && !isAnalyzing && historyEntries.length === 0 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              textAlign: "center",
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ink)",
                margin: 0,
                fontFamily: "var(--sans)",
              }}>
                Analyze your video ad
              </h2>
              <p style={{
                fontSize: 14,
                color: "var(--ink-muted)",
                margin: 0,
                maxWidth: 400,
                lineHeight: 1.6,
                fontFamily: "var(--sans)",
              }}>
                Drop a video file or paste a URL to get AI-powered scores, scene breakdowns, and actionable creative insights.
              </p>
            </div>
          )}

          <VideoDropzone
            file={file}
            onFileSelect={(f) => {
              if (!f) { handleReset(); return; }
              setFile(f);
              reset();
            }}
            disabled={isAnalyzing || isImporting}
            videoRef={videoRef}
            isDark={isDark}
            onUrlSubmit={async (u) => {
              setUrlInput(u);
              await importFromUrl(u);
            }}
          />

          {/* Recent Analyses — empty state only */}
          {!file && historyEntries.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 900 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Recent Analyses</span>
                <button type="button" onClick={() => setHistoryOpen(true)} style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", fontWeight: 500, background: "none", border: "none", fontFamily: "var(--sans)" }}>View all →</button>
              </div>
              <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4, width: "100%", maxWidth: 900, scrollbarWidth: "thin" }}>
                {historyEntries.slice(0, 10).map((entry) => {
                  const overall = entry.scores?.overall ?? 0;
                  const scoreColor = getScoreColorByValue(overall);
                  const displayName = entry.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setLoadedEntry(entry)}
                      style={{
                        flexShrink: 0,
                        width: 200,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "transform 0.15s, border-color 0.15s",
                        textAlign: "left",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div style={{ width: "100%", height: 110, background: "var(--surface-el)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))" }} />
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                          <svg width={12} height={12} viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M4 3l10 5-10 5V3z"/></svg>
                        </div>
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 3, fontFamily: "var(--mono)" }}>—</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>{displayName}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: scoreColor, background: `${scoreColor}1a`, border: `1px solid ${scoreColor}33`, borderRadius: 5, padding: "2px 7px" }}>{overall}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-muted)" }}>{relativeTime(entry.timestamp)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Analyze button */}
          {file && status !== "complete" && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !file || !canAnalyze}
              style={{
                padding: "14px",
                background: isAnalyzing ? "rgba(99,102,241,0.3)" : !canAnalyze ? t.surface : "var(--grad)",
                border: !canAnalyze ? `1px solid ${t.border}` : "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: isAnalyzing || !canAnalyze ? "not-allowed" : "pointer",
                transition: "all 0.2s var(--ease-out)",
                boxShadow: !isAnalyzing && canAnalyze ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
              }}
            >
              {!canAnalyze ? "Upgrade to run more" : isAnalyzing ? "Analyzing..." : "Run AI Analysis →"}
            </button>
          )}

          {/* Error state */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(255,68,68,0.08)",
                border: "1px solid rgba(255,68,68,0.2)",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                color: "#FF6B6B",
              }}
            >
              {error}
            </div>
          )}

          {/* Score card — shows below upload on complete */}
          {activeResult?.scores && (
            <div
              ref={scorecardRef}
              style={{
                background: t.scorecardBg,
                padding: "16px",
                borderRadius: "12px",
              }}
            >
              <ScoreCard
                scores={activeResult.scores}
                fileName={activeResult.fileName}
                onShare={handleCopy}
                isDark={isDark}
              />
            </div>
          )}

          {/* Re-analyze diff — show change vs previous live result */}
          {activeResult?.scores && previousResult?.scores && !loadedEntry && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                color: t.textSecondary,
              }}
            >
              <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Score change:&nbsp;
              </span>
              {(() => {
                const metrics: Array<{
                  key: keyof typeof activeResult.scores;
                  label: string;
                }> = [
                  { key: "hook", label: "Hook" },
                  { key: "clarity", label: "Clarity" },
                  { key: "cta", label: "CTA" },
                  { key: "production", label: "Production" },
                  { key: "overall", label: "Overall" },
                ];
                return metrics.map((m, idx) => {
                  const prev = previousResult.scores?.[m.key] ?? 0;
                  const next = activeResult.scores![m.key];
                  const delta = next - prev;
                  const sign = delta > 0 ? "+" : "";
                  const color =
                    delta > 0 ? "#00D4AA" : delta < 0 ? "#FF6B6B" : t.textMuted;
                  return (
                    <span key={m.key}>
                      {idx > 0 && <span style={{ color: t.textMuted }}> · </span>}
                      <span>{m.label} </span>
                      <span style={{ color }}>
                        {delta === 0 ? "0" : `${sign}${delta}`}
                      </span>
                    </span>
                  );
                });
              })()}
            </div>
          )}

          {/* Save to swipe file */}
          {activeResult && (
            <button
              onClick={() => {
                addSwipeItem({
                  fileName: activeResult.fileName,
                  timestamp: activeResult.timestamp.toISOString(),
                  scores: activeResult.scores,
                  markdown: activeResult.markdown,
                  brand: "",
                  format: "",
                  niche: "",
                  platform: "",
                  tags: [],
                  notes: "",
                });
              }}
              style={{
                marginTop: "10px",
                padding: "9px 10px",
                background: "transparent",
                border: `1px dashed ${t.border}`,
                borderRadius: "6px",
                color: t.textSecondary,
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              + Save to Swipe File
            </button>
          )}

          {/* New analysis button */}
          {activeResult && (
            <button
              onClick={handleReset}
              style={{
                padding: "10px",
                background: "transparent",
                border: `1px solid ${t.border}`,
                borderRadius: "6px",
                color: t.textMuted,
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              ← New Analysis
            </button>
          )}
        </div>

        {/* History drawer */}
        <HistoryDrawer
          open={historyOpen}
          entries={historyEntries}
          onClose={() => setHistoryOpen(false)}
          onSelect={(entry) => { setLoadedEntry(entry); }}
          onDelete={deleteEntry}
          onClearAll={clearAll}
          isDark={isDark}
        />

        {/* RIGHT — Analysis output */}
        {(isAnalyzing || activeResult) && (
          <div
            style={{
              padding: "32px 24px",
              overflowY: "auto",
              maxHeight: "calc(100vh - 57px)",
              position: "sticky",
              top: "57px",
            }}
          >
            {/* Header row: label + tabs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: t.textFaint,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {rightTab === "brief" ? "03 / Creative Brief" : "02 / Creative Analysis"}
              </div>

              {/* Tab switcher — shown once brief exists */}
              {(brief || briefLoading) && (
                <div
                  style={{
                    display: "flex",
                    gap: "2px",
                    background: t.surfaceDim,
                    border: `1px solid ${t.border}`,
                    borderRadius: "6px",
                    padding: "2px",
                  }}
                >
                  {(["analysis", "brief"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRightTab(tab)}
                      style={{
                        padding: "4px 10px",
                        background: rightTab === tab ? (isDark ? "rgba(255,255,255,0.08)" : "#fff") : "transparent",
                        border: "none",
                        borderRadius: "4px",
                        color: rightTab === tab ? t.text : t.textMuted,
                        fontSize: "10px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: rightTab === tab ? 700 : 400,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Analyzing spinner */}
            {isAnalyzing && <AnalyzingState message={statusMessage || STATUS_COPY[status]} t={t} />}

            {/* Analysis tab */}
            {activeResult && rightTab === "analysis" && (
              <>
                <AnalysisOutput markdown={activeResult.markdown} onSeekTo={handleSeekTo} t={t} />

                {/* Generate Brief — below analysis */}
                <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: `1px solid ${t.border}` }}>
                  {!brief && !briefLoading && (
                    <button
                      onClick={handleGenerateBrief}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "transparent",
                        border: "1px solid rgba(99,102,241,0.3)",
                        borderRadius: "8px",
                        color: "var(--accent)",
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.2s var(--ease-out)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      Generate Brief →
                    </button>
                  )}
                  {briefLoading && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 0",
                      }}
                    >
                      <div
                        style={{
                          width: "14px",
                          height: "14px",
                          border: "2px solid rgba(99,102,241,0.2)",
                          borderTopColor: "var(--accent)",
                          borderRadius: "50%",
                          animation: "rotate-slow 0.8s linear infinite",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "11px",
                          fontFamily: "'JetBrains Mono', monospace",
                          color: t.textMuted,
                          letterSpacing: "0.06em",
                        }}
                      >
                        Generating brief...
                      </span>
                    </div>
                  )}
                  {briefError && (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "rgba(255,68,68,0.08)",
                        border: "1px solid rgba(255,68,68,0.2)",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#FF6B6B",
                      }}
                    >
                      {briefError}
                    </div>
                  )}
                  {brief && (
                    <button
                      onClick={() => setRightTab("brief")}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: "6px",
                        color: "var(--accent)",
                        fontSize: "11px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                      }}
                    >
                      View Brief →
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Brief tab */}
            {rightTab === "brief" && brief && (
              <>
                {/* Brief actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "24px",
                  }}
                >
                  <button
                    onClick={handleBriefCopy}
                    style={{
                      padding: "6px 12px",
                      background: t.surface,
                      border: `1px solid ${t.borderMid}`,
                      borderRadius: "5px",
                      color: t.textSecondary,
                      fontSize: "10px",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    {briefCopied ? "Copied!" : "Copy MD"}
                  </button>
                  <button
                    onClick={handleBriefDownload}
                    style={{
                      padding: "6px 12px",
                      background: "var(--grad)",
                      border: "none",
                      borderRadius: "5px",
                      color: "#fff",
                      fontSize: "10px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    Export .md
                  </button>
                  <button
                    onClick={handleGenerateBrief}
                    disabled={briefLoading}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: `1px solid ${t.border}`,
                      borderRadius: "5px",
                      color: t.textMuted,
                      fontSize: "10px",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.06em",
                      cursor: briefLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {briefLoading ? "Regenerating..." : "Regenerate"}
                  </button>
                </div>

                <AnalysisOutput markdown={brief} t={t} />
              </>
            )}
          </div>
        )}
      </div>
      </div>

      </main>

      {/* Share link toast */}
      {shareToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
            border: `1px solid ${t.borderMid}`,
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            color: t.textSecondary,
            letterSpacing: "0.04em",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 100,
          }}
        >
          Link copied to clipboard
        </div>
      )}

      {/* Rate limit error toast */}
      {rateLimitError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            background: "rgba(255,68,68,0.15)",
            border: "1px solid rgba(255,68,68,0.3)",
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            color: "#FF6B6B",
            letterSpacing: "0.04em",
            boxShadow: "0 4px 20px rgba(255,68,68,0.2)",
            zIndex: 100,
          }}
        >
          {rateLimitError}
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={t} />}
    </div>
  );
}
