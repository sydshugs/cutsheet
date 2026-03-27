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
  const cancelRef = useRef<HTMLButtonElement>(null);
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    // For destructive dialogs: focus cancel button to prevent accidental confirmation
    // For default dialogs: focus confirm button
    setTimeout(() => {
      if (variant === "destructive") {
        cancelRef.current?.focus();
      } else {
        confirmRef.current?.focus();
      }
    }, 50);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, variant]);

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
        className="relative bg-zinc-900/95 border border-white/[0.08] rounded-2xl p-6 max-w-[400px] w-[calc(100%-32px)] shadow-2xl"
      >
        <h3
          id="alert-dialog-title"
          className="m-0 text-base font-semibold text-zinc-100"
        >
          {title}
        </h3>
        <p className="mt-2 mb-5 text-[13px] leading-relaxed text-zinc-400">
          {description}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-[color,background-color] bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
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
              "px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
              variant === "destructive"
                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                : "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
