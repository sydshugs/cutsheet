// HookAnalysisExpanded — D3 layout, format-aware
// Shared: D3 split panel (Hook type | Strength)
// Static: Fix block → 2-up tiles (scroll-stop + first impression)
// Video: Fix block → scrubber bar → C-style timestamp rows → meta tiles

interface HookAnalysisExpandedProps {
  content: string;
  format: 'video' | 'static';
}

function parseHookData(content: string) {
  const c = content;
  const verdictMatch = c.match(/Hook (?:Verdict|strength):\s*\[?([^\]\n]+)\]?/i);
  const verdictRaw = verdictMatch?.[1]?.trim() ?? '';
  const verdict = /strong|scroll.?stop/i.test(verdictRaw) ? 'strong' : /weak/i.test(verdictRaw) ? 'weak' : 'needs_work';

  const hookTypeMatch = c.match(/Hook (?:Type|type):\s*\[?([^\]\n]+)\]?/i);
  const hookType = hookTypeMatch?.[1]?.replace(/\*\*/g, '').trim() ?? 'Visual hook';

  const strengthMatch = c.match(/Hook (?:strength|Strength):\s*\[?([^\]\n]+)\]?/i);
  const strengthRaw = strengthMatch?.[1]?.trim() ?? '';
  const strength: 'strong' | 'moderate' | 'weak' = /strong|scroll.?stop/i.test(strengthRaw) ? 'strong' : /weak/i.test(strengthRaw) ? 'weak' : 'moderate';

  // Hook type note — extract explanation after the type
  const hookTypeNote = hookTypeMatch?.[1]?.match(/[—–-]\s*(.+)/)?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const scrollStopMatch = c.match(/Scroll.?stop.*?:\s*\[?([^\]\n]+(?:\n(?!\*\*|-\s)[^\n]+)?)\]?/i);
  const scrollStopFactor = scrollStopMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const firstImpressionMatch = c.match(/(?:First (?:3 Seconds|Glance|impression)):\s*\[?([^\]\n]+(?:\n(?!\*\*|-\s)[^\n]+)?)\]?/i);
  const firstImpression = firstImpressionMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const fixMatch = c.match(/Hook Fix:\s*\[?([^\]\n]+)\]?/i);
  const fix = fixMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';
  const noFix = /none needed/i.test(fix);

  return { verdict, hookType, hookTypeNote, strength, scrollStopFactor, firstImpression, fix, noFix };
}

const STRENGTH_STYLES = {
  strong: { width: '80%', color: '#10b981' },
  moderate: { width: '55%', color: '#d97706' },
  weak: { width: '30%', color: '#ef4444' },
};

const SCRUBBER_DOTS = [
  { ts: '0s', pos: '0%', color: '#10b981' },
  { ts: '1s', pos: '33%', color: '#10b981' },
  { ts: '3s', pos: '66%', color: '#d97706' },
  { ts: '5s', pos: '100%', color: '#ef4444' },
];

export function HookAnalysisExpanded({ content, format }: HookAnalysisExpandedProps) {
  const data = parseHookData(content);
  const bar = STRENGTH_STYLES[data.strength];

  const fixColors = data.verdict === 'strong'
    ? { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.18)', label: '#10b981', labelText: 'No fix needed' }
    : { bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.18)', label: '#d97706', labelText: 'FIX' };

  // Parse video moments from content
  const moments = (() => {
    if (format !== 'video') return [];
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    const result: { ts: string; label: string; text: string; color: string; flag?: string }[] = [];
    for (const line of lines) {
      const tsMatch = line.match(/(\d+:\d+|\d+s)/);
      if (tsMatch) {
        const ts = tsMatch[1];
        const text = line.replace(tsMatch[0], '').replace(/^[\s:—–\-*]+/, '').replace(/\*\*/g, '').trim();
        if (!text || text.length < 5) continue;
        const tsNum = parseInt(ts);
        const color = tsNum <= 1 ? '#10b981' : tsNum <= 3 ? '#d97706' : '#ef4444';
        const label = tsNum === 0 ? 'First frame' : tsNum <= 1 ? 'Hook lands' : tsNum <= 3 ? 'Decision point' : 'Risk zone';
        const flag = /drop.?off|risk|scroll|lose/i.test(text) ? 'dropoff_risk' : /strong|retain|hold/i.test(text) ? 'retention_strong' : undefined;
        result.push({ ts, label, text, color, flag });
      }
    }
    return result.slice(0, 5);
  })();

  return (
    <div>
      {/* D3 Split Panel — shared between static and video */}
      <div className="grid mb-3" style={{ gridTemplateColumns: '1fr 0.5px 1fr', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        {/* Hook type */}
        <div className="p-4">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1.5">Hook type</span>
          <span className="text-lg font-medium leading-tight" style={{ color: '#818cf8' }}>
            {data.hookType.split(/[—–-]/)[0].trim()}
          </span>
          {data.hookTypeNote && (
            <span className="text-[10px] text-zinc-500 block mt-1">{data.hookTypeNote}</span>
          )}
        </div>
        {/* Divider */}
        <div style={{ background: 'rgba(255,255,255,0.06)' }} />
        {/* Strength */}
        <div className="p-4">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1.5">Strength</span>
          <span className="text-base font-medium capitalize" style={{ color: bar.color }}>{data.strength}</span>
          <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: bar.width, background: bar.color }} />
          </div>
        </div>
      </div>

      {/* Fix block */}
      <div className="rounded-lg mb-2" style={{ background: fixColors.bg, border: `0.5px solid ${fixColors.border}`, padding: '12px 14px' }}>
        <span className="text-[10px] font-medium uppercase tracking-[0.04em] block mb-1" style={{ color: fixColors.label }}>{fixColors.labelText}</span>
        <p className="text-xs font-medium text-zinc-200">{data.noFix ? 'Hook is performing well — no changes needed.' : data.fix}</p>
      </div>

      {format === 'static' ? (
        /* STATIC: 2-up tiles */
        <div className="grid grid-cols-2 gap-1.5">
          {data.scrollStopFactor && (
            <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Scroll-stop</span>
              <span className="text-[11px] text-zinc-400 leading-[1.45]">{data.scrollStopFactor}</span>
            </div>
          )}
          {data.firstImpression && (
            <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">First impression</span>
              <span className="text-[11px] text-zinc-400 leading-[1.45]">{data.firstImpression}</span>
            </div>
          )}
        </div>
      ) : (
        /* VIDEO: Scrubber → C-style rows → meta tiles */
        <>
          {/* Scrubber bar */}
          <div className="relative mb-3.5 mt-2">
            <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full w-full" style={{ background: 'linear-gradient(90deg, #10b981 0%, #10b981 40%, #d97706 70%, #ef4444 100%)' }} />
            </div>
            {/* Dots */}
            <div className="relative h-6 mt-[-3px]">
              {SCRUBBER_DOTS.map(dot => (
                <div key={dot.ts} className="absolute flex flex-col items-center" style={{ left: dot.pos, transform: 'translateX(-50%)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: dot.color, border: '1.5px solid var(--bg, #08080F)' }} />
                  <span className="text-[9px] font-mono mt-1" style={{ color: dot.color }}>{dot.ts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* C-style timestamp rows */}
          {moments.length > 0 && (
            <div className="flex flex-col gap-1 mb-2">
              {moments.map((m, i) => (
                <div key={i} className="flex bg-white/[0.03] rounded-[9px] overflow-hidden">
                  <div className="w-[38px] flex items-center justify-center shrink-0" style={{ borderRight: '0.5px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[10px] font-medium font-mono" style={{ color: m.color }}>{m.ts}</span>
                  </div>
                  <div className="flex-1 py-2 px-3">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">{m.label}</span>
                    <span className="text-xs font-medium text-zinc-200 leading-snug">{m.text}</span>
                    {m.flag && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="w-1 h-1 rounded-full" style={{ background: m.flag === 'retention_strong' ? '#10b981' : '#ef4444' }} />
                        <span className="text-[10px] font-medium" style={{ color: m.flag === 'retention_strong' ? '#10b981' : '#ef4444' }}>
                          {m.flag === 'retention_strong' ? 'Retention strong' : 'Drop-off risk'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Meta tiles */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Hook type</span>
              <span className="text-xs font-medium text-zinc-200">{data.hookType.split(/[—–-]/)[0].trim()}</span>
            </div>
            <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 11px' }}>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Strength</span>
              <span className="text-xs font-medium capitalize" style={{ color: bar.color }}>{data.strength}</span>
              <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: bar.width, background: bar.color }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
