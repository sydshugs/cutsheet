import { type HistoryEntry } from "../hooks/useHistory";

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
  if (overall >= 9) return "#00D4AA";
  if (overall >= 7) return "#88DD00";
  if (overall >= 5) return "#FFB800";
  if (overall >= 3) return "#FF7A00";
  return "#FF4444";
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
  const bg = isDark ? "#111111" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const text = isDark ? "#fff" : "#0A0A0A";
  const muted = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const surface = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const deleteBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
  const deleteColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 40,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
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
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: open ? "4px 0 24px rgba(0,0,0,0.3)" : "none",
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
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.08em",
                color: text,
              }}
            >
              HISTORY
            </span>
            {entries.length > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: muted,
                  background: surface,
                  padding: "1px 6px",
                  borderRadius: "3px",
                }}
              >
                {entries.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {entries.length > 0 && (
              <button
                onClick={onClearAll}
                style={{
                  padding: "4px 8px",
                  background: "transparent",
                  border: `1px solid ${border}`,
                  borderRadius: "4px",
                  color: muted,
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
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
                borderRadius: "4px",
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
          {entries.length === 0 ? (
            <div
              style={{
                padding: "48px 16px",
                textAlign: "center",
                color: muted,
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.6,
              }}
            >
              No analyses yet.
              <br />
              Run your first one to start building history.
            </div>
          ) : (
            entries.map((entry) => {
              const color = entry.scores ? scoreColor(entry.scores.overall) : "#666";
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
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
                        fontFamily: "'JetBrains Mono', monospace",
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
                          fontFamily: "'JetBrains Mono', monospace",
                          color: muted,
                        }}
                      >
                        {formatTime(entry.timestamp)}
                      </span>
                      {entry.scores && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            color,
                            background: `${color}18`,
                            border: `1px solid ${color}44`,
                            borderRadius: "3px",
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
                    onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                    title="Delete"
                    style={{
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: deleteBg,
                      border: "none",
                      borderRadius: "4px",
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
    </>
  );
}
