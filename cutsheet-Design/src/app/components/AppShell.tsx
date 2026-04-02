import React from "react";
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
  CircleHelp
} from "lucide-react";
import ResultsScreen from "./ResultsScreen";
import UploadState from "./UploadState";
import AppIcon from "../../imports/AppIcon";

export default function AppShell() {
  return (
    <div className="flex w-full h-full min-h-[calc(100vh-49px)] bg-[#09090b] text-white font-['Geist',sans-serif]">
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
            <NavItem icon={Zap} label="Paid Ad" active />
            <NavItem icon={TrendingUp} label="Organic" />
            <NavItem icon={Monitor} label="Display" />
            <NavItem icon={ScanSearch} label="Ad Breakdown" />
          </div>

          {/* Group: COMPARE */}
          <div className="flex flex-col gap-[2px]">
            <div className="text-[10px] uppercase text-zinc-600 tracking-[0.12em] font-semibold px-[12px] pt-[16px] pb-[6px]">
              Compare
            </div>
            <NavItem icon={GitBranch} label="A/B Test" />
            <NavItem icon={Swords} label="Competitor" />
            <NavItem icon={Trophy} label="Rank Creatives" />
          </div>

          {/* Group: LIBRARY */}
          <div className="flex flex-col gap-[2px]">
            <div className="text-[10px] uppercase text-zinc-600 tracking-[0.12em] font-semibold px-[12px] pt-[16px] pb-[6px]">
              Library
            </div>
            <NavItem icon={Bookmark} label="Saved Ads" />
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
          {/* // Only render when subscriptionStatus === 'free' */}
          <div className="flex flex-col mb-4 px-[12px]">
            <span className="text-[12px] text-zinc-500 font-medium mb-[6px]">
              3 of 10 analyses used
            </span>
            <div className="h-[3px] w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#6366f1] rounded-full w-[30%]" />
            </div>
          </div>

          <div className="flex items-center">
            <a 
              href="mailto:hello@cutsheet.xyz" 
              className="w-[32px] h-[36px] rounded-[8px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors flex shrink-0 items-center justify-center mr-[4px]"
            >
              <CircleHelp size={16} strokeWidth={2} />
            </a>
            <div className="flex-1 min-w-0">
              <NavItem icon={Settings} label="Settings" />
            </div>
          </div>

        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#09090b]">
        {/* Top Bar */}
        <div className="h-[48px] shrink-0 border-b border-white/[0.06] flex items-center justify-between px-6">
          <h2 className="text-[14px] font-medium text-white">
            Paid Ad Analyzer
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[#818cf8] text-[12px] font-medium rounded-full py-[4px] px-[12px]">
              &#9679; Pro
            </div>
            <div className="w-[24px] h-[24px] rounded-full bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center cursor-pointer">
              <span className="text-[10px] font-medium text-indigo-300">S</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ResultsScreen />
        </div>
      </div>

    </div>
  );
}

// Subcomponent for Navigation Items
function NavItem({ 
  icon: Icon, 
  label, 
  active 
}: { 
  icon: any; 
  label: string; 
  active?: boolean 
}) {
  return (
    <button className={`flex items-center w-full h-[36px] px-3 gap-2.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 cursor-pointer ${
      active 
        ? 'bg-[rgba(99,102,241,0.08)] border-l-[2px] border-l-[#6366f1] border-y-0 border-r-0 text-indigo-300 rounded-l-[4px]' 
        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300 border-l-[2px] border-transparent rounded-l-[4px]'
    }`}>
      <Icon size={16} strokeWidth={2} className={active ? "text-indigo-400" : "text-zinc-500"} />
      {label}
    </button>
  );
}
