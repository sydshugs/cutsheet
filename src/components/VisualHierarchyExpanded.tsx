// VisualHierarchyExpanded — Redesigned eye-flow visualization with clear visual hierarchy

import { AlertCircle, Eye, ArrowDown, CheckCircle2, XCircle } from "lucide-react";

interface VisualHierarchyExpandedProps {
  content: string;
}

// Subdued color palette for eye-flow steps
const ACTION_CONFIG: Record<string, { verb: string; color: string }> = {
  'first': { verb: 'lands on', color: '#a5b4fc' },
  'second': { verb: 'moves to', color: '#6ee7b7' },
  'third': { verb: 'scans', color: '#fcd34d' },
  'fourth': { verb: 'exits or', color: '#fca5a5' },
  'where': { verb: 'exits at', color: '#fca5a5' },
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
    // Fallback based on index - subdued colors
    const colors = ['#a5b4fc', '#6ee7b7', '#fcd34d', '#fca5a5'];
    const verbs = ['lands on', 'moves to', 'scans', 'exits at'];
    return { color: colors[index] || colors[0], verb: verbs[index] || 'sees' };
  };

  return (
    <div className="space-y-3">
      {/* Eye-tracking flow - simplified */}
      {steps.length > 0 && (
        <div className="space-y-2">
          {steps.slice(0, 4).map((step, i) => {
            const config = getStepConfig(step.element, i);
            
            return (
              <div 
                key={i} 
                className="flex items-start gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-3"
              >
                {/* Step number */}
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-semibold"
                  style={{ background: `${config.color}15`, color: config.color }}
                >
                  {i + 1}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-zinc-300 mb-0.5">
                    {step.element.replace(/^(first|second|third|fourth|where)\s*/i, '').trim() || step.element}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assessment - simplified */}
      {warnings.length > 0 && (
        <div className="rounded-lg p-3 bg-white/[0.015] border border-white/[0.04]">
          <div className="flex items-start gap-2">
            {hasIssue ? (
              <AlertCircle size={12} className="text-amber-400/70 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={12} className="text-emerald-400/70 shrink-0 mt-0.5" />
            )}
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              {warnings[0]}
            </p>
          </div>
        </div>
      )}

      {/* Fallback */}
      {steps.length === 0 && (
        <p className="text-[11px] text-zinc-400 leading-relaxed">{content.replace(/\*\*/g, '').trim()}</p>
      )}
    </div>
  );
}
