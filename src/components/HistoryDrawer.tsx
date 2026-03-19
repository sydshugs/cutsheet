import { useState, useCallback, useRef, useEffect } from "react";
import { type HistoryEntry } from "../hooks/useHistory";
import { AlertDialog } from "@/src/components/ui/AlertDialog";
import { Toast } from "@/src/components/Toast";

interface HistoryDrawerProps {
  open: boolean;
  entries: HistoryEntry[];
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  isDark: boolean;
}

function scoreColor(overall: number): string {
  if (overall >= 9) return "var(--score-excellent)";
  if (overall >= 7) return "var(--score-good)";
  if (overall >= 5) return "var(--score-average)";
  return "var(--score-weak)";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export function HistoryDrawer({
  open,
  entries,
  onClose,
  onSelect,
  onDelete,
  onClearAll,
  isDark,
}: HistoryDrawerProps) {
  const bg = "var(--surface)";
  const border = "var(--border)";
  const text = "var(--ink)";
  const muted = "var(--ink-muted)";
  const surface = "var(--surface-el)";
  const hoverBg = "var(--surface-el)";
  const deleteBg = "var(--surface-el)";
  const deleteColor = "var(--ink-faint)";

  // Clear All confirmation dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Undo toast for single delete
  const [pendingDelete, setPendingDelete] = useState<{
    entry: HistoryEntry;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const pendingDeleteRef = useRef(pendingDelete);
  pendingDeleteRef.current = pendingDelete;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current) {
        clearTimeout(pendingDeleteRef.current.timer);
      }
    };
  }, []);

  const handleSingleDelete = useCallback(
    (entry: HistoryEntry) => {
      // If there's already a pending delete, commit it immediately
      if (pendingDeleteRef.current) {
        clearTimeout(pendingDeleteRef.current.timer);
        onDelete(pendingDeleteRef.current.entry.id);
      }

      const timer = setTimeout(() => {
        onDelete(entry.id);
        setPendingDelete(null);
      }, 5000);

      setPendingDelete({ entry, timer });
    },
    [onDelete],
  );

  const handleUndoDelete = useCallback(() => {
    if (pendingDelete) {
      clearTimeout(pendingDelete.timer);
      setPendingDelete(null);
    }
  }, [pendingDelete]);

  // Filter out the pending-delete entry from displayed list
  const displayedEntries = pendingDelete
    ? entries.filter((e) => e.id !== pendingDelete.entry.id)
    : entries;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--overlay)",
          zIndex: 110,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity var(--duration-mid) var(--ease-out)",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "320px",
          background: bg,
          borderRight: `1px solid ${border}`,
          zIndex: 120,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform var(--duration-mid) var(--ease-out)",
          boxShadow: open ? "var(--shadow-lg)" : "none",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 16px",
            borderBottom: `1px solid ${border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--sans)",
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.18em",
                color: "var(--label)",
              }}
            >
              HISTORY
            </span>
            {entries.length > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--mono)",
                  color: muted,
                  background: surface,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {entries.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {entries.length > 0 && (
              <button
                onClick={() => setClearDialogOpen(true)}
                style={{
                  padding: "4px 8px",
                  background: "transparent",
                  border: `1px solid ${border}`,
                  borderRadius: "var(--radius-sm)",
                  color: muted,
                  fontSize: "10px",
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                }}
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: `1px solid ${border}`,
                borderRadius: "var(--radius-sm)",
                color: muted,
                cursor: "pointer",
                padding: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="11" y2="11" />
                <line x1="11" y1="1" x2="1" y2="11" />
              </svg>
            </button>
          </div>
        </div>

        {/* Entry list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {displayedEntries.length === 0 ? (
            <div
              style={{
                padding: "48px 16px",
                textAlign: "center",
                color: muted,
                fontSize: "12px",
                fontFamily: "var(--mono)",
                lineHeight: 1.6,
              }}
            >
              No analyses yet.
              <br />
              Run your first one to start building history.
            </div>
          ) : (
            displayedEntries.map((entry) => {
              const color = entry.scores ? scoreColor(entry.scores.overall) : "var(--ink-faint)";
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 10px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    transition: "background var(--duration-fast) var(--ease-out)",
                    marginBottom: "2px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Main content — clickable */}
                  <div
                    onClick={() => { onSelect(entry); onClose(); }}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontFamily: "var(--mono)",
                        color: text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "4px",
                      }}
                    >
                      {truncate(entry.fileName, 28)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "var(--mono)",
                          color: muted,
                        }}
                      >
                        {formatTime(entry.timestamp)}
                      </span>
                      {entry.scores && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontFamily: "var(--mono)",
                            fontWeight: 700,
                            color,
                            background: `${color}18`,
                            border: `1px solid ${color}44`,
                            borderRadius: "var(--radius-sm)",
                            padding: "1px 5px",
                          }}
                        >
                          {entry.scores.overall}/10
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSingleDelete(entry); }}
                    title="Delete"
                    style={{
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: deleteBg,
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      color: deleteColor,
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="1" y1="1" x2="11" y2="11" />
                      <line x1="11" y1="1" x2="1" y2="11" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clear All confirmation dialog */}
      <AlertDialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={onClearAll}
        title="Clear all history?"
        description={`This will delete all ${entries.length} analysis records. This can't be undone.`}
        confirmLabel="Delete All"
        variant="destructive"
      />

      {/* Undo toast for single entry delete */}
      {pendingDelete && (
        <Toast
          variant="info"
          message="Analysis removed"
          duration={5000}
          onClose={() => {
            // Toast expired — deletion already committed by timer
            setPendingDelete(null);
          }}
          action={{ label: "Undo", onClick: handleUndoDelete }}
        />
      )}
    </>
  );
}
