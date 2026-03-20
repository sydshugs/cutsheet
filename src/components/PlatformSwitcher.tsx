// PlatformSwitcher.tsx — Segmented platform tabs for instant re-score

import { useState } from "react";

export interface PlatformOption {
  key: string;
  label: string;
}

interface PlatformSwitcherProps {
  platforms: PlatformOption[];
  selected: string;
  onChange: (key: string) => void;
  isSwitching: boolean;
  disabled: boolean;
}

export function PlatformSwitcher({
  platforms,
  selected,
  onChange,
  isSwitching,
  disabled,
}: PlatformSwitcherProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className="flex gap-1 p-1 rounded-xl"
      style={{
        background: "var(--surface, rgba(255,255,255,0.03))",
        border: "1px solid var(--border, rgba(255,255,255,0.1))",
      }}
      role="tablist"
      aria-label="Platform selector"
    >
      {platforms.map((p) => {
        const isActive = p.key === selected;
        const isHovered = p.key === hovered;
        const showSpinner = isActive && isSwitching;

        return (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => {
              if (!isActive && !disabled) onChange(p.key);
            }}
            onMouseEnter={() => setHovered(p.key)}
            onMouseLeave={() => setHovered(null)}
            className="relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 outline-none"
            style={{
              background: isActive
                ? "var(--accent, #6366f1)"
                : isHovered && !disabled
                ? "rgba(255,255,255,0.05)"
                : "transparent",
              color: isActive
                ? "white"
                : disabled
                ? "var(--ink-faint, rgba(255,255,255,0.25))"
                : "var(--ink-muted, rgba(255,255,255,0.5))",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              border: isActive
                ? "1px solid rgba(99,102,241,0.4)"
                : "1px solid transparent",
            }}
            title={disabled ? "Analyze your ad first" : `Score for ${p.label}`}
          >
            {showSpinner && (
              <div
                className="w-3 h-3 rounded-full border-[1.5px] border-white/30 border-t-white animate-spin"
                aria-hidden="true"
              />
            )}
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Platform lists by analyzer type
export const PAID_AD_PLATFORMS: PlatformOption[] = [
  { key: "all", label: "All" },
  { key: "Meta", label: "Meta" },
  { key: "TikTok", label: "TikTok" },
  { key: "Reels", label: "Reels" },
  { key: "YouTube", label: "YouTube" },
  { key: "Shorts", label: "Shorts" },
];

export const ORGANIC_PLATFORMS: PlatformOption[] = [
  { key: "TikTok", label: "TikTok" },
  { key: "Reels", label: "Reels" },
  { key: "Shorts", label: "Shorts" },
];
