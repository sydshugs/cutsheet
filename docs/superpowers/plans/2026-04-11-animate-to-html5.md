# Animate to HTML5 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert static display banners into animated HTML5 ad units via a full-screen takeover UI + CSS animation generator API.

**Architecture:** Full-screen takeover component renders from DisplayAnalyzer when user clicks "Animate". Backend generates self-contained HTML5 ad units with CSS keyframe animations (no AI needed). JSZip bundles index.html + image into a downloadable .zip. Credit system enforces Pro-only with monthly limits.

**Tech Stack:** React 19, Framer Motion, Tailwind, JSZip, Vercel serverless functions, Upstash credits

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/AnimateToHtml5Takeover.tsx` | Create | Full-screen takeover UI — settings, preview, download |
| `api/animate-html5.ts` | Create | CSS animation generator + zip bundler |
| `api/_lib/creditCheck.ts` | Modify | Register "animate" feature limits |
| `src/pages/app/DisplayAnalyzer.tsx` | Modify | Wire animate button + render takeover |
| `package.json` | Modify | Add jszip dependency |

---

## Chunk 1: Backend + Credit System

### Task 1: Install jszip + register animate credits

- [ ] **Step 1:** Install jszip: `npm install jszip`
- [ ] **Step 2:** Register "animate" in PRO_MONTHLY_LIMITS (10) and TEAM_MONTHLY_LIMITS (25) in `api/_lib/creditCheck.ts`
- [ ] **Step 3:** Verify build: `npm run build`

### Task 2: Create api/animate-html5.ts

- [ ] **Step 1:** Create the endpoint with auth, rate limit, tier check, credit deduction
- [ ] **Step 2:** Implement `generateHtml5Ad()` with 3 CSS animation templates (entrance/pulse/reveal)
- [ ] **Step 3:** Implement zip bundling with JSZip (index.html + image asset)
- [ ] **Step 4:** Add logApiUsage instrumentation
- [ ] **Step 5:** Verify build: `npm run build`

## Chunk 2: Frontend Component

### Task 3: Create AnimateToHtml5Takeover.tsx

- [ ] **Step 1:** Port the reference design from cutsheet-Design, adapting for production props
- [ ] **Step 2:** Add API integration (fetch to /api/animate-html5)
- [ ] **Step 3:** Add download handler (zip base64 -> blob -> download)
- [ ] **Step 4:** Add iframe preview for generated HTML
- [ ] **Step 5:** Verify build: `npm run build`

### Task 4: Wire into DisplayAnalyzer

- [ ] **Step 1:** Add animate takeover state
- [ ] **Step 2:** Change "Animate" button onClick to open takeover
- [ ] **Step 3:** Render AnimateToHtml5Takeover conditionally
- [ ] **Step 4:** Add to handleReset cleanup
- [ ] **Step 5:** Verify build + all imports correct: `npm run build`
- [ ] **Step 6:** Commit

---
