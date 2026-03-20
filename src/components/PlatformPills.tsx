// PlatformPills — 3-visible + "More +" expandable platform selector
// Radio group a11y. Per DESIGN-SPEC.md Section 10, UX Fix #2.

import { useState, useRef, useEffect } from "react";

export type Platform = "Meta" | "TikTok" | "Instagram" | "General" | "Google" | "YouTube";
export type Format = "video" | "static";

const VISIBLE_PLATFORMS: Platform[] = ["Meta", "TikTok", "Instagram"];
const EXPANDED_PLATFORMS: Platform[] = ["General", "Google", "YouTube"];

interface PlatformPillsProps {
  selected: Platform;
  onSelect: (platform: Platform) => void;
  format: Format;
  onFormatChange?: (format: Format) => void;
}

const pillBase = {
  height: 28,
  padding: "0 12px",
  borderRadius: 9999,
  fontSize: 12,
  cursor: "pointer",
  border: "1px solid",
  transition: "all 150ms ease",
} as const;

const activeStyle = {
  ...pillBase,
  background: "#4f46e5",
  borderColor: "#4f46e5",
  color: "white",
  fontWeight: 500,
} as const;

const inactiveStyle = {
  ...pillBase,
  background: "rgba(255,255,255,0.04)",
  borderColor: "rgba(255,255,255,0.08)",
  color: "#71717a",
  fontWeight: 400,
} as const;

export function PlatformPills({
  selected,
  onSelect,
  format,
  onFormatChange,
}: PlatformPillsProps) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Collapse on outside click
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  const platforms = expanded
    ? [...VISIBLE_PLATFORMS, ...EXPANDED_PLATFORMS]
    : VISIBLE_PLATFORMS;

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 12, color: "#52525b", flexShrink: 0 }}>
        Platform:
      </span>

      <div
        role="radiogroup"
        aria-label="Platform"
        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
      >
        {platforms.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={selected === p}
            onClick={() => {
              onSelect(p);
              // Auto-collapse if an expanded platform was selected
              if (EXPANDED_PLATFORMS.includes(p)) setExpanded(false);
            }}
            style={selected === p ? activeStyle : inactiveStyle}
          >
            {p}
          </button>
        ))}
      </div>

      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            height: 28,
            padding: "0 10px",
            borderRadius: 9999,
            fontSize: 11,
            background: "transparent",
            border: "1px dashed rgba(255,255,255,0.08)",
            color: "#3f3f46",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          More +
        </button>
      )}

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 18,
          background: "rgba(255,255,255,0.06)",
        }}
      />

      {/* Format pills (always visible) */}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          onClick={() => onFormatChange?.("video")}
          style={format === "video" ? activeStyle : inactiveStyle}
        >
          Video
        </button>
        <button
          type="button"
          onClick={() => onFormatChange?.("static")}
          style={format === "static" ? activeStyle : inactiveStyle}
        >
          Static
        </button>
      </div>
    </div>
  );
}
