// Sidebar.tsx — 64px icon-only sidebar with Tailwind classes

import { BarChart3, GitCompare, Layers, FlaskConical, Bookmark, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

function SignOutButton({ showLabels = false }: { showLabels?: boolean }) {
  const { signOut } = useAuth();
  return (
    <div className={showLabels ? "" : "group relative"}>
      <button
        type="button"
        aria-label="Sign out"
        onClick={signOut}
        className={
          showLabels
            ? "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
            : "w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none transition-colors"
        }
      >
        <LogOut size={20} />
        {showLabels && "Sign out"}
      </button>
      {!showLabels && (
        <span className="absolute left-full ml-2 bg-zinc-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 top-1/2 -translate-y-1/2">
          Sign out
        </span>
      )}
    </div>
  );
}

function SidebarContent({
  mode,
  onModeChange,
  showLabels = false,
}: {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  showLabels?: boolean;
}) {
  return (
    <>
      {/* Logo */}
      <div className="mb-6">
        <img src="/cutsheet-logo.png" alt="Cutsheet" className="w-7 h-7" />
      </div>

      {/* Mode buttons */}
      <div className={`flex flex-col ${showLabels ? "gap-1 w-full px-3" : "items-center gap-2"}`}>
        {MODES.map((m) => {
          const isActive = mode === m.id;
          const Icon = m.icon;
          return showLabels ? (
            <button
              key={m.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onModeChange(m.id)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                "focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none",
                isActive
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
              ].join(" ")}
            >
              <Icon size={20} />
              {m.label}
            </button>
          ) : (
            <div key={m.id} className="group relative">
              <button
                type="button"
                aria-label={m.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onModeChange(m.id)}
                className={[
                  "w-10 h-10 flex items-center justify-center rounded-xl",
                  "focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none",
                  "transition-colors",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                ].join(" ")}
              >
                <Icon size={20} />
              </button>
              {/* Tooltip */}
              <span className="absolute left-full ml-2 bg-zinc-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 top-1/2 -translate-y-1/2">
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Settings + Sign Out at bottom */}
      <div className={`mt-auto flex flex-col ${showLabels ? "w-full px-3 gap-1" : "items-center gap-2"}`}>
        <div className={`${showLabels ? "" : "group relative"}`}>
          <button
            type="button"
            aria-label="Settings"
            className={
              showLabels
                ? "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors w-full focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
                : "w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-zinc-300 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none transition-colors"
            }
          >
            <Settings size={20} />
            {showLabels && "Settings"}
          </button>
          {!showLabels && (
            <span className="absolute left-full ml-2 bg-zinc-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 top-1/2 -translate-y-1/2">
              Settings
            </span>
          )}
        </div>
        <SignOutButton showLabels={showLabels} />
      </div>
    </>
  );
}

export function Sidebar({
  mode,
  onModeChange,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — icon-only, hidden below lg */}
      <nav className="fixed left-0 top-0 bottom-0 w-16 bg-zinc-950 border-r border-white/5 flex-col items-center py-4 z-50 hidden lg:flex">
        <SidebarContent mode={mode} onModeChange={onModeChange} />
      </nav>

      {/* Mobile sidebar overlay — visible only when mobileOpen */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          {/* Sidebar panel */}
          <nav className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-zinc-950 border-r border-white/5 flex flex-col py-4 lg:hidden">
            <SidebarContent mode={mode} onModeChange={(m) => { onModeChange(m); onMobileClose?.(); }} showLabels />
          </nav>
        </>
      )}
    </>
  );
}
