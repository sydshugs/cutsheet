// App.tsx — Full wired app
// src/App.tsx

import { useState, useRef, useEffect, Fragment, Children, type ReactNode } from "react";
import html2canvas from "html2canvas";
import { VideoDropzone } from "./components/VideoDropzone";
import { ScoreCard } from "./components/ScoreCard";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { CompareView } from "./components/CompareView";
import { useVideoAnalyzer } from "./hooks/useVideoAnalyzer";
import { useHistory, type HistoryEntry } from "./hooks/useHistory";
import { useUsage } from "./hooks/useUsage";
import { downloadMarkdown, copyToClipboard, generateBrief } from "./services/analyzerService";
import { createShare } from "./services/shareService";
import { exportToPdf } from "./utils/pdfExport";
import { UpgradeModal } from "./components/UpgradeModal";
import { themes, type ThemeTokens, type Theme, THEME_KEY, getInitialTheme } from "./theme";
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

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────────
function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        background: "transparent",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        borderRadius: "6px",
        color: isDark ? "rgba(255,255,255,0.6)" : "rgba(10,10,10,0.6)",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {isDark ? (
        // Sun — click to switch to light
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon — click to switch to dark
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
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
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes ping2 {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ position: "relative", width: "80px", height: "80px",
        display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Ripple rings */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid rgba(255,68,68,0.6)",
          animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid rgba(255,68,68,0.4)",
          animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
          animationDelay: "0.5s" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid rgba(255,68,68,0.25)",
          animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
          animationDelay: "1s" }} />

        {/* Rotating outer ring */}
        <div style={{ position: "absolute", inset: "8px", borderRadius: "50%",
          border: "1.5px solid transparent",
          borderTopColor: "rgba(255,68,68,0.7)",
          borderRightColor: "rgba(255,68,68,0.2)",
          animation: "rotate-slow 1.2s linear infinite" }} />

        {/* Center dot */}
        <div style={{ width: "10px", height: "10px", borderRadius: "50%",
          background: "#FF4444",
          boxShadow: "0 0 12px rgba(255,68,68,0.8)",
          animation: "pulse-dot 1.5s ease-in-out infinite" }} />
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
            color: "#FF6B6B",
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
          color: #FF4444;
          margin: 28px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,68,68,0.2);
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
          border-left: 2px solid #FF4444;
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
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialTheme();
    document.documentElement.setAttribute("data-theme", initial);
    return initial;
  });
  const t = themes[theme];
  const isDark = theme === "dark";

  const toggleTheme = () => {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  };

  const [mode, setMode] = useState<"single" | "compare">("single");

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const { status, statusMessage, result, error, analyze, download, copy, reset } = useVideoAnalyzer();
  const { entries: historyEntries, addEntry, deleteEntry, clearAll } = useHistory();
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
  }, [status, result]);

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

  const handleImportFromUrl = async () => {
    const trimmed = urlInput.trim();
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
    setShareLoading(true);
    try {
      const slug = await createShare({
        file_name: activeResult.fileName,
        scores: activeResult.scores,
        markdown: activeResult.markdown,
      });
      const url = `${window.location.origin}/s/${slug}`;
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch {
      // silent fail or could set error state
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Top nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: `1px solid ${t.border}`,
          position: "sticky",
          top: 0,
          background: t.navBg,
          backdropFilter: "blur(12px)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "#FF4444",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon
                points="0,0 10,0 14,4 14,14 0,14"
                fill="white"
                opacity="0.95"
              />
              <line
                x1="9.5" y1="0.5"
                x2="13.5" y2="4.5"
                stroke="#FF4444"
                strokeWidth="1"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "0.04em",
            }}
          >
            CUTSHEET
          </span>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              color: t.textFaint,
              background: t.surface,
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            BETA
          </span>
          {isPro && (
            <span
              style={{
                fontSize: "10px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: "#0A0A0A",
                background: "#00D4AA",
                padding: "2px 6px",
                borderRadius: "3px",
                letterSpacing: "0.04em",
              }}
            >
              Pro
            </span>
          )}

          {/* Mode divider */}
          <div style={{ width: "1px", height: "16px", background: t.border, margin: "0 4px" }} />

          {/* Single / Compare toggle */}
          <button
            onClick={() => setMode(mode === "single" ? "compare" : "single")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              background: mode === "compare" ? "rgba(255,68,68,0.12)" : "transparent",
              border: `1px solid ${mode === "compare" ? "rgba(255,68,68,0.4)" : t.border}`,
              borderRadius: "5px",
              color: mode === "compare" ? "#FF4444" : t.textMuted,
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            {mode === "compare" ? (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="1" y1="1" x2="9" y2="9" />
                  <line x1="9" y1="1" x2="1" y2="9" />
                </svg>
                COMPARE
              </>
            ) : (
              <>
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="1" y1="5" x2="5" y2="5" />
                  <line x1="7" y1="5" x2="11" y2="5" />
                  <line x1="1" y1="2" x2="5" y2="2" />
                  <line x1="7" y1="2" x2="11" y2="2" />
                  <line x1="1" y1="8" x2="5" y2="8" />
                  <line x1="7" y1="8" x2="11" y2="8" />
                </svg>
                COMPARE
              </>
            )}
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* History icon */}
          <button
            onClick={() => setHistoryOpen(true)}
            title="Analysis history"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              background: "transparent",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              borderRadius: "6px",
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(10,10,10,0.6)",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
              position: "relative",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {historyEntries.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "14px",
                  height: "14px",
                  background: "#FF4444",
                  borderRadius: "50%",
                  fontSize: "8px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {historyEntries.length > 9 ? "9+" : historyEntries.length}
              </span>
            )}
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          {!isPro && usageCount >= 1 && (
            <a
              href={import.meta.env.VITE_STRIPE_CHECKOUT_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "7px 14px",
                background: "rgba(0,212,170,0.12)",
                border: "1px solid rgba(0,212,170,0.3)",
                borderRadius: "6px",
                color: "#00D4AA",
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
            >
              Upgrade to Pro
            </a>
          )}
          {activeResult && (
            <>
              <button
                onClick={handleShareLink}
                disabled={shareLoading}
                style={{
                  padding: "7px 14px",
                  background: t.surface,
                  border: `1px solid ${t.borderMid}`,
                  borderRadius: "6px",
                  color: t.textSecondary,
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: shareLoading ? "not-allowed" : "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                {shareLoading ? "Creating..." : "Share Link"}
              </button>
              <button
                onClick={handleShareAsImage}
                style={{
                  padding: "7px 14px",
                  background: t.surface,
                  border: `1px solid ${t.borderMid}`,
                  borderRadius: "6px",
                  color: t.textSecondary,
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                Share as image
              </button>
              <button
                onClick={handleCopy}
                style={{
                  padding: "7px 14px",
                  background: t.surface,
                  border: `1px solid ${t.borderMid}`,
                  borderRadius: "6px",
                  color: t.textSecondary,
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                {copied ? "Copied!" : "Copy MD"}
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: "7px 14px",
                  background: "#FF4444",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                }}
              >
                Export .md
              </button>
              <button
                onClick={handleExportPdf}
                style={{
                  padding: "7px 14px",
                  background: t.surface,
                  border: `1px solid ${t.borderMid}`,
                  borderRadius: "6px",
                  color: t.textSecondary,
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                Export PDF
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Compare mode */}
      {mode === "compare" && (
        <CompareView isDark={isDark} apiKey={API_KEY} />
      )}

      {/* Main layout — single mode */}
      <div
        style={{
          display: mode === "compare" ? "none" : "grid",
          gridTemplateColumns: activeResult ? "1fr 1fr" : "1fr",
          gap: "0",
          maxWidth: "1400px",
          margin: "0 auto",
          minHeight: "calc(100vh - 57px)",
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
              fontFamily: "'JetBrains Mono', monospace",
              color: t.textFaint,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            01 / Upload Creative
          </div>

          {/* URL import */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Paste TikTok / Instagram / direct video URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${t.borderStrong}`,
                  background: t.surfaceDim,
                  color: t.textPrimary,
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: "none",
                }}
                disabled={isAnalyzing || isImporting}
              />
              <button
                onClick={handleImportFromUrl}
                disabled={!urlInput.trim() || isAnalyzing || isImporting}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${t.borderStrong}`,
                  background: isImporting ? t.surface : t.surfaceMid,
                  color: t.text,
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: !urlInput.trim() || isAnalyzing || isImporting ? "not-allowed" : "pointer",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {isImporting ? "Importing..." : "Import"}
              </button>
            </div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                color: t.textMuted,
              }}
            >
              Paste a link instead of downloading the file first.
            </div>
            {urlError && (
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#FF6B6B",
                }}
              >
                {urlError}
              </div>
            )}
          </div>

          <VideoDropzone
            file={file}
            onFileSelect={(f) => {
              if (!f) { handleReset(); return; }
              setFile(f);
              reset();
            }}
            disabled={isAnalyzing}
            videoRef={videoRef}
            isDark={isDark}
          />

          {/* Analyze button */}
          {file && status !== "complete" && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !file || !canAnalyze}
              style={{
                padding: "14px",
                background: isAnalyzing ? "rgba(255,68,68,0.3)" : !canAnalyze ? t.surface : "#FF4444",
                border: !canAnalyze ? `1px solid ${t.border}` : "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: isAnalyzing || !canAnalyze ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
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
                        border: `1px solid ${isDark ? "rgba(255,68,68,0.3)" : "rgba(255,68,68,0.4)"}`,
                        borderRadius: "8px",
                        color: "#FF4444",
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,68,68,0.08)";
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
                          border: "2px solid rgba(255,68,68,0.2)",
                          borderTopColor: "#FF4444",
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
                        background: "rgba(255,68,68,0.08)",
                        border: "1px solid rgba(255,68,68,0.2)",
                        borderRadius: "6px",
                        color: "#FF4444",
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
                      background: "#FF4444",
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

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={t} />}
    </div>
  );
}
