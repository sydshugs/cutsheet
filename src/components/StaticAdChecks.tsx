import { CheckCircle, XCircle, AlertCircle, Image } from "lucide-react";

interface Scores {
  hook: number;
  clarity: number;
  cta: number;
  production: number;
  overall: number;
}

interface Check {
  label: string;
  description: string;
  status: "pass" | "fail" | "manual";
}

function getChecks(scores: Scores): Check[] {
  return [
    {
      label: "Visual Hierarchy",
      description: "Does the eye flow naturally: headline \u2192 image \u2192 CTA?",
      status: scores.production >= 7 ? "pass" : "fail",
    },
    {
      label: "CTA Visibility",
      description: "Is the CTA immediately visible without scanning?",
      status: scores.cta >= 6 ? "pass" : "fail",
    },
    {
      label: "Message Clarity",
      description: "Can you understand the offer in under 3 seconds?",
      status: scores.clarity >= 7 ? "pass" : "fail",
    },
    {
      label: "Brand Visibility",
      description: "Is the brand/logo clearly identifiable at a glance?",
      status: "manual" as const,
    },
  ];
}

const STATUS_ICON = {
  pass: <CheckCircle size={14} color="#10b981" />,
  fail: <XCircle size={14} color="#ef4444" />,
  manual: <AlertCircle size={14} color="#f59e0b" />,
};

const STATUS_BADGE = {
  pass: null,
  fail: null,
  manual: (
    <span
      style={{
        fontSize: 10,
        color: "#f59e0b",
        background: "rgba(245,158,11,0.1)",
        borderRadius: 9999,
        padding: "2px 8px",
        lineHeight: "16px",
        flexShrink: 0,
      }}
    >
      Check manually
    </span>
  ),
};

export function StaticAdChecks({ scores }: { scores: Scores }) {
  const checks = getChecks(scores);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Image size={14} color="#71717a" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>
          Static Ad Checks
        </span>
      </div>

      {/* Check rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map((check) => (
          <div
            key={check.label}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "8px 0",
            }}
          >
            <div style={{ marginTop: 1, flexShrink: 0 }}>
              {STATUS_ICON[check.status]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#a1a1aa" }}>{check.label}</span>
                {STATUS_BADGE[check.status]}
              </div>
              <p style={{ fontSize: 11, color: "#52525b", margin: "2px 0 0", lineHeight: 1.4 }}>
                {check.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
