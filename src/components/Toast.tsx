// Toast.tsx
// Toast notification component with variant support

import { useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: ToastVariant;
  action?: { label: string; onClick: () => void };
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; border: string; color: string; icon: string }
> = {
  success: {
    bg: "rgba(0, 212, 170, 0.15)",
    border: "rgba(0, 212, 170, 0.3)",
    color: "#10B981",
    icon: "✓",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.3)",
    color: "#EF4444",
    icon: "✕",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.3)",
    color: "#F59E0B",
    icon: "⚠",
  },
  info: {
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.3)",
    color: "#818CF8",
    icon: "ℹ",
  },
};

export function Toast({
  message,
  onClose,
  duration = 3000,
  variant = "success",
  action,
}: ToastProps) {
  const [visible, setVisible] = useState(true);
  const style = VARIANT_STYLES[variant];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: visible ? "translate(-50%, 0)" : "translate(-50%, 20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.3s ease",
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: "8px",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: 10000,
        fontFamily: "var(--mono)",
        fontSize: "13px",
        color: style.color,
        pointerEvents: action ? "auto" : "none",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span>{style.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: "none",
            border: "none",
            color: style.color,
            fontFamily: "var(--mono)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            padding: 0,
            whiteSpace: "nowrap",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
