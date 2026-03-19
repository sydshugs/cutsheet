// src/components/Sidebar.tsx — complete redesign, URL-based nav, brand tokens
import { useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Zap, TrendingUp, Monitor, GitBranch, Swords, Trophy,
  Bookmark, Settings, ChevronLeft, ChevronRight, MoreHorizontal, X, HelpCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UsageIndicator } from "./UsageIndicator";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  sublabel: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  comingSoon?: boolean;
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  userEmail: string;
  isPro: boolean;
  usageCount: number;
  FREE_LIMIT: number;
  onShowShortcuts?: () => void;
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────

const ANALYZE: NavItem[] = [
  { label: "Paid Ad",  sublabel: "Meta, TikTok, Google",  path: "/app/paid",     icon: Zap },
  { label: "Organic",  sublabel: "TikTok, Reels, Shorts", path: "/app/organic",  icon: TrendingUp },
  { label: "Display",  sublabel: "Google, affiliate",     path: "/app/display",  icon: Monitor },
];

const COMPARE: NavItem[] = [
  { label: "A/B Test",   sublabel: "Test variants",      path: "/app/ab-test",    icon: GitBranch },
  { label: "Competitor", sublabel: "Your ad vs theirs",  path: "/app/competitor", icon: Swords, comingSoon: true },
  { label: "Rank Creatives", sublabel: "Find your best",  path: "/app/batch",      icon: Trophy },
];

const LIBRARY: NavItem[] = [
  { label: "Swipe File", sublabel: "Saved winners", path: "/app/swipe-file", icon: Bookmark },
];

const MORE_ITEMS = [...COMPARE.slice(1), ...LIBRARY]; // Competitor, Batch, Swipe File

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div role="heading" aria-level={2} style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#71717a", padding: "0 12px", marginTop: 24, marginBottom: 2 }}>
      {label}
    </div>
  );
}

// ─── NAV ITEM ROW ─────────────────────────────────────────────────────────────

function NavItemRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const [showCSTip, setShowCSTip] = useState(false);
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCSClick = () => {
    setShowCSTip(true);
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
    tipTimerRef.current = setTimeout(() => setShowCSTip(false), 2000);
  };

  const inner = (isActive: boolean) => (
    <>
      {/* Active left bar */}
      {isActive && !collapsed && (
        <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, background: "#6366f1", borderRadius: "0 2px 2px 0" }} />
      )}

      {/* Icon */}
      <Icon
        size={18}
        className={
          isActive
            ? "text-[#818cf8]"
            : "text-[#71717a] group-hover:text-[#a1a1aa] transition-colors"
        }
      />

      {/* Labels */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            className={isActive ? "text-[#f4f4f5]" : "text-[#a1a1aa] group-hover:text-[#f4f4f5] transition-colors"}
          >
            {item.label}
          </span>
          <span style={{ fontSize: 11, color: "#52525b", lineHeight: 1.3, whiteSpace: "nowrap" }}>
            {item.sublabel}
          </span>
          {item.comingSoon && !collapsed && (
            <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 500, marginLeft: 6, lineHeight: 1, letterSpacing: "0.04em", alignSelf: "flex-start", marginTop: 2 }}>SOON</span>
          )}
        </div>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <span
          className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
          style={{
            left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)",
            background: "#18181b", border: "1px solid rgba(255,255,255,0.08)",
            color: "#f4f4f5", fontSize: 12, borderRadius: 8, padding: "4px 8px",
            whiteSpace: "nowrap", zIndex: 50,
          }}
        >
          {item.label}
        </span>
      )}

      {/* Coming-soon click tooltip */}
      {showCSTip && (
        <span
          style={{
            position: "absolute", left: collapsed ? "calc(100% + 8px)" : "calc(100% - 12px)",
            top: "50%", transform: "translateY(-50%)",
            background: "#18181b", border: "1px solid rgba(99,102,241,0.3)",
            color: "#818cf8", fontSize: 11, borderRadius: 8, padding: "4px 8px",
            whiteSpace: "nowrap", zIndex: 60, pointerEvents: "none",
          }}
        >
          Coming soon
        </span>
      )}
    </>
  );

  const baseStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    height: collapsed ? 40 : 52,
    opacity: item.comingSoon ? 0.4 : 1,
    textDecoration: "none",
  };

  if (item.comingSoon) {
    return (
      <div
        className="group"
        title={collapsed ? item.label : undefined}
        style={{ ...baseStyle, margin: collapsed ? "2px auto" : "2px 8px", width: collapsed ? 40 : "auto", borderRadius: 10, padding: collapsed ? 0 : "0 10px", cursor: "default", justifyContent: collapsed ? "center" : "flex-start" }}
        onClick={handleCSClick}
      >
        {inner(false)}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center transition-colors ${
          collapsed
            ? "justify-center rounded-[10px]"
            : isActive
            ? "rounded-[0_10px_10px_0]"
            : "rounded-[10px] hover:bg-[rgba(255,255,255,0.04)]"
        }`
      }
      style={({ isActive }) => ({
        ...baseStyle,
        margin: collapsed ? "2px auto" : isActive ? "2px 8px 2px 0" : "2px 8px",
        width: collapsed ? 40 : "auto",
        padding: collapsed ? 0 : "0 10px",
        justifyContent: collapsed ? "center" : "flex-start",
        background: isActive ? "rgba(99,102,241,0.1)" : undefined,
      })}
    >
      {({ isActive }) => inner(isActive)}
    </NavLink>
  );
}

// ─── DESKTOP SIDEBAR ──────────────────────────────────────────────────────────

function DesktopSidebar({
  userEmail, isPro, usageCount, FREE_LIMIT, onShowShortcuts,
}: { userEmail: string; isPro: boolean; usageCount: number; FREE_LIMIT: number; onShowShortcuts?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const initial = (user?.email ?? userEmail).charAt(0).toUpperCase() || "U";
  const width = collapsed ? 64 : 220;

  return (
    <nav
      aria-label="Main navigation"
      className="sidebar-desktop hidden md:flex flex-col flex-shrink-0 relative z-40"
      style={{
        width, minWidth: width,
        background: "#111113",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        transition: "width 200ms cubic-bezier(0.16,1,0.3,1)",
        overflow: "hidden",
      }}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-4 right-2 flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.04)] transition-colors rounded-md z-10"
        style={{ width: 24, height: 24, background: "transparent", border: "none", cursor: "pointer" }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 0 0" : "20px 16px 0",
          display: "flex", alignItems: "center", gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
          marginBottom: 4,
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Zap size={16} color="white" fill="white" />
        </div>
        {!collapsed && (
          <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 600, color: "#f4f4f5", letterSpacing: "-0.02em" }}>
            cutsheet
          </span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {!collapsed ? <SectionLabel label="Analyze" /> : <div style={{ height: 20 }} />}
        {ANALYZE.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}

        {!collapsed ? <SectionLabel label="Compare" /> : <div style={{ height: 20 }} />}
        {COMPARE.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}

        {!collapsed ? <SectionLabel label="Library" /> : <div style={{ height: 20 }} />}
        {LIBRARY.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        <UsageIndicator usageCount={usageCount} FREE_LIMIT={FREE_LIMIT} isPro={isPro} collapsed={collapsed} />

        {/* Shortcuts hint — only visible when collapsed */}
        {collapsed && onShowShortcuts && (
          <div style={{ display: "flex", justifyContent: "center", margin: "0 8px 2px" }}>
            <button
              type="button"
              onClick={onShowShortcuts}
              aria-label="Keyboard shortcuts"
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: "#71717a", fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              ?
            </button>
          </div>
        )}

        {/* Help & Support */}
        <a href="mailto:support@cutsheet.xyz" style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "8px 0" : "8px 12px", justifyContent: collapsed ? "center" : "flex-start", color: "#52525b", fontSize: 12, textDecoration: "none", transition: "color 150ms", margin: "0 8px" }} title={collapsed ? "Help & Support" : undefined} onMouseEnter={e => (e.currentTarget.style.color = "#a1a1aa")} onMouseLeave={e => (e.currentTarget.style.color = "#52525b")}>
          <HelpCircle size={16} />
          {!collapsed && <span>Help &amp; Support</span>}
        </a>

        {/* Settings */}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="group flex items-center gap-[10px] transition-colors hover:bg-[rgba(255,255,255,0.04)] rounded-[8px]"
          style={{ height: 40, padding: collapsed ? 0 : "0 16px", margin: "0 8px", background: "transparent", border: "none", cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}
          aria-label="Settings"
        >
          <Settings size={18} className="text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa" }}>Settings</span>
          )}
        </button>

        {/* User avatar */}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="group flex items-center gap-[10px] transition-colors hover:bg-[rgba(255,255,255,0.04)] rounded-[8px]"
          style={{ height: 40, padding: collapsed ? 0 : "0 16px", margin: "0 8px", background: "transparent", border: "none", cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}
          aria-label="Profile settings"
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 600, color: "white" }}>
            {initial}
          </div>
          {!collapsed && (
            <span style={{ fontSize: 12, color: "#a1a1aa" }}>
              {isPro ? "Pro Plan" : "Free Plan"}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

// ─── MOBILE BOTTOM TAB BAR ────────────────────────────────────────────────────

const MOBILE_TABS = [
  { label: "Paid",     path: "/app/paid",     icon: Zap },
  { label: "Organic",  path: "/app/organic",  icon: TrendingUp },
  { label: "Display",  path: "/app/display",  icon: Monitor },
];

function MobileTabBar({ onMoreClick }: { onMoreClick: () => void }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{ height: 60, background: "#111113", borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textDecoration: "none" }}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} color={isActive ? "#6366f1" : "#52525b"} />
                <span style={{ fontSize: 10, color: isActive ? "#6366f1" : "#52525b", fontWeight: isActive ? 500 : 400 }}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
      <button
        type="button"
        onClick={onMoreClick}
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer" }}
      >
        <MoreHorizontal size={20} color="#52525b" />
        <span style={{ fontSize: 10, color: "#52525b" }}>More</span>
      </button>
    </nav>
  );
}

// ─── MOBILE MORE DRAWER ───────────────────────────────────────────────────────

function MobileMoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>
        <div className="flex items-center justify-between px-4 pb-2">
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>More</span>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#71717a" }}>
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-8">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => { if (!item.comingSoon) { navigate(item.path); onClose(); } }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: item.comingSoon ? "default" : "pointer", opacity: item.comingSoon ? 0.4 : 1 }}
              >
                <Icon size={18} color="#71717a" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#52525b" }}>{item.sublabel}</div>
                </div>
                {item.comingSoon && (
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#818cf8", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(99,102,241,0.2)" }}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function Sidebar({ mobileOpen: _mobileOpen, onMobileClose: _onMobileClose, userEmail, isPro, usageCount, FREE_LIMIT, onShowShortcuts }: SidebarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <DesktopSidebar userEmail={userEmail} isPro={isPro} usageCount={usageCount} FREE_LIMIT={FREE_LIMIT} onShowShortcuts={onShowShortcuts} />
      <MobileTabBar onMoreClick={() => setMoreOpen(true)} />
      <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
