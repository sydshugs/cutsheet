import { cn } from "@/src/lib/utils";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface DeepDivePreviewCardProps {
  title: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  signal?: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export function DeepDivePreviewCard({
  title,
  icon: Icon,
  badge,
  badgeColor = '#a1a1aa',
  badgeBg = 'rgba(161,161,170,0.08)',
  signal,
  onClick,
  isActive,
  className,
}: DeepDivePreviewCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col justify-between text-left rounded-xl bg-zinc-900/50 px-3.5 py-3 min-h-[90px]",
        "hover:border-white/10 hover:bg-zinc-800/50 transition-colors cursor-pointer",
        isActive ? "border border-white/15 bg-zinc-800/50" : "border border-white/5",
        className
      )}
    >
      {/* Top row: icon + title | verdict chip */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={13} className="text-zinc-500 shrink-0 opacity-45" />}
          <span className="text-xs font-medium text-zinc-200 truncate">
            {title}
          </span>
        </div>
        {badge && (
          <span
            className="text-[10px] font-medium shrink-0 rounded-full px-1.5 py-px leading-4"
            style={{ color: badgeColor, background: badgeBg }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Bottom row: signal line | arrow */}
      <div className="flex items-end justify-between w-full mt-2">
        {signal ? (
          <span className="text-[11px] text-zinc-500 leading-snug">{signal}</span>
        ) : (
          <span />
        )}
        <ChevronRight size={11} className="text-zinc-600 shrink-0" />
      </div>
    </button>
  );
}
