// SwipeFileFilterBar.tsx — Filter controls for the swipe file grid

import type { SwipeFileFilters } from "@/src/lib/swipeFileFilters";
import { isDefaultFilters } from "@/src/lib/swipeFileFilters";

interface SwipeFileFilterBarProps {
  filters: SwipeFileFilters;
  options: { platforms: string[]; formats: string[] };
  totalCount: number;
  filteredCount: number;
  onChange: (filters: SwipeFileFilters) => void;
  onReset: () => void;
}

const SCORE_PRESETS: { label: string; min: number; max: number }[] = [
  { label: "All scores", min: 0, max: 10 },
  { label: "Top tier (8+)", min: 8, max: 10 },
  { label: "Above avg (6-7)", min: 6, max: 7 },
  { label: "Needs work (<6)", min: 0, max: 5 },
];

function getPresetValue(min: number, max: number): string {
  const match = SCORE_PRESETS.find((p) => p.min === min && p.max === max);
  return match ? match.label : "custom";
}

const selectStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "7px 28px 7px 10px",
  fontSize: 12,
  color: "var(--ink)",
  fontFamily: "var(--sans)",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.5)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  transition: "border-color 0.15s ease",
};

const pillBase: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  fontFamily: "var(--sans)",
  padding: "5px 10px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--ink-muted)",
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: "rgba(99,102,241,0.15)",
  borderColor: "rgba(99,102,241,0.4)",
  color: "var(--accent)",
};

export function SwipeFileFilterBar({
  filters,
  options,
  totalCount,
  filteredCount,
  onChange,
  onReset,
}: SwipeFileFilterBarProps) {
  const showPlatforms = options.platforms.length >= 2;
  const showFormats = options.formats.length >= 2;
  const hasActiveFilters = !isDefaultFilters(filters);

  const togglePlatform = (platform: string) => {
    const current = filters.platforms;
    const next = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform];
    onChange({ ...filters, platforms: next });
  };

  const toggleFormat = (format: string) => {
    const current = filters.formats;
    const next = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    onChange({ ...filters, formats: next });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Score preset dropdown */}
      <select
        value={getPresetValue(filters.scoreMin, filters.scoreMax)}
        onChange={(e) => {
          const preset = SCORE_PRESETS.find((p) => p.label === e.target.value);
          if (preset) {
            onChange({ ...filters, scoreMin: preset.min, scoreMax: preset.max });
          }
        }}
        style={selectStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        {SCORE_PRESETS.map((p) => (
          <option key={p.label} value={p.label}>
            {p.label}
          </option>
        ))}
        {getPresetValue(filters.scoreMin, filters.scoreMax) === "custom" && (
          <option value="custom" disabled>
            Custom ({filters.scoreMin}-{filters.scoreMax})
          </option>
        )}
      </select>

      {/* Platform pills */}
      {showPlatforms && (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              fontFamily: "var(--sans)",
              marginRight: 2,
            }}
          >
            Platform:
          </span>
          {options.platforms.map((platform) => {
            const active = filters.platforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                style={active ? pillActive : pillBase}
              >
                {platform}
              </button>
            );
          })}
        </div>
      )}

      {/* Format pills */}
      {showFormats && (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              fontFamily: "var(--sans)",
              marginRight: 2,
            }}
          >
            Format:
          </span>
          {options.formats.map((format) => {
            const active = filters.formats.includes(format);
            return (
              <button
                key={format}
                type="button"
                onClick={() => toggleFormat(format)}
                style={active ? pillActive : pillBase}
              >
                {format}
              </button>
            );
          })}
        </div>
      )}

      {/* Sort dropdown */}
      <select
        value={filters.sortBy}
        onChange={(e) =>
          onChange({
            ...filters,
            sortBy: e.target.value as SwipeFileFilters["sortBy"],
          })
        }
        style={selectStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="score_high">Highest Score</option>
        <option value="score_low">Lowest Score</option>
      </select>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Count + clear */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--ink-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {filteredCount} of {totalCount} ads
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            style={{
              fontSize: 11,
              fontFamily: "var(--sans)",
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              textUnderlineOffset: 2,
              whiteSpace: "nowrap",
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
