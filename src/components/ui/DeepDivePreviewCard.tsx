import { cn } from "@/src/lib/utils";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface DeepDivePreviewCardProps {
  title: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  onClick?: () => void;
  className?: string;
}

export function DeepDivePreviewCard({
  title,
  icon: Icon,
  badge,
  badgeColor = '#a1a1aa',
  badgeBg = 'rgba(161,161,170,0.08)',
  onClick,
  className,
}: DeepDivePreviewCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col justify-between text-left rounded-[10px] border border-white/5 bg-zinc-900/50 px-3 py-2.5 min-h-[72px]",
        "hover:border-white/10 hover:bg-zinc-800/50 transition-colors cursor-pointer",
        className
      )}
    >
      {/* Top row: icon + title + badge */}
      <div className="flex items-center gap-2 w-full">
        {Icon && <Icon size={12} className="text-zinc-500 shrink-0" />}
        <span className="text-[11px] font-medium text-zinc-300 truncate flex-1">
          {title}
        </span>
        {badge && (
          <span
            className="text-[10px] font-mono font-medium shrink-0 rounded-full px-1.5 py-px"
            style={{ color: badgeColor, background: badgeBg }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Arrow bottom-right */}
      <div className="flex justify-end mt-2">
        <ChevronRight size={11} className="text-zinc-600" />
      </div>
    </button>
  );
}
