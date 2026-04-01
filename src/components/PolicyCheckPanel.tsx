// src/components/PolicyCheckPanel.tsx — redesigned to match Figma node 228:1098

import { useState } from "react";
import {
  ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronRight,
  Copy, Check, AlertTriangle, FileText, X, CheckCircle2, XCircle,
} from "lucide-react";
import type { PolicyCheckResult, PolicyCategory } from "../lib/policyCheckService";
import { formatPolicyReportAsText } from "../lib/policyCheckService";

// ─── VERDICT CONFIG ───────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  good: {
    bg:     "rgba(0,188,125,0.06)",
    border: "rgba(0,188,125,0.2)",
    color:  "#00d492",
    icon:   ShieldCheck,
    label:  "Good to launch",
  },
  fix: {
    bg:     "rgba(254,154,0,0.06)",
    border: "rgba(254,154,0,0.2)",
    color:  "#ffb900",
    icon:   ShieldAlert,
    label:  "Fix before launching",
  },
  high_risk: {
    bg:     "rgba(251,44,54,0.06)",
    border: "rgba(251,44,54,0.2)",
    color:  "#ff6467",
    icon:   ShieldX,
    label:  "High rejection risk",
  },
} as const;

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  clear:     { color: "#00d492", bg: "rgba(0,188,125,0.1)",  label: "Clear",            Icon: CheckCircle2 },
  review:    { color: "#ffb900", bg: "rgba(254,154,0,0.1)",  label: "Review",           Icon: AlertTriangle },
  rejection: { color: "#ff6467", bg: "rgba(251,44,54,0.1)",  label: "Likely Rejection", Icon: XCircle },
} as const;

// ─── RISK BADGE CONFIG ────────────────────────────────────────────────────────

const RISK_CONFIG = {
  high:   { bg: "rgba(251,44,54,0.1)",  color: "#ff6467", label: "HIGH RISK" },
  medium: { bg: "rgba(254,154,0,0.1)",  color: "#ffb900", label: "MEDIUM RISK" },
  low:    { bg: "rgba(0,188,125,0.1)",  color: "#00d492", label: "LOW RISK" },
} as const;

// ─── CATEGORY CARD ────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: PolicyCategory }) {
  const [expanded, setExpanded] = useState(category.status !== "clear");
  const statusCfg = STATUS_CONFIG[category.status];
  const StatusIcon = statusCfg.Icon;
  const riskCfg = RISK_CONFIG[category.riskLevel];

  return (
    <div
      style={{
        borderRadius: 17.5,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 17.5px",
          minHeight: category.status === "clear" ? 50.4 : 72.3,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Status pill */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10.95,
            fontWeight: 600,
            padding: "3px 8.76px",
            borderRadius: 9999,
            background: statusCfg.bg,
            color: statusCfg.color,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <StatusIcon size={13} />
          {statusCfg.label}
        </span>

        {/* Category name */}
        <span
          style={{
            fontSize: 15.3,
            fontWeight: 500,
            color: "#e4e4e7",
            flex: 1,
            lineHeight: "21.9px",
          }}
        >
          {category.name}
        </span>

        {/* Risk badge — only for non-clear */}
        {category.status !== "clear" && (
          <span
            style={{
              fontSize: 9.86,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 4.38,
              background: riskCfg.bg,
              color: riskCfg.color,
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {riskCfg.label}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          size={15.3}
          color="#52525c"
          style={{
            flexShrink: 0,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms",
          }}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 17.5px 17.5px" }}>
          <p style={{ fontSize: 13.1, color: "#9f9fa9", margin: "0 0 10px", lineHeight: 1.6 }}>
            {category.finding}
          </p>
          {category.status !== "clear" && (
            <div
              style={{
                padding: "10px 13px",
                borderRadius: 10,
                background: "rgba(97,95,255,0.06)",
                border: "1px solid rgba(97,95,255,0.15)",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <ChevronRight size={13} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13.1, color: "#818cf8", margin: 0, lineHeight: 1.55 }}>
                {category.fix}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CATEGORY GROUP ───────────────────────────────────────────────────────────

function CategoryGroup({ categories }: { categories: PolicyCategory[] }) {
  const flagged = categories.filter((c) => c.status !== "clear");
  const clear   = categories.filter((c) => c.status === "clear");
  const [showClear, setShowClear] = useState(false);

  if (categories.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8.76 }}>
      {flagged.map((c) => <CategoryCard key={c.id} category={c} />)}

      {/* Clear items toggle */}
      {clear.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowClear((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6.57,
              fontSize: 13.1,
              color: "#71717b",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 0",
            }}
          >
            <ChevronDown
              size={15.3}
              style={{ transform: showClear ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms" }}
            />
            {showClear ? "Hide" : `Show`} {clear.length} clear {clear.length === 1 ? "item" : "items"}
          </button>
          {showClear && clear.map((c) => <CategoryCard key={c.id} category={c} />)}
        </>
      )}
    </div>
  );
}

// ─── PROPS ───────────────────────────────────────────────────────────────────

interface PolicyCheckPanelProps {
  result: PolicyCheckResult;
  onClose?: () => void;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

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
  const totalCount = activeCategories.filter((c) => c.status !== "clear").length;

  const platformSubtitle =
    result.platform === "both" ? "Meta & TikTok · Ad policy scan"
    : result.platform === "tiktok" ? "TikTok · Ad policy scan"
    : "Meta · Ad policy scan";

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatPolicyReportAsText(result));
    } catch {
      /* clipboard blocked */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        fontFamily: "'Geist', sans-serif",
      }}
    >

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 0 22px",
        }}
      >
        {/* Amber icon tile */}
        <div
          style={{
            width: 43.8,
            height: 43.8,
            borderRadius: 26.3,
            background: "rgba(254,154,0,0.12)",
            border: "1.1px solid rgba(254,154,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <VerdictIcon size={17.5} color="#fe9a00" />
        </div>

        {/* Title + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15.3, fontWeight: 600, color: "#f4f4f5", margin: 0, letterSpacing: -0.165 }}>
            Policy Check
          </p>
          <p style={{ fontSize: 13.1, color: "#71717b", margin: 0 }}>
            {platformSubtitle}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8.76, flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleCopyReport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 32.9,
              padding: "0 14.2px",
              borderRadius: 17.5,
              background: "rgba(255,255,255,0.02)",
              border: "1.1px solid rgba(255,255,255,0.06)",
              color: "#9f9fa9",
              fontSize: 13.1,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? <Check size={13} color="#00d492" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy Report"}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close policy check"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28.5,
                height: 41.6,
                borderRadius: 17.5,
                background: "rgba(255,255,255,0.02)",
                border: "1.1px solid rgba(255,255,255,0.06)",
                color: "#71717b",
                cursor: "pointer",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Risk Summary Card ── */}
      <div
        style={{
          borderRadius: 17.5,
          background: verdictCfg.bg,
          border: `1.1px solid ${verdictCfg.border}`,
          padding: 18.6,
          display: "flex",
          alignItems: "center",
          gap: 13,
          marginBottom: 8.76,
        }}
      >
        <VerdictIcon size={19.7} color={verdictCfg.color} style={{ flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 15.3, fontWeight: 600, color: verdictCfg.color, margin: "0 0 2px" }}>
            {verdictCfg.label}
          </p>
          <p style={{ fontSize: 13.1, color: "#71717b", margin: 0 }}>
            {totalCount > 0
              ? `${totalCount} item${totalCount !== 1 ? "s" : ""} need${totalCount === 1 ? "s" : ""} attention`
              : "No issues found"}
          </p>
        </div>
      </div>

      {/* ── Top 3 Fixes Card ── */}
      {result.topFixes.length > 0 && result.verdict !== "good" && (
        <div
          style={{
            borderRadius: 17.5,
            background: "rgba(254,154,0,0.04)",
            border: "1.1px solid rgba(254,154,0,0.2)",
            padding: 18.6,
            marginBottom: 8.76,
          }}
        >
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
            <AlertTriangle size={15.3} color="#fe9a00" />
            <span
              style={{
                fontSize: 10.95,
                fontWeight: 600,
                color: "#fe9a00",
                textTransform: "uppercase",
                letterSpacing: 0.5475,
              }}
            >
              Top 3 Fixes
            </span>
          </div>

          {/* Fix items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {result.topFixes.map((fix, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10.95px 0",
                  borderBottom: i < result.topFixes.length - 1
                    ? "1.095px solid rgba(255,255,255,0.04)"
                    : "none",
                }}
              >
                <ChevronRight size={10.95} color="#fe9a00" style={{ marginTop: 5, flexShrink: 0 }} />
                <p style={{ fontSize: 15.3, color: "#d4d4d8", margin: 0, lineHeight: "21.08px" }}>
                  {fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Policy Categories label ── */}
      <p
        style={{
          fontSize: 10.95,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5475,
          color: "#52525c",
          margin: "8.76px 0 8.76px",
        }}
      >
        Policy Categories
      </p>

      {/* ── Platform tabs (only for "both") ── */}
      {showTabs && (
        <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
          {(["meta", "tiktok"] as const).map((p) => {
            const cats  = p === "meta" ? result.metaCategories : result.tiktokCategories;
            const flags = cats.filter((c) => c.status !== "clear").length;
            const isActive = activeTab === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActiveTab(p)}
                style={{
                  height: 30.7,
                  padding: "0 14px",
                  borderRadius: 9999,
                  fontSize: 13.1,
                  fontWeight: 500,
                  cursor: "pointer",
                  background: isActive ? "#615fff" : "rgba(255,255,255,0.04)",
                  border: isActive ? "none" : "1px solid rgba(255,255,255,0.06)",
                  color: isActive ? "#fff" : "#9f9fa9",
                  boxShadow: isActive ? "0 1px 4px rgba(97,95,255,0.3)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {p === "meta" ? "Meta" : "TikTok"}
                {flags > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: 9999,
                      background: isActive ? "rgba(255,255,255,0.2)" : "rgba(251,44,54,0.2)",
                      color: isActive ? "#fff" : "#ff6467",
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

      {/* ── Category cards ── */}
      <CategoryGroup categories={activeCategories} />

      {/* ── Reviewer Notes ── */}
      {result.reviewerNotes && (
        <div
          style={{
            marginTop: 8.76,
            borderRadius: 17.5,
            border: "1.1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={() => setNotesExpanded((v) => !v)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8.76,
              padding: "0 17.5px",
              height: 50.4,
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <FileText size={15.3} color="#52525c" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 15.3, fontWeight: 500, color: "#d4d4d8", flex: 1 }}>
              Reviewer Notes
            </span>
            <span style={{ fontSize: 13.1, color: "#52525c" }}>For appeal if flagged</span>
            <ChevronDown
              size={15.3}
              color="#52525c"
              style={{
                flexShrink: 0,
                transform: notesExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms",
              }}
            />
          </button>

          {notesExpanded && (
            <div style={{ padding: "0 17.5px 17.5px" }}>
              <p style={{ fontSize: 13.1, color: "#71717b", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {result.reviewerNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
