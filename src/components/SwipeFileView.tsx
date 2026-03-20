// SwipeFileView.tsx — Enhanced empty state with structured layout + filter bar

import { useMemo, useState, useEffect, useCallback } from "react";
import type { SwipeItem } from "../hooks/useSwipeFile";
import type { SwipeFileFilters } from "@/src/lib/swipeFileFilters";
import { getScoreColorByValue } from "./ScoreCard";
import { AlertDialog } from "@/src/components/ui/AlertDialog";
import { SwipeFileFilterBar } from "./SwipeFileFilterBar";

interface SwipeFileViewProps {
  isDark: boolean;
  items: SwipeItem[];
  deleteItem: (id: string) => void;
  clearAll: () => void;
  filteredItems: SwipeItem[];
  filters: SwipeFileFilters;
  setFilters: (f: SwipeFileFilters) => void;
  resetFilters: () => void;
  filterOptions: { platforms: string[]; formats: string[] };
  filteredCount: number;
  totalCount: number;
}

export function SwipeFileView({
  items,
  deleteItem,
  clearAll,
  filteredItems,
  filters,
  setFilters,
  resetFilters,
  filterOptions,
  filteredCount,
  totalCount,
}: SwipeFileViewProps) {
  const [search, setSearch] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SwipeItem | null>(null);

  // Close modal on Escape key
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setSelectedItem(null);
  }, []);

  useEffect(() => {
    if (selectedItem) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscKey);
        document.body.style.overflow = "";
      };
    }
  }, [selectedItem, handleEscKey]);

  // Search applies on top of already-filtered items
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredItems;
    return filteredItems.filter((item) => {
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
  }, [filteredItems, search]);

  const avgScore = items.length > 0
    ? (items.reduce((acc, i) => acc + (i.scores?.overall ?? 0), 0) / items.length).toFixed(1)
    : "\u2014";

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--label)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
        Saved Ads
      </div>

      {/* Search bar */}
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
      </div>

      {/* Filter bar — only show when there are items */}
      {items.length > 0 && (
        <SwipeFileFilterBar
          filters={filters}
          options={filterOptions}
          totalCount={totalCount}
          filteredCount={filteredCount}
          onChange={setFilters}
          onReset={resetFilters}
        />
      )}

      {/* Stats row */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-muted)" }}>
          {items.length} creatives · Avg score: <span style={{ color: "var(--accent)" }}>{avgScore}</span>
        </span>
        {items.length > 0 && (
          <button type="button" onClick={() => setConfirmClearOpen(true)} style={{ padding: "7px 12px", fontSize: 12, background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--ink-muted)", cursor: "pointer", fontFamily: "var(--sans)" }}>Clear all</button>
        )}
      </div>

      {/* Clear all confirmation dialog */}
      <AlertDialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={clearAll}
        title="Delete all saved ads?"
        description={`This will remove ${items.length} items from your library. This can't be undone.`}
        confirmLabel="Delete All"
        variant="destructive"
      />

      {/* Empty state — no items at all */}
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
            No saved ads yet
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-muted)", maxWidth: 320, lineHeight: 1.5 }}>
            Score any ad in Paid, Organic, or Display — then save it here to build your reference library.
          </div>
        </div>
      )}

      {/* Empty filter state — items exist but filters match nothing */}
      {items.length > 0 && displayed.length === 0 && (
        <div style={{
          padding: "40px 24px",
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--border)",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          textAlign: "center",
        }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-muted)" }}>
            No ads match your filters
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-faint)", maxWidth: 280, lineHeight: 1.5 }}>
            Try adjusting the score range, platform, or format filters.
          </div>
          <button
            type="button"
            onClick={() => {
              resetFilters();
              setSearch("");
            }}
            style={{
              marginTop: 4,
              fontSize: 12,
              fontFamily: "var(--sans)",
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Card grid */}
      {displayed.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {displayed.map((item) => {
            const overall = item.scores?.overall ?? 0;
            const scoreColor = getScoreColorByValue(overall);
            const displayName = item.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            const brandLabel = item.brand || "\u2014";
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedItem(item)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedItem(item); } }}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
                  e.currentTarget.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.15), 0 4px 16px rgba(0,0,0,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
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

      {/* Detail modal */}
      {selectedItem && (() => {
        const overall = selectedItem.scores?.overall ?? 0;
        const scoreColor = getScoreColorByValue(overall);
        const displayName = selectedItem.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        const savedDate = new Date(selectedItem.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}
          >
            <div
              style={{
                background: "var(--surface-el)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                maxWidth: 480,
                width: "calc(100% - 32px)",
                maxHeight: "calc(100vh - 64px)",
                overflowY: "auto",
                position: "relative",
                fontFamily: "var(--sans)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                  transition: "border-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--ink)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-muted)"; }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>

              {/* Header area with gradient */}
              <div style={{
                padding: "24px 24px 16px",
                borderBottom: "1px solid var(--border)",
                background: "linear-gradient(160deg, rgba(99,102,241,0.06), transparent)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingRight: 32 }}>
                  {selectedItem.scores && (
                    <div style={{
                      fontFamily: "var(--mono)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fff",
                      background: scoreColor,
                      borderRadius: "var(--radius-sm)",
                      padding: "4px 10px",
                      lineHeight: 1.2,
                      flexShrink: 0,
                    }}>
                      {overall}<span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>/10</span>
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, wordBreak: "break-word" }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4, fontFamily: "var(--mono)" }}>
                      {selectedItem.fileName}
                    </div>
                  </div>
                </div>

                {/* Platform + Format labels */}
                <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                  {selectedItem.platform && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px",
                      borderRadius: "var(--radius-sm)", background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.2)", color: "var(--accent)",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      {selectedItem.platform}
                    </span>
                  )}
                  {selectedItem.format && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px",
                      borderRadius: "var(--radius-sm)", background: "var(--surface)",
                      border: "1px solid var(--border)", color: "var(--ink-muted)",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      {selectedItem.format}
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Score breakdown */}
                {selectedItem.scores && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
                      Scores
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {(["hook", "clarity", "cta", "production"] as const).map((key) => {
                        const val = selectedItem.scores![key];
                        const c = getScoreColorByValue(val);
                        return (
                          <div key={key} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "6px 10px", borderRadius: "var(--radius-sm)",
                            background: "var(--surface)", border: "1px solid var(--border)",
                          }}>
                            <span style={{ fontSize: 12, color: "var(--ink-muted)", textTransform: "capitalize" }}>{key === "cta" ? "CTA" : key}</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: c }}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Brand & Niche */}
                {(selectedItem.brand || selectedItem.niche) && (
                  <div style={{ display: "flex", gap: 24 }}>
                    {selectedItem.brand && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Brand</div>
                        <div style={{ fontSize: 13, color: "var(--ink)" }}>{selectedItem.brand}</div>
                      </div>
                    )}
                    {selectedItem.niche && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Niche</div>
                        <div style={{ fontSize: 13, color: "var(--ink)" }}>{selectedItem.niche}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {selectedItem.tags.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Tags</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {selectedItem.tags.map((tag) => (
                        <span key={tag} style={{
                          fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500,
                          padding: "3px 9px", borderRadius: "var(--radius-sm)",
                          background: "var(--surface)", border: "1px solid var(--border)",
                          color: "var(--ink-muted)",
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedItem.notes && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Notes</div>
                    <div style={{
                      fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6,
                      padding: "10px 14px", borderRadius: "var(--radius-sm)",
                      background: "var(--surface)", border: "1px solid var(--border)",
                      whiteSpace: "pre-wrap",
                    }}>
                      {selectedItem.notes}
                    </div>
                  </div>
                )}

                {/* Saved date */}
                <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--mono)" }}>
                  Saved {savedDate}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => { deleteItem(selectedItem.id); setSelectedItem(null); }}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "var(--sans)",
                    background: "transparent",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--error)",
                    cursor: "pointer",
                    transition: "background 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                >
                  Remove from library
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
