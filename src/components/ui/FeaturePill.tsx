// src/components/ui/FeaturePill.tsx

interface FeaturePillProps {
  label: string;
}

export function FeaturePill({ label }: FeaturePillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 500,
        color: "#a1a1aa",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 9999,
      }}
    >
      {label}
    </span>
  );
}
