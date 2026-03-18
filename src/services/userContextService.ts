// src/services/userContextService.ts — fetch user profile for AI prompt personalization

import { supabase } from '../lib/supabase'

export interface UserContext {
  niche: string
  platform: string
  role: string
}

const DEFAULTS: UserContext = {
  niche: 'Other',
  platform: 'All platforms',
  role: 'Founder / Operator',
}

let cached: UserContext | null = null

export async function getUserContext(): Promise<UserContext> {
  if (cached) return cached

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return DEFAULTS

    const { data } = await supabase
      .from('profiles')
      .select('niche, platform, role')
      .eq('id', user.id)
      .single()

    cached = {
      niche: data?.niche || DEFAULTS.niche,
      platform: data?.platform || DEFAULTS.platform,
      role: data?.role || DEFAULTS.role,
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
}

/** Format a context block to inject at the top of any AI prompt */
export function formatUserContextBlock(ctx: UserContext): string {
  return `USER CONTEXT:
- Niche: ${ctx.niche}
- Primary platform: ${ctx.platform}
- Role: ${ctx.role}
Apply this context to all feedback, improvements, and recommendations.
Tailor every suggestion specifically to this niche, platform, and role.
Do not give generic advice that applies to everyone.`
}
