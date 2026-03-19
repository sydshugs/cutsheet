// src/lib/userMemoryService.ts — Assemble compact session context from recent analyses
//
// Reads the last N analyses from historyService (Supabase RLS = auth-gated).
// Produces a plain-text block for injection into Claude prompts.
// No new DB tables — reads from existing `analyses` table.
// Returns empty string for unauthenticated users (historyService returns []).

import { getAnalysisHistory, type AnalysisRecord } from '../services/historyService'
import { sanitizeForAI, sanitizeForAILong } from '../utils/sanitize'

const MEMORY_LIMIT = 3

export interface SessionMemorySummary {
  text: string
  analysisCount: number
}

/**
 * Fetch last N analyses and assemble a compact context block.
 * Returns empty text if user is not authenticated or has no history.
 * Safe to call unconditionally — degrades gracefully.
 */
export async function getSessionMemory(): Promise<SessionMemorySummary> {
  const history = await getAnalysisHistory(MEMORY_LIMIT)
  if (history.length === 0) return { text: '', analysisCount: 0 }
  return { text: formatMemoryBlock(history), analysisCount: history.length }
}

function formatMemoryBlock(analyses: AnalysisRecord[]): string {
  const entries = analyses.map((a, i) => {
    const scores = (a.scores ?? {}) as Record<string, number>
    const weakAreas = Object.entries(scores)
      .filter(([key, val]) => key !== 'overall' && val <= 6)
      .map(([key, val]) => `${key}(${val})`)
      .join(', ')

    // sanitizeForAI (200 chars) for short fields, sanitizeForAILong (500 chars) for improvements
    const topImprovements = (a.improvements ?? []).slice(0, 2)

    return [
      `${i + 1}. ${sanitizeForAI(a.file_name)} (${a.file_type}/${a.mode}${a.platform ? `/${sanitizeForAI(a.platform)}` : ''})`,
      `   Score: ${a.overall_score}/10 | Weak: ${weakAreas || 'none'}`,
      topImprovements.length > 0
        ? `   Top issues: ${topImprovements.map(imp => sanitizeForAILong(imp)).join('; ')}`
        : null,
    ].filter(Boolean).join('\n')
  })

  const recurringWeaknesses = findRecurringWeaknesses(analyses)

  const lines = [
    'SESSION MEMORY — Recent analyses by this user:',
    ...entries,
  ]

  if (recurringWeaknesses.length > 0) {
    lines.push(`Recurring weak areas: ${recurringWeaknesses.join(', ')}`)
  }

  lines.push(
    'Use this history to: reference prior work, flag recurring problems, note improvement trends, and avoid repeating advice already given.'
  )

  return lines.join('\n')
}

function findRecurringWeaknesses(analyses: AnalysisRecord[]): string[] {
  const weakCounts: Record<string, number> = {}
  for (const a of analyses) {
    const scores = (a.scores ?? {}) as Record<string, number>
    for (const [key, val] of Object.entries(scores)) {
      if (typeof val !== 'number') continue
      if (key !== 'overall' && val <= 6) {
        weakCounts[key] = (weakCounts[key] ?? 0) + 1
      }
    }
  }
  // Only flag areas weak in 2+ of the last 3 analyses
  return Object.entries(weakCounts)
    .filter(([, count]) => count >= 2)
    .map(([key]) => key)
}
