// App.tsx — Full wired app
// src/App.tsx

import { useState, useRef, Fragment, Children, type ReactNode } from "react";
import html2canvas from "html2canvas";
import { VideoDropzone } from "./components/VideoDropzone";
import { ScoreCard } from "./components/ScoreCard";
import { useVideoAnalyzer } from "./hooks/useVideoAnalyzer";
import ReactMarkdown from "react-markdown";

// ─── GOOGLE FONTS ─────────────────────────────────────────────────────────────
// Add to your index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

// ─── THEME ────────────────────────────────────────────────────────────────────
type Theme = "dark" | "light";
const THEME_KEY = "cutsheet-theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "dark";
}

const themes = {
  dark: {
    bg: "#0A0A0A",
    navBg: "rgba(10,10,10,0.9)",
    text: "#fff",
    textPrimary: "rgba(255,255,255,0.85)",
    textSecondary: "rgba(255,255,255,0.7)",
    textMuted: "rgba(255,255,255,0.35)",
    textFaint: "rgba(255,255,255,0.3)",
    textSubtle: "rgba(255,255,255,0.25)",
    surface: "rgba(255,255,255,0.06)",
    surfaceDim: "rgba(255,255,255,0.02)",
    surfaceMid: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.06)",
    borderMid: "rgba(255,255,255,0.1)",
    borderStrong: "rgba(255,255,255,0.12)",
    scorecardBg: "#0A0A0A",
    spinnerText: "rgba(255,255,255,0.6)",
    spinnerSub: "rgba(255,255,255,0.25)",
    h3Color: "rgba(255,255,255,0.5)",
    pColor: "rgba(255,255,255,0.75)",
    strongColor: "rgba(255,255,255,0.95)",
    liColor: "rgba(255,255,255,0.7)",
    codeColor: "rgba(255,255,255,0.8)",
    codeBg: "rgba(255,255,255,0.06)",
    hrColor: "rgba(255,255,255,0.06)",
    blockquoteColor: "rgba(255,255,255,0.5)",
    markdownText: "rgba(255,255,255,0.8)",
  },
  light: {
    bg: "#F5F5F3",
    navBg: "rgba(245,245,243,0.9)",
    text: "#0A0A0A",
    textPrimary: "rgba(10,10,10,0.85)",
    textSecondary: "rgba(10,10,10,0.7)",
    textMuted: "rgba(0,0,0,0.35)",
    textFaint: "rgba(10,10,10,0.3)",
    textSubtle: "rgba(10,10,10,0.25)",
    surface: "#FFFFFF",
    surfaceDim: "rgba(0,0,0,0.02)",
    surfaceMid: "rgba(0,0,0,0.08)",
    border: "rgba(0,0,0,0.08)",
    borderMid: "rgba(0,0,0,0.1)",
    borderStrong: "rgba(0,0,0,0.12)",
    scorecardBg: "#FFFFFF",
    spinnerText: "rgba(10,10,10,0.6)",
    spinnerSub: "rgba(10,10,10,0.25)",
    h3Color: "rgba(10,10,10,0.5)",
    pColor: "rgba(10,10,10,0.75)",
    strongColor: "rgba(10,10,10,0.95)",
    liColor: "rgba(10,10,10,0.7)",
    codeColor: "rgba(10,10,10,0.8)",
    codeBg: "rgba(0,0,0,0.06)",
    hrColor: "rgba(0,0,0,0.06)",
    blockquoteColor: "rgba(10,10,10,0.5)",
    markdownText: "rgba(10,10,10,0.8)",
  },
} as const;

type ThemeTokens = typeof themes.dark;

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
      <div style={{ position: "relative", width: "64px", height: "64px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1.5px solid rgba(255,68,68,0.3)",
            borderRadius: "50%",
            animation: "spin 2s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "8px",
            border: "1.5px solid rgba(255,68,68,0.6)",
            borderRadius: "50%",
            animation: "spin 1.4s linear infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "16px",
            background: "rgba(255,68,68,0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "8px", height: "8px", background: "#FF4444", borderRadius: "50%" }} />
        </div>
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
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

  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const { status, statusMessage, result, error, analyze, download, copy, reset } = useVideoAnalyzer();

  const isAnalyzing = status === "uploading" || status === "processing";

  const handleAnalyze = async () => {
    if (!file || isAnalyzing) return;
    await analyze(file, API_KEY);
  };

  const handleCopy = async () => {
    await copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    reset();
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
    if (!scorecardRef.current || !result) return;
    try {
      const canvas = await html2canvas(scorecardRef.current, {
        backgroundColor: t.scorecardBg,
        scale: 2,
        useCORS: true,
      });
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = (result.fileName.replace(/\.[^/.]+$/, "") || "scorecard") + "_cutsheet.png";
      a.click();
    } catch {
      // fallback silent
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
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          {result && (
            <>
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
                onClick={download}
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
            </>
          )}
        </div>
      </nav>

      {/* Main layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: result ? "1fr 1fr" : "1fr",
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
            borderRight: result ? `1px solid ${t.border}` : "none",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: result ? "100%" : "560px",
            margin: result ? "0" : "0 auto",
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
              disabled={isAnalyzing || !file}
              style={{
                padding: "14px",
                background: isAnalyzing ? "rgba(255,68,68,0.3)" : "#FF4444",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: isAnalyzing ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {isAnalyzing ? "Analyzing..." : "Run AI Analysis →"}
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
          {result?.scores && (
            <div
              ref={scorecardRef}
              style={{
                background: t.scorecardBg,
                padding: "16px",
                borderRadius: "12px",
              }}
            >
              <ScoreCard
                scores={result.scores}
                fileName={result.fileName}
                onShare={handleCopy}
                isDark={isDark}
              />
            </div>
          )}

          {/* New analysis button */}
          {result && (
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

        {/* RIGHT — Analysis output */}
        {(isAnalyzing || result) && (
          <div
            style={{
              padding: "32px 24px",
              overflowY: "auto",
              maxHeight: "calc(100vh - 57px)",
              position: "sticky",
              top: "57px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontFamily: "'JetBrains Mono', monospace",
                color: t.textFaint,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}
            >
              02 / Creative Analysis
            </div>

            {isAnalyzing && <AnalyzingState message={statusMessage || STATUS_COPY[status]} t={t} />}
            {result && <AnalysisOutput markdown={result.markdown} onSeekTo={handleSeekTo} t={t} />}
          </div>
        )}
      </div>
    </div>
  );
}
