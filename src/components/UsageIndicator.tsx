// UsageIndicator.tsx — Usage display in sidebar bottom
//
// Free:      progress bar showing daily analyses remaining
// Pro/Team:  monthly credit summary (visualize / scripts / fix its)

export interface CreditSummary {
  visualize: { remaining: number; limit: number };
  script: { remaining: number; limit: number };
  fixIt: { remaining: number; limit: number };
}

interface UsageIndicatorProps {
  usageCount: number;
  FREE_LIMIT: number;
  isPro: boolean;
  isTeam?: boolean;
  credits?: CreditSummary | null; // undefined = not fetched yet; null = loading
  collapsed?: boolean;
}

export function UsageIndicator({
  usageCount,
  FREE_LIMIT,
  isPro,
  isTeam = false,
  credits,
  collapsed = false,
}: UsageIndicatorProps) {

  // ── FREE tier: progress bar ──────────────────────────────────────────────
  if (!isPro) {
    const pct = Math.min((usageCount / FREE_LIMIT) * 100, 100);
    const remaining = Math.max(FREE_LIMIT - usageCount, 0);
    const barColor = pct >= 100 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#6366f1";

    if (collapsed) {
      return (
        <div
          className="flex items-center justify-center"
          style={{ width: 40, height: 40, margin: "0 auto" }}
          aria-label={`${usageCount} of ${FREE_LIMIT} free analyses used`}
          role="status"
        >
          <div
            style={{ width: 8, height: 8, borderRadius: "50%", background: barColor }}
            title={`${remaining} analyses remaining`}
          />
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-label={`${usageCount} of ${FREE_LIMIT} free analyses used`}
        style={{
          margin: "0 8px 4px",
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#71717a" }}>Free plan</span>
          <span style={{ fontSize: 11, color: "#52525b" }}>{remaining} left</span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
          <div
            style={{
              height: 3,
              borderRadius: 2,
              width: `${pct}%`,
              background: barColor,
              transition: "width 300ms",
            }}
          />
        </div>
        <p style={{ fontSize: 10, color: "#52525b", marginTop: 5 }}>
          {usageCount}/{FREE_LIMIT} analyses today
        </p>
      </div>
    );
  }

  // ── PRO / TEAM tier ───────────────────────────────────────────────────────
  const planLabel = isTeam ? "Team plan" : "Pro plan";

  if (collapsed) {
    const dotColor = credits === undefined || credits === null ? "#3f3f46" : "#818cf8";
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: 40, height: 40, margin: "0 auto" }}
        title={planLabel}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
      </div>
    );
  }

  // Loading skeleton (credits === null means actively fetching)
  if (credits === null) {
    return (
      <div
        style={{
          margin: "0 8px 4px",
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 500, color: "#71717a" }}>{planLabel}</span>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {[70, 55, 65].map((w, i) => (
            <div
              key={i}
              style={{
                height: 9,
                borderRadius: 4,
                width: `${w}%`,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Credits loaded (or not yet fetched — show plan label only)
  const items = credits
    ? [
        { label: "🎨 Visualize", remaining: credits.visualize.remaining, limit: credits.visualize.limit },
        { label: "✍️ Scripts", remaining: credits.script.remaining, limit: credits.script.limit },
        { label: "🛠️ Fix Its", remaining: credits.fixIt.remaining, limit: credits.fixIt.limit },
      ]
    : [];

  return (
    <div
      style={{
        margin: "0 8px 4px",
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 500, color: "#71717a" }}>{planLabel}</span>
      {items.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map(({ label, remaining, limit }) => (
            <div
              key={label}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span style={{ fontSize: 10, color: "#52525b" }}>{label}</span>
              <span
                style={{
                  fontSize: 10,
                  color: remaining === 0 ? "#ef4444" : "#71717a",
                }}
              >
                {remaining}/{limit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
