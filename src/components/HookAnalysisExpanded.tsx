// HookAnalysisExpanded — format-aware Hook Analysis expanded view
// Static: Fix block → 2-up tiles → first impression
// Video: Fix block → scrubber bar → C-style timestamp rows → meta tiles

import { Eye } from "lucide-react";

interface HookAnalysisExpandedProps {
  content: string;
  format: 'video' | 'static';
}

// Parse hook data from markdown content
function parseHookData(content: string) {
  const c = content;
  const verdictMatch = c.match(/Hook (?:Verdict|strength):\s*\[?([^\]\n]+)\]?/i);
  const verdictRaw = verdictMatch?.[1]?.trim() ?? '';
  const verdict = /strong|scroll.?stop/i.test(verdictRaw) ? 'strong' : /weak/i.test(verdictRaw) ? 'weak' : 'needs_work';

  const hookTypeMatch = c.match(/Hook (?:Type|type):\s*\[?([^\]\n]+)\]?/i);
  const hookType = hookTypeMatch?.[1]?.replace(/\*\*/g, '').trim() ?? 'Visual hook';

  const strengthMatch = c.match(/Hook (?:strength|Strength):\s*\[?([^\]\n]+)\]?/i);
  const strengthRaw = strengthMatch?.[1]?.trim() ?? '';
  const strength = /strong|scroll.?stop/i.test(strengthRaw) ? 'strong' : /weak/i.test(strengthRaw) ? 'weak' : 'moderate';

  const scrollStopMatch = c.match(/Scroll.?stop.*?:\s*\[?([^\]\n]+(?:\n(?!\*\*|-\s)[^\n]+)?)\]?/i);
  const scrollStopFactor = scrollStopMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const firstImpressionMatch = c.match(/(?:First (?:3 Seconds|Glance|impression)):\s*\[?([^\]\n]+(?:\n(?!\*\*|-\s)[^\n]+)?)\]?/i);
  const firstImpression = firstImpressionMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const fixMatch = c.match(/Hook Fix:\s*\[?([^\]\n]+)\]?/i);
  const fix = fixMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';
  const noFix = /none needed/i.test(fix);

  return { verdict, hookType, strength, scrollStopFactor, firstImpression, fix, noFix };
}

const STRENGTH_BAR = { strong: { width: '80%', color: '#10b981' }, moderate: { width: '55%', color: '#d97706' }, weak: { width: '30%', color: '#ef4444' } };

export function HookAnalysisExpanded({ content, format }: HookAnalysisExpandedProps) {
  const data = parseHookData(content);

  // Fix block colors
  const fixColors = data.verdict === 'strong'
    ? { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.18)', label: '#10b981', labelText: 'No fix needed' }
    : { bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.18)', label: '#d97706', labelText: 'FIX' };

  const bar = STRENGTH_BAR[data.strength];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Fix block */}
      <div className="rounded-lg" style={{ background: fixColors.bg, border: `0.5px solid ${fixColors.border}`, padding: '10px 12px' }}>
        <span className="text-[10px] font-medium uppercase tracking-[0.04em] block mb-1" style={{ color: fixColors.label }}>{fixColors.labelText}</span>
        <p className="text-xs font-medium text-zinc-200">{data.noFix ? 'Hook is performing well — no changes needed.' : data.fix}</p>
      </div>

      {format === 'static' ? (
        <>
          {/* 2-up tile grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Hook type */}
            <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Hook type</span>
              <span className="text-xs font-medium text-zinc-200">{data.hookType}</span>
            </div>
            {/* Strength */}
            <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Strength</span>
              <span className="text-xs font-medium capitalize" style={{ color: bar.color }}>{data.strength}</span>
              <div className="h-[3px] bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: bar.width, background: bar.color }} />
              </div>
            </div>
            {/* Scroll-stop factor — full width */}
            {data.scrollStopFactor && (
              <div className="col-span-2 bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Scroll-stop factor</span>
                <span className="text-[11px] text-zinc-400 leading-[1.45]">{data.scrollStopFactor}</span>
              </div>
            )}
          </div>

          {/* First impression panel */}
          {data.firstImpression && (
            <div className="flex items-start gap-2.5 bg-white/[0.03] rounded-lg" style={{ padding: '10px 12px' }}>
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Eye size={13} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">First impression</span>
                <p className="text-xs text-zinc-400 leading-relaxed">{data.firstImpression}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* VIDEO: Scrubber bar */}
          <div className="mb-1">
            <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #10b981 0%, #10b981 40%, #d97706 70%, #ef4444 100%)' }} />
            </div>
            <div className="flex justify-between mt-1.5">
              {['0s', '1s', '3s', '5s'].map((ts, i) => (
                <span key={ts} className="text-[9px] font-mono" style={{ color: i < 2 ? '#10b981' : i === 2 ? '#d97706' : '#ef4444' }}>{ts}</span>
              ))}
            </div>
          </div>

          {/* C-style timestamp rows — parsed from content */}
          {(() => {
            const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
            const moments: { ts: string; label: string; text: string; color: string }[] = [];
            for (const line of lines) {
              const tsMatch = line.match(/(\d+:\d+|\d+s)/);
              if (tsMatch) {
                const ts = tsMatch[1];
                const text = line.replace(tsMatch[0], '').replace(/^[\s:—–\-*]+/, '').replace(/\*\*/g, '').trim();
                const tsNum = parseInt(ts);
                const color = tsNum <= 1 ? '#10b981' : tsNum <= 3 ? '#d97706' : '#ef4444';
                moments.push({ ts, label: tsNum === 0 ? 'First frame' : tsNum <= 1 ? 'Hook lands' : tsNum <= 3 ? 'Decision point' : 'Risk zone', text, color });
              }
            }
            if (moments.length === 0) return null;
            return (
              <div className="flex flex-col gap-1 mb-2">
                {moments.slice(0, 4).map((m, i) => (
                  <div key={i} className="flex bg-white/[0.03] rounded-[9px] overflow-hidden">
                    <div className="w-[38px] flex items-center justify-center shrink-0" style={{ borderRight: '0.5px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-[10px] font-medium font-mono" style={{ color: m.color }}>{m.ts}</span>
                    </div>
                    <div className="flex-1 py-2 px-3">
                      <span className="text-[10px] text-zinc-500 block mb-0.5">{m.label}</span>
                      <span className="text-xs font-medium text-zinc-200 leading-snug">{m.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Meta tiles */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Hook type</span>
              <span className="text-xs font-medium text-zinc-200">{data.hookType}</span>
            </div>
            <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Strength</span>
              <span className="text-xs font-medium capitalize" style={{ color: bar.color }}>{data.strength}</span>
              <div className="h-[3px] bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: bar.width, background: bar.color }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
