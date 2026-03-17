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
import { useThumbnail } from "./hooks/useThumbnail";
import { downloadMarkdown, copyToClipboard, generateBrief, parseImprovements, parseBudget, parseHashtags } from "./services/analyzerService";
import { generateBriefWithClaude, generateCTARewrites } from "./services/claudeService";
import { createShare } from "./services/shareService";
import { exportToPdf } from "./utils/pdfExport";
import { UpgradeModal } from "./components/UpgradeModal";
import { checkShareLimit, incrementShareCount } from "./utils/rateLimiter";
import { themes } from "./theme";
import { Menu } from "lucide-react";

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
  const [ctaRewrites, setCtaRewrites] = useState<string[] | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
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
  const thumbnailDataUrl = useThumbnail(file);
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
          thumbnailDataUrl: thumbnailDataUrl ?? undefined,
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
  // For live results, attach the current thumbnail from the hook
  const liveResult = result
    ? { ...result, thumbnailDataUrl: thumbnailDataUrl ?? result.thumbnailDataUrl }
    : result;

  const activeResult = loadedEntry
    ? {
        markdown: loadedEntry.markdown,
        scores: loadedEntry.scores,
        improvements: parseImprovements(loadedEntry.markdown),
        budget: parseBudget(loadedEntry.markdown),
        hashtags: parseHashtags(loadedEntry.markdown),
        thumbnailDataUrl: loadedEntry.thumbnailDataUrl,
        fileName: loadedEntry.fileName,
        timestamp: new Date(loadedEntry.timestamp),
      }
    : liveResult;

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
    setCtaRewrites(null);
    setCtaLoading(false);
    setRightTab("analysis");
  };

  const handleGenerateBrief = async () => {
    if (!activeResult || briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const result = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName);
      setBrief(result);
      setRightTab("brief");
    } catch {
      // Fallback to Gemini
      try {
        const result = await generateBrief(activeResult.markdown, API_KEY);
        setBrief(result);
        setRightTab("brief");
      } catch (err) {
        setBriefError(err instanceof Error ? err.message : "Failed to generate brief.");
      }
    } finally {
      setBriefLoading(false);
    }
  };

  const handleCTARewrite = async () => {
    if (!activeResult || ctaLoading) return;
    setCtaLoading(true);
    try {
      const ctaSection = activeResult.markdown.match(/CTA[\s\S]*?(?=\n##|\n---)/i)?.[0] ?? "";
      const rewrites = await generateCTARewrites(ctaSection, activeResult.fileName);
      setCtaRewrites(rewrites);
    } catch { /* silent fail */ }
    finally { setCtaLoading(false); }
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
        {/* Mobile top bar — hamburger only */}
        <div className="lg:hidden flex items-center px-4 py-3 border-b border-white/5">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(prev => !prev)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="ml-2 text-sm font-semibold text-white tracking-tight" style={{ fontFamily: "'TBJ Interval', sans-serif" }}>
            cutsheet
          </span>
        </div>

        {/* Content + Right panel wrapper */}
        <div className="flex flex-1 overflow-hidden max-lg:flex-col">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto relative">
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
                  thumbnailDataUrl={activeResult?.thumbnailDataUrl}
                  onFileSelect={(f) => {
                    if (!f) { handleReset(); return; }
                    setFile(f);
                    reset();
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
                  onModeChange={(m) => {
                    if (m === "compare") setCompareKey((k) => k + 1);
                    setMode(m);
                  }}
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
            {showRightPanel && activeResult?.scores && rightTab === "analysis" && (
              <div ref={scorecardRef}>
                <ScoreCard
                  scores={activeResult.scores}
                  improvements={activeResult.improvements}
                  budget={activeResult.budget}
                  hashtags={activeResult.hashtags}
                  fileName={activeResult.fileName}
                  analysisTime={analysisCompletedAt ?? undefined}
                  modelName="Gemini + Claude"
                  onGenerateBrief={handleGenerateBrief}
                  onAddToSwipeFile={handleAddToSwipeFile}
                  onCTARewrite={handleCTARewrite}
                  ctaRewrites={ctaRewrites}
                  ctaLoading={ctaLoading}
                  onShare={handleCopy}
                  isDark={isDark}
                />
              </div>
            )}

            {/* Brief display panel */}
            {showRightPanel && rightTab === "brief" && (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRightTab("analysis")}
                    className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Back to Scorecard
                  </button>
                  <span className="text-xs text-zinc-600 font-mono">Claude Sonnet</span>
                </div>

                {/* Loading state */}
                {briefLoading && !brief && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500">Generating creative brief...</span>
                  </div>
                )}

                {/* Error state */}
                {briefError && (
                  <div className="px-5 py-4">
                    <p className="text-xs text-red-400">{briefError}</p>
                  </div>
                )}

                {/* Brief content */}
                {brief && (
                  <>
                    <div className="px-5 pt-5 pb-2 flex-1 overflow-y-auto">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
                        Creative Brief
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {brief.split("\n").map((line, i) => {
                          const trimmed = line.trim();
                          if (!trimmed) return null;
                          // Markdown heading
                          if (trimmed.startsWith("## ")) return (
                            <p key={i} className="text-xs font-semibold text-white mt-4 mb-1">
                              {trimmed.replace(/^##\s*/, "")}
                            </p>
                          );
                          // Bold label line: **Label:** Value
                          const boldMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                          if (boldMatch) return (
                            <div key={i} className="mb-3">
                              <p className="text-xs text-zinc-500 font-medium">{boldMatch[1]}</p>
                              {boldMatch[2] && <p className="text-xs text-zinc-300 leading-relaxed mt-0.5">{boldMatch[2]}</p>}
                            </div>
                          );
                          // Bullet point
                          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return (
                            <div key={i} className="flex gap-2 items-start ml-1 mb-1">
                              <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                              <span className="text-xs text-zinc-400 leading-relaxed">{trimmed.replace(/^[-*]\s*/, "")}</span>
                            </div>
                          );
                          // Separator
                          if (trimmed === "---") return <div key={i} className="border-t border-white/5 my-3" />;
                          // Regular text
                          return (
                            <p key={i} className="text-xs text-zinc-300 leading-relaxed mb-1">{trimmed}</p>
                          );
                        })}
                      </div>
                    </div>

                    {/* Copy Brief button */}
                    <div className="p-5 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleBriefCopy}
                        className="w-full py-2 px-3 bg-transparent border border-white/10 rounded-lg text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-150 cursor-pointer"
                      >
                        {briefCopied ? "Copied!" : "Copy Brief"}
                      </button>
                    </div>
                  </>
                )}
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
