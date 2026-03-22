import { cn } from "@/src/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  credit?: string;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ToolButton({
  icon: Icon,
  label,
  credit,
  iconBg = 'rgba(99,102,241,0.1)',
  iconColor = '#818cf8',
  onClick,
  disabled,
  loading,
  className,
}: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] border border-white/5 bg-zinc-900/50 px-3 py-2.5",
        "hover:border-white/10 hover:bg-zinc-800/50 transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
    >
      <div
        className="shrink-0 w-7 h-7 rounded-[7px] flex items-center justify-center"
        style={{ background: iconBg }}
      >
        <Icon size={14} style={{ color: iconColor }} />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-[11px] font-medium text-zinc-200">
          {loading ? 'Loading...' : label}
        </span>
        {credit && (
          <span className="text-[9px] text-zinc-600">{credit}</span>
        )}
      </div>
    </button>
  );
}
