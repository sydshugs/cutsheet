// SharePage.tsx
// Public share page for analysis results

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ScoreCard } from "../components/ScoreCard";
import { getAnalysisBySlug, type Analysis } from "../services/supabaseClient";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

export function SharePage() {
  const { slug } = useParams<{ slug: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      if (!slug) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      const { analysis: data, error: fetchError } = await getAnalysisBySlug(slug);

      if (fetchError || !data) {
        setError("Analysis not found");
        setLoading(false);
        return;
      }

      setAnalysis(data);
      setLoading(false);
    }

    loadAnalysis();
  }, [slug]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#09090b",
          color: "#fff",
          fontFamily: "var(--sans)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "13px",
            color: "#71717a",
          }}
        >
          Loading analysis...
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#09090b",
          color: "#fff",
          fontFamily: "var(--sans)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "14px",
            color: "#6366F1",
          }}
        >
          {error || "Analysis not found"}
        </div>
        <Link
          to="/"
          style={{
            padding: "10px 20px",
            background: "#6366F1",
            border: "none",
            borderRadius: "6px",
            color: "#fff",
            fontFamily: "var(--mono)",
            fontSize: "12px",
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}
        >
          Go to Cutsheet
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
          minHeight: "100vh",
          background: "#09090b",
          color: "#fff",
          fontFamily: "var(--sans)",
        }}
    >
      {/* Header */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "#6366F1",
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
                x1="9.5"
                y1="0.5"
                x2="13.5"
                y2="4.5"
                stroke="#6366F1"
                strokeWidth="1"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "0.04em",
              color: "#fff",
            }}
          >
            CUTSHEET
          </span>
        </Link>

        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--mono)",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Shared Analysis
        </div>
      </nav>

      {/* Content */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        {/* Score Card */}
        <div style={{ marginBottom: "40px" }}>
          <ScoreCard
            scores={analysis.scores}
            fileName={analysis.file_name}
            isDark={true}
          />
        </div>

        {/* Analysis Markdown */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "32px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--sans)",
              color: "rgba(255,255,255,0.8)",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            <style>{`
              .share-analysis h2 {
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
              .share-analysis h3, .share-analysis h4 {
                font-family: var(--mono);
                font-size: 11px;
                color: rgba(255,255,255,0.5);
                letter-spacing: 0.06em;
                text-transform: uppercase;
                margin: 16px 0 6px;
              }
              .share-analysis p {
                margin: 8px 0;
                color: rgba(255,255,255,0.75);
              }
              .share-analysis strong {
                color: rgba(255,255,255,0.95);
                font-weight: 600;
              }
              .share-analysis ul, .share-analysis ol {
                padding-left: 18px;
                margin: 8px 0;
              }
              .share-analysis li {
                margin: 4px 0;
                color: rgba(255,255,255,0.7);
              }
              .share-analysis code {
                font-family: var(--mono);
                font-size: 12px;
                background: rgba(255,255,255,0.06);
                padding: 2px 6px;
                border-radius: 3px;
                color: rgba(255,255,255,0.8);
              }
              .share-analysis hr {
                border: none;
                border-top: 1px solid rgba(255,255,255,0.06);
                margin: 20px 0;
              }
              .share-analysis blockquote {
                border-left: 2px solid #6366F1;
                padding-left: 12px;
                margin: 12px 0;
                color: rgba(255,255,255,0.5);
                font-style: italic;
              }
            `}</style>
            <div className="share-analysis">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{analysis.markdown}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "60px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              marginBottom: "12px",
            }}
          >
            Analyzed with
          </div>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              padding: "8px 16px",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.12)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.08)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)";
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                background: "#6366F1",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <polygon
                  points="0,0 10,0 14,4 14,14 0,14"
                  fill="white"
                  opacity="0.95"
                />
                <line
                  x1="9.5"
                  y1="0.5"
                  x2="13.5"
                  y2="4.5"
                  stroke="#6366F1"
                  strokeWidth="1"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.04em",
                color: "#6366F1",
              }}
            >
              CUTSHEET
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
