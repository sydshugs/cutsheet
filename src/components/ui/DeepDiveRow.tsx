import { cn } from "@/src/lib/utils";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface DeepDiveRowProps {
  title: string;
  icon?: LucideIcon;
  preview?: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export function DeepDiveRow({
  title,
  icon: Icon,
  preview,
  onClick,
  isActive,
  className,
}: DeepDiveRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 w-full rounded-xl bg-zinc-900/50 px-4 py-3",
        "hover:border-white/10 hover:bg-zinc-800/50 transition-colors cursor-pointer text-left",
        isActive ? "border border-white/15 bg-zinc-800/50" : "border border-white/5",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {Icon && <Icon size={13} className="text-zinc-500 shrink-0 opacity-45" />}
        <span className="text-xs font-medium text-zinc-300 shrink-0">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {preview && (
          <span className="text-[11px] text-zinc-500">{preview}</span>
        )}
        <ChevronRight size={12} className="text-zinc-600" />
      </div>
    </button>
  );
}
