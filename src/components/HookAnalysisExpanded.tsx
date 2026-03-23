// HookAnalysisExpanded — Redesigned for clarity and visual hierarchy
// Cleaner layout with focused sections and better scanability

import { Eye, Zap, Target, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

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

const STRENGTH_CONFIG = {
  strong: { percent: 85, color: '#10b981', label: 'Strong', bgColor: 'rgba(16,185,129,0.08)' },
  moderate: { percent: 55, color: '#f59e0b', label: 'Moderate', bgColor: 'rgba(245,158,11,0.08)' },
  weak: { percent: 25, color: '#ef4444', label: 'Weak', bgColor: 'rgba(239,68,68,0.08)' },
};

const SCRUBBER_DOTS = [
  { ts: '0s', pos: '0%', color: '#10b981' },
  { ts: '1s', pos: '33%', color: '#10b981' },
  { ts: '3s', pos: '66%', color: '#f59e0b' },
  { ts: '5s', pos: '100%', color: '#ef4444' },
];

export function HookAnalysisExpanded({ content, format }: HookAnalysisExpandedProps) {
  const data = parseHookData(content);
  const strengthConfig = STRENGTH_CONFIG[data.strength];
  const isStrong = data.verdict === 'strong';

  // Parse video moments
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
    <div className="space-y-4">
      {/* Hero stat card — Strength score as the focal point */}
      <div 
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: strengthConfig.bgColor, border: `1px solid ${strengthConfig.color}20` }}
      >
        {/* Background glow */}
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ background: strengthConfig.color }}
        />
        
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: strengthConfig.color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Hook Strength</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold" style={{ color: strengthConfig.color }}>{strengthConfig.percent}</span>
              <span className="text-lg text-zinc-500">/100</span>
            </div>
            <span 
              className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${strengthConfig.color}20`, color: strengthConfig.color }}
            >
              {strengthConfig.label}
            </span>
          </div>
          
          {/* Circular progress indicator */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle 
                cx="18" cy="18" r="15" fill="none" 
                stroke={strengthConfig.color} strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${strengthConfig.percent} 100`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isStrong ? (
                <CheckCircle2 size={18} style={{ color: strengthConfig.color }} />
              ) : (
                <AlertTriangle size={18} style={{ color: strengthConfig.color }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hook type pill */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
          <Target size={18} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-0.5">Hook Type</span>
          <span className="text-sm font-semibold text-zinc-200">{data.hookType.split(/[—–-]/)[0].trim()}</span>
        </div>
      </div>

      {/* Recommendation callout */}
      <div 
        className="rounded-xl p-4"
        style={{ 
          background: isStrong ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)', 
          border: `1px solid ${isStrong ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}` 
        }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: isStrong ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }}
          >
            {isStrong ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <Sparkles size={16} className="text-amber-400" />
            )}
          </div>
          <div>
            <span 
              className="text-xs font-semibold block mb-1"
              style={{ color: isStrong ? '#10b981' : '#f59e0b' }}
            >
              {isStrong ? 'No Changes Needed' : 'Suggested Improvement'}
            </span>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              {data.noFix ? 'Your hook is performing well. It effectively captures attention and drives engagement.' : data.fix}
            </p>
          </div>
        </div>
      </div>

      {format === 'static' ? (
        /* STATIC: Visual insights cards */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye size={12} className="text-zinc-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Visual Insights</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {data.scrollStopFactor && (
              <div className="rounded-xl bg-gradient-to-br from-cyan-500/[0.06] to-transparent border border-cyan-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Scroll-Stop Factor</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{data.scrollStopFactor}</p>
              </div>
            )}
            {data.firstImpression && (
              <div className="rounded-xl bg-gradient-to-br from-violet-500/[0.06] to-transparent border border-violet-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">First Impression</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{data.firstImpression}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIDEO: Timeline view */
        <>
          {/* Scrubber bar */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-3">Attention Timeline</span>
            <div className="relative">
              <div className="h-2 rounded-full overflow-hidden bg-white/[0.04]">
                <div className="h-full rounded-full w-full" style={{ background: 'linear-gradient(90deg, #10b981 0%, #10b981 40%, #d97706 70%, #ef4444 100%)' }} />
              </div>
              <div className="relative h-6 mt-1">
                {SCRUBBER_DOTS.map(dot => (
                  <div key={dot.ts} className="absolute flex flex-col items-center" style={{ left: dot.pos, transform: 'translateX(-50%)' }}>
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-zinc-900" style={{ background: dot.color }} />
                    <span className="text-[9px] font-mono mt-1" style={{ color: dot.color }}>{dot.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timestamp moments */}
          {moments.length > 0 && (
            <div className="space-y-2">
              {moments.map((m, i) => (
                <div key={i} className="flex rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
                  <div className="w-14 flex items-center justify-center shrink-0 border-r border-white/[0.05]" style={{ background: `${m.color}10` }}>
                    <span className="text-xs font-bold font-mono" style={{ color: m.color }}>{m.ts}</span>
                  </div>
                  <div className="flex-1 py-3 px-4">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">{m.label}</span>
                    <span className="text-sm text-zinc-200 leading-relaxed">{m.text}</span>
                    {m.flag && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.flag === 'retention_strong' ? '#10b981' : '#ef4444' }} />
                        <span className="text-[10px] font-semibold" style={{ color: m.flag === 'retention_strong' ? '#10b981' : '#ef4444' }}>
                          {m.flag === 'retention_strong' ? 'Retention strong' : 'Drop-off risk'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
