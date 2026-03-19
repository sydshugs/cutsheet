// SwipeFileView.tsx — Enhanced empty state with structured layout

import { useMemo, useState } from "react";
import { useSwipeFile, type SwipeItem } from "../hooks/useSwipeFile";
import { getScoreColorByValue } from "./ScoreCard";
import { AlertDialog } from "@/src/components/ui/AlertDialog";

type SortOption = "newest" | "highest" | "lowest" | "az";

interface SwipeFileViewProps {
  isDark: boolean;
}

export function SwipeFileView({ isDark }: SwipeFileViewProps) {
  const { items, deleteItem, clearAll } = useSwipeFile();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = items.filter((item) => {
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

    // Sort
    switch (sort) {
      case "highest":
        result = [...result].sort((a, b) => (b.scores?.overall ?? 0) - (a.scores?.overall ?? 0));
        break;
      case "lowest":
        result = [...result].sort((a, b) => (a.scores?.overall ?? 0) - (b.scores?.overall ?? 0));
        break;
      case "az":
        result = [...result].sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "newest":
      default:
        // Assume items are already newest-first from the hook
        break;
    }

    return result;
  }, [items, search, sort]);

  const avgScore = items.length > 0
    ? (items.reduce((acc, i) => acc + (i.scores?.overall ?? 0), 0) / items.length).toFixed(1)
    : "—";

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--label)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
        Swipe File
      </div>

      {/* Filter bar */}
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
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "9px 12px",
            fontSize: 13,
            color: "var(--ink)",
            fontFamily: "var(--sans)",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.5)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            paddingRight: 30,
            transition: "border-color var(--duration-fast) var(--ease-out)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <option value="newest">Newest first</option>
          <option value="highest">Highest score</option>
          <option value="lowest">Lowest score</option>
          <option value="az">A–Z</option>
        </select>
      </div>

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
        title="Delete all saved creatives?"
        description={`This will remove ${items.length} items from your swipe file. This can't be undone.`}
        confirmLabel="Delete All"
        variant="destructive"
      />

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
            Score any ad in Paid, Organic, or Display — then save it here to build your reference library.
          </div>
        </div>
      )}

      {/* Card grid */}
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
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
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
