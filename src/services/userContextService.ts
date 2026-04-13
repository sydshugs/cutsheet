// src/services/userContextService.ts — fetch user profile for AI prompt personalization

import { supabase } from '../lib/supabase'
import { sanitizeForAI } from '../utils/sanitize'

export type AdIntent = 'awareness' | 'consideration' | 'conversion'

export interface UserContext {
  niche: string
  platform: string
  role: string
  intent: AdIntent
}

const DEFAULTS: UserContext = {
  niche: 'Other',
  platform: 'All platforms',
  role: 'Founder / Operator',
  intent: 'conversion',
}

let cached: UserContext | null = null

export async function getUserContext(): Promise<UserContext> {
  if (cached) return cached

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return DEFAULTS

    const { data } = await supabase
      .from('profiles')
      .select('niche, platform, role, intent')
      .eq('id', user.id)
      .single()

    cached = {
      niche: data?.niche || DEFAULTS.niche,
      platform: data?.platform || DEFAULTS.platform,
      role: data?.role || DEFAULTS.role,
      intent: (['awareness', 'consideration', 'conversion'].includes(data?.intent) ? data?.intent : DEFAULTS.intent) as AdIntent,
    }
    return cached
  } catch {
    return DEFAULTS
  }
}

/** Clear cache when user updates profile or logs out */
export function clearUserContextCache(): void {
  cached = null
}

/** Returns true if all profile fields are still defaults (user hasn't set them) */
export function isDefaultContext(ctx: UserContext): boolean {
  return ctx.niche === DEFAULTS.niche
    && ctx.platform === DEFAULTS.platform
    && ctx.role === DEFAULTS.role
    && ctx.intent === DEFAULTS.intent
}

/** Format a context block to inject at the top of any AI prompt.
 *  All fields are sanitized (OWASP LLM01) before interpolation. */
const INTENT_GUIDANCE: Record<AdIntent, string> = {
  awareness: 'Prioritize memorability, brand recall, emotional resonance over direct response signals.',
  consideration: 'Prioritize information clarity, trust signals, mid-funnel engagement.',
  conversion: 'Prioritize CTA strength, urgency, offer clarity, friction removal.',
}

export function formatUserContextBlock(ctx: UserContext): string {
  const niche    = sanitizeForAI(ctx.niche    || DEFAULTS.niche)
  const platform = sanitizeForAI(ctx.platform || DEFAULTS.platform)
  const role     = sanitizeForAI(ctx.role     || DEFAULTS.role)
  const intent   = ctx.intent || DEFAULTS.intent
  return `USER CONTEXT:
- Niche: ${niche}
- Primary platform: ${platform}
- Role: ${role}
- Ad Intent: ${intent}
Apply this context to all feedback, improvements, and recommendations.
Tailor every suggestion specifically to this niche, platform, and role.
Scoring emphasis for ${intent} intent: ${INTENT_GUIDANCE[intent]}
Do not give generic advice that applies to everyone.`
}
