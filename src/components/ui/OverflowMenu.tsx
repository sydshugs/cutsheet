// OverflowMenu — ⋯ icon button with dropdown for secondary actions
// Per-item async state machine: idle → loading → success/error
// Supports destructive items (red text, below divider)

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Check } from "lucide-react";

export type ItemState = "idle" | "loading" | "success" | "error";

export interface OverflowMenuItem {
  label: string;
  onClick: () => void | Promise<void>;
  icon?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  destructive?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  /** "up" opens above the button (default), "down" opens below */
  direction?: "up" | "down";
}

export function OverflowMenu({ items, direction = "up" }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  const normalItems = items.filter((item) => !item.destructive);
  const destructiveItems = items.filter((item) => item.destructive);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="More actions"
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
        style={{
          color: open ? "#a1a1aa" : "#52525b",
          background: open ? "rgba(255,255,255,0.05)" : "transparent",
          border: "1px solid",
          borderColor: open ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
          cursor: "pointer",
        }}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          className={`absolute ${direction === "down" ? "top-full mt-2" : "bottom-full mb-2"} right-0 min-w-[200px] rounded-xl overflow-hidden`}
          style={{
            background: "rgba(24,24,27,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 50,
            padding: 4,
          }}
        >
          {normalItems.map((item, i) => (
            <MenuItemButton key={`normal-${i}`} item={item} onClose={() => setOpen(false)} />
          ))}
          {destructiveItems.length > 0 && (
            <>
              <div data-divider style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 8px" }} />
              {destructiveItems.map((item, i) => (
                <MenuItemButton key={`destructive-${i}`} item={item} onClose={() => setOpen(false)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItemButton({ item, onClose }: { item: OverflowMenuItem; onClose: () => void }) {
  const [successVisible, setSuccessVisible] = useState(false);
  const isError = !!item.error;
  const isLoading = !!item.loading;
  const isDestructive = !!item.destructive;

  const state: ItemState = successVisible ? "success" : isError ? "error" : isLoading ? "loading" : "idle";

  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && !isError) {
      setSuccessVisible(true);
      const timer = setTimeout(() => setSuccessVisible(false), 2000);
      return () => clearTimeout(timer);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, isError]);

  const textColor =
    state === "success" ? "#10B981"
    : state === "error" ? "#EF4444"
    : state === "loading" ? "#52525b"
    : isDestructive ? "#EF4444"
    : "#a1a1aa";

  const displayLabel =
    state === "success" ? "Done"
    : state === "error" ? item.error!
    : state === "loading" ? (item.loadingLabel ?? "Loading...")
    : item.label;

  const displayIcon =
    state === "success" ? <Check size={14} style={{ color: "#10B981" }} /> : item.icon;

  return (
    <button
      type="button"
      onClick={() => {
        if (state !== "loading" && state !== "success") {
          item.onClick();
          if (!item.loadingLabel && !isError && !isDestructive) onClose();
        }
      }}
      disabled={state === "loading" || state === "success"}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors rounded-md"
      style={{
        fontSize: 12,
        color: textColor,
        background: "transparent",
        border: "none",
        cursor: state === "loading" || state === "success" ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (state === "idle") e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {displayIcon && <span className="flex-shrink-0 opacity-60">{displayIcon}</span>}
      <span>{displayLabel}</span>
    </button>
  );
}
