// ErrorFallback — lightweight error state for sections that fail to render
import { AlertCircle } from "lucide-react";

interface ErrorFallbackProps {
  section?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ section, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
      <AlertCircle size={14} className="text-red-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-300">
          {section ? `${section} unavailable` : 'Section unavailable'}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5">Analysis data could not be loaded.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer bg-transparent border-none shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}
