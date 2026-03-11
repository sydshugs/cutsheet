import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ComparePanel } from "./ComparePanel";
import { compareAnalyses } from "../services/analyzerService";
import { themes, type ThemeTokens } from "../theme";
import type { AnalysisResult } from "../services/analyzerService";

interface CompareViewProps {
  isDark: boolean;
  apiKey: string;
}

function CompareOutput({ markdown, t }: { markdown: string; t: ThemeTokens }) {
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", color: t.markdownText, fontSize: "14px", lineHeight: 1.7 }}>
      <style>{`
        .compare-output h2 {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          margin: 24px 0 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(99,102,241,0.2);
        }
        .compare-output p { margin: 8px 0; color: ${t.pColor}; }
        .compare-output strong { color: ${t.strongColor}; font-weight: 600; }
        .compare-output ul { padding-left: 18px; margin: 8px 0; }
        .compare-output li { margin: 6px 0; color: ${t.liColor}; }
        .compare-output hr { border: none; border-top: 1px solid ${t.hrColor}; margin: 16px 0; }
      `}</style>
      <div className="compare-output">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}

export function CompareView({ isDark, apiKey }: CompareViewProps) {
  const t = themes[isDark ? "dark" : "light"];
  const [resultA, setResultA] = useState<AnalysisResult | null>(null);
  const [resultB, setResultB] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const compareKeyRef = useRef<string | null>(null);

  // Determine winner by overall score
  const winnerA: boolean | null = (() => {
    if (!resultA?.scores || !resultB?.scores) return null;
    if (resultA.scores.overall > resultB.scores.overall) return true;
    if (resultA.scores.overall < resultB.scores.overall) return false;
    return null; // tie
  })();

  // Auto-run comparison when both analyses are done
  useEffect(() => {
    if (resultA && resultB) {
      const key = `${resultA.timestamp.toISOString()}|${resultB.timestamp.toISOString()}`;
      if (compareKeyRef.current !== key) {
        compareKeyRef.current = key;
        runComparison(resultA.markdown, resultB.markdown);
      }
    }
    if (!resultA || !resultB) {
      setComparison(null);
      setCompareError(null);
      compareKeyRef.current = null;
    }
  }, [resultA, resultB]);

  const runComparison = async (mdA: string, mdB: string) => {
    setComparing(true);
    setCompareError(null);
    setComparison(null);
    try {
      const result = await compareAnalyses(mdA, mdB, apiKey);
      setComparison(result);
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setComparing(false);
    }
  };

  const bothDone = !!(resultA && resultB);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Two panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <ComparePanel
          label="AD A"
          isDark={isDark}
          apiKey={apiKey}
          isWinner={winnerA}
          onResult={setResultA}
        />
        {/* Panel B — no right border needed */}
        <div style={{ borderLeft: `1px solid ${t.border}` }}>
          <ComparePanel
            label="AD B"
            isDark={isDark}
            apiKey={apiKey}
            isWinner={winnerA === null ? null : !winnerA}
            onResult={setResultB}
          />
        </div>
      </div>

      {/* Comparison section */}
      {(bothDone || comparing || compareError) && (
        <div
          style={{
            borderTop: `1px solid ${t.border}`,
            padding: "32px 24px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: t.textFaint,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                03 / Head-to-Head Comparison
              </div>
              {comparing && (
                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "rgba(99,102,241,0.7)",
                    letterSpacing: "0.06em",
                  }}
                >
                  Generating...
                </span>
              )}
            </div>
            {comparison && (
              <button
                onClick={() => runComparison(resultA!.markdown, resultB!.markdown)}
                style={{
                  padding: "5px 10px",
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: "4px",
                  color: t.textMuted,
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                }}
              >
                Re-run
              </button>
            )}
          </div>

          {/* Comparing spinner */}
          {comparing && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "24px 0",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(99,102,241,0.2)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: t.spinnerText,
                  letterSpacing: "0.06em",
                }}
              >
                Gemini is comparing both creatives...
              </span>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Error */}
          {compareError && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(255,68,68,0.08)",
                border: "1px solid rgba(255,68,68,0.2)",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                color: "#FF6B6B",
                marginBottom: "12px",
              }}
            >
              {compareError}
            </div>
          )}

          {/* Comparison output */}
          {comparison && (
            <div style={{ maxWidth: "860px" }}>
              <CompareOutput markdown={comparison} t={t} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
