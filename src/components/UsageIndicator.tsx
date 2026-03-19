// UsageIndicator.tsx — shows free usage in sidebar bottom

interface UsageIndicatorProps {
  usageCount: number;
  FREE_LIMIT: number;
  isPro: boolean;
  collapsed?: boolean;
}

export function UsageIndicator({
  usageCount,
  FREE_LIMIT,
  isPro,
  collapsed = false,
}: UsageIndicatorProps) {
  if (isPro) return null;

  const pct = Math.min((usageCount / FREE_LIMIT) * 100, 100);
  const remaining = Math.max(FREE_LIMIT - usageCount, 0);
  const barColor = pct >= 100 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#6366f1";

  if (collapsed) {
    return (
      <div className="flex items-center justify-center" style={{ width: 40, height: 40, margin: "0 auto" }} aria-label={`${usageCount} of ${FREE_LIMIT} free analyses used`} role="status">
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
          style={{ height: 3, borderRadius: 2, width: `${pct}%`, background: barColor, transition: "width 300ms" }}
        />
      </div>
      <p style={{ fontSize: 10, color: "#52525b", marginTop: 5 }}>
        {usageCount}/{FREE_LIMIT} analyses used
      </p>
    </div>
  );
}
