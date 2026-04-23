// src/components/organic/OrganicActionRow.tsx
// Figma 493:1859 — 3-button action row for Organic-Static.
// AI Rewrite · Visualize · Safe Zone. Policy Check omitted per Q3.

import { Wand2, Sparkles, Crosshair, type LucideIcon } from "lucide-react";

interface OrganicActionRowProps {
  onFixIt?: () => void;
  onVisualize?: () => void;
  onSafeZone?: () => void;
}

interface ActionTileProps {
  icon: LucideIcon;
  label: string;
  tintBg: string;
  iconColor: string;
  onClick?: () => void;
  disabled?: boolean;
}

function ActionTile({ icon: Icon, label, tintBg, iconColor, onClick, disabled }: ActionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex-1 flex flex-col items-center justify-center gap-3 py-[22px] rounded-[17px] bg-[rgba(24,24,27,0.5)] border border-white/[0.06] transition-[transform,opacity] duration-150 ease-out hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    >
      <div
        className="w-[42px] h-[42px] rounded-full flex items-center justify-center"
        style={{ background: tintBg }}
      >
        <Icon size={17} style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <span className="text-[14.83px] leading-[21.19px] font-medium text-zinc-200">
        {label}
      </span>
    </button>
  );
}

export function OrganicActionRow({ onFixIt, onVisualize, onSafeZone }: OrganicActionRowProps) {
  return (
    <div className="flex gap-[13px] items-stretch w-full">
      <ActionTile
        icon={Wand2}
        label="AI Rewrite"
        tintBg="rgba(99,102,241,0.15)"
        iconColor="#6366f1"
        onClick={onFixIt}
        disabled={!onFixIt}
      />
      <ActionTile
        icon={Sparkles}
        label="Visualize"
        tintBg="rgba(16,185,129,0.15)"
        iconColor="#10b981"
        onClick={onVisualize}
        disabled={!onVisualize}
      />
      <ActionTile
        icon={Crosshair}
        label="Safe Zone"
        tintBg="rgba(14,165,233,0.15)"
        iconColor="#0ea5e9"
        onClick={onSafeZone}
        disabled={!onSafeZone}
      />
    </div>
  );
}
