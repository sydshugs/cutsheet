// VisualHierarchyExpanded — numbered eye-flow steps + optional warning note

import { AlertCircle } from "lucide-react";

interface VisualHierarchyExpandedProps {
  content: string;
}

export function VisualHierarchyExpanded({ content }: VisualHierarchyExpandedProps) {
  // Parse numbered steps from markdown
  const steps: { element: string; description: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Match numbered items: "1. **First element** the eye lands on: ..."
    const numMatch = line.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?\s*(?:the eye|:|—|–|-)\s*(.*)/i);
    if (numMatch) {
      steps.push({
        element: numMatch[1].replace(/\*\*/g, '').replace(/:$/, '').trim(),
        description: numMatch[2].replace(/\*\*/g, '').trim(),
      });
      continue;
    }
    // Also match "**Element name**: description" or "**Element name** description"
    const boldMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*[:\s]*(.+)/);
    if (boldMatch && !steps.find(s => s.element === boldMatch[1].trim())) {
      steps.push({
        element: boldMatch[1].trim(),
        description: boldMatch[2].trim(),
      });
    }
  }

  // Parse warning/effectiveness notes (bullet points at the end)
  const warnings: string[] = [];
  for (const line of lines) {
    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      const text = bulletMatch[1].replace(/\*\*/g, '').trim();
      if (text.length > 15) warnings.push(text);
    }
  }

  // Detect if hierarchy has issues
  const hasIssue = /no.*cta|stuck|exit|missing|lacks|not.*effective|competing/i.test(content);

  return (
    <div>
      {/* Eye-flow steps — cleaner card style */}
      {steps.length > 0 && (
        <div className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors"
            >
              {/* Step number */}
              <div className="w-6 h-6 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-zinc-400">{i + 1}</span>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <span className="text-[13px] font-medium text-zinc-200">{step.element}</span>
                {step.description && (
                  <span className="text-[11px] text-zinc-500 block mt-1 leading-relaxed">{step.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning note */}
      {hasIssue && warnings.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl mt-3 p-3.5 bg-red-500/[0.04] border border-red-500/10">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-zinc-400 leading-relaxed">{w}</p>
            ))}
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
