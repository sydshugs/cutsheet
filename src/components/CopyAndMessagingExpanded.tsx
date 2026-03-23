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
      {/* Copy checklist rows */}
      {data.elements.length > 0 && (
        <div className="flex flex-col gap-1 mb-3">
          {data.elements.map((el, i) => {
            const pass = el.present;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg"
                style={{
                  padding: '8px 11px',
                  background: pass ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.06)',
                  border: pass ? 'none' : '0.5px solid rgba(239,68,68,0.15)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: pass ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}
                >
                  {pass ? (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  )}
                </div>
                {/* Label */}
                <span className="text-xs font-medium flex-1" style={{ color: pass ? '#e4e4e7' : '#ef4444' }}>
                  {el.label}
                </span>
                {/* Value */}
                <span
                  className="text-[11px] text-right max-w-[150px] truncate"
                  style={{ color: pass ? '#71717a' : '#ef4444' }}
                >
                  {pass ? el.value : 'Conversion blocker'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Messaging section */}
      {(data.format || data.coreClaim || data.proofPoints) && (
        <>
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.05em] block mb-2 mt-1">Messaging</span>
          <div className="flex flex-col gap-1.5">
            {data.format && (
              <div className="flex items-start gap-2.5">
                <span className="text-[11px] text-zinc-500 w-[80px] shrink-0">Format</span>
                <span className="text-xs font-medium text-zinc-200 leading-snug">{data.format}</span>
              </div>
            )}
            {data.coreClaim && (
              <div className="flex items-start gap-2.5">
                <span className="text-[11px] text-zinc-500 w-[80px] shrink-0">Core claim</span>
                <span className="text-xs font-medium text-zinc-200 leading-snug">{data.coreClaim}</span>
              </div>
            )}
            {data.proofPoints && (
              <div className="flex items-start gap-2.5">
                <span className="text-[11px] text-zinc-500 w-[80px] shrink-0">Proof points</span>
                <span className="text-xs font-medium text-zinc-200 leading-snug">{data.proofPoints}</span>
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <span className="text-[11px] text-zinc-500 w-[80px] shrink-0">CTA</span>
              <span className="text-xs font-medium leading-snug" style={{ color: data.ctaMissing ? '#ef4444' : '#e4e4e7' }}>
                {data.ctaMissing ? 'None — conversion blocker' : data.ctaText}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Fallback */}
      {data.elements.length === 0 && !data.format && !data.coreClaim && (
        <p className="text-xs text-zinc-400 leading-relaxed">{content.replace(/\*\*/g, '').trim()}</p>
      )}
    </div>
  );
}
