// CreativeVerdictAndSecondEye — combined for video format only
// Verdict band → SecondEyePanel (full expandable panel with timeline + flag cards)
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
  not_ready: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Not ready' },
  needs_work: { bg: 'rgba(251,191,36,0.12)', color: '#d97706', label: 'Needs work' },
  ready: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Strong' },
};

export function CreativeVerdictAndSecondEye({
  verdictOneLiner,
  verdictDetail,
  verdictState,
  secondEyeResult,
  secondEyeLoading,
}: CreativeVerdictAndSecondEyeProps) {
  const chip = VERDICT_CHIP[verdictState];

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden mt-3" style={{ background: 'var(--surface, rgba(255,255,255,0.02))' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" className="opacity-40"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span className="text-[13px] font-medium text-zinc-200">Creative verdict & second eye</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-600">Fresh viewer perspective</span>
          <span className="text-[10px] font-medium rounded-full px-1.5 py-px" style={{ background: chip.bg, color: chip.color }}>{chip.label}</span>
        </div>
      </div>

      {/* Creative verdict band */}
      <div className="flex items-start gap-2.5 px-3.5 py-3" style={{ background: 'rgba(251,191,36,0.05)', borderBottom: '0.5px solid rgba(251,191,36,0.12)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.12)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-[0.04em] block mb-1" style={{ color: '#d97706' }}>Creative verdict</span>
          <p className="text-[13px] font-medium text-zinc-100 leading-[1.45] mb-1">{verdictOneLiner}</p>
          {verdictDetail && <p className="text-xs text-zinc-400 leading-relaxed">{verdictDetail}</p>}
        </div>
      </div>

      {/* Second Eye — full panel with expandable flag cards, timeline, scroll alert */}
      <div className="px-3.5 py-3">
        <SecondEyePanel
          result={secondEyeResult ?? null}
          loading={secondEyeLoading ?? false}
        />
      </div>
    </div>
  );
}
