// Sidebar.tsx — 240px labeled sidebar (Manus-style)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, GitCompare, Layers, FlaskConical, Bookmark, Settings, LogOut, Plus, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUsageInfo } from "../services/usageService";

export type SidebarMode = "single" | "compare" | "batch" | "preflight" | "swipe";

interface SidebarProps {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  isPro?: boolean;
  onNewAnalysis?: () => void;
  onHistoryOpen?: () => void;
  userName?: string;
  userPlan?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const MODES: { id: SidebarMode; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "single", label: "Analyzer", icon: BarChart3 },
  { id: "compare", label: "Compare", icon: GitCompare },
  { id: "batch", label: "Batch", icon: Layers },
  { id: "preflight", label: "A/B Test", icon: FlaskConical },
  { id: "swipe", label: "Swipe File", icon: Bookmark },
];

function UsageIndicator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<{ used: number; limit: number; isPro: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    getUsageInfo().then(setUsage).catch(() => {});
  }, [user]);

  if (!usage) return null;

  if (usage.isPro) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{
          background: "rgba(99,102,241,0.15)",
          color: "#818cf8",
        }}
      >
        Pro
      </span>
    );
  }

  const usageColor =
    usage.used >= 3
      ? "#ef4444"
      : usage.used >= 2
        ? "#f59e0b"
        : "#71717a";

  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: usageColor,
        }}
      >
        {usage.used}/{usage.limit}
      </span>
      <button
        type="button"
        onClick={() => navigate("/upgrade")}
        className="text-[11px] underline transition-colors hover:opacity-80"
        style={{ color: "#6366f1" }}
      >
        Upgrade
      </button>
    </div>
  );
}

function SidebarContent({
  mode,
  onModeChange,
  onNewAnalysis,
  onHistoryOpen,
  onSettingsClick,
}: {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  onNewAnalysis?: () => void;
  onHistoryOpen?: () => void;
  onSettingsClick?: () => void;
}) {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";
  const initial = email ? email.charAt(0).toUpperCase() : "U";

  return (
    <>
      {/* Logo + wordmark */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <img src="/cutsheet-logo.png" alt="Cutsheet" className="w-7 h-7" />
        <span className="text-base font-semibold text-white tracking-tight" style={{ fontFamily: "'TBJ Interval', sans-serif" }}>
          cutsheet
        </span>
      </div>

      {/* New Analysis CTA */}
      <div className="px-3 mb-4">
        <button
          type="button"
          onClick={onNewAnalysis}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:outline-none"
        >
          <Plus size={18} />
          New Analysis
        </button>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-3">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onModeChange(m.id)}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                "focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none",
                isActive
                  ? "bg-white/[0.07] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
              ].join(" ")}
            >
              <Icon size={18} />
              {m.label}
            </button>
          );
        })}

        {/* History */}
        <button
          type="button"
          onClick={onHistoryOpen}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
        >
          <Clock size={18} />
          History
        </button>
      </div>

      {/* Bottom section — user profile */}
      <div className="mt-auto px-3 flex flex-col gap-2">
        {/* Settings */}
        <button
          type="button"
          aria-label="Settings"
          onClick={onSettingsClick}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors w-full focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
        >
          <Settings size={18} />
          Settings
        </button>

        {/* User profile card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-300 truncate">{email || "User"}</p>
            <UsageIndicator />
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </>
  );
}

export function Sidebar({
  mode,
  onModeChange,
  onNewAnalysis,
  onHistoryOpen,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const handleSettings = () => navigate("/settings");

  return (
    <>
      {/* Desktop sidebar — 240px with labels, hidden below lg */}
      <nav className="fixed left-0 top-0 bottom-0 w-60 bg-zinc-950 border-r border-white/5 flex-col py-5 z-50 hidden lg:flex">
        <SidebarContent mode={mode} onModeChange={onModeChange} onNewAnalysis={onNewAnalysis} onHistoryOpen={onHistoryOpen} onSettingsClick={handleSettings} />
      </nav>

      {/* Mobile sidebar overlay — visible only when mobileOpen */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <nav className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-zinc-950 border-r border-white/5 flex flex-col py-5 lg:hidden">
            <SidebarContent
              mode={mode}
              onModeChange={(m) => { onModeChange(m); onMobileClose?.(); }}
              onNewAnalysis={() => { onNewAnalysis?.(); onMobileClose?.(); }}
              onHistoryOpen={() => { onHistoryOpen?.(); onMobileClose?.(); }}
              onSettingsClick={() => { handleSettings(); onMobileClose?.(); }}
            />
          </nav>
        </>
      )}
    </>
  );
}
