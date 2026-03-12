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
import { TopBar } from "./components/TopBar";

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
            fontFamily: "var(--mono)",
            color: t.spinnerText,
            letterSpacing: "0.06em",
          }}
        >
          {message}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--mono)",
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
            fontFamily: "var(--mono)",
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
        fontFamily: "var(--sans)",
        color: t.markdownText,
        fontSize: "14px",
        lineHeight: 1.7,
      }}
    >
      <style>{`
        .analysis-output h2 {
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--label);
          margin: 28px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(99,102,241,0.12);
        }
        .analysis-output h3, .analysis-output h4 {
          font-family: var(--mono);
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
          font-family: var(--mono);
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const showRightPanel = mode === "single" && status === "complete" && activeResult !== null;

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
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar
        mode={mode}
        onModeChange={(m) => setMode(m)}
        isPro={isPro}
        onNewAnalysis={handleReset}
        onHistoryOpen={() => setHistoryOpen(true)}
        userName="User"
        userPlan={isPro ? "Pro Plan" : "Free"}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area (right of sidebar) */}
      <div className="main-content flex flex-col">
        {/* Top bar */}
        <TopBar
          onNewAnalysis={handleReset}
          onHistoryOpen={() => setHistoryOpen(true)}
          onMobileMenuToggle={() => setMobileOpen(prev => !prev)}
          showMobileMenu={mobileOpen}
          userName="User"
          userPlan={isPro ? "pro" : "free"}
        />

        {/* Content + Right panel wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />

            {/* Mode content */}
            <div className="relative px-8 py-6">
              {/* ── SINGLE / ANALYZER MODE ── */}
              {mode === "single" && (
                <div>
                  {/* Keep existing Analyzer inline JSX for now — replaced in Task 12 */}

                  {/* Results action bar */}
                  {(activeResult || (isAnalyzing && file)) && (
                    <div className="flex items-center gap-2 py-3 mb-4 border-b border-white/5">
                      <span className="font-mono text-xs text-zinc-500 mr-auto">
                        Analyzing: <span className="text-white font-medium">{activeResult?.fileName ?? file?.name ?? ""}</span>
                      </span>
                      {activeResult && (
                        <>
                          <button type="button" onClick={handleReset} className="text-xs text-zinc-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors">Re-analyze</button>
                          <button type="button" onClick={handleExportPdf} className="text-xs text-zinc-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors">Export PDF</button>
                          <button type="button" onClick={handleShareLink} disabled={shareLoading} className="text-xs text-zinc-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">{shareLoading ? "Creating…" : "Share"}</button>
                          <button type="button" onClick={handleGenerateBrief} disabled={briefLoading} className="text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">Generate Brief</button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Welcome state */}
                  {!file && !activeResult && !isAnalyzing && historyEntries.length === 0 && (
                    <div className="flex flex-col items-center gap-2 mb-2 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mb-2">
                        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-white">Analyze your video ad</h2>
                      <p className="text-sm text-zinc-400 max-w-[400px] leading-relaxed">
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

                  {/* Analyze button */}
                  {file && status !== "complete" && (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !file || !canAnalyze}
                      className={`w-full mt-5 py-3.5 rounded-xl text-white text-sm font-mono font-bold tracking-wider uppercase transition-all ${
                        isAnalyzing ? 'bg-indigo-600/30 cursor-not-allowed' :
                        !canAnalyze ? 'bg-zinc-800 border border-white/10 cursor-not-allowed' :
                        'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] cursor-pointer'
                      }`}
                    >
                      {!canAnalyze ? "Upgrade to run more" : isAnalyzing ? "Analyzing..." : "Run AI Analysis →"}
                    </button>
                  )}

                  {/* Error state */}
                  {error && (
                    <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Analyzing spinner */}
                  {isAnalyzing && <AnalyzingState message={statusMessage || STATUS_COPY[status]} t={t} />}

                  {/* Analysis output — inline for now, replaced by ReportCards in Task 12 */}
                  {activeResult && rightTab === "analysis" && (
                    <div className="mt-6">
                      <AnalysisOutput markdown={activeResult.markdown} onSeekTo={handleSeekTo} t={t} />
                    </div>
                  )}

                  {/* Brief tab — inline for now */}
                  {rightTab === "brief" && brief && (
                    <div className="mt-6">
                      <div className="flex gap-2 mb-6">
                        <button onClick={handleBriefCopy} className="text-xs text-zinc-400 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono">{briefCopied ? "Copied!" : "Copy MD"}</button>
                        <button onClick={handleBriefDownload} className="text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg px-3 py-1.5 font-mono font-bold">Export .md</button>
                        <button onClick={handleGenerateBrief} disabled={briefLoading} className="text-xs text-zinc-500 border border-white/10 rounded-lg px-3 py-1.5 font-mono disabled:opacity-50">{briefLoading ? "Regenerating..." : "Regenerate"}</button>
                      </div>
                      <AnalysisOutput markdown={brief} t={t} />
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
                      className="mt-3 w-full py-2.5 text-xs font-mono text-zinc-500 border border-dashed border-white/10 rounded-lg tracking-wider hover:text-white hover:border-white/20 transition-colors"
                    >
                      + Save to Swipe File
                    </button>
                  )}
                </div>
              )}

              {/* ── NON-ANALYZER MODES ── Keep exactly as-is with existing props */}
              {mode === "compare" && <CompareView isDark={isDark} apiKey={API_KEY} />}
              {mode === "batch" && <BatchView isDark={isDark} apiKey={API_KEY} addHistoryEntry={addEntry} t={t} />}
              {mode === "preflight" && <PreFlightView isDark={isDark} apiKey={API_KEY} />}
              {mode === "swipe" && <SwipeFileView isDark={isDark} />}
            </div>
          </div>

          {/* Right panel (results only) */}
          <div className={`shrink-0 bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showRightPanel ? 'w-[340px] opacity-100' : 'w-0 opacity-0'}`}>
            {showRightPanel && activeResult?.scores && (
              <div ref={scorecardRef} className="p-4">
                <ScoreCard
                  scores={activeResult.scores}
                  fileName={activeResult.fileName}
                  onShare={handleCopy}
                  isDark={isDark}
                />
              </div>
            )}
          </div>
        </div>
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

      {/* Share link toast */}
      {shareToast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]">
          Link copied to clipboard
        </div>
      )}

      {/* Rate limit error toast */}
      {rateLimitError && (
        <div role="alert" aria-live="assertive" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs font-mono text-red-400 shadow-lg z-[100]">
          {rateLimitError}
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={t} />}
    </div>
  );
}
