// src/components/PolicyCheckPanel.tsx — Policy Check results panel (reusable)

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp, Copy, Check, AlertTriangle, Wrench, FileText } from "lucide-react";
import type { PolicyCheckResult, PolicyCategory } from "../lib/policyCheckService";
import { formatPolicyReportAsText } from "../lib/policyCheckService";

// ─── VERDICT CONFIG ───────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  good: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    color: "#10b981",
    icon: ShieldCheck,
    label: "Good to launch",
  },
  fix: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    color: "#f59e0b",
    icon: ShieldAlert,
    label: "Fix before launching",
  },
  high_risk: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    color: "#ef4444",
    icon: ShieldX,
    label: "High rejection risk",
  },
} as const;

const STATUS_CONFIG = {
  clear: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "✅ Clear" },
  review: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "⚠️ Review" },
  rejection: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "🚨 Likely Rejection" },
} as const;

const RISK_COLOR = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
} as const;

// ─── CATEGORY CARD ────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: PolicyCategory }) {
  const [expanded, setExpanded] = useState(category.status !== "clear");
  const statusCfg = STATUS_CONFIG[category.status];

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${category.status === "rejection" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
        background: category.status === "rejection" ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)",
        overflow: "hidden",
        transition: "all 150ms",
      }}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,
            background: statusCfg.bg, color: statusCfg.color, flexShrink: 0,
          }}
        >
          {statusCfg.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5", flex: 1 }}>
          {category.name}
        </span>
        {category.status !== "clear" && (
          <span
            style={{
              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
              background: `${RISK_COLOR[category.riskLevel]}22`,
              color: RISK_COLOR[category.riskLevel], flexShrink: 0, textTransform: "uppercase",
            }}
          >
            {category.riskLevel} risk
          </span>
        )}
        {expanded
          ? <ChevronUp size={14} color="#52525b" style={{ flexShrink: 0 }} />
          : <ChevronDown size={14} color="#52525b" style={{ flexShrink: 0 }} />
        }
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <p style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 10px", lineHeight: 1.5 }}>
            {category.finding}
          </p>
          {category.status !== "clear" && (
            <div
              style={{
                padding: "10px 12px", borderRadius: 8,
                background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <Wrench size={13} color="#818cf8" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "#818cf8", margin: 0, lineHeight: 1.5 }}>
                  {category.fix}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CATEGORY GROUP ───────────────────────────────────────────────────────────

function CategoryGroup({
  title, categories,
}: { title: string; categories: PolicyCategory[] }) {
  const clear = categories.filter((c) => c.status === "clear");
  const flagged = categories.filter((c) => c.status !== "clear");
  const [showClear, setShowClear] = useState(false);

  if (categories.length === 0) return null;

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#52525b", margin: "0 0 8px" }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {flagged.map((c) => <CategoryCard key={c.id} category={c} />)}
        {clear.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowClear((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#52525b",
                background: "none", border: "none", cursor: "pointer", padding: "4px 0",
                textDecoration: "underline", textUnderlineOffset: 2,
              }}
            >
              {showClear ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showClear ? "Hide" : "Show"} {clear.length} clear {clear.length === 1 ? "item" : "items"}
            </button>
            {showClear && clear.map((c) => <CategoryCard key={c.id} category={c} />)}
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface PolicyCheckPanelProps {
  result: PolicyCheckResult;
  onClose?: () => void;
}

export function PolicyCheckPanel({ result, onClose }: PolicyCheckPanelProps) {
  const [activeTab, setActiveTab] = useState<"meta" | "tiktok">(
    result.platform === "tiktok" ? "tiktok" : "meta"
  );
  const [copied, setCopied] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const verdictCfg = VERDICT_CONFIG[result.verdict];
  const VerdictIcon = verdictCfg.icon;

  const showTabs = result.platform === "both";
  const activeCategories = activeTab === "meta" ? result.metaCategories : result.tiktokCategories;
  const flaggedCount = activeCategories.filter((c) => c.status !== "clear").length;

  const handleCopyReport = async () => {
    await navigator.clipboard.writeText(formatPolicyReportAsText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Verdict banner */}
      <div
        style={{
          padding: "14px 16px", borderRadius: 12,
          background: verdictCfg.bg, border: `1px solid ${verdictCfg.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <VerdictIcon size={22} color={verdictCfg.color} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: verdictCfg.color, margin: "0 0 2px" }}>
            {verdictCfg.label}
          </p>
          {flaggedCount > 0 && (
            <p style={{ fontSize: 12, color: "#71717a", margin: 0 }}>
              {flaggedCount} item{flaggedCount !== 1 ? "s" : ""} need{flaggedCount === 1 ? "s" : ""} attention
              {showTabs ? ` on ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` : ""}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleCopyReport}
            title="Copy report"
            style={{
              display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 10px",
              borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#a1a1aa", fontSize: 12, cursor: "pointer",
            }}
          >
            {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy Report"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 32, width: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", color: "#52525b", fontSize: 18,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Top 3 fixes */}
      {result.topFixes.length > 0 && result.verdict !== "good" && (
        <div
          style={{
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <AlertTriangle size={14} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>Top 3 Fixes</span>
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {result.topFixes.map((fix, i) => (
              <li key={i} style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>
                {fix}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Platform tabs */}
      {showTabs && (
        <div style={{ display: "flex", gap: 4 }}>
          {(["meta", "tiktok"] as const).map((p) => {
            const cats = p === "meta" ? result.metaCategories : result.tiktokCategories;
            const flags = cats.filter((c) => c.status !== "clear").length;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActiveTab(p)}
                style={{
                  height: 32, padding: "0 14px", borderRadius: 9999, fontSize: 13,
                  cursor: "pointer", transition: "all 150ms",
                  background: activeTab === p ? "#6366f1" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${activeTab === p ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                  color: activeTab === p ? "white" : "#71717a",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
                {flags > 0 && (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 9999,
                      background: activeTab === p ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.2)",
                      color: activeTab === p ? "white" : "#ef4444",
                    }}
                  >
                    {flags}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Category cards */}
      <CategoryGroup
        title={showTabs ? `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Policy Categories` : "Policy Categories"}
        categories={activeCategories}
      />

      {/* Reviewer notes (collapsed by default) */}
      {result.reviewerNotes && (
        <div
          style={{
            borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={() => setNotesExpanded((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
              background: "none", border: "none", cursor: "pointer", textAlign: "left",
            }}
          >
            <FileText size={14} color="#52525b" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", flex: 1 }}>Reviewer Notes</span>
            <span style={{ fontSize: 11, color: "#52525b" }}>For appeal if flagged</span>
            {notesExpanded
              ? <ChevronUp size={14} color="#52525b" />
              : <ChevronDown size={14} color="#52525b" />
            }
          </button>
          {notesExpanded && (
            <div style={{ padding: "0 14px 14px" }}>
              <p style={{ fontSize: 13, color: "#71717a", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {result.reviewerNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
