// YouTubeFormatSelector.tsx — Format sub-selector for YouTube ad types

import { useState } from "react";

export type YouTubeFormat = 'skippable' | 'non_skippable' | 'bumper' | 'shorts' | 'in_feed';

export interface YouTubeFormatOption {
  key: YouTubeFormat;
  label: string;
  tooltip: string;
}

export const YOUTUBE_FORMATS: YouTubeFormatOption[] = [
  { key: 'skippable', label: 'Skippable', tooltip: '15s–3min, skip after 5s. First 5s are everything.' },
  { key: 'non_skippable', label: 'Non-Skip', tooltip: '7–15s, no skip. One idea, one takeaway.' },
  { key: 'bumper', label: 'Bumper', tooltip: '6s max, non-skippable. Brand recall only.' },
  { key: 'shorts', label: 'Shorts', tooltip: 'Vertical 9:16, <60s. Hold rate is primary signal.' },
  { key: 'in_feed', label: 'In-Feed', tooltip: 'Discovery ads. Thumbnail + title drive clicks.' },
];

interface YouTubeFormatSelectorProps {
  selected: YouTubeFormat;
  onChange: (format: YouTubeFormat) => void;
  disabled?: boolean;
}

export function YouTubeFormatSelector({ selected, onChange, disabled }: YouTubeFormatSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "var(--mono)" }}>
        Each format is scored differently
      </span>
      <div
        className="flex gap-0.5 p-0.5 rounded-lg"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        role="tablist"
        aria-label="YouTube format selector"
      >
        {YOUTUBE_FORMATS.map((f) => {
          const isActive = f.key === selected;
          const isHovered = f.key === hovered;

          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => { if (!isActive && !disabled) onChange(f.key); }}
              onMouseEnter={() => setHovered(f.key)}
              onMouseLeave={() => setHovered(null)}
              title={f.tooltip}
              className="relative flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-150 outline-none"
              style={{
                background: isActive
                  ? "rgba(99,102,241,0.15)"
                  : isHovered && !disabled
                  ? "rgba(255,255,255,0.04)"
                  : "transparent",
                color: isActive
                  ? "#818cf8"
                  : disabled
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.4)",
                cursor: disabled ? "not-allowed" : "pointer",
                border: isActive
                  ? "1px solid rgba(99,102,241,0.25)"
                  : "1px solid transparent",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
