// ReportAnalysis.tsx — Page 2+ of PDF report (full analysis + score card)
import ReactMarkdown from "react-markdown";
import { ScoreCard } from "./ScoreCard";
import type { AnalysisResult } from "../services/analyzerService";

/** Preprocess markdown to fix line-break issues in hashtag section and platform lines */
function fixMarkdownLineBreaks(md: string): string {
  // In the HASHTAGS section, ensure each platform line is a separate paragraph
  // by replacing single newlines between PLATFORM: lines with double newlines
  return md.replace(
    /(##\s*(?:#️⃣\s*)?HASHTAGS\s*\n)([\s\S]*?)(?=\n---|\n##|$)/gi,
    (_match, header, body) => {
      const fixed = body.replace(/\n(?=\s*(TIKTOK|META|INSTAGRAM|YOUTUBE|X|TWITTER):)/gi, "\n\n");
      return header + fixed;
    }
  );
}

export function ReportAnalysis({ result }: { result: AnalysisResult }) {
  const processedMarkdown = fixMarkdownLineBreaks(result.markdown);

  return (
    <div
      style={{
        width: "794px",
        background: "#0A0A0A",
        color: "rgba(255,255,255,0.8)",
        fontFamily: "var(--sans)",
        padding: "40px 56px 80px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .report-analysis-output h2 {
          font-family: var(--mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6366F1;
          margin: 28px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(99,102,241,0.2);
        }
        .report-analysis-output h3, .report-analysis-output h4 {
          font-family: var(--mono);
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 16px 0 6px;
        }
        .report-analysis-output p {
          margin: 8px 0;
          color: rgba(255,255,255,0.75);
        }
        .report-analysis-output strong {
          color: rgba(255,255,255,0.95);
          font-weight: 600;
        }
        .report-analysis-output ul, .report-analysis-output ol {
          padding-left: 18px;
          margin: 8px 0;
        }
        .report-analysis-output li {
          margin: 4px 0;
          color: rgba(255,255,255,0.7);
        }
        .report-analysis-output code {
          font-family: var(--mono);
          font-size: 12px;
          background: rgba(255,255,255,0.06);
          padding: 2px 6px;
          border-radius: 3px;
          color: rgba(255,255,255,0.8);
        }
        .report-analysis-output hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin: 20px 0;
        }
        .report-analysis-output blockquote {
          border-left: 2px solid #6366F1;
          padding-left: 12px;
          margin: 12px 0;
          color: rgba(255,255,255,0.5);
          font-style: italic;
        }
      `}</style>

      {/* Score card — all 5 bars, no share button */}
      {result.scores && (
        <div style={{ marginBottom: "32px" }}>
          <ScoreCard
            scores={result.scores}
            fileName={result.fileName}
            isDark={true}
          />
        </div>
      )}

      {/* Full analysis markdown */}
      <div
        className="report-analysis-output"
        style={{
          fontSize: "14px",
          lineHeight: 1.7,
        }}
      >
        <ReactMarkdown>{processedMarkdown}</ReactMarkdown>
      </div>
    </div>
  );
}
