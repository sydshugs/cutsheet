// api/_lib/sanitizeMemory.ts — Server-side sanitization for sessionMemory before prompt injection
// Defense-in-depth: client sanitizes during assembly, server sanitizes before injection.
//
// NOTE: These regex patterns mirror src/utils/sanitize.ts::stripInjectionPatterns().
// Server-side copy is intentional (different runtime: Node.js serverless vs browser).
// If you add a new pattern, update BOTH locations.

const MAX_MEMORY_LENGTH = 2000 // ~350 tokens, 3 analyses max

/** Strip prompt injection patterns and enforce length limit on sessionMemory */
export function sanitizeSessionMemory(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return ''

  const cleaned = raw
    // Common override commands
    .replace(/ignore\s+(previous|above|all)\s+instructions?/gi, '')
    .replace(/disregard\s+(previous|above|all)\s+instructions?/gi, '')
    .replace(/forget\s+(everything|all|previous|prior)/gi, '')
    // Role / persona hijacking
    .replace(/you\s+are\s+(now|a|an)/gi, '')
    .replace(/act\s+as\s+(a|an|if)/gi, '')
    .replace(/pretend\s+(to\s+be|you\s+are)/gi, '')
    // System / meta prompt leakage
    .replace(/system\s*prompt/gi, '')
    .replace(/###\s*(instruction|system|human|assistant)/gi, '')
    // LLM special tokens
    .replace(/\[INST\]|\[\/INST\]/g, '')
    .replace(/<\|im_start\|>|<\|im_end\|>/g, '')
    .replace(/<\|system\|>|<\|user\|>|<\|assistant\|>/g, '')
    // Strip fenced code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, MAX_MEMORY_LENGTH)

  return cleaned
}
