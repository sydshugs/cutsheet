// Toast.tsx
// Simple toast notification component

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
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
        background: "rgba(0, 212, 170, 0.15)",
        border: "1px solid rgba(0, 212, 170, 0.3)",
        borderRadius: "8px",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: 1000,
        fontFamily: "var(--mono)",
        fontSize: "13px",
        color: "#10B981",
        pointerEvents: "none",
      }}
    >
      <span>✓</span>
      {message}
    </div>
  );
}
