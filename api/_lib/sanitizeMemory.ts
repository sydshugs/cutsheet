// api/_lib/sanitizeMemory.ts — Server-side sanitization for AI prompt injection defense
// Defense-in-depth: client sanitizes during assembly, server sanitizes before injection.
//
// NOTE: These regex patterns mirror src/utils/sanitize.ts::stripInjectionPatterns().
// Server-side copy is intentional (different runtime: Node.js serverless vs browser).
// If you add a new pattern, update BOTH locations.
//
// Exports:
//   sanitizeSessionMemory  — session context / memory blobs (~350 tokens max)
//   sanitizeUserInput      — short user strings: filenames, labels (256 chars max)
//   sanitizeAnalysisText   — AI analysis text returned from client (8000 chars max)

const MAX_MEMORY_LENGTH  = 2000  // ~350 tokens — session memory blobs
const MAX_INPUT_LENGTH   = 256   // short user-supplied labels / filenames
const MAX_ANALYSIS_LENGTH = 8000 // ~2000 tokens — Gemini analysis returned via client

/** Shared injection-pattern stripping (pure regex, no DOMPurify — safe in Node.js). */
function stripInjection(s: string): string {
  return s
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
    // Strip HTML tags (prevents XML delimiter escaping attacks)
    .replace(/<[^>]*>/g, '')
    // Strip C0 control characters (except \t \n \r)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/** Strip prompt injection patterns and enforce length limit on sessionMemory */
export function sanitizeSessionMemory(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return ''
  return stripInjection(raw)
    // Also strip fenced code blocks from memory (not needed in analysis text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .trim()
    .slice(0, MAX_MEMORY_LENGTH)
}

/**
 * Sanitize short user-supplied strings (filenames, ad names, labels).
 * Strips injection patterns, HTML, control chars. Max 256 chars.
 */
export function sanitizeUserInput(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return ''
  return stripInjection(raw).trim().slice(0, MAX_INPUT_LENGTH)
}

/**
 * Sanitize longer AI-generated analysis text that passes back through the client.
 * Treats req.body content as untrusted even if it originated from an AI call.
 * Preserves markdown structure (does NOT strip code blocks — analysis may contain them).
 * Max 8000 chars (~2000 tokens).
 */
export function sanitizeAnalysisText(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return ''
  return stripInjection(raw).trim().slice(0, MAX_ANALYSIS_LENGTH)
}
