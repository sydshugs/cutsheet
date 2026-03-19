// src/utils/sanitize.ts — Central input sanitization and validation
// Addresses OWASP LLM01 (Prompt Injection), LLM05 (Unsafe Outputs), LLM02 (Sensitive Data)

import DOMPurify from 'dompurify'

// ─── DISPLAY SANITIZATION ─────────────────────────────────────────────────────

/** Strip HTML tags and dangerous characters for display in the UI */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
    .trim()
    .slice(0, 500)
}

// ─── AI PROMPT INJECTION PREVENTION ─────────────────────────────────────────
// OWASP LLM01: strip patterns commonly used in prompt injection attacks
// before user-supplied strings are interpolated into AI prompts.

/** Sanitize a string for safe injection into an AI prompt */
export const sanitizeForAI = (input: string): string => {
  if (!input || typeof input !== 'string') return ''

  const cleaned = input
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
    // Common LLM special tokens
    .replace(/\[INST\]|\[\/INST\]/g, '')
    .replace(/<\|im_start\|>|<\|im_end\|>/g, '')
    .replace(/<\|system\|>|<\|user\|>|<\|assistant\|>/g, '')
    // Strip fenced code blocks (could smuggle multi-line injections)
    .replace(/```[\s\S]*?```/g, '')
    // Strip backtick inline code
    .replace(/`[^`]*`/g, '')
    .trim()
    .slice(0, 200) // strict limit for user-profile fields

  return sanitizeText(cleaned)
}

// ─── FILE NAME SANITIZATION ──────────────────────────────────────────────────

/** Sanitize a file name for safe display and use in prompts */
export const sanitizeFileName = (name: string): string => {
  if (!name || typeof name !== 'string') return 'Untitled'
  return name
    .replace(/[<>:"/\\|?*]/g, '')   // remove shell/path/HTML-dangerous chars
    .replace(/\.\./g, '')            // prevent path traversal
    .replace(/[\x00-\x1f\x7f]/g, '') // strip control characters
    .trim()
    .slice(0, 100)
}

// ─── SEARCH QUERY SANITIZATION ───────────────────────────────────────────────

/** Sanitize a search query before sending to third-party APIs (e.g. Meta Ad Library) */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return ''
  return query
    .replace(/[<>"'&]/g, '')                 // strip HTML-dangerous chars
    .replace(/[^\w\s\-\.,'!?@#]/g, '')       // allow word chars, punctuation, @, #
    .trim()
    .slice(0, 100)
}

// ─── EMAIL VALIDATION ─────────────────────────────────────────────────────────

/** Returns true if the string is a plausible email address */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 254
}

// ─── CLIENT-SIDE RATE LIMITER ─────────────────────────────────────────────────
// OWASP LLM10: Unbounded Consumption — prevent rapid-fire analysis clicks.
// NOT a replacement for server-side rate limiting.

interface RateLimitState {
  lastClick: number         // timestamp of most recent allowed click
  retryCount: number        // retries in the current window
  windowStart: number       // start of the 60-second retry window
}

const _state: Record<string, RateLimitState> = {}

/**
 * Check whether an action is allowed under rate-limit rules.
 * @param key       - Unique key for the action (e.g. 'analyze')
 * @param cooldownMs  - Min ms between any two clicks (default 2000)
 * @param maxRetries  - Max retries allowed within windowMs (default 3)
 * @param windowMs    - Rolling window for retry counting (default 60 000)
 * @returns { allowed: boolean; reason?: string }
 */
export function checkRateLimit(
  key: string,
  cooldownMs = 2000,
  maxRetries = 3,
  windowMs = 60_000,
): { allowed: boolean; reason?: string } {
  const now = Date.now()
  if (!_state[key]) {
    _state[key] = { lastClick: 0, retryCount: 0, windowStart: now }
  }
  const s = _state[key]

  // Reset window if it has expired
  if (now - s.windowStart > windowMs) {
    s.retryCount = 0
    s.windowStart = now
  }

  // Cooldown between any two clicks
  if (now - s.lastClick < cooldownMs) {
    return { allowed: false, reason: 'Please wait a moment before trying again.' }
  }

  // Max retries within window
  if (s.retryCount >= maxRetries) {
    const waitSec = Math.ceil((s.windowStart + windowMs - now) / 1000)
    return { allowed: false, reason: `Too many retries — wait ${waitSec}s before trying again.` }
  }

  s.lastClick = now
  s.retryCount += 1
  return { allowed: true }
}

/** Reset the rate-limit counter for a key (e.g. on successful completion) */
export function resetRateLimit(key: string): void {
  delete _state[key]
}
