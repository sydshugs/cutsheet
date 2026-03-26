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

  // Single platform: show label only, no tab bar
  if (platforms.length <= 1) {
    const label = platforms[0]?.label ?? '';
    return (
      <div className="text-[11px] text-zinc-500 py-1">{label}</div>
    );
  }

  return (
    <div
      className="flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-none"
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
            className="relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
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
  { key: "Meta", label: "Meta" },
  { key: "TikTok", label: "TikTok" },
  { key: "YouTube", label: "YouTube" },
];

// Paid static: Meta only
export const PAID_STATIC_PLATFORMS: PlatformOption[] = [
  { key: "Meta", label: "Meta" },
];

export const ORGANIC_PLATFORMS: PlatformOption[] = [
  { key: "TikTok", label: "TikTok" },
  { key: "Reels", label: "Reels" },
  { key: "Shorts", label: "Shorts" },
];

// Organic static: Instagram + Facebook only
export const ORGANIC_STATIC_PLATFORMS: PlatformOption[] = [
  { key: "Instagram", label: "Instagram" },
  { key: "Facebook", label: "Facebook" },
];

/** Platforms that do NOT support static image ads */
export const VIDEO_ONLY_PLATFORMS = new Set(["TikTok", "YouTube", "Shorts", "Reels"]);
