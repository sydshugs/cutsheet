// src/components/PolicyCheckPanel.tsx — Policy Check results panel (reusable)

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp, Copy, Check, AlertTriangle, Wrench, FileText } from "lucide-react";
import type { PolicyCheckResult, PolicyCategory } from "../lib/policyCheckService";
import { formatPolicyReportAsText } from "../lib/policyCheckService";

// ─── VERDICT CONFIG ───────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  good: {
    bg: "var(--score-excellent-bg)",
    border: "var(--score-excellent-border)",
    color: "var(--success)",
    icon: ShieldCheck,
    label: "Good to launch",
  },
  fix: {
    bg: "var(--score-average-bg)",
    border: "var(--score-average-border)",
    color: "var(--warn)",
    icon: ShieldAlert,
    label: "Fix before launching",
  },
  high_risk: {
    bg: "var(--score-weak-bg)",
    border: "var(--score-weak-border)",
    color: "var(--error)",
    icon: ShieldX,
    label: "High rejection risk",
  },
} as const;

const STATUS_CONFIG = {
  clear:     { color: "var(--success)", bg: "var(--score-excellent-bg)", label: "✅ Clear" },
  review:    { color: "var(--warn)",    bg: "var(--score-average-bg)",   label: "⚠️ Review" },
  rejection: { color: "var(--error)",   bg: "var(--score-weak-bg)",      label: "🚨 Likely Rejection" },
} as const;

const RISK_COLOR = {
  low:    "var(--success)",
  medium: "var(--warn)",
  high:   "var(--error)",
} as const;

// ─── CATEGORY CARD ────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: PolicyCategory }) {
  const [expanded, setExpanded] = useState(category.status !== "clear");
  const statusCfg = STATUS_CONFIG[category.status];

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${category.status === "rejection" ? "var(--score-weak-border)" : "var(--border-subtle)"}`,
        background: category.status === "rejection" ? "var(--score-weak-bg)" : "var(--surface)",
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
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-full)",
            background: statusCfg.bg, color: statusCfg.color, flexShrink: 0,
          }}
        >
          {statusCfg.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", flex: 1 }}>
          {category.name}
        </span>
        {category.status !== "clear" && (
          <span
            style={{
              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
              background: `color-mix(in srgb, ${RISK_COLOR[category.riskLevel]} 13%, transparent)`,
              color: RISK_COLOR[category.riskLevel], flexShrink: 0, textTransform: "uppercase",
            }}
          >
            {category.riskLevel} risk
          </span>
        )}
        {expanded
          ? <ChevronUp size={14} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
          : <ChevronDown size={14} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
        }
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
            {category.finding}
          </p>
          {category.status !== "clear" && (
            <div
              style={{
                padding: "10px 12px", borderRadius: "var(--radius-sm)",
                background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <Wrench size={13} color="var(--accent-text)" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "var(--accent-text)", margin: 0, lineHeight: 1.5 }}>
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
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-tertiary)", margin: "0 0 8px" }}>
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
                display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-tertiary)",
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
          padding: "14px 16px", borderRadius: "var(--radius)",
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
            <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: 0 }}>
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
              borderRadius: "var(--radius-sm)", background: "var(--border-subtle)", border: "1px solid var(--border)",
              color: "var(--ink-muted)", fontSize: 12, cursor: "pointer",
            }}
          >
            {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy Report"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 32, width: 32, borderRadius: "var(--radius-sm)", background: "var(--surface)",
                border: "1px solid var(--border)", color: "var(--ink-tertiary)", fontSize: 18,
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
            padding: "14px 16px", borderRadius: "var(--radius)",
            background: "var(--score-average-bg)", border: "1px solid var(--score-average-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <AlertTriangle size={14} color="var(--warn)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--warn)" }}>Top 3 Fixes</span>
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {result.topFixes.map((fix, i) => (
              <li key={i} style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
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
                  height: 32, padding: "0 14px", borderRadius: "var(--radius-full)", fontSize: 13,
                  cursor: "pointer", transition: "all 150ms",
                  background: activeTab === p ? "var(--accent)" : "var(--surface)",
                  border: `1px solid ${activeTab === p ? "var(--accent)" : "var(--border)"}`,
                  color: activeTab === p ? "white" : "var(--ink-faint)",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
                {flags > 0 && (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)",
                      background: activeTab === p ? "rgba(255,255,255,0.2)" : "var(--score-weak-bg)",
                      color: activeTab === p ? "white" : "var(--error)",
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
            borderRadius: "var(--radius)", border: "1px solid var(--border-subtle)",
            background: "var(--surface)",
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
            <FileText size={14} color="var(--ink-tertiary)" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-muted)", flex: 1 }}>Reviewer Notes</span>
            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>For appeal if flagged</span>
            {notesExpanded
              ? <ChevronUp size={14} color="var(--ink-tertiary)" />
              : <ChevronDown size={14} color="var(--ink-tertiary)" />
            }
          </button>
          {notesExpanded && (
            <div style={{ padding: "0 14px 14px" }}>
              <p style={{ fontSize: 13, color: "var(--ink-faint)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {result.reviewerNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
