// Sidebar.tsx — 64px icon-only sidebar with Tailwind classes

import { BarChart3, GitCompare, Layers, FlaskConical, Bookmark, Settings } from "lucide-react";

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

export function Sidebar({
  mode,
  onModeChange,
  isPro,
  onNewAnalysis,
  onHistoryOpen,
  userName,
  userPlan,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <nav className="fixed left-0 top-0 bottom-0 w-16 bg-zinc-950 border-r border-white/5 flex flex-col items-center py-4 z-50 hidden lg:flex">
      {/* Logo */}
      <div className="mb-6">
        <img src="/cutsheet-logo.png" alt="Cutsheet" className="w-7 h-7" />
      </div>

      {/* Mode buttons */}
      <div className="flex flex-col items-center gap-2">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          const Icon = m.icon;
          return (
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

      {/* Settings at bottom */}
      <div className="mt-auto group relative">
        <button
          type="button"
          aria-label="Settings"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-zinc-300 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:outline-none transition-colors"
        >
          <Settings size={20} />
        </button>
        {/* Tooltip */}
        <span className="absolute left-full ml-2 bg-zinc-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 top-1/2 -translate-y-1/2">
          Settings
        </span>
      </div>
    </nav>
  );
}
