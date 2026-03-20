// OverflowMenu — ⋯ icon button with dropdown for secondary actions

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

export interface OverflowMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
}

export function OverflowMenu({ items }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
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
          className="absolute bottom-full mb-2 right-0 min-w-[180px] rounded-xl overflow-hidden"
          style={{
            background: "rgba(24,24,32,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 50,
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!item.loading) {
                  item.onClick();
                  setOpen(false);
                }
              }}
              disabled={item.loading}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors"
              style={{
                fontSize: 13,
                color: item.loading ? "#52525b" : "#a1a1aa",
                background: "transparent",
                border: "none",
                borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                cursor: item.loading ? "default" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!item.loading) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {item.icon && <span className="flex-shrink-0 opacity-60">{item.icon}</span>}
              <span>{item.loading ? (item.loadingLabel ?? "Loading...") : item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
