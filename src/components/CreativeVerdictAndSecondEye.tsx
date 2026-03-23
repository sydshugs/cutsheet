// CreativeVerdictAndSecondEye — combined for video format only
// Verdict band → Would scroll alert → Timeline → Fix cards

import type { SecondEyeResult } from "../services/claudeService";

const CATEGORY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  scroll_trigger: { bg: 'rgba(239,68,68,0.08)', color: '#ef4444', label: 'Scroll risk' },
  scroll_risk: { bg: 'rgba(239,68,68,0.08)', color: '#ef4444', label: 'Scroll risk' },
  clarity: { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', label: 'Clarity' },
  sound_off: { bg: 'rgba(251,191,36,0.1)', color: '#d97706', label: 'Sound-off' },
  pacing: { bg: 'rgba(251,191,36,0.1)', color: '#d97706', label: 'Pacing' },
};

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
  const flags = secondEyeResult?.flags ?? [];
  const wouldScroll = !!secondEyeResult?.scrollMoment;
  const scrollTs = secondEyeResult?.scrollMoment;

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

      {/* Would scroll alert */}
      {wouldScroll && scrollTs && (
        <div className="mx-3.5 mt-3 flex items-center gap-2 rounded-[9px] px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.07)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
          <span className="text-[10px] font-medium rounded-full px-1.5 py-px shrink-0" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Would scroll</span>
          <span className="text-[11px] font-mono font-medium shrink-0" style={{ color: '#ef4444' }}>{scrollTs}</span>
          {secondEyeResult?.whatItFails && (
            <span className="text-xs text-zinc-400 truncate">{secondEyeResult.whatItFails}</span>
          )}
        </div>
      )}

      {/* Loading state for second eye */}
      {secondEyeLoading && (
        <div className="px-3.5 py-4 text-center">
          <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-1.5" />
          <span className="text-[11px] text-zinc-500">Analyzing viewer behavior...</span>
        </div>
      )}

      {/* Timeline */}
      {flags.length > 0 && (
        <div className="px-3.5 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em]">Second eye timeline</span>
            <div className="flex items-center gap-3">
              {[
                { label: 'Scroll risk', color: '#ef4444' },
                { label: 'Clarity', color: '#818cf8' },
                { label: 'Sound-off', color: '#d97706' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-[10px] text-zinc-600">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Bar */}
          <div className="relative h-1 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full w-full" style={{
              background: `linear-gradient(90deg, ${flags.map((f, i) => {
                const pct = (i / Math.max(flags.length - 1, 1)) * 100;
                const cat = CATEGORY_STYLES[f.category];
                return `${cat?.color ?? '#71717a'} ${pct}%`;
              }).join(', ')})`,
            }} />
          </div>
          {/* Timestamp labels */}
          <div className="flex justify-between mb-2.5">
            {flags.slice(0, 5).map((f, fi) => (
              <span key={fi} className="text-[9px] font-mono" style={{ color: CATEGORY_STYLES[f.category]?.color ?? '#71717a' }}>{f.timestamp}</span>
            ))}
          </div>
        </div>
      )}

      {/* Fix cards */}
      {flags.length > 0 && (
        <div className="px-3.5 pb-3.5 flex flex-col gap-[5px]">
          {flags.map((flag, fi) => {
            const catStyle = CATEGORY_STYLES[flag.category] ?? { bg: 'rgba(161,161,170,0.08)', color: '#a1a1aa', label: flag.category };
            return (
              <div key={fi} className="bg-white/[0.03] rounded-[9px]" style={{ padding: '10px 12px' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium rounded-full px-1.5 py-px" style={{ background: catStyle.bg, color: catStyle.color }}>{catStyle.label}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{flag.timestamp}</span>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Fix</span>
                <p className="text-xs font-medium text-zinc-200 leading-snug">{flag.fix}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
