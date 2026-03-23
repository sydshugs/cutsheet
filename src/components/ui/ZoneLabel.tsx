import { cn } from "@/src/lib/utils";

interface ZoneLabelProps {
  label: string;
  className?: string;
}

export function ZoneLabel({ label, className }: ZoneLabelProps) {
  return (
    <div className={cn("flex items-center gap-3 my-4", className)}>
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-500 select-none">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}
