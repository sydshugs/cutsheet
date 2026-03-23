// VisualHierarchyExpanded — Redesigned eye-flow visualization with clear visual hierarchy

import { AlertCircle, Eye, ArrowDown, CheckCircle2, XCircle } from "lucide-react";

interface VisualHierarchyExpandedProps {
  content: string;
}

// Action word mappings for visual variety
const ACTION_CONFIG: Record<string, { verb: string; color: string }> = {
  'first': { verb: 'lands on', color: '#818cf8' },
  'second': { verb: 'moves to', color: '#10b981' },
  'third': { verb: 'scans', color: '#f59e0b' },
  'fourth': { verb: 'exits or', color: '#ef4444' },
  'where': { verb: 'exits at', color: '#ef4444' },
};

export function VisualHierarchyExpanded({ content }: VisualHierarchyExpandedProps) {
  // Parse numbered steps from markdown
  const steps: { element: string; description: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const numMatch = line.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?\s*(?:the eye|:|—|–|-)\s*(.*)/i);
    if (numMatch) {
      steps.push({
        element: numMatch[1].replace(/\*\*/g, '').replace(/:$/, '').trim(),
        description: numMatch[2].replace(/\*\*/g, '').trim(),
      });
      continue;
    }
    const boldMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*[:\s]*(.+)/);
    if (boldMatch && !steps.find(s => s.element === boldMatch[1].trim())) {
      steps.push({
        element: boldMatch[1].trim(),
        description: boldMatch[2].trim(),
      });
    }
  }

  // Parse warning/effectiveness notes
  const warnings: string[] = [];
  for (const line of lines) {
    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      const text = bulletMatch[1].replace(/\*\*/g, '').trim();
      if (text.length > 15) warnings.push(text);
    }
  }

  // Detect issues
  const hasIssue = /no.*cta|stuck|exit|missing|lacks|not.*effective|competing/i.test(content);
  const isEffective = /effective|clear|strong|good/i.test(content) && !hasIssue;

  // Get config for each step
  const getStepConfig = (element: string, index: number) => {
    const lowerElement = element.toLowerCase();
    for (const [key, config] of Object.entries(ACTION_CONFIG)) {
      if (lowerElement.includes(key)) return config;
    }
    // Fallback based on index
    const colors = ['#818cf8', '#10b981', '#f59e0b', '#ef4444'];
    const verbs = ['lands on', 'moves to', 'scans', 'exits at'];
    return { color: colors[index] || colors[0], verb: verbs[index] || 'sees' };
  };

  return (
    <div className="space-y-4">
      {/* Eye-tracking flow visualization */}
      {steps.length > 0 && (
        <div className="relative">
          {/* Section header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Eye size={12} className="text-indigo-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Eye-Tracking Flow</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
            <span className="text-[10px] text-zinc-600">{steps.length} elements</span>
          </div>

          {/* Flow timeline */}
          <div className="relative pl-4">
            {/* Vertical connecting line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-indigo-500/50 via-emerald-500/50 to-red-500/30" />
            
            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, i) => {
                const config = getStepConfig(step.element, i);
                const isLast = i === steps.length - 1;
                const isExitPoint = step.element.toLowerCase().includes('where') || step.element.toLowerCase().includes('exit');
                
                return (
                  <div key={i} className="relative">
                    {/* Timeline node */}
                    <div 
                      className="absolute left-[-4px] top-4 w-4 h-4 rounded-full border-[3px] z-10"
                      style={{ 
                        backgroundColor: config.color,
                        borderColor: '#0a0a0f',
                        boxShadow: `0 0 10px ${config.color}40`
                      }}
                    />
                    
                    {/* Step card */}
                    <div 
                      className="ml-6 rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
                      style={{ 
                        background: `linear-gradient(135deg, ${config.color}08, transparent)`,
                        border: `1px solid ${config.color}15`
                      }}
                    >
                      {/* Step header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                          style={{ background: `${config.color}20`, color: config.color }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span 
                          className="text-[10px] font-medium uppercase tracking-wide"
                          style={{ color: config.color }}
                        >
                          {config.verb}
                        </span>
                        {isExitPoint && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                            Exit Point
                          </span>
                        )}
                      </div>
                      
                      {/* Element name - prominent */}
                      <p className="text-sm font-semibold text-zinc-100 mb-1">
                        {step.element.replace(/^(first|second|third|fourth|where)\s*/i, '').trim() || step.element}
                      </p>
                      
                      {/* Description */}
                      {step.description && (
                        <p className="text-[12px] text-zinc-500 leading-relaxed">
                          {step.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Arrow between steps */}
                    {!isLast && (
                      <div className="absolute left-[3px] bottom-[-10px] z-20">
                        <ArrowDown size={10} className="text-zinc-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hierarchy effectiveness assessment */}
      {warnings.length > 0 && (
        <div 
          className="rounded-xl p-4"
          style={{ 
            background: hasIssue ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
            border: `1px solid ${hasIssue ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}`
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: hasIssue ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)' }}
            >
              {hasIssue ? (
                <AlertCircle size={16} className="text-amber-400" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <span 
                className="text-xs font-semibold block mb-2"
                style={{ color: hasIssue ? '#f59e0b' : '#10b981' }}
              >
                {hasIssue ? 'Hierarchy Assessment' : 'Effective Flow'}
              </span>
              <div className="space-y-2">
                {warnings.map((w, i) => (
                  <p key={i} className="text-[12px] text-zinc-400 leading-relaxed">{w}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick verdict bar */}
      {steps.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Flow Verdict</span>
          </div>
          <div className="flex items-center gap-2">
            {hasIssue ? (
              <>
                <XCircle size={14} className="text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Needs clear exit action</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Clear reading path</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fallback */}
      {steps.length === 0 && (
        <p className="text-[13px] text-zinc-400 leading-relaxed">{content.replace(/\*\*/g, '').trim()}</p>
      )}
    </div>
  );
}
