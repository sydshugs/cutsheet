// src/components/Sidebar.tsx — complete redesign, URL-based nav, brand tokens
import { useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Zap, TrendingUp, Monitor, GitBranch, Swords, Trophy,
  Bookmark, Settings, ChevronLeft, ChevronRight, MoreHorizontal, X, CircleHelp,
  ScanSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
// UsageIndicator removed from sidebar — plan badge shown inline

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  sublabel: string;
  path: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  userEmail: string;
  isPro: boolean;
  isTeam?: boolean;
  usageCount: number;
  FREE_LIMIT: number;
  onShowShortcuts?: () => void;
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────

const ANALYZE: NavItem[] = [
  { label: "Paid Ad", sublabel: "Meta, TikTok, Google", path: "/app/paid", icon: Zap },
  { label: "Organic", sublabel: "TikTok, Reels, Shorts", path: "/app/organic", icon: TrendingUp },
  { label: "Display", sublabel: "Google, affiliate", path: "/app/display", icon: Monitor },
  { label: "Ad Breakdown", sublabel: "Teardown any ad URL", path: "/app/deconstructor", icon: ScanSearch },
];

const COMPARE: NavItem[] = [
  { label: "A/B Test", sublabel: "Quick compare 2–5 variants", path: "/app/ab-test", icon: GitBranch },
  { label: "Competitor", sublabel: "Your ad vs theirs", path: "/app/competitor", icon: Swords },
  { label: "Rank", sublabel: "Score & rank up to 10", path: "/app/batch", icon: Trophy },
];

const LIBRARY: NavItem[] = [
  { label: "Saved Ads", sublabel: "Your reference library", path: "/app/swipe-file", icon: Bookmark },
];

// Mobile "More" drawer: Ad Breakdown (ANALYZE[3]) + Competitor + Rank Creatives + Saved Ads
// A/B Test is in the primary tab bar — not duplicated here
const MORE_ITEMS = [...ANALYZE.slice(3), ...COMPARE.slice(1), ...LIBRARY];

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div role="heading" aria-level={2} className="text-[11px] uppercase text-zinc-600 tracking-[0.12em] font-semibold px-[12px] pt-[16px] pb-[6px]">
      {label}
    </div>
  );
}

const ACTIVE_NAV_CLASS = "bg-[rgba(99,102,241,0.08)] border-l-[2px] border-l-[#6366f1] border-y-0 border-r-0 text-indigo-300 rounded-tl-[4px] rounded-bl-[4px] rounded-tr-[8px] rounded-br-[8px]";

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
      {/* Icon */}
      <Icon
        size={17.5}
        strokeWidth={1.5}
        className={
          isActive
            ? "text-indigo-400"
            : "text-zinc-400 group-hover:text-zinc-300 transition-colors"
        }
      />

      {/* Label */}
      {!collapsed && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span
            style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            className={isActive ? "text-inherit" : "text-zinc-400 group-hover:text-zinc-300 transition-colors"}
          >
            {item.label}
          </span>
          {item.comingSoon && (
            <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 500, lineHeight: 1, letterSpacing: "0.04em" }}>SOON</span>
          )}
        </div>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <span
          className="absolute opacity-0 group-hover:opacity-100 group-hover:delay-300 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-150"
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
    height: 40,
    opacity: item.comingSoon ? 0.4 : 1,
    textDecoration: "none",
  };

  if (item.comingSoon) {
    return (
      <div
        className="group"
        title={collapsed ? item.label : undefined}
        style={{ ...baseStyle, margin: collapsed ? "2px auto" : "2px 0", width: collapsed ? 40 : "auto", borderRadius: 10, padding: collapsed ? 0 : "0 12px", cursor: "default", justifyContent: collapsed ? "center" : "flex-start" }}
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
          `group relative flex items-center transition-all duration-200 ${
            collapsed
              ? `justify-center rounded-[8px]${isActive ? " bg-[rgba(99,102,241,0.08)]" : ""}`
              : isActive
              ? ACTIVE_NAV_CLASS
              : "rounded-tl-[4px] rounded-bl-[4px] rounded-tr-[8px] rounded-br-[8px] border-l-[2px] border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300"
          }`
        }
        style={() => ({
          ...baseStyle,
          margin: collapsed ? "2px auto" : "2px 0",
          width: collapsed ? 40 : "auto",
          padding: collapsed ? 0 : "0 12px",
          justifyContent: collapsed ? "center" : "flex-start",
        })}
    >
      {({ isActive }) => inner(isActive)}
    </NavLink>
  );
}

// ─── DESKTOP SIDEBAR ──────────────────────────────────────────────────────────

function DesktopSidebar({
  userEmail: _userEmail, isPro, isTeam: _isTeam, usageCount, FREE_LIMIT, onShowShortcuts: _onShowShortcuts,
}: { userEmail: string; isPro: boolean; isTeam?: boolean; usageCount: number; FREE_LIMIT: number; onShowShortcuts?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const width = collapsed ? 64 : 240;

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
      {/* Logo + collapse toggle row */}
      <div
        className={collapsed ? "px-2" : "px-[20px]"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          height: 72,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/app/paid")}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="Cutsheet — go to home"
        >
          <img
            src="/icon.png"
            alt="Cutsheet"
            style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}
          />
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04] transition-colors rounded-md"
          style={{ width: 24, height: 24, background: "transparent", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* cutsheet-Design: divider under header */}
      <div className="h-px w-full bg-white/[0.06] shrink-0" aria-hidden="true" />

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-[12px] pb-[24px] gap-[16px] flex flex-col pt-[8px]">
        <div className="flex flex-col gap-[2px]">
          {!collapsed ? <SectionLabel label="Analyze" /> : <div style={{ height: 20 }} />}
          {ANALYZE.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}
        </div>

        <div className="flex flex-col gap-[2px]">
          {!collapsed ? <SectionLabel label="Compare" /> : <div style={{ height: 20 }} />}
          {COMPARE.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}
        </div>

        <div className="flex flex-col gap-[2px]">
          {!collapsed ? <SectionLabel label="Library" /> : <div style={{ height: 20 }} />}
          {LIBRARY.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-auto shrink-0 flex flex-col pt-5 pb-4 border-t border-white/[0.04]">
        {/* Usage bar — free tier only */}
        {!isPro && !collapsed && (
          <div className="flex flex-col mb-3 px-[25px]">
            <span
              className="mb-[6px]"
              style={{ fontSize: 13, fontWeight: 500, color: "#71717b" }}
            >
              {usageCount} of {FREE_LIMIT} analyses used
            </span>
            <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: "#27272a" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((usageCount / FREE_LIMIT) * 100, 100)}%`,
                  background: "#6366f1",
                }}
              />
            </div>
          </div>
        )}

        {/* Help & Support */}
        <a
          href="mailto:hello@cutsheet.xyz"
          className="group relative flex items-center h-[36px] rounded-[8px] hover:bg-white/[0.04] transition-colors"
          style={{ textDecoration: "none", margin: "1px 12px", padding: "0 12px", gap: 10 }}
          title={collapsed ? "Help & Support" : undefined}
          aria-label="Help & Support"
        >
          <CircleHelp
            size={16}
            strokeWidth={2}
            className="shrink-0"
            style={{ color: "#71717a" }}
          />
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 500, color: "#e4e4e7", whiteSpace: "nowrap" }}>
              Help &amp; Support
            </span>
          )}
          {/* Collapsed tooltip */}
          {collapsed && (
            <span
              className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
              style={{
                left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)",
                background: "#18181b", border: "1px solid rgba(255,255,255,0.08)",
                color: "#f4f4f5", fontSize: 12, borderRadius: 8, padding: "4px 8px",
                whiteSpace: "nowrap", zIndex: 50, position: "absolute",
              }}
            >
              Help &amp; Support
            </span>
          )}
        </a>

        {/* Settings */}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="group relative flex items-center h-[36px] rounded-[8px] hover:bg-white/[0.04] transition-colors bg-transparent border-none cursor-pointer w-full text-left"
          style={{ margin: "1px 12px", padding: "0 12px", gap: 10, width: "calc(100% - 24px)" }}
          aria-label="Settings"
          title={collapsed ? "Settings" : undefined}
        >
          <Settings
            size={16}
            strokeWidth={2}
            className="shrink-0"
            style={{ color: "#71717a" }}
          />
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 500, color: "#e4e4e7", whiteSpace: "nowrap" }}>
              Settings
            </span>
          )}
          {/* Collapsed tooltip */}
          {collapsed && (
            <span
              className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
              style={{
                left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)",
                background: "#18181b", border: "1px solid rgba(255,255,255,0.08)",
                color: "#f4f4f5", fontSize: 12, borderRadius: 8, padding: "4px 8px",
                whiteSpace: "nowrap", zIndex: 50, position: "absolute",
              }}
            >
              Settings
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

// ─── MOBILE BOTTOM TAB BAR ────────────────────────────────────────────────────

const MOBILE_TABS = [
  { label: "Paid Ad",  path: "/app/paid",     icon: Zap },
  { label: "Organic",  path: "/app/organic",  icon: TrendingUp },
  { label: "Display",  path: "/app/display",  icon: Monitor },
  { label: "A/B Test", path: "/app/ab-test",  icon: GitBranch },
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
                <Icon size={20} color={isActive ? "#6366f1" : "rgba(255,255,255,0.6)"} />
                <span style={{ fontSize: 10, color: isActive ? "#6366f1" : "rgba(255,255,255,0.6)", fontWeight: isActive ? 500 : 400 }}>
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
        <MoreHorizontal size={20} color="rgba(255,255,255,0.6)" />
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>More</span>
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
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
        style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation options"
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      >
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
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{item.sublabel}</div>
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

export function Sidebar({ mobileOpen: _mobileOpen, onMobileClose: _onMobileClose, userEmail, isPro, isTeam, usageCount, FREE_LIMIT, onShowShortcuts }: SidebarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <DesktopSidebar userEmail={userEmail} isPro={isPro} isTeam={isTeam} usageCount={usageCount} FREE_LIMIT={FREE_LIMIT} onShowShortcuts={onShowShortcuts} />
      <MobileTabBar onMoreClick={() => setMoreOpen(true)} />
      <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
