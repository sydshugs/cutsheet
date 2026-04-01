// HookAnalysisExpanded — pixel-matched to Figma node 217:1894 (Hook Analysis section)
// Content box + hook type tag + indigo suggestion callout

import { Lightbulb } from 'lucide-react';

interface HookAnalysisExpandedProps {
  content: string;
  format: 'video' | 'static';
  platform?: string;
}

const HOOK_TYPE_CATEGORIES: Record<string, { label: string }> = {
  question:       { label: 'Question Hook' },
  curiosity:      { label: 'Curiosity Hook' },
  pattern:        { label: 'Pattern Interrupt' },
  'social proof': { label: 'Social Proof Hook' },
  authority:      { label: 'Authority Hook' },
  pain:           { label: 'Pain Point Hook' },
  story:          { label: 'Story Hook' },
  visual:         { label: 'Visual Hook' },
  contrast:       { label: 'Contrast Hook' },
  statistics:     { label: 'Stat/Data Hook' },
  humor:          { label: 'Humor Hook' },
  benefit:        { label: 'Benefit Led Hook' },
};

const PLATFORM_HOOK_CONTEXT: Record<string, string> = {
  'Meta':            'Pattern Interrupt hooks on Meta have 2× higher thumb-stop than Benefit Led hooks',
  'TikTok':          'Pattern Interrupt hooks on TikTok have 31% higher scroll-stop rate than Benefit Led hooks',
  'Instagram':       'Visual-first hooks retain Reels viewers past 3s',
  'Instagram Reels': 'Story or Contrast hooks retain Reels viewers past 3s',
  'YouTube':         'Authority or Stats hooks survive the 5s skip window',
  'YouTube Shorts':  'Curiosity loop hooks maximize Shorts replays',
  'Google Display':  'Pain Point or Contrast headlines lift Display CTR',
  'LinkedIn':        'Value-first hooks drive professional engagement',
};

const ALTERNATIVE_HOOKS: Record<string, string> = {
  'Meta':            'Try a Problem First hook instead — opening with the viewer\'s pain point typically outperforms Benefit Led on Meta for DTC brands.',
  'TikTok':          'Try a Pattern Interrupt or Curiosity hook instead — these perform best on TikTok for scroll-stopping.',
  'Instagram Reels': 'Try a Story or Contrast hook instead — these retain Reels viewers past the 3s mark.',
  'YouTube':         'Try an Authority or Stats hook instead — it survives the 5s skip window better.',
  'YouTube Shorts':  'Try a Curiosity loop hook — it maximizes Shorts replays.',
  'Google Display':  'Try a Pain Point or Contrast headline — it lifts Display CTR.',
};

function classifyHookType(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, val] of Object.entries(HOOK_TYPE_CATEGORIES)) {
    if (lower.includes(key)) return val.label;
  }
  return raw.split(/[—–-]/)[0].trim() || 'Visual Hook';
}

function parseHookData(content: string) {
  const c = content;

  const hookTypeMatch = c.match(/Hook (?:Type|type):\s*\[?([^\]\n]+)\]?/i);
  const hookType = hookTypeMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const hookTypeNote = hookType.match(/[—–-]\s*(.+)/)?.[1]?.replace(/\*\*/g, '').trim() ?? '';
  const hookTypeLabel = classifyHookType(hookType);

  const strengthMatch = c.match(/Hook (?:strength|Strength):\s*\[?([^\]\n]+)\]?/i);
  const strengthRaw = strengthMatch?.[1]?.trim() ?? '';
  const isWeak = /weak/i.test(strengthRaw);

  const firstImpressionMatch = c.match(/(?:First (?:3 Seconds|Glance|impression)):\s*\[?([^\]\n]+(?:\n(?!\*\*|-\s)[^\n]+)?)\]?/i);
  const firstImpression = firstImpressionMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const scrollStopMatch = c.match(/Scroll.?stop.*?:\s*\[?([^\]\n]+(?:\n(?!\*\*|-\s)[^\n]+)?)\]?/i);
  const scrollStop = scrollStopMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const fixMatch = c.match(/Hook Fix:\s*\[?([^\]\n]+)\]?/i);
  const fix = fixMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';
  const noFix = /none needed/i.test(fix);

  // Main paragraph — use firstImpression, scrollStop, or fallback to cleaned content lines
  let mainText = firstImpression || scrollStop;
  if (!mainText) {
    mainText = c
      .replace(/\*\*/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 20 && !l.startsWith('#') && !l.match(/^Hook (Type|strength|Fix|Verdict):/i))
      .slice(0, 2)
      .join(' ');
  }

  return { hookTypeLabel, hookTypeNote, isWeak, mainText, fix, noFix };
}

export function HookAnalysisExpanded({ content, platform }: HookAnalysisExpandedProps) {
  const data = parseHookData(content);
  const contextNote = data.hookTypeNote || (platform ? PLATFORM_HOOK_CONTEXT[platform] : null);
  const suggestion = !data.noFix && data.fix
    ? data.fix
    : (data.isWeak && platform ? ALTERNATIVE_HOOKS[platform] : null);

  return (
    <div className="flex flex-col gap-[13px]">
      {/* Main content box */}
      <div
        className="flex flex-col gap-[15px] rounded-[13px] p-[18px]"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        {/* Main paragraph */}
        {data.mainText && (
          <p className="text-[14px] text-[#d4d4d8] leading-[1.6]">
            {data.mainText}
          </p>
        )}

        {/* Hook type tag + context */}
        {data.hookTypeLabel && (
          <div className="flex items-start gap-[11px]">
            {/* Tag pill */}
            <div
              className="shrink-0 px-[9px] py-[2px] rounded-[4px] text-[12px] font-medium text-[#d4d4d8] whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              {data.hookTypeLabel}
            </div>
            {/* Context description */}
            {contextNote && (
              <p className="text-[13px] text-[#71717b] leading-[1.5]">
                {contextNote}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Suggestion box */}
      {suggestion && (
        <div
          className="relative rounded-[13px] overflow-hidden px-[17px] py-[18px]"
          style={{ background: 'rgba(97,95,255,0.03)', border: '1px solid rgba(97,95,255,0.10)' }}
        >
          {/* Subtle gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(158deg, rgba(97,95,255,0.05) 0%, rgba(0,0,0,0) 100%)' }}
          />
          <div className="relative flex items-start gap-[11px]">
            <Lightbulb size={15} className="shrink-0 mt-[2px]" style={{ color: '#a3b3ff' }} />
            <p className="text-[14px] leading-[1.6]" style={{ color: 'rgba(198,210,255,0.8)' }}>
              {suggestion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
