/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── MOCKS (hoisted before imports) ────────────────────────────────────────

let capturedPrompt = ''
const mockGenerateContent = vi.fn()

vi.mock('@google/generative-ai', () => {
  function GoogleGenerativeAI() {
    return {
      getGenerativeModel: () => ({
        generateContent: mockGenerateContent,
      }),
    }
  }
  return { GoogleGenerativeAI }
})

// analyzerService imports claudeService which imports @anthropic-ai/sdk.
// claudeImprovements is called in a silent catch — mock to prevent resolution errors.
vi.mock('@anthropic-ai/sdk', () => {
  function Anthropic() {
    return { messages: { create: () => Promise.reject(new Error('mocked')) } }
  }
  return { default: Anthropic }
})

import { analyzeVideo } from '../analyzerService'

// ── HELPERS ───────────────────────────────────────────────────────────────

const mockFile = new File(['fake-video-data'], 'test.mp4', { type: 'video/mp4' })
const mockApiKey = 'test-gemini-api-key'
const mockStatusCb = vi.fn()

// ── TESTS ─────────────────────────────────────────────────────────────────

describe('analyzeVideo — contextPrefix behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedPrompt = ''
  })

  it('includes contextPrefix at the start of the prompt when provided', async () => {
    mockGenerateContent.mockImplementation(
      (parts: Array<{ text?: string; inlineData?: unknown }>) => {
        capturedPrompt = parts.find((p) => p.text !== undefined)?.text ?? ''
        return Promise.reject(new Error('intentional mock rejection'))
      }
    )

    try {
      await analyzeVideo(mockFile, mockApiKey, mockStatusCb, 'MY_CONTEXT_PREFIX')
    } catch {
      // expected rejection
    }

    expect(capturedPrompt).toMatch(/^MY_CONTEXT_PREFIX\n\n/)
  })

  it('does not include "undefined" or "null" in the prompt when contextPrefix is omitted', async () => {
    mockGenerateContent.mockImplementation(
      (parts: Array<{ text?: string; inlineData?: unknown }>) => {
        capturedPrompt = parts.find((p) => p.text !== undefined)?.text ?? ''
        return Promise.reject(new Error('intentional mock rejection'))
      }
    )

    try {
      await analyzeVideo(mockFile, mockApiKey, mockStatusCb)
    } catch {
      // expected rejection
    }

    expect(capturedPrompt).not.toContain('undefined')
    expect(capturedPrompt).not.toContain('null')
  })

  it('wraps errors with "Analysis failed:" prefix and calls status callback with "error"', async () => {
    mockGenerateContent.mockRejectedValue(new Error('network timeout'))

    await expect(
      analyzeVideo(mockFile, mockApiKey, mockStatusCb)
    ).rejects.toThrow('Analysis failed: network timeout')

    // emit("error") — first argument is 'error'
    const calls = mockStatusCb.mock.calls
    expect(calls.some((c) => c[0] === 'error')).toBe(true)
  })
})
