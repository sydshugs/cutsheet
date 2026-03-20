import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
}

export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: AlertDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    // Focus confirm button on open
    setTimeout(() => confirmRef.current?.focus(), 50);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />
      {/* Dialog */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "var(--surface-el, #141419)",
          border: "1px solid var(--border, rgba(255,255,255,0.1))",
          borderRadius: "var(--radius, 16px)",
          padding: "24px",
          maxWidth: "400px",
          width: "calc(100% - 32px)",
        }}
      >
        <h3
          id="alert-dialog-title"
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--ink, rgba(255,255,255,0.92))",
            fontFamily: "var(--sans)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "8px 0 20px",
            fontSize: "13px",
            lineHeight: 1.5,
            color: "var(--ink-muted, rgba(255,255,255,0.5))",
            fontFamily: "var(--sans)",
          }}
        >
          {description}
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-medium transition-colors",
              "bg-transparent text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white/5"
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-medium transition-colors",
              variant === "destructive"
                ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
