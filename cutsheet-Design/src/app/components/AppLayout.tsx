import React, { useState, createContext, useContext, useRef, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import {
  Zap,
  TrendingUp,
  Monitor,
  GitBranch,
  Swords,
  Bookmark,
  Settings,
  Scissors,
  ScanSearch,
  Trophy,
  CircleHelp,
  CreditCard,
  BarChart2,
  HelpCircle,
  LogOut,
} from "lucide-react";
import AppIcon from "../../imports/AppIcon";

const routeTitles: Record<string, string> = {
  "/app/paid-ad": "Paid Ad Analyzer",
  "/app/paid-ad/video": "Video Paid Ad Analyzer",
  "/app/organic": "Organic Static Analyzer",
  "/app/organic/video": "Organic Video Analyzer",
  "/app/display": "Display Analyzer",
  "/app/a-b-test": "A/B Test",
  "/app/competitor": "Competitor Analyzer (Losing)",
  "/app/competitor/winning": "Competitor Analyzer (Winning)",
  "/app/ad-breakdown": "Ad Breakdown",
  "/app/rank": "Rank Creatives",
  "/app/saved": "Saved Ads",
  "/app/settings": "Settings",
  "/app/upgrade": "Upgrade",
};

// ── Page Title Override Context ──────────────────────────────────────────────
interface PageTitleCtx { setTitle: (t: string | null) => void; }
export const PageTitleContext = createContext<PageTitleCtx>({ setTitle: () => {} });
export function usePageTitleOverride() { return useContext(PageTitleContext); }

export default function AppLayout() {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || "Analyzer";
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    if (avatarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarOpen]);

  return (
    <PageTitleContext.Provider value={{ setTitle: setTitleOverride }}>
    <div className="flex w-full h-full min-h-screen bg-[#09090b] text-white font-['Geist',sans-serif]">
      {/* SIDEBAR */}
      <div className="w-[220px] shrink-0 bg-[#111113] border-r border-white/[0.06] flex flex-col h-full">
        {/* Top Section */}
        <div className="flex items-center gap-2.5 p-[20px] shrink-0">
          <div className="w-[32px] h-[32px] shrink-0 rounded-[8px] overflow-hidden">
            <div className="w-[756.64px] h-[754.64px] origin-top-left scale-[0.04229]">
              <AppIcon />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-white/[0.06] shrink-0" />

        {/* Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto px-[12px] pb-[24px] gap-[16px] scrollbar-hide pt-[8px]">
          
          {/* Group: ANALYZE */}
          <div className="flex flex-col gap-[2px]">
            <div className="text-[10px] uppercase text-zinc-600 tracking-[0.12em] font-semibold px-[12px] pt-[16px] pb-[6px]">
              Analyze
            </div>
            <NavItem 
              to="/app/paid-ad" 
              icon={Zap} 
              label="Paid Ad" 
              subItems={[
                { label: 'Static', to: '/app/paid-ad' },
                { label: 'Video', to: '/app/paid-ad/video' }
              ]}
            />
            <NavItem 
              to="/app/organic" 
              icon={TrendingUp} 
              label="Organic" 
              accent="emerald"
              subItems={[
                { label: 'Static', to: '/app/organic' },
                { label: 'Video', to: '/app/organic/video' }
              ]}
            />
            <NavItem to="/app/display" icon={Monitor} label="Display" accent="cyan" />
            <NavItem to="/app/ad-breakdown" icon={ScanSearch} label="Ad Breakdown" accent="amber" />
          </div>

          {/* Group: COMPARE */}
          <div className="flex flex-col gap-[2px]">
            <div className="text-[10px] uppercase text-zinc-600 tracking-[0.12em] font-semibold px-[12px] pt-[16px] pb-[6px]">
              Compare
            </div>
            <NavItem to="/app/a-b-test" icon={GitBranch} label="A/B Test" accent="rose" />
            <NavItem 
              to="/app/competitor" 
              icon={Swords} 
              label="Competitor" 
              accent="sky"
              subItems={[
                { label: 'Losing', to: '/app/competitor' },
                { label: 'Winning', to: '/app/competitor/winning' }
              ]}
            />
            <NavItem to="/app/rank" icon={Trophy} label="Rank Creatives" accent="violet" />
          </div>

          {/* Group: LIBRARY */}
          <div className="flex flex-col gap-[2px]">
            <div className="text-[10px] uppercase text-zinc-600 tracking-[0.12em] font-semibold px-[12px] pt-[16px] pb-[6px]">
              Library
            </div>
            <NavItem to="/app/saved" icon={Bookmark} label="Saved Ads" accent="slate" />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto shrink-0 flex flex-col pt-4 pb-4 px-[12px] border-t border-white/[0.04]">
          
          {/* User Profile Row */}
          <div className="flex items-center h-[36px] gap-2.5 px-[12px] mb-4 rounded-[8px] hover:bg-white/[0.04] transition-colors cursor-pointer">
            <div className="w-[28px] h-[28px] rounded-full bg-[rgba(99,102,241,0.2)] flex items-center justify-center shrink-0">
              <span className="text-[11px] font-medium text-indigo-300">S</span>
            </div>
            <span className="text-[12px] text-zinc-500 truncate font-medium">
              shugstudio.atlas...
            </span>
          </div>

          {/* Usage Indicator */}
          <div className="flex flex-col mb-4 px-[12px]">
            <span className="text-[12px] text-zinc-500 font-medium mb-[6px]">
              3 of 10 analyses used
            </span>
            <div className="h-[3px] w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#6366f1] rounded-full w-[30%]" />
            </div>
          </div>

          <div className="flex items-center gap-[4px]">
            <a 
              href="mailto:hello@cutsheet.xyz" 
              className="w-[32px] h-[36px] rounded-[8px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors flex shrink-0 items-center justify-center"
            >
              <CircleHelp size={16} strokeWidth={2} />
            </a>
            <div className="flex-1 min-w-0">
              <NavLink 
                to="/app/settings"
                className={({ isActive }) => `flex items-center w-full h-[36px] px-3 gap-2.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  isActive ? "bg-white/[0.04] text-zinc-200" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300"
                }`}
              >
                <Settings size={16} strokeWidth={2} className="text-zinc-500" />
                Settings
              </NavLink>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#09090b]">
        {/* Top Bar */}
        <div className="h-[48px] shrink-0 border-b border-white/[0.06] flex items-center justify-between px-6">
          <h2 className="text-[14px] font-medium text-white">
            {titleOverride ?? pageTitle}
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[#818cf8] text-[12px] font-medium rounded-full py-[4px] px-[12px]">
              &#9679; Pro
            </div>
            {/* Avatar button + dropdown */}
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen((v) => !v)}
                className="w-[24px] h-[24px] rounded-full bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center cursor-pointer hover:bg-[#6366f1]/30 transition-colors"
              >
                <span className="text-[10px] font-medium text-indigo-300">S</span>
              </button>

              {avatarOpen && (
                <div className="absolute top-8 right-0 z-50 rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-2xl w-[260px]">
                  {/* User info */}
                  <div className="flex items-center px-4 py-4 border-b border-white/[0.06]">
                    <div className="w-[36px] h-[36px] rounded-full bg-indigo-500/[0.20] text-indigo-300 text-sm font-semibold flex items-center justify-center shrink-0">
                      S
                    </div>
                    <div className="flex flex-col ml-3 min-w-0">
                      <span className="text-sm font-semibold text-zinc-100 truncate">syddakid.art</span>
                      <span className="text-xs text-zinc-500 truncate">syddakid.art@gmail.com</span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    {[
                      { icon: Settings, label: "Settings" },
                      { icon: CreditCard, label: "Billing" },
                      { icon: BarChart2, label: "Usage" },
                      { icon: HelpCircle, label: "Help & Support" },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04] cursor-pointer rounded-lg mx-1 w-[calc(100%-8px)] text-left transition-colors"
                        onClick={() => setAvatarOpen(false)}
                      >
                        <Icon size={16} className="text-zinc-500 shrink-0" />
                        {label}
                      </button>
                    ))}

                    <div className="border-t border-white/[0.04] my-1 mx-4" />

                    <button
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/[0.04] cursor-pointer rounded-lg mx-1 w-[calc(100%-8px)] text-left transition-colors"
                      onClick={() => setAvatarOpen(false)}
                    >
                      <LogOut size={16} className="text-red-400 shrink-0" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Outlet />
        </div>
      </div>

    </div>
    </PageTitleContext.Provider>
  );
}

// Subcomponent for Navigation Items
function NavItem({ 
  icon: Icon, 
  label, 
  to,
  subItems,
  accent = 'indigo'
}: { 
  icon: any; 
  label: string; 
  to: string;
  subItems?: { label: string; to: string }[];
  accent?: 'indigo' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';
}) {
  const location = useLocation();
  const isActive = location.pathname === to || (subItems && subItems.some(sub => location.pathname === sub.to));

  const activeStyles =
    accent === 'emerald'
      ? 'bg-emerald-500/[0.08] border-l-[2px] border-l-[#10b981] border-y-0 border-r-0 text-emerald-300 rounded-l-[4px]'
      : accent === 'cyan'
      ? 'bg-cyan-500/[0.08] border-l-[2px] border-l-[#06b6d4] border-y-0 border-r-0 text-cyan-300 rounded-l-[4px]'
      : accent === 'amber'
      ? 'bg-amber-500/[0.08] border-l-[2px] border-l-[#f59e0b] border-y-0 border-r-0 text-amber-300 rounded-l-[4px]'
      : accent === 'rose'
      ? 'bg-rose-500/[0.08] border-l-[2px] border-l-[#f43f5e] border-y-0 border-r-0 text-rose-300 rounded-l-[4px]'
      : accent === 'sky'
      ? 'bg-sky-500/[0.08] border-l-[2px] border-l-[#0ea5e9] border-y-0 border-r-0 text-sky-300 rounded-l-[4px]'
      : accent === 'violet'
      ? 'bg-violet-500/[0.08] border-l-[2px] border-l-[#8b5cf6] border-y-0 border-r-0 text-violet-300 rounded-l-[4px]'
      : accent === 'slate'
      ? 'bg-slate-500/[0.08] border-l-[2px] border-l-[#94a3b8] border-y-0 border-r-0 text-slate-300 rounded-l-[4px]'
      : 'bg-[rgba(99,102,241,0.08)] border-l-[2px] border-l-[#6366f1] border-y-0 border-r-0 text-indigo-300 rounded-l-[4px]';

  const activeIconClass =
    accent === 'emerald' ? 'text-emerald-400'
    : accent === 'cyan' ? 'text-cyan-400'
    : accent === 'amber' ? 'text-amber-400'
    : accent === 'rose' ? 'text-rose-400'
    : accent === 'sky' ? 'text-sky-400'
    : accent === 'violet' ? 'text-violet-400'
    : accent === 'slate' ? 'text-slate-400'
    : 'text-indigo-400';

  return (
    <div className="flex flex-col">
      <NavLink 
        to={to}
        end={!subItems}
        className={() => `flex items-center w-full h-[36px] px-3 gap-2.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 cursor-pointer ${
          isActive 
            ? activeStyles
            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300 border-l-[2px] border-transparent rounded-l-[4px]'
        }`}
      >
        <Icon size={16} strokeWidth={2} className={isActive ? activeIconClass : "text-zinc-500"} />
        {label}
      </NavLink>
      
      {/* Sub-items */}
      {isActive && subItems && (
        <div className="flex flex-col mt-1 ml-[28px] border-l border-white/[0.06] pl-2 gap-1 py-1">
          {subItems.map((sub, idx) => (
            <NavLink
              key={idx}
              to={sub.to}
              end
              className={({ isActive: isSubActive }) => `flex items-center h-[28px] px-2 rounded-[6px] text-[12px] font-medium transition-all duration-200 ${
                isSubActive
                  ? 'bg-white/[0.06] text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              {sub.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}