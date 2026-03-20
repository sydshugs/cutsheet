// BottomTabBar — Mobile 4-tab nav with glass treatment
// Per DESIGN-SPEC.md Section 11

import { Zap, Clock, Bookmark, Settings } from "lucide-react";

type TabId = "analyze" | "history" | "swipefile" | "settings";

interface BottomTabBarProps {
  activeTab: TabId | string;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; Icon: typeof Zap }[] = [
  { id: "analyze", label: "Analyze", Icon: Zap },
  { id: "history", label: "History", Icon: Clock },
  { id: "swipefile", label: "Swipe File", Icon: Bookmark },
  { id: "settings", label: "Settings", Icon: Settings },
];

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(15,15,18,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "8px 0 28px",
        display: "flex",
        justifyContent: "space-around",
        zIndex: 30,
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 12px",
              position: "relative",
              color: isActive ? "var(--accent)" : "#52525b",
              minWidth: 64,
            }}
          >
            {/* Accent dot above icon */}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
            )}
            <Icon
              size={20}
              fill={isActive ? "var(--accent)" : "none"}
              stroke={isActive ? "var(--accent)" : "#52525b"}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
