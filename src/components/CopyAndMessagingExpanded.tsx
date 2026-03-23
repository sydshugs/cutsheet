// CopyAndMessagingExpanded — combined Visual Copy Inventory + Messaging Structure
// Checklist rows (Brand, Headline, Body, CTA) + messaging key/value rows

interface CopyAndMessagingExpandedProps {
  content: string;
}

interface CopyElement {
  label: string;
  present: boolean;
  value: string;
}

function parseCopyAndMessaging(content: string) {
  const c = content;

  // Parse copy elements
  const elements: CopyElement[] = [];
  const elementPatterns = [
    { label: 'Brand', re: /\[?Brand\]?[:\s]*\*?\*?\s*(.+)/i },
    { label: 'Headline', re: /\[?Headline\]?[:\s]*\*?\*?\s*(.+)/i },
    { label: 'Body copy', re: /\[?Body(?:\s*copy)?\]?[:\s]*\*?\*?\s*(.+)/i },
    { label: 'CTA', re: /\[?CTA\]?[:\s]*\*?\*?\s*(.+)/i },
  ];

  for (const { label, re } of elementPatterns) {
    const match = c.match(re);
    if (match) {
      const value = match[1].replace(/\*\*/g, '').trim();
      const isMissing = /none|missing|no\s*(explicit\s*)?(cta|call)|absent|not\s*present/i.test(value);
      elements.push({ label, present: !isMissing, value: isMissing ? '' : value });
    }
  }

  // If no elements parsed, try to detect from bullet structure
  if (elements.length === 0) {
    const lines = c.split('\n');
    for (const line of lines) {
      const bulletMatch = line.match(/^[-*]\s*\*?\*?(.+?)\*?\*?[:\s]+(.+)/);
      if (bulletMatch) {
        const label = bulletMatch[1].trim();
        const value = bulletMatch[2].replace(/\*\*/g, '').trim();
        const isMissing = /none|missing|no\s/i.test(value);
        if (/brand|headline|body|copy|cta|call/i.test(label)) {
          elements.push({ label, present: !isMissing, value: isMissing ? '' : value });
        }
      }
    }
  }

  // Parse messaging fields
  const formatMatch = c.match(/\*?\*?Format\*?\*?[:\s]+(.+)/i);
  const format = formatMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const claimMatch = c.match(/\*?\*?Core claim\*?\*?[:\s]+(.+)/i);
  const coreClaim = claimMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const proofMatch = c.match(/\*?\*?Proof points?\*?\*?[:\s]+(.+)/i);
  const proofPoints = proofMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';

  const ctaMatch = c.match(/\*?\*?CTA\*?\*?[:\s]+(.+)/i);
  const ctaText = ctaMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';
  const ctaMissing = /none|missing|no\s*(explicit\s*)?(cta|call)|flag|absent/i.test(ctaText);

  return { elements, format, coreClaim, proofPoints, ctaText, ctaMissing };
}

export function CopyAndMessagingExpanded({ content }: CopyAndMessagingExpandedProps) {
  const data = parseCopyAndMessaging(content);

  return (
    <div>
      {/* Copy checklist — cleaner card rows */}
      {data.elements.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {data.elements.map((el, i) => {
            const pass = el.present;
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  background: pass ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.04)',
                  border: pass ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(239,68,68,0.1)',
                }}
              >
                {/* Status icon */}
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: pass ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}
                >
                  {pass ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  )}
                </div>
                {/* Label */}
                <span className="text-[13px] font-medium flex-1" style={{ color: pass ? '#e4e4e7' : '#fca5a5' }}>
                  {el.label}
                </span>
                {/* Value */}
                <span
                  className="text-xs text-right max-w-[140px] truncate"
                  style={{ color: pass ? '#71717a' : '#f87171' }}
                >
                  {pass ? el.value : 'Missing'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Messaging section */}
      {(data.format || data.coreClaim || data.proofPoints) && (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-3">Messaging</span>
          <div className="flex flex-col gap-2.5">
            {data.format && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] text-zinc-500 w-20 shrink-0">Format</span>
                <span className="text-[13px] font-medium text-zinc-200 leading-relaxed">{data.format}</span>
              </div>
            )}
            {data.coreClaim && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] text-zinc-500 w-20 shrink-0">Claim</span>
                <span className="text-[13px] font-medium text-zinc-200 leading-relaxed">{data.coreClaim}</span>
              </div>
            )}
            {data.proofPoints && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] text-zinc-500 w-20 shrink-0">Proof</span>
                <span className="text-[13px] font-medium text-zinc-200 leading-relaxed">{data.proofPoints}</span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-zinc-500 w-20 shrink-0">CTA</span>
              <span className="text-[13px] font-medium leading-relaxed" style={{ color: data.ctaMissing ? '#f87171' : '#e4e4e7' }}>
                {data.ctaMissing ? 'None — conversion blocker' : data.ctaText}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fallback */}
      {data.elements.length === 0 && !data.format && !data.coreClaim && (
        <p className="text-[13px] text-zinc-400 leading-relaxed">{content.replace(/\*\*/g, '').trim()}</p>
      )}
    </div>
  );
}
