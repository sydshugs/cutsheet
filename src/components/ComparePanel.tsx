import { useState, useRef, useEffect } from "react";
import { VideoDropzone } from "./VideoDropzone";
import { ScoreCard } from "./ScoreCard";
import { useVideoAnalyzer } from "../hooks/useVideoAnalyzer";
import { themes, type ThemeTokens } from "../theme";
import type { AnalysisResult } from "../services/analyzerService";

interface ComparePanelProps {
  label: string;
  isDark: boolean;
  apiKey: string;
  isWinner: boolean | null;
  onResult: (result: AnalysisResult | null) => void;
}

const STATUS_COPY: Record<string, string> = {
  uploading: "Reading video...",
  processing: "Analyzing creative...",
  error: "Something went wrong",
  idle: "",
  complete: "",
};

function MiniSpinner({ t }: { t: ThemeTokens }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 0",
        gap: "14px",
      }}
    >
      <div style={{ position: "relative", width: "40px", height: "40px" }}>
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
            inset: "6px",
            border: "1.5px solid rgba(255,68,68,0.6)",
            borderRadius: "50%",
            animation: "spin 1.4s linear infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "12px",
            background: "rgba(255,68,68,0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "5px", height: "5px", background: "#FF4444", borderRadius: "50%" }} />
        </div>
      </div>
      <div
        style={{
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', monospace",
          color: t.spinnerText,
          letterSpacing: "0.06em",
        }}
      >
        Analyzing...
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export function ComparePanel({ label, isDark, apiKey, isWinner, onResult }: ComparePanelProps) {
  const t = themes[isDark ? "dark" : "light"];
  const [file, setFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { status, result, error, analyze, reset } = useVideoAnalyzer();
  const isAnalyzing = status === "uploading" || status === "processing";

  useEffect(() => {
    onResult(result);
  }, [result]);

  const handleAnalyze = async () => {
    if (!file || isAnalyzing) return;
    await analyze(file, apiKey);
  };

  const handleReset = () => {
    setFile(null);
    reset();
    onResult(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "24px",
        borderRight: `1px solid ${t.border}`,
      }}
    >
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            color: t.textFaint,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        {status === "complete" && (
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#00D4AA",
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Upload zone */}
      <VideoDropzone
        file={file}
        onFileSelect={(f) => {
          if (!f) { handleReset(); return; }
          setFile(f);
          reset();
          onResult(null);
        }}
        disabled={isAnalyzing}
        videoRef={videoRef}
        isDark={isDark}
      />

      {/* Analyze button */}
      {file && status !== "complete" && !isAnalyzing && (
        <button
          onClick={handleAnalyze}
          style={{
            padding: "12px",
            background: "#FF4444",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Run Analysis →
        </button>
      )}

      {/* Analyzing */}
      {isAnalyzing && <MiniSpinner t={t} />}

      {/* Error */}
      {error && (
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
          {STATUS_COPY.error}: {error}
        </div>
      )}

      {/* Scorecard */}
      {result?.scores && (
        <div style={{ background: t.scorecardBg, borderRadius: "10px", padding: "12px" }}>
          <ScoreCard
            scores={result.scores}
            fileName={result.fileName}
            isDark={isDark}
            winner={isWinner === true}
          />
        </div>
      )}

      {/* Reset */}
      {status === "complete" && (
        <button
          onClick={handleReset}
          style={{
            padding: "8px",
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
          ← New Ad
        </button>
      )}
    </div>
  );
}
