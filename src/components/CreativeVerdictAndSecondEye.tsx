// CreativeVerdictAndSecondEye — combined for video format only
// Verdict band → SecondEyePanel (full expandable panel with timeline + flag cards)
// Enhanced with motion-specific annotations and unified styling
import { useMemo } from "react";
import { Eye, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import type { SecondEyeResult } from "../services/claudeService";
import { SecondEyePanel } from "./SecondEyePanel";

interface CreativeVerdictAndSecondEyeProps {
  verdictOneLiner: string;
  verdictDetail: string;
  verdictState: 'not_ready' | 'needs_work' | 'ready';
  secondEyeResult?: SecondEyeResult | null;
  secondEyeLoading?: boolean;
}

const VERDICT_CHIP = {
  not_ready: { 
    bg: 'rgba(239,68,68,0.1)', 
    color: '#ef4444', 
    label: 'Not ready',
    icon: AlertCircle,
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)',
    borderColor: 'rgba(239,68,68,0.15)'
  },
  needs_work: { 
    bg: 'rgba(251,191,36,0.12)', 
    color: '#d97706', 
    label: 'Needs work',
    icon: TrendingUp,
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 100%)',
    borderColor: 'rgba(251,191,36,0.15)'
  },
  ready: { 
    bg: 'rgba(16,185,129,0.1)', 
    color: '#10b981', 
    label: 'Strong',
    icon: CheckCircle,
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)',
    borderColor: 'rgba(16,185,129,0.15)'
  },
};

export function CreativeVerdictAndSecondEye({
  verdictOneLiner,
  verdictDetail,
  verdictState,
  secondEyeResult,
  secondEyeLoading,
}: CreativeVerdictAndSecondEyeProps) {
  const chip = VERDICT_CHIP[verdictState];
  const ChipIcon = chip.icon;

  // Count critical issues from second eye flags
  const criticalCount = useMemo(() => {
    if (!secondEyeResult?.flags) return 0;
    return secondEyeResult.flags.filter(f => 
      f.category === 'scroll_trigger' || f.severity === 'critical'
    ).length;
  }, [secondEyeResult]);

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden mt-3" style={{ background: 'var(--surface, rgba(255,255,255,0.02))' }}>
      {/* Header — Enhanced with status chip and critical count */}
      <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Eye size={13} className="text-zinc-500 opacity-60" />
          <span className="text-[13px] font-medium text-zinc-200">Creative verdict & second eye</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-600">Fresh viewer perspective</span>
          <span 
            className="text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1" 
            style={{ background: chip.bg, color: chip.color }}
          >
            <ChipIcon size={10} />
            {chip.label}
          </span>
        </div>
      </div>

      {/* Creative verdict band — Enhanced visual hierarchy */}
      <div 
        className="flex items-start gap-3 px-4 py-4" 
        style={{ 
          background: chip.gradient,
          borderBottom: `0.5px solid ${chip.borderColor}` 
        }}
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" 
          style={{ background: `${chip.color}15` }}
        >
          <TrendingUp size={16} style={{ color: chip.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className="text-[10px] font-semibold uppercase tracking-[0.05em]" 
              style={{ color: chip.color }}
            >
              Creative verdict
            </span>
            {criticalCount > 0 && verdictState !== 'ready' && (
              <span className="text-[10px] text-zinc-500">
                {criticalCount} critical {criticalCount === 1 ? 'fix' : 'fixes'}
              </span>
            )}
          </div>
          <p className="text-[14px] font-medium text-zinc-100 leading-[1.5] mb-1">
            {verdictOneLiner}
          </p>
          {verdictDetail && (
            <p className="text-[12px] text-zinc-400 leading-relaxed">
              {verdictDetail}
            </p>
          )}
        </div>
      </div>

      {/* Second Eye — full panel with expandable flag cards, timeline, scroll alert */}
      <SecondEyePanel
        result={secondEyeResult ?? null}
        loading={secondEyeLoading ?? false}
      />
    </div>
  );
}
