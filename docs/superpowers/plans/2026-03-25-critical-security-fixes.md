# Critical Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan.

**Goal:** Fix all 4 CRITICAL security vulnerabilities identified in the 2026-03-25 audit.

**Architecture:** Add rehype-sanitize to all ReactMarkdown usages, replace raw HTML rendering with DOMPurify-sanitized output, add sanitizeSessionMemory+XML delimiters to 6 API routes, add CSP+HSTS headers.

**Tech Stack:** rehype-sanitize (already installed), dompurify, validateInput.ts helpers

---

## Task 1: C1 — Add rehype-sanitize to 4 ReactMarkdown usages (src/)

**Files:**
- Modify: `src/components/CompareView.tsx:2,35`
- Modify: `src/components/ReportAnalysis.tsx:2,110`
- Modify: `src/components/ReportCards.tsx:4,346`
- Modify: `src/pages/app/Deconstructor.tsx:7,384,418`

For each file: Add rehype-sanitize import and add rehypePlugins prop to ReactMarkdown.

## Task 2: C2 — Sanitize HTML output in FixItPanel.tsx

**Files:**
- Modify: `src/components/FixItPanel.tsx:1-4,38-40,213`

Install dompurify, import it, and wrap all renderBold output with DOMPurify.sanitize() to prevent XSS from AI-generated content being rendered as HTML.

## Task 3: C3 — Add sanitization to 6 API routes

**Files:**
- Modify: `api/predict-performance.ts` — sanitize niche, platform, intent, adType
- Modify: `api/fix-it.ts` — sanitize niche, platform, intent, adType
- Modify: `api/analyze.ts` — sanitize systemInstruction
- Modify: `api/policy-check.ts` — ALREADY uses safePlatform/safeAdType/safeNiche (skip)
- Modify: `api/platform-score.ts` — sanitize userContext, niche, platform
- Modify: `api/deconstruct.ts` — sanitize userContext, niche

Use existing safePlatform, safeAdType, safeNiche from validateInput.ts for enum fields.
Use sanitizeSessionMemory for freeform text (userContext).
Wrap user-supplied values in XML delimiters in prompts.

## Task 4: C4 — Add CSP + HSTS headers to vercel.json

**Files:**
- Modify: `vercel.json`

Add Content-Security-Policy and Strict-Transport-Security headers.

---

## Verification

- npm run build — 0 errors
- Push to main
