// TopBar.tsx — top bar with plan badge + profile popover

import { useEffect, useRef, useState } from "react";
import { Menu, Settings, CreditCard, BarChart3, HelpCircle, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserAvatar } from "./UserAvatar";

const ROUTE_TITLES: Record<string, string> = {
  "/app/paid": "Paid Ad Analyzer",
  "/app/organic": "Organic Analyzer",
  "/app/display": "Display Analyzer",
  "/app/ab-test": "A/B Test",
  "/app/competitor": "Competitor Analyzer",
  "/app/batch": "Rank Creatives",
  "/app/deconstructor": "Ad Breakdown",
  "/app/swipe-file": "Saved Ads",
  "/settings": "Settings",
};

interface TopBarProps {
  onNewAnalysis: () => void;
  onHistoryOpen: () => void;
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
  userName?: string;
  userEmail?: string;
  userPlan?: string;
  avatarUrl?: string | null;
  hasResult?: boolean;
  historyCount?: number;
  onLogout?: () => void;
}

export function TopBar({
  onMobileMenuToggle,
  userName,
  userEmail,
  userPlan,
  avatarUrl,
  onLogout,
}: TopBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const planLabel = userPlan === "team" ? "Team" : userPlan === "pro" ? "Pro" : "Free";
  const isPaid = userPlan === "pro" || userPlan === "team";
  const displayName = userName?.split("@")[0] || "User";

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPopoverOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [popoverOpen]);

  const location = useLocation();
  const pageTitle = ROUTE_TITLES[location.pathname] ?? "Analyzer";

  return (
    <div className="h-[48px] shrink-0 border-b border-white/[0.06] flex items-center justify-between px-6 relative z-20">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden text-zinc-400 hover:text-zinc-200 p-1"
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-[14px] font-medium text-white hidden md:block">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Plan badge */}
        <div className="bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[#818cf8] text-[12px] font-medium rounded-full py-[4px] px-[12px] flex items-center gap-[6px]">
          <span>●</span>
          <span>{planLabel}</span>
        </div>

      {/* Avatar + popover */}
      {userName && (
        <div ref={popoverRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setPopoverOpen((p) => !p)}
            className="flex items-center hover:bg-white/[0.04] rounded-lg p-1 transition-colors"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
            aria-label="Profile menu"
            aria-expanded={popoverOpen}
          >
            <UserAvatar size="sm" avatarUrl={avatarUrl} name={displayName} email={userEmail} />
          </button>

          {popoverOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 240, borderRadius: 12,
              background: "#18181b", border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <UserAvatar size="md" avatarUrl={avatarUrl} name={displayName} email={userEmail} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</p>
                  <p style={{ fontSize: 11, color: "#71717a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</p>
                </div>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ padding: "6px 4px" }}>
                {[
                  { icon: Settings, label: "Settings", onClick: () => { navigate("/settings"); setPopoverOpen(false); } },
                  { icon: CreditCard, label: "Billing", onClick: () => { navigate("/settings?tab=billing"); setPopoverOpen(false); } },
                  { icon: BarChart3, label: "Usage", onClick: () => { navigate("/settings?tab=usage"); setPopoverOpen(false); } },
                  { icon: HelpCircle, label: "Help & Support", onClick: () => { window.location.href = "mailto:support@cutsheet.xyz"; setPopoverOpen(false); } },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "8px 12px", borderRadius: 6,
                      background: "transparent", border: "none", cursor: "pointer",
                      fontSize: 13, color: "#a1a1aa", textAlign: "left",
                      transition: "background 150ms, color 150ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#f4f4f5"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ padding: "6px 4px" }}>
                <button
                  type="button"
                  onClick={() => { onLogout?.(); setPopoverOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 12px", borderRadius: 6,
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 13, color: "#ef4444", textAlign: "left",
                    transition: "background 150ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
