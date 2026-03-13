// App.tsx — Full wired app
// src/App.tsx

import { useState, useRef, useEffect } from "react";
import { ScoreCard } from "./components/ScoreCard";
import { Sidebar, type SidebarMode } from "./components/Sidebar";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { CompareView } from "./components/CompareView";
import { BatchView } from "./components/BatchView";
import { SwipeFileView } from "./components/SwipeFileView";
import { PreFlightView } from "./components/PreFlightView";
import { AnalyzerView } from "./components/AnalyzerView";
import { useVideoAnalyzer } from "./hooks/useVideoAnalyzer";
import { useHistory, type HistoryEntry } from "./hooks/useHistory";
import { useSwipeFile } from "./hooks/useSwipeFile";
import { useUsage } from "./hooks/useUsage";
import { downloadMarkdown, copyToClipboard, generateBrief, parseImprovements, parseBudget } from "./services/analyzerService";
import { createShare } from "./services/shareService";
import { exportToPdf } from "./utils/pdfExport";
import { UpgradeModal } from "./components/UpgradeModal";
import { checkShareLimit, incrementShareCount } from "./utils/rateLimiter";
import { themes } from "./theme";
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // Single dark mode — no theme toggle
  const t = themes.dark;
  const isDark = true;
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const [mode, setMode] = useState<SidebarMode>("single");
  const [compareKey, setCompareKey] = useState(0);

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
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);
  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const { status, statusMessage, result, error, analyze, download, copy, reset } = useVideoAnalyzer();
  const { entries: historyEntries, addEntry, deleteEntry, clearAll } = useHistory();
  const { addItem: addSwipeItem } = useSwipeFile();
  const [previousResult, setPreviousResult] = useState<HistoryEntry | null>(null);
  const { isPro, canAnalyze, increment, FREE_LIMIT } = useUsage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAnalyzing = status === "uploading" || status === "processing";

  // Set analysisCompletedAt when status transitions to complete
  useEffect(() => {
    if (status === "complete") setAnalysisCompletedAt(new Date());
  }, [status]);

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

  // Auto-analyze when file is selected
  useEffect(() => {
    if (file && status === "idle" && canAnalyze) {
      handleAnalyze();
    }
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unified display result — history load takes precedence over live result
  const activeResult = loadedEntry
    ? {
        markdown: loadedEntry.markdown,
        scores: loadedEntry.scores,
        improvements: parseImprovements(loadedEntry.markdown),
        budget: parseBudget(loadedEntry.markdown),
        fileName: loadedEntry.fileName,
        timestamp: new Date(loadedEntry.timestamp),
      }
    : result;

  const effectiveStatus = loadedEntry ? "complete" : status;
  const showRightPanel = mode === "single" && effectiveStatus === "complete" && activeResult !== null;

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
        improvements: parseImprovements(loadedEntry.markdown),
        budget: parseBudget(loadedEntry.markdown),
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

  const handleAddToSwipeFile = () => {
    if (activeResult) {
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
        onModeChange={(m) => {
          // Reset compare panels when entering Compare mode
          if (m === "compare") setCompareKey((k) => k + 1);
          // Clear single-analyzer error state so it doesn't persist across mode switches
          if (mode === "single" && (status === "error" || error)) {
            reset();
            setFile(null);
          }
          setMode(m);
        }}
        isPro={isPro}
        onNewAnalysis={handleReset}
        onHistoryOpen={() => setHistoryOpen(true)}
        userName="User"
        userPlan={isPro ? "Pro Plan" : "Free"}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area (right of sidebar) */}
      <div className="main-content flex flex-col min-w-0">
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
        <div className="flex flex-1 overflow-hidden max-lg:flex-col">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />

            {/* Mode content */}
            <div className="relative px-4 py-6 md:px-8 min-h-full flex flex-col">
              {/* ── SINGLE / ANALYZER MODE ── */}
              {mode === "single" && (
                <AnalyzerView
                  file={file}
                  status={loadedEntry ? "complete" : status}
                  statusMessage={statusMessage || STATUS_COPY[status]}
                  result={activeResult}
                  error={error}
                  onFileSelect={(f) => {
                    if (!f) { handleReset(); return; }
                    setFile(f);
                    reset();
                    // Auto-analyze after setting file
                  }}
                  onUrlSubmit={async (u) => {
                    setUrlInput(u);
                    await importFromUrl(u);
                  }}
                  onAnalyze={handleAnalyze}
                  onReset={handleReset}
                  onCopy={handleCopy}
                  onExportPdf={handleExportPdf}
                  onShare={handleShareLink}
                  onGenerateBrief={handleGenerateBrief}
                  onAddToSwipeFile={handleAddToSwipeFile}
                  copied={copied}
                  shareLoading={shareLoading}
                  historyEntries={historyEntries}
                  onHistoryEntryClick={(entry) => setLoadedEntry(entry)}
                />
              )}

              {/* ── NON-ANALYZER MODES ── Keep exactly as-is with existing props */}
              {mode === "compare" && <CompareView key={compareKey} isDark={isDark} apiKey={API_KEY} />}
              {mode === "batch" && <BatchView isDark={isDark} apiKey={API_KEY} addHistoryEntry={addEntry} t={t} canAnalyze={canAnalyze} isPro={isPro} increment={increment} FREE_LIMIT={FREE_LIMIT} />}
              {mode === "preflight" && <PreFlightView isDark={isDark} apiKey={API_KEY} />}
              {mode === "swipe" && <SwipeFileView isDark={isDark} />}
            </div>
          </div>

          {/* Right panel (results only) */}
          <div className={`shrink-0 bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/5 ${showRightPanel ? 'w-[340px] max-lg:w-full opacity-100' : 'w-0 max-lg:w-0 opacity-0'}`}>
            {showRightPanel && activeResult?.scores && (
              <div ref={scorecardRef}>
                <ScoreCard
                  scores={activeResult.scores}
                  improvements={activeResult.improvements}
                  budget={activeResult.budget}
                  fileName={activeResult.fileName}
                  analysisTime={analysisCompletedAt ?? undefined}
                  modelName="Gemini 2.5 Flash"
                  onGenerateBrief={handleGenerateBrief}
                  onAddToSwipeFile={handleAddToSwipeFile}
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
