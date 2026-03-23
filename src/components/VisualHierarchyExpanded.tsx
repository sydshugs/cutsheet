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
      {/* Numbered eye-flow steps */}
      {steps.length > 0 && (
        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 py-2.5"
              style={{ borderBottom: i < steps.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              {/* Number circle */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-[10px] font-medium text-zinc-400">{i + 1}</span>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-zinc-200">{step.element}</span>
                {step.description && (
                  <span className="text-[11px] text-zinc-500 block mt-0.5 leading-relaxed">{step.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning note — if hierarchy has issues */}
      {hasIssue && warnings.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-lg mt-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.15)', padding: '8px 10px' }}
        >
          <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-[11px] text-zinc-400 leading-relaxed">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Fallback if no steps parsed */}
      {steps.length === 0 && (
        <p className="text-xs text-zinc-400 leading-relaxed">{content.replace(/\*\*/g, '').trim()}</p>
      )}
    </div>
  );
}
