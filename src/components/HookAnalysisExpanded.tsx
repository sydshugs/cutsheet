// HookAnalysisExpanded — Redesigned for clarity and visual hierarchy
// Cleaner layout with focused sections and better scanability

import { CheckCircle2, Sparkles } from 'lucide-react';

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

// Subdued color palette
const STRENGTH_CONFIG = {
  strong: { percent: 85, color: '#6ee7b7', label: 'Strong', bgColor: 'rgba(110,231,183,0.05)' },
  moderate: { percent: 55, color: '#fcd34d', label: 'Moderate', bgColor: 'rgba(252,211,77,0.05)' },
  weak: { percent: 25, color: '#fca5a5', label: 'Weak', bgColor: 'rgba(252,165,165,0.05)' },
};

const SCRUBBER_DOTS = [
  { ts: '0s', pos: '0%', color: '#6ee7b7' },
  { ts: '1s', pos: '33%', color: '#6ee7b7' },
  { ts: '3s', pos: '66%', color: '#fcd34d' },
  { ts: '5s', pos: '100%', color: '#fca5a5' },
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
    <div className="space-y-3">
      {/* Strength indicator - compact glassmorphism style */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-sm">
        {/* Progress ring */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2.5" />
            <circle 
              cx="18" cy="18" r="14" fill="none" 
              stroke={strengthConfig.color} strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${strengthConfig.percent} 100`}
              style={{ transition: 'stroke-dasharray 0.5s ease', opacity: 0.7 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-zinc-300">{strengthConfig.percent}</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Hook Strength</span>
            <span 
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${strengthConfig.color}15`, color: strengthConfig.color }}
            >
              {strengthConfig.label}
            </span>
          </div>
          <span className="text-xs text-zinc-400">{data.hookType.split(/[—–-]/)[0].trim()}</span>
        </div>
      </div>

      {/* Recommendation - subtle */}
      <div className="rounded-lg p-3 bg-white/[0.015] border border-white/[0.04]">
        <div className="flex items-start gap-2.5">
          <div 
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: isStrong ? 'rgba(110,231,183,0.1)' : 'rgba(252,211,77,0.1)' }}
          >
            {isStrong ? (
              <CheckCircle2 size={12} style={{ color: '#6ee7b7' }} />
            ) : (
              <Sparkles size={12} style={{ color: '#fcd34d' }} />
            )}
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block mb-0.5">
              {isStrong ? 'No Changes Needed' : 'Suggestion'}
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {data.noFix ? 'Hook is performing well' : data.fix}
            </p>
          </div>
        </div>
      </div>

      {format === 'static' ? (
        /* STATIC: Visual insights - simplified */
        <div className="grid grid-cols-2 gap-2">
          {data.scrollStopFactor && (
            <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wide block mb-1">Scroll-Stop</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{data.scrollStopFactor}</p>
            </div>
          )}
          {data.firstImpression && (
            <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wide block mb-1">First Glance</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{data.firstImpression}</p>
            </div>
          )}
        </div>
      ) : (
        /* VIDEO: Timeline view - simplified */
        <>
          {/* Scrubber bar */}
          <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wide block mb-2">Timeline</span>
            <div className="relative">
              <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                <div className="h-full rounded-full w-full" style={{ background: 'linear-gradient(90deg, #6ee7b780 0%, #6ee7b780 40%, #fcd34d80 70%, #fca5a580 100%)' }} />
              </div>
              <div className="flex justify-between mt-1.5">
                {SCRUBBER_DOTS.map(dot => (
                  <span key={dot.ts} className="text-[8px] font-mono text-zinc-600">{dot.ts}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Timestamp moments */}
          {moments.length > 0 && (
            <div className="space-y-1.5">
              {moments.slice(0, 3).map((m, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5">
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0 w-8">{m.ts}</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
