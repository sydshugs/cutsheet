// Sidebar.tsx — Replaces top tab nav. Collapsed (icon-only) at viewport < 1024px.

import { useState, useEffect } from "react";

export type SidebarMode = "single" | "compare" | "batch" | "preflight" | "swipe";

interface SidebarProps {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  isPro?: boolean;
  onNewAnalysis?: () => void;
  onHistoryOpen?: () => void;
  userName?: string;
  userPlan?: string;
}

const MODES: { id: SidebarMode; label: string; href: string }[] = [
  { id: "single", label: "Analyzer", href: "#screen-analyzer" },
  { id: "compare", label: "Compare", href: "#screen-results" },
  { id: "batch", label: "Batch", href: "#screen-batch" },
  { id: "preflight", label: "A/B Test", href: "#screen-ab" },
  { id: "swipe", label: "Swipe File", href: "#screen-swipe" },
];

const WORKSPACE_ITEMS: { id: string; label: string; icon: "new" | "library" | "settings" }[] = [
  { id: "new", label: "New Analysis", icon: "new" },
  { id: "library", label: "Library", icon: "library" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function NavIcon({ type }: { type: string }) {
  const iconProps = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5 };
  switch (type) {
    case "analyzer":
      return <svg {...iconProps}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
    case "results":
      return <svg {...iconProps}><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 5h6M5 11h4"/></svg>;
    case "batch":
      return <svg {...iconProps}><path d="M2 4h12M2 8h12M2 12h8"/></svg>;
    case "ab":
      return <svg {...iconProps}><path d="M3 3l4 10M9 3l4 10M5 8h6"/></svg>;
    case "swipe":
      return <svg {...iconProps}><rect x="2" y="2" width="5" height="7" rx="1"/><rect x="9" y="2" width="5" height="7" rx="1"/><rect x="2" y="11" width="5" height="3" rx="1"/><rect x="9" y="11" width="5" height="3" rx="1"/></svg>;
    case "new":
      return <svg {...iconProps}><path d="M8 2v12M2 8h12"/></svg>;
    case "library":
      return <svg {...iconProps}><path d="M2 4h12v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4zM5 4V2h6v2"/></svg>;
    case "settings":
      return <svg {...iconProps}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
    default:
      return null;
  }
}

export function Sidebar({
  mode,
  onModeChange,
  isPro = false,
  onNewAnalysis,
  onHistoryOpen,
  userName = "User",
  userPlan = "Free",
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setCollapsed(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const width = collapsed ? 56 : 220;

  return (
    <nav
      className="sidebar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: width,
        height: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: collapsed ? "24px 10px" : "24px 16px",
        zIndex: 100,
        gap: 4,
        transition: "width 0.25s var(--ease-out)",
      }}
    >
      {/* Logo — gradient only on mark, text plain */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 28,
          padding: "0 4px",
          minHeight: 32,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: "var(--grad)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(99,102,241,0.2)",
          }}
        >
          C
        </div>
        {!collapsed && (
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "-0.3px",
            }}
          >
            Cutsheet
          </span>
        )}
      </div>

      <span
        className="sidebar-section-label"
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          fontWeight: 500,
          color: "var(--ink-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "0 8px",
          margin: "12px 0 4px",
          display: collapsed ? "none" : "block",
        }}
      >
        Modes
      </span>

      {MODES.map((m) => {
        const isActive = mode === m.id;
        const isPreflight = m.id === "preflight";
        const iconType = m.id === "single" ? "analyzer" : m.id === "compare" ? "results" : m.id === "preflight" ? "ab" : m.id === "swipe" ? "swipe" : "batch";
        const btn = (
          <button
            type="button"
            onClick={() => onModeChange(m.id)}
            title={collapsed ? m.label : undefined}
            aria-current={isActive ? "page" : undefined}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "9px 12px" : "9px 12px 9px 16px",
              borderRadius: 8,
              cursor: "pointer",
              color: isActive ? "var(--accent)" : "var(--ink-muted)",
              fontSize: 13.5,
              fontWeight: 500,
              transition: "all 0.2s var(--ease-out)",
              border: "1px solid transparent",
              background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
              borderColor: isActive ? "rgba(99,102,241,0.2)" : "transparent",
              width: collapsed ? "100%" : "auto",
              justifyContent: collapsed ? "center" : "flex-start",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isActive ? "rgba(99,102,241,0.12)" : "var(--surface-el)";
              e.currentTarget.style.color = isActive ? "var(--accent)" : "var(--ink)";
              e.currentTarget.style.borderColor = isActive ? "rgba(99,102,241,0.2)" : "var(--border)";
              if (!isActive) e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isActive ? "rgba(99,102,241,0.12)" : "transparent";
              e.currentTarget.style.color = isActive ? "var(--accent)" : "var(--ink-muted)";
              e.currentTarget.style.borderColor = isActive ? "rgba(99,102,241,0.2)" : "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            {isActive && !collapsed && (
              <div style={{
                position: "absolute",
                left: 0,
                top: "20%",
                bottom: "20%",
                width: 3,
                borderRadius: "0 2px 2px 0",
                background: "var(--accent)",
              }} />
            )}
            <span style={{ width: 16, height: 16, opacity: isActive ? 1 : 0.7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NavIcon type={iconType} />
            </span>
            {!collapsed && <span>{m.label}</span>}
          </button>
        );
        return <div key={m.id}>{btn}</div>;
      })}

      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          fontWeight: 500,
          color: "var(--ink-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "0 8px",
          margin: "12px 0 4px",
          display: collapsed ? "none" : "block",
        }}
      >
        Workspace
      </span>

      {WORKSPACE_ITEMS.map((w) => (
        <button
          key={w.id}
          type="button"
          title={collapsed ? w.label : undefined}
          onClick={() => {
            if (w.id === "new") onNewAnalysis?.();
            if (w.id === "library") onHistoryOpen?.();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: 8,
            cursor: "pointer",
            color: "var(--ink-muted)",
            fontSize: 13.5,
            fontWeight: 500,
            transition: "all 0.2s var(--ease-out)",
            border: "1px solid transparent",
            background: "transparent",
            width: collapsed ? "100%" : "auto",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-el)";
            e.currentTarget.style.color = "var(--ink)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.transform = "translateX(2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--ink-muted)";
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <span style={{ width: 16, height: 16, opacity: 0.7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <NavIcon type={w.icon} />
          </span>
          {!collapsed && <span>{w.label}</span>}
        </button>
      ))}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
          display: collapsed ? "none" : "block",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            background: "var(--surface-el)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--grad)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>{userName}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--success)" }}>{userPlan}</div>
          </div>
        </div>
      </div>

      {collapsed && (
        <div
          style={{
            marginTop: "auto",
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            title={`${userName} · ${userPlan}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--grad)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {userName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
    </nav>
  );
}
