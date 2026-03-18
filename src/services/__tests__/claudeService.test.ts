/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── MOCKS ─────────────────────────────────────────────────────────────────

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  function Anthropic() {
    return { messages: { create: mockCreate } }
  }
  return { default: Anthropic }
})

import { generateSecondEyeReview } from '../claudeService'

// ── HELPERS ───────────────────────────────────────────────────────────────

// Raw JSON (no markdown fences) — the regex /\{[\s\S]*\}/ matches this directly
const VALID_RESPONSE_JSON = JSON.stringify({
  scrollMoment: '0:02',
  flags: [],
  whatItCommunicates: 'Promotes a skincare product with a before/after hook.',
  whatItFails: 'No clear CTA until the final 2 seconds.',
})

function mockAnthropicResponse(text: string) {
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text }],
  })
}

// ── TESTS ─────────────────────────────────────────────────────────────────

describe('generateSecondEyeReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path — returns parsed SecondEyeResult with all four fields', async () => {
    mockAnthropicResponse(VALID_RESPONSE_JSON)

    const result = await generateSecondEyeReview(
      'Some analysis markdown',
      'test.mp4',
      { hook: 6, overall: 7 },
      ['Improve the hook', 'Add text overlay']
    )

    expect(result).toMatchObject({
      scrollMoment: expect.anything(),   // string | null
      flags: expect.any(Array),
      whatItCommunicates: expect.any(String),
      whatItFails: expect.any(String),
    })
    expect(result.flags).toEqual([])
    expect(result.whatItCommunicates).toContain('skincare')
  })

  it('malformed JSON response — rejects', async () => {
    mockAnthropicResponse('This is plain text with no JSON object.')

    await expect(
      generateSecondEyeReview('analysis markdown', 'test.mp4')
    ).rejects.toThrow()
  })

  it('network error — propagates without hanging', async () => {
    mockCreate.mockRejectedValue(new Error('fetch failed'))

    await expect(
      generateSecondEyeReview('analysis markdown', 'test.mp4')
    ).rejects.toThrow('fetch failed')
  })
})
