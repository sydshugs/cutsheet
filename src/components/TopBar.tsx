// TopBar.tsx — top bar with plan badge + profile popover

import { useEffect, useRef, useState } from "react";
import { Menu, Settings, CreditCard, BarChart3, HelpCircle, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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
  const pageTitle =
    location.pathname.startsWith("/app/batch/scorecard")
      ? "Rank Creatives"
      : ROUTE_TITLES[location.pathname] ?? "Analyzer";

  return (
    <div className="relative z-20 flex h-[48px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[color:var(--bg)] px-6">
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

      <div className="flex items-center gap-[17px]">
        {/* Plan pill — same indigo style for all tiers and all pages */}
        <div
          className="flex items-center gap-[6px] rounded-full border py-[5px] px-[13px] text-[13px] font-medium"
          style={{
            background: "rgba(99,102,241,0.1)",
            borderColor: "rgba(99,102,241,0.2)",
            color: "#818cf8",
          }}
        >
          <span aria-hidden>●</span>
          <span>{planLabel}</span>
        </div>

      {/* Avatar + popover */}
      {userName && (
        <div ref={popoverRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setPopoverOpen((p) => !p)}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#a3b3ff", fontSize: 11, fontWeight: 500,
              cursor: "pointer",
            }}
            aria-label="Profile menu"
            aria-expanded={popoverOpen}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </button>

          {popoverOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 240, borderRadius: 12,
              background: "#18181b", border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#a3b3ff", fontSize: 13, fontWeight: 500 }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
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
    </div>
  );
}
