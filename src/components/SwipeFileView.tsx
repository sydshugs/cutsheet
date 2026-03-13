// SwipeFileView.tsx — Enhanced empty state with structured layout

import { useMemo, useState } from "react";
import { useSwipeFile, type SwipeItem } from "../hooks/useSwipeFile";
import { getScoreColorByValue } from "./ScoreCard";

interface SwipeFileViewProps {
  isDark: boolean;
}

export function SwipeFileView({ isDark }: SwipeFileViewProps) {
  const { items, deleteItem, clearAll } = useSwipeFile();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!q) return true;
      const haystack = [
        item.fileName,
        item.brand,
        item.format,
        item.niche,
        item.platform,
        item.notes,
        item.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  const avgScore = items.length > 0
    ? (items.reduce((acc, i) => acc + (i.scores?.overall ?? 0), 0) / items.length).toFixed(1)
    : "—";

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--label)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
        Swipe File
      </div>

      {/* Filter bar — prototype filter-bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)", width: 14, height: 14 }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
          <input
            type="text"
            placeholder="Search creatives, brands, hooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "9px 14px 9px 36px",
              fontSize: 13,
              color: "var(--ink)",
              fontFamily: "var(--sans)",
              outline: "none",
              transition: "border-color var(--duration-fast) var(--ease-out)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          />
        </div>
        {/* Filters coming soon */}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-muted)" }}>
          {items.length} creatives · Avg score: <span style={{ color: "var(--accent)" }}>{avgScore}</span>
        </span>
        {items.length > 0 && (
          <button type="button" onClick={clearAll} style={{ padding: "7px 12px", fontSize: 12, background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--ink-muted)", cursor: "pointer", fontFamily: "var(--sans)" }}>Clear all</button>
        )}
      </div>

      {/* Enhanced empty state v2 */}
      {items.length === 0 && (
        <div style={{
          padding: "48px 24px",
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--border)",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-lg)",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="8" height="10" rx="2" />
              <rect x="14" y="2" width="8" height="10" rx="2" />
              <rect x="2" y="14" width="8" height="8" rx="2" />
              <rect x="14" y="14" width="8" height="8" rx="2" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            No saved creatives yet
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-muted)", maxWidth: 320, lineHeight: 1.5 }}>
            Analyze a video in Analyzer mode and save it to your Swipe File to start building your reference library.
          </div>
        </div>
      )}

      {/* Card grid — prototype swipe-grid */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {filtered.map((item) => {
            const overall = item.scores?.overall ?? 0;
            const scoreColor = getScoreColorByValue(overall);
            const displayName = item.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            const brandLabel = item.brand || "—";
            return (
              <div
                key={item.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ width: "100%", aspectRatio: "9/16", maxHeight: 200, background: "var(--surface-el)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(99,102,241,0.2), transparent)" }} />
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M5 3l14 9-14 9V3z"/></svg>
                  </div>
                  {item.scores && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        fontFamily: "var(--mono)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                        background: scoreColor,
                        borderRadius: "var(--radius-sm)",
                        padding: "2px 7px",
                        zIndex: 2,
                      }}
                    >
                      {overall}
                    </div>
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--label)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 4 }}>{brandLabel}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, lineHeight: 1.4, color: "var(--ink)" }}>{displayName}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          fontWeight: 500,
                          padding: "2px 7px",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-el)",
                          border: "1px solid var(--border)",
                          color: "var(--ink-muted)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    style={{ marginTop: 8, padding: "4px 8px", fontSize: 11, background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--ink-muted)", cursor: "pointer", fontFamily: "var(--sans)" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
