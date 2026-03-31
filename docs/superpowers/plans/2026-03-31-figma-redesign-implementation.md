# Figma Make Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full Figma Make redesign into the Cutsheet codebase across 9 slices, each independently shippable to staging.

**Architecture:** Vite SPA (React 19 + TypeScript). No SSR. All styling via CSS custom properties in `src/styles/tokens.css` + Tailwind utilities. Component library in `src/components/`. All interactive elements use indigo `#6366f1` as primary; page accent color appears ONLY on 76×76 icon tiles.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, framer-motion, lucide-react, CVA, Radix UI

---

## Blocker — Figma Export Path

The Figma Make export ZIP path was not provided. Before starting Slice 7 (Display in-situ mockups) and Slice 8 (Animate to HTML5 panel), confirm the export path with the user. Slices 1–6 and 9 can proceed from the specs below without the export.

---

## Slice Map

| Slice | Deliverable | Blocks | Does NOT include |
|-------|-------------|--------|-----------------|
| S1 | Design token additions | Nothing | Visual changes |
| S2 | ScoreCard new features | S1 | ScoreCard layout reorder |
| S3 | Upload page idle states | S1 | Loading states |
| S4 | Loading page ONE COLOR RULE | S1 | Upload states |
| S5 | Onboarding steps 4+5 | Nothing | Settings changes |
| S6 | Settings Brand Profile | S5 | Onboarding changes |
| S7 | Display in-situ SVG mockups | S1 | Figma export required |
| S8 | Animate to HTML5 panel | S2 | Other panels |
| S9 | Landing page sections | S1 | App changes |

---

## Chunk 1: Foundation + ScoreCard

### Slice 1 — Design System Token Additions

**Files:**
- Modify: `src/styles/tokens.css`

Token gaps to fill from the redesign spec:

```css
/* Confidence band tokens — for score confidence intervals */
--confidence-low:    rgba(239,68,68,0.15);
--confidence-mid:    rgba(245,158,11,0.15);
--confidence-high:   rgba(16,185,129,0.15);
--confidence-stroke: rgba(255,255,255,0.06);

/* Score delta tokens */
--delta-positive:    #10b981;
--delta-negative:    #ef4444;
--delta-neutral:     #71717a;

/* Feedback thumb tokens */
--thumb-idle:    rgba(255,255,255,0.08);
--thumb-active:  rgba(99,102,241,0.20);
--thumb-hover:   rgba(255,255,255,0.12);

/* Background glow tokens — per upload page */
--glow-indigo:   radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%);
--glow-emerald:  radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%);
--glow-cyan:     radial-gradient(ellipse 60% 40% at 50% 0%, rgba(6,182,212,0.07) 0%, transparent 70%);
--glow-rose:     radial-gradient(ellipse 60% 40% at 50% 0%, rgba(236,72,153,0.07) 0%, transparent 70%);
--glow-sky:      radial-gradient(ellipse 60% 40% at 50% 0%, rgba(14,165,233,0.07) 0%, transparent 70%);
--glow-amber:    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 70%);
--glow-violet:   radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 70%);
```

- [ ] **Step 1: Add tokens to `src/styles/tokens.css`**

  Append after `--ambient-glow` block (around line 137). Tokens from the spec above.

- [ ] **Step 2: Verify build passes**

  ```bash
  cd /Users/atlas/cutsheet/.claude/worktrees/youthful-bohr && npm run lint
  ```
  Expected: 0 TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/tokens.css
  git commit -m "feat: add redesign tokens — confidence bands, delta, glow, feedback"
  ```

---

### Slice 2 — ScoreCard New Features

**Files:**
- Modify: `src/components/ScoreHero.tsx`
- Modify: `src/components/ScoreCard.tsx`
- Create: `src/components/scorecard/FeedbackThumbs.tsx`
- Create: `src/components/scorecard/HookClassification.tsx`
- Modify: `src/components/scorecard/index.ts`

#### Feature specs:

**Confidence Band** — a thin shaded region on the BenchmarkBar showing ±0.5 score uncertainty. Renders as a semi-transparent rect behind the score fill.

**Score Delta** — shows change vs previous analysis for same file/platform. Only renders when `previousScore?: number` prop is provided. Format: `+0.4` in green or `-0.3` in red, next to the score number in ScoreHero.

**Feedback Thumbs** — thumbs-up/thumbs-down below the score. Tracks user sentiment. Persists to localStorage key `cutsheet:feedback:{analysisId}`. Does NOT send to server in this slice.

**Hook Classification** — a pill label below the hook score dimension in the 4-metric grid. Classifications: `"Pattern Interrupt"` | `"Question Hook"` | `"Bold Claim"` | `"Story Open"` | `"Problem Agitate"`. Passed as `hookClassification?: string` prop to ScoreHero.

#### Implementation steps:

- [ ] **Step 1: Create `FeedbackThumbs.tsx`**

  ```tsx
  // src/components/scorecard/FeedbackThumbs.tsx
  import { useState, useEffect } from "react";
  import { ThumbsUp, ThumbsDown } from "lucide-react";
  import { cn } from "@/src/lib/utils";

  interface FeedbackThumbsProps {
    analysisId?: string;
  }

  type Sentiment = "up" | "down" | null;

  export function FeedbackThumbs({ analysisId }: FeedbackThumbsProps) {
    const storageKey = analysisId ? `cutsheet:feedback:${analysisId}` : null;
    const [sentiment, setSentiment] = useState<Sentiment>(null);

    useEffect(() => {
      if (!storageKey) return;
      const stored = localStorage.getItem(storageKey);
      if (stored === "up" || stored === "down") setSentiment(stored);
    }, [storageKey]);

    const handleVote = (vote: "up" | "down") => {
      const next = sentiment === vote ? null : vote;
      setSentiment(next);
      if (storageKey) {
        if (next) localStorage.setItem(storageKey, next);
        else localStorage.removeItem(storageKey);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-zinc-600">Was this analysis helpful?</span>
        <button
          onClick={() => handleVote("up")}
          aria-label="Helpful"
          aria-pressed={sentiment === "up"}
          className={cn(
            "w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-150",
            sentiment === "up"
              ? "border-indigo-500/40 bg-[--thumb-active] text-indigo-400"
              : "border-white/[0.08] bg-[--thumb-idle] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300"
          )}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleVote("down")}
          aria-label="Not helpful"
          aria-pressed={sentiment === "down"}
          className={cn(
            "w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-150",
            sentiment === "down"
              ? "border-red-500/40 bg-red-500/10 text-red-400"
              : "border-white/[0.08] bg-[--thumb-idle] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300"
          )}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  ```

- [ ] **Step 2: Create `HookClassification.tsx`**

  ```tsx
  // src/components/scorecard/HookClassification.tsx
  import { cn } from "@/src/lib/utils";

  const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "Pattern Interrupt":  { bg: "rgba(99,102,241,0.08)",  text: "#818cf8", border: "rgba(99,102,241,0.2)" },
    "Question Hook":      { bg: "rgba(16,185,129,0.08)",  text: "#34d399", border: "rgba(16,185,129,0.2)" },
    "Bold Claim":         { bg: "rgba(245,158,11,0.08)",  text: "#fbbf24", border: "rgba(245,158,11,0.2)" },
    "Story Open":         { bg: "rgba(139,92,246,0.08)",  text: "#a78bfa", border: "rgba(139,92,246,0.2)" },
    "Problem Agitate":    { bg: "rgba(239,68,68,0.08)",   text: "#f87171", border: "rgba(239,68,68,0.2)"  },
  };

  interface HookClassificationProps {
    classification: string;
    className?: string;
  }

  export function HookClassification({ classification, className }: HookClassificationProps) {
    const style = CLASSIFICATION_COLORS[classification] ?? {
      bg: "rgba(255,255,255,0.05)", text: "#a1a1aa", border: "rgba(255,255,255,0.1)",
    };
    return (
      <span
        className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium leading-none", className)}
        style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
      >
        {classification}
      </span>
    );
  }
  ```

- [ ] **Step 3: Add `previousScore` and `hookClassification` props to `ScoreHeroProps`**

  In `src/components/ScoreHero.tsx`, add to the interface:
  ```ts
  previousScore?: number;       // undefined = no delta shown
  hookClassification?: string;  // e.g. "Pattern Interrupt"
  ```

- [ ] **Step 4: Render score delta in ScoreHero**

  In the score number section (around line 189+), add delta badge after the animated score:
  ```tsx
  {previousScore != null && (
    <span className={cn(
      "text-[13px] font-mono font-medium ml-2",
      score > previousScore ? "text-emerald-400" : score < previousScore ? "text-red-400" : "text-zinc-500"
    )}>
      {score > previousScore ? "+" : ""}{(score - previousScore).toFixed(1)}
    </span>
  )}
  ```

- [ ] **Step 5: Render confidence band in BenchmarkBar**

  In `BenchmarkBar`, add a ±0.5 shaded region on the benchmark bar track:
  ```tsx
  {/* Confidence band — ±0.5 around benchmark tick */}
  <div
    className="absolute h-full rounded-full"
    style={{
      left: `${Math.max(0, ((benchmark - 0.5) / 10) * 100)}%`,
      width: `${(1.0 / 10) * 100}%`,
      background: "rgba(255,255,255,0.05)",
    }}
  />
  ```

- [ ] **Step 6: Render hook classification under Hook dimension in 4-metric grid**

  After the Hook dimension row in the grid, conditionally render:
  ```tsx
  {hookClassification && dimensionName === 'Hook' && (
    <HookClassification classification={hookClassification} className="mt-1" />
  )}
  ```

- [ ] **Step 7: Add `analysisId`, `previousScore`, `hookClassification` props to `ScoreCardProps`**

  Wire through from `ScoreCard.tsx` → `ScoreHero`.

- [ ] **Step 8: Add `FeedbackThumbs` below ScoreHero in ScoreCard**

  After `<ScoreHero ... />`, render `<FeedbackThumbs analysisId={analysisId} />`.

- [ ] **Step 9: Update `scorecard/index.ts`**

  ```ts
  export { FeedbackThumbs } from './FeedbackThumbs';
  export { HookClassification } from './HookClassification';
  ```

- [ ] **Step 10: Verify build + icon imports**

  ```bash
  cd /Users/atlas/cutsheet/.claude/worktrees/youthful-bohr && npm run lint
  ```
  Also run:
  ```bash
  grep -n "<[A-Z][a-zA-Z]*\|lucide" src/components/scorecard/FeedbackThumbs.tsx
  grep -n "^import" src/components/scorecard/FeedbackThumbs.tsx
  ```
  Confirm every icon used appears in imports.

- [ ] **Step 11: Commit**

  ```bash
  git add src/components/scorecard/ src/components/ScoreHero.tsx src/components/ScoreCard.tsx
  git commit -m "feat: scorecard — confidence bands, score delta, feedback thumbs, hook classification"
  ```

---

## Chunk 2: Upload + Loading Pages

### Slice 3 — Upload Page Idle States

**Files to modify (one pass each):**
- `src/pages/app/PaidAdAnalyzer.tsx` (PaidEmptyState)
- `src/pages/app/OrganicAnalyzer.tsx`
- `src/pages/app/DisplayAnalyzer.tsx`
- `src/pages/app/CompetitorAnalyzer.tsx`
- `src/pages/app/Deconstructor.tsx`
- `src/pages/app/PolicyCheck.tsx`
- `src/pages/app/ABTestPage.tsx`
- `src/components/ui/FeaturePill.tsx`

**Spec:**

Each idle/upload state must have:
1. **Background glow** — page-specific radial gradient from `--glow-{color}` token, applied to the outer wrapper div as `backgroundImage`
2. **Icon tile** — 76×76px, borderRadius 14px, page accent bg + border + icon color (from CLAUDE.md Icon Tile Color System)
3. **Feature pills** — ALL pages use page accent color subtly:
   - `bg: rgba(PAGE_COLOR_RGB, 0.08)`
   - `border: 1px solid rgba(PAGE_COLOR_RGB, 0.15)`
   - `text: PAGE_COLOR at full opacity`
4. **CloudUpload icon** — every dropzone/upload area uses `CloudUpload` from lucide-react, NOT `Upload`
5. **Browse Files button** — `bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-full` (indigo, NOT page accent)
6. **H1** — every analyzer page must have exactly one `<h1>` as primary heading

**Page → accent color mapping (from CLAUDE.md):**

| Page | Hex | RGB |
|------|-----|-----|
| PaidAdAnalyzer | #6366f1 | 99,102,241 |
| OrganicAnalyzer | #10b981 | 16,185,129 |
| DisplayAnalyzer | #06b6d4 | 6,182,212 |
| ABTestPage | #ec4899 | 236,72,153 |
| CompetitorAnalyzer | #0ea5e9 | 14,165,233 |
| Deconstructor | #f59e0b | 245,158,11 |
| PolicyCheck | #6366f1 | 99,102,241 (indigo, same as paid) |

**FeaturePill component update:**

- [ ] **Step 1: Read current `FeaturePill.tsx`**

  ```bash
  cat src/components/ui/FeaturePill.tsx
  ```

- [ ] **Step 2: Add `accentRgb` prop to FeaturePill**

  Add optional `accentRgb?: string` (e.g. `"99,102,241"`). When provided, override background/border/text with the accent-based formula:
  ```tsx
  const accentStyle = accentRgb ? {
    background: `rgba(${accentRgb}, 0.08)`,
    border: `1px solid rgba(${accentRgb}, 0.15)`,
    color: `rgb(${accentRgb})`,
  } : {};
  ```

- [ ] **Step 3: Update PaidAdAnalyzer idle state**

  In `PaidEmptyState`:
  - Add `style={{ backgroundImage: 'var(--glow-indigo)' }}` to outer wrapper
  - Replace icon with `<CloudUpload>` (import: `import { CloudUpload } from "lucide-react"`)
  - Pass `accentRgb="99,102,241"` to each `<FeaturePill>`
  - Ensure Browse Files button uses indigo (not accent)
  - Add `<h1>` wrapping the primary heading text

- [ ] **Step 4–Step 9: Repeat for each remaining page**

  Each page follows the same pattern. Work through: OrganicAnalyzer → DisplayAnalyzer → CompetitorAnalyzer → Deconstructor → PolicyCheck → ABTestPage.

  For each:
  1. Read the file's idle state section (Grep for `EmptyState` or `idleState` or `idle`)
  2. Apply background glow token
  3. Replace `Upload` icon with `CloudUpload`
  4. Update icon tile colors to page accent
  5. Pass `accentRgb` to FeaturePill
  6. Confirm H1 present
  7. Confirm Browse Files button is indigo

- [ ] **Step 10: Verify all icon imports**

  ```bash
  for f in src/pages/app/PaidAdAnalyzer.tsx src/pages/app/OrganicAnalyzer.tsx src/pages/app/DisplayAnalyzer.tsx src/pages/app/CompetitorAnalyzer.tsx src/pages/app/Deconstructor.tsx src/pages/app/PolicyCheck.tsx src/pages/app/ABTestPage.tsx; do
    echo "=== $f ===" && grep -n "CloudUpload\|Upload" $f | head -5
  done
  ```

- [ ] **Step 11: Build check**

  ```bash
  npm run lint
  ```
  Expected: 0 errors.

- [ ] **Step 12: Commit**

  ```bash
  git add src/pages/app/ src/components/ui/FeaturePill.tsx
  git commit -m "feat: upload pages — background glows, CloudUpload icon, accent feature pills, H1s"
  ```

---

### Slice 4 — Loading Page ONE COLOR RULE Enforcement

**Files to modify:**
- `src/components/ProgressCard.tsx`
- `src/pages/app/DisplayAnalyzer.tsx` (DisplayProgressCard if separate)
- `src/components/DisplayProgressCard.tsx` (if exists)
- `src/components/AnalysisProgressCard.tsx` (if exists)

**Spec:**

The ONE COLOR RULE states: page accent color appears ONLY on the 76×76 icon tile. Everything else in the loading state uses indigo `#6366f1`.

Violations to fix in ProgressCard:
- Metric bars: must use indigo `#6366f1` fill and indigo shimmers — NOT page accent
- Checklist dots: active state must use indigo — NOT page accent
- Progress spinner/pulse: must use indigo
- The icon itself can receive page accent via the `icon` + a color prop

Additionally, ProgressCard receives an `accentColor` prop that some callers pass (e.g. DisplayAnalyzer passes cyan). This accent color must ONLY affect the icon tile. It must NOT bleed into bars, dots, or shimmers.

- [ ] **Step 1: Read ProgressCard fully**

  ```bash
  cat src/components/ProgressCard.tsx
  ```

- [ ] **Step 2: Audit color usage**

  Find every non-indigo color reference:
  ```bash
  grep -n "cyan\|emerald\|amber\|rose\|accentColor\|accent" src/components/ProgressCard.tsx
  ```

- [ ] **Step 3: Add `iconAccentColor` prop (rename from `accentColor` if it exists)**

  Add explicit `iconAccentColor?: string` prop. Update the icon tile to use it:
  ```tsx
  // Icon tile — ONLY place accent color appears
  <div style={{
    width: 76, height: 76, borderRadius: 14,
    background: iconAccentColor ? `${iconAccentColor}1A` : "rgba(99,102,241,0.1)",
    border: `1px solid ${iconAccentColor ? `${iconAccentColor}33` : "rgba(99,102,241,0.2)"}`,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <Icon style={{ color: iconAccentColor ?? "#6366f1", width: 28, height: 28 }} />
  </div>
  ```

- [ ] **Step 4: Fix metric bars — force indigo**

  Replace any `accentColor`-driven bar fills with hardcoded indigo:
  ```tsx
  // Done bar
  className="h-full bg-indigo-500 rounded-full"
  // Active shimmer
  style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.1) 25%, rgba(99,102,241,0.3) 50%, rgba(99,102,241,0.1) 75%)" }}
  ```

- [ ] **Step 5: Fix checklist active dots — force indigo**

  ```tsx
  active ? "border-indigo-500 bg-indigo-500/10" : ...
  // Active dot
  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
  ```

- [ ] **Step 6: Check DisplayProgressCard.tsx for same violations**

  ```bash
  cat src/components/DisplayProgressCard.tsx 2>/dev/null || echo "not found"
  cat src/components/AnalysisProgressCard.tsx 2>/dev/null || echo "not found"
  ```

  Apply same ONE COLOR RULE to any found.

- [ ] **Step 7: Verify callers pass icon accent correctly**

  ```bash
  grep -rn "ProgressCard\|DisplayProgressCard\|AnalysisProgressCard" src/pages/app/
  ```

  Confirm each caller passes `iconAccentColor` (not just raw `accentColor`) to get correct behavior. Update callers if prop name changed.

- [ ] **Step 8: Build check**

  ```bash
  npm run lint
  ```

- [ ] **Step 9: Commit**

  ```bash
  git add src/components/ProgressCard.tsx src/components/DisplayProgressCard.tsx src/components/AnalysisProgressCard.tsx
  git commit -m "feat: loading pages — enforce ONE COLOR RULE, indigo-only bars/dots/shimmers"
  ```

---

## Chunk 3: Onboarding + Settings

### Slice 5 — Onboarding Steps 4+5 (Brand Identity + Voice)

**Files:**
- Modify: `src/pages/Welcome.tsx`

**Spec:**

Current onboarding: Step 1 (Intent) → Step 2 (Niche) → Step 3 (Platform) → Complete.

Add Step 4 (Brand Identity) and Step 5 (Brand Voice) before the completion screen.

**Step 4 — Brand Identity:**
- Heading: "What's your brand like?"
- Two text inputs: Brand Name (required, max 60 chars), Primary Color (hex input with live preview swatch)
- Optional upload field for brand logo (image only, max 2MB)
- All fields persisted to `profiles` table on completion: `brand_name`, `brand_color`, `brand_logo_url`
- Brand logo upload goes to Supabase Storage bucket: `brand-assets/{userId}/logo`
- Skip button available

**Step 5 — Brand Voice:**
- Heading: "How does your brand speak?"
- 6 voice tone chips (multi-select, 1-3 max): `"Direct & Bold"` | `"Playful & Fun"` | `"Premium & Minimal"` | `"Warm & Personal"` | `"Expert & Educational"` | `"Energetic & Hype"`
- Textarea: "Describe your brand in a sentence" (optional, max 200 chars)
- Persisted to `profiles`: `brand_voice` (JSON array of selected tones), `brand_description`
- Skip button available

**Total steps changes:** was 3, now 5. Update `ProgressDots` total from `3` to `5`.

**Critical:**
- `onboarding_completed` is written to DB only on step 5 (or skip on step 5), not step 3
- Back navigation must work across all 5 steps

- [ ] **Step 1: Read Welcome.tsx fully**

  ```bash
  cat src/pages/Welcome.tsx
  ```

- [ ] **Step 2: Add step data constants**

  Add to the step data section:
  ```ts
  const VOICE_OPTIONS = [
    "Direct & Bold", "Playful & Fun", "Premium & Minimal",
    "Warm & Personal", "Expert & Educational", "Energetic & Hype"
  ] as const;
  ```

- [ ] **Step 3: Add state for steps 4+5**

  ```tsx
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [brandVoice, setBrandVoice] = useState<string[]>([]);
  const [brandDescription, setBrandDescription] = useState("");
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  ```

- [ ] **Step 4: Add `BrandIdentityStep` component (inline, after existing step components)**

  ```tsx
  function BrandIdentityStep({
    brandName, onBrandName,
    brandColor, onBrandColor,
    onLogoFile, onContinue, onSkip, onBack,
  }: { ... }) {
    return (
      <motion.div ... className="w-full max-w-md mx-auto flex flex-col gap-6">
        {/* Brand Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Brand name</label>
          <input
            type="text"
            maxLength={60}
            value={brandName}
            onChange={e => onBrandName(e.target.value)}
            placeholder="e.g. Acme Co"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 text-sm"
          />
        </div>
        {/* Primary Color */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Primary brand color</label>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/[0.08]" style={{ background: brandColor }} />
            <input
              type="text"
              value={brandColor}
              onChange={e => onBrandColor(e.target.value)}
              placeholder="#6366f1"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 text-sm font-mono"
            />
          </div>
        </div>
        {/* Skip / Continue */}
        <div className="flex gap-3 mt-2">
          <button onClick={onSkip} className="flex-1 py-3 rounded-xl border border-white/[0.08] text-zinc-500 text-sm hover:border-white/[0.14] hover:text-zinc-400 transition-colors">
            Skip for now
          </button>
          <button onClick={onContinue} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            Continue
          </button>
        </div>
      </motion.div>
    );
  }
  ```

- [ ] **Step 5: Add `BrandVoiceStep` component**

  Voice chip multi-select (max 3). Selected chips use: `bg-indigo-600/20 border-indigo-500/50 text-indigo-300`. Unselected: `bg-white/[0.04] border-white/[0.08] text-zinc-400`.

  ```tsx
  function BrandVoiceStep({ selected, onToggle, description, onDescription, onComplete, onSkip, onBack }) {
    return (
      <motion.div ... className="w-full max-w-md mx-auto flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {VOICE_OPTIONS.map(v => (
            <button
              key={v}
              onClick={() => onToggle(v)}
              disabled={selected.length >= 3 && !selected.includes(v)}
              className={cn(
                "px-4 py-2 rounded-full border text-sm transition-all duration-150",
                selected.includes(v)
                  ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                  : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:border-white/[0.14] disabled:opacity-40"
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <textarea
          maxLength={200}
          value={description}
          onChange={e => onDescription(e.target.value)}
          placeholder="e.g. We're a bold DTC brand for Gen Z fitness enthusiasts"
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 text-sm resize-none"
        />
        <div className="flex gap-3">
          <button onClick={onSkip} className="flex-1 py-3 rounded-xl border border-white/[0.08] text-zinc-500 text-sm hover:border-white/[0.14] hover:text-zinc-400 transition-colors">
            Skip
          </button>
          <button onClick={onComplete} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            Get started
          </button>
        </div>
      </motion.div>
    );
  }
  ```

- [ ] **Step 6: Update step rendering logic**

  Change step total from 3 to 5 in `ProgressDots`. Add cases for `step === 4` and `step === 5` in the render switch.

- [ ] **Step 7: Update completion handler**

  Move `onboarding_completed: true` upsert to the step 5 "Get started" handler. Step 5 skip also triggers completion. Step 3 completion no longer writes `onboarding_completed`.

  After step 5, upsert brand data:
  ```ts
  await supabase.from("profiles").upsert({
    id: user.id,
    onboarding_completed: true,
    brand_name: sanitizeText(brandName) || null,
    brand_color: brandColor || null,
    brand_voice: brandVoice.length ? brandVoice : null,
    brand_description: sanitizeText(brandDescription) || null,
  }, { onConflict: "id" });
  ```

- [ ] **Step 8: Verify imports** (all icons, cn, sanitizeText all imported)

- [ ] **Step 9: Build check**

  ```bash
  npm run lint
  ```

- [ ] **Step 10: Commit**

  ```bash
  git add src/pages/Welcome.tsx
  git commit -m "feat: onboarding — add steps 4+5 Brand Identity + Brand Voice"
  ```

---

### Slice 6 — Settings Brand Profile Section

**Files:**
- Modify: `src/pages/Settings.tsx`

**Spec:**

Add a new "Brand Profile" section to Settings, after the existing profile section. Shows and allows editing of the brand data collected in onboarding:
- Brand Name (text input)
- Primary Color (hex input + live swatch)
- Brand Voice (same chip multi-select as onboarding, max 3)
- Brand Description (textarea)
- Save button: calls Supabase upsert to `profiles`

The section uses the same visual pattern as other Settings sections: `<section>` with a heading, divider, and content card.

- [ ] **Step 1: Read Settings.tsx fully (first 150 lines to understand pattern)**

  ```bash
  head -150 src/pages/Settings.tsx
  ```

- [ ] **Step 2: Read the brand state loading pattern from profiles**

  Identify how the current profile data is loaded (likely `supabase.from("profiles").select(...)` in a `useEffect`). Brand fields will come from the same query — add `brand_name, brand_color, brand_voice, brand_description` to the select.

- [ ] **Step 3: Add brand state variables**

  ```tsx
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [brandVoice, setBrandVoice] = useState<string[]>([]);
  const [brandDescription, setBrandDescription] = useState("");
  const [brandSaving, setBrandSaving] = useState(false);
  ```

- [ ] **Step 4: Populate from profile load**

  In the profile load `useEffect`, after setting existing fields, also:
  ```ts
  setBrandName(profile.brand_name ?? "");
  setBrandColor(profile.brand_color ?? "#6366f1");
  setBrandVoice(profile.brand_voice ?? []);
  setBrandDescription(profile.brand_description ?? "");
  ```

- [ ] **Step 5: Add save handler**

  ```ts
  async function saveBrandProfile() {
    setBrandSaving(true);
    await supabase.from("profiles").upsert({
      id: user.id,
      brand_name: sanitizeText(brandName) || null,
      brand_color: brandColor || null,
      brand_voice: brandVoice.length ? brandVoice : null,
      brand_description: sanitizeText(brandDescription) || null,
    }, { onConflict: "id" });
    setBrandSaving(false);
  }
  ```

- [ ] **Step 6: Add Brand Profile JSX section**

  Add after the profile/avatar section, before the danger zone:
  ```tsx
  {/* Brand Profile */}
  <section className="flex flex-col gap-4">
    <div>
      <h2 className="text-base font-semibold text-zinc-100">Brand Profile</h2>
      <p className="text-sm text-zinc-500 mt-0.5">Used to personalize your analysis context</p>
    </div>
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-5">
      {/* Brand Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Brand name</label>
        <input type="text" maxLength={60} value={brandName} onChange={e => setBrandName(e.target.value)} className="..." />
      </div>
      {/* Primary Color */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Primary color</label>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md border border-white/[0.08]" style={{ background: brandColor }} />
          <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="font-mono ..." />
        </div>
      </div>
      {/* Brand Voice chips */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Brand voice (pick up to 3)</label>
        <div className="flex flex-wrap gap-2">
          {VOICE_OPTIONS.map(v => (
            <button key={v} onClick={() => setBrandVoice(prev =>
              prev.includes(v) ? prev.filter(x => x !== v) : prev.length < 3 ? [...prev, v] : prev
            )} className={cn("px-3 py-1.5 rounded-full border text-xs transition-all", brandVoice.includes(v) ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:border-white/[0.14]")}>
              {v}
            </button>
          ))}
        </div>
      </div>
      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Brand description</label>
        <textarea maxLength={200} rows={2} value={brandDescription} onChange={e => setBrandDescription(e.target.value)} className="resize-none ..." />
      </div>
      {/* Save */}
      <button onClick={saveBrandProfile} disabled={brandSaving} className="self-start px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
        {brandSaving ? "Saving..." : "Save brand profile"}
      </button>
    </div>
  </section>
  ```

  Note: `VOICE_OPTIONS` must be defined at module level (same as in Welcome.tsx) or imported from a shared constants file.

- [ ] **Step 7: Extract VOICE_OPTIONS to shared constant**

  Create `src/lib/brandConstants.ts`:
  ```ts
  export const VOICE_OPTIONS = [
    "Direct & Bold", "Playful & Fun", "Premium & Minimal",
    "Warm & Personal", "Expert & Educational", "Energetic & Hype"
  ] as const;
  export type VoiceOption = typeof VOICE_OPTIONS[number];
  ```

  Update both `Welcome.tsx` and `Settings.tsx` to import from this file.

- [ ] **Step 8: Verify no hardcoded hex in JSX**

  ```bash
  grep -n "#[0-9a-fA-F]\{6\}" src/pages/Settings.tsx | grep -v "brandColor\|#6366f1\|tokens\|comment"
  ```

- [ ] **Step 9: Build check**

  ```bash
  npm run lint
  ```

- [ ] **Step 10: Commit**

  ```bash
  git add src/pages/Settings.tsx src/lib/brandConstants.ts src/pages/Welcome.tsx
  git commit -m "feat: settings — Brand Profile section; extract VOICE_OPTIONS to shared constant"
  ```

---

## Chunk 4: Display Mockups + New Panels

### Slice 7 — Display In-Situ SVG Mockups

> **BLOCKED:** Requires Figma export ZIP. Do not start until export path is confirmed.

**Files:**
- Create: `src/components/display/WebpageMockup.tsx` — SVG browser chrome with ad slot
- Create: `src/components/display/MobileMockup.tsx` — SVG phone frame with banner slot
- Modify: `src/pages/app/DisplayAnalyzer.tsx` — render mockup in result panel

**Spec:**

When a Display ad is analyzed, the result panel should show the ad image placed inside an SVG browser/device mockup. This gives context for how the creative looks in-situ.

- WebpageMockup: 16:9 aspect ratio SVG. Browser chrome at top (address bar, tab strip, traffic lights). Ad slot: 728×90px leaderboard in center or 300×250 rectangle in right rail.
- MobileMockup: 9:16 aspect ratio SVG. Phone bezel, status bar, browser chrome. Ad slot: 320×50 banner at bottom or 300×250 center.
- Ad slot renders the actual uploaded creative via `<image>` element clipped to slot dimensions.
- Format selector drives which mockup variant shows.

> Full implementation depends on Figma export for exact SVG shapes and dimensions.

---

### Slice 8 — Animate to HTML5 Panel

> **Note:** Depends on Slice 2 (ScoreCard) being merged.

**Files:**
- Create: `src/components/AnimateToHTML5Panel.tsx`
- Modify: `src/components/ScoreCard.tsx` — add panel to action row

**Spec:**

New action in the ScoreCard action row: "Animate to HTML5". This panel converts a static display ad into an animated HTML5 banner (CSS keyframe animation output) using the Gemini API.

- Button only shows when `format === "static"` and `platform === "Google Display"` or `platform === "Google"`
- Panel slides in (SlideSheet pattern from `src/components/ui/SlideSheet.tsx`)
- Panel content: preview of animated CSS output as live HTML iframe, download button for `.zip` (HTML + CSS files)
- Uses a new API endpoint: `api/animate-html5.ts`
- Credits: deducted from `fixIt` bucket (reuses same limits)
- Pro only: shows upgrade prompt for free users

- [ ] **Step 1: Create `api/animate-html5.ts` (stub)**

  ```ts
  // api/animate-html5.ts
  // ESM-compatible: use explicit .js imports
  import type { VercelRequest, VercelResponse } from '@vercel/node';
  import { checkAuth } from './_lib/auth.js';
  import { checkRateLimit } from './_lib/rateLimit.js';

  export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const user = await checkAuth(req, res);
    if (!user) return;
    await checkRateLimit(user.id, 'fixIt', res);
    // TODO: implement Gemini call for HTML5 animation generation
    return res.status(501).json({ error: 'Not implemented yet' });
  }
  ```

- [ ] **Step 2: Create `AnimateToHTML5Panel.tsx` (UI only, calls stub)**

  Panel with: "This feature generates CSS keyframe animations from your static creative." placeholder message + a "Coming soon" badge. Full implementation deferred until API is ready.

- [ ] **Step 3: Add to ScoreCard action row**

  In ScoreCard, add to the action row (below Fix It / Visualize / Policy Check):
  ```tsx
  {format === "static" && (platform === "Google Display" || platform === "Google") && (
    <ToolButton icon={Wand2} label="Animate to HTML5" onClick={() => setShowAnimatePanel(true)} />
  )}
  ```

  Import `Wand2` from `lucide-react`.

- [ ] **Step 4: Add `showAnimatePanel` state + `<AnimateToHTML5Panel>` render**

- [ ] **Step 5: Verify ESM imports in api/animate-html5.ts**

  ```bash
  grep -n "from '\." api/animate-html5.ts
  ```
  Every internal import must end in `.js`.

- [ ] **Step 6: Build check**

  ```bash
  npm run lint
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add api/animate-html5.ts src/components/AnimateToHTML5Panel.tsx src/components/ScoreCard.tsx
  git commit -m "feat: animate-to-html5 panel — stub endpoint + UI panel + ScoreCard action row entry"
  ```

---

## Chunk 5: Landing Page

### Slice 9 — Landing Page Sections

> **Note:** Per CLAUDE.md Build Order Rules: "Do NOT drive paid traffic until landing page is updated" and "Do NOT build landing page until UX audit is done — product must be polished first." Confirm with user that UX audit is complete before executing this slice.

**Files:**
- Modify: `src/pages/LandingPage.tsx`
- Modify: various `src/components/ui/cutsheet-*.tsx` sections

**Spec:**

The redesign introduces updated landing page sections. Without the Figma export, the known changes are:
1. Hero: headline + subheadline copy update (cutsheet-brand voice — direct, no fluff)
2. Social proof: add a metrics bar (e.g. "14 metrics · 9 analyzers · 60-second results")
3. Features section: icon tiles with page accent colors (from Icon Tile Color System)
4. Pricing: no changes specified yet
5. CTA section: replace with a new two-column layout (creative preview left, score card mockup right)

> Full implementation depends on Figma export confirmation and UX audit completion.

**Immediate steps (copy + metrics bar — no Figma needed):**

- [ ] **Step 1: Update hero copy**

  In `src/components/ui/cutsheet-hero.tsx`, find the headline and subheadline. Apply cutsheet-brand voice:
  - Before implementing, run `cutsheet-brand` skill
  - Headline: short, direct, benefit-first. No "AI-powered" fluff.
  - Subheadline: specific metric count ("14 metrics across 9 ad types")

- [ ] **Step 2: Add metrics bar**

  Below the hero CTA, add a row of 3 stats separated by pipes:
  ```tsx
  <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
    <span><span className="text-zinc-200 font-mono font-medium">14</span> metrics scored</span>
    <span className="text-zinc-700">·</span>
    <span><span className="text-zinc-200 font-mono font-medium">9</span> ad types</span>
    <span className="text-zinc-700">·</span>
    <span><span className="text-zinc-200 font-mono font-medium">60s</span> to results</span>
  </div>
  ```

- [ ] **Step 3: Update features section icon tiles**

  In `cutsheet-features.tsx`, for each feature card, apply the Icon Tile Color System. Use the same color → accent RGB mapping. Icon tiles: 48×48px (landing scale), same border/bg formula.

- [ ] **Step 4: Build check**

  ```bash
  npm run lint
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/LandingPage.tsx src/components/ui/cutsheet-hero.tsx src/components/ui/cutsheet-features.tsx
  git commit -m "feat: landing page — updated hero copy, metrics bar, accent icon tiles"
  ```

---

## Verification Checklist (Before Any Merge to Staging)

Run `superpowers:verification-before-completion` on each slice:

- [ ] `npm run lint` → 0 TypeScript errors, 0 unused imports
- [ ] `npm run build` → exit 0
- [ ] For every file touched: `grep -n "<[A-Z][a-zA-Z]*" <file>` vs `grep -n "^import" <file>` — every component/icon in JSX has a corresponding import
- [ ] No hardcoded hex values in JSX (grep: `style=.*#[0-9a-fA-F]{6}` — exceptions: brandColor live preview swatches, chart colors documented in comments)
- [ ] No `transition-all` in any touched file
- [ ] No `use client` directives added anywhere
- [ ] ESM imports in `api/` use explicit `.js` extensions
- [ ] `--glow-*` and new tokens in tokens.css are used, not duplicated with inline rgba values

---

## Staging Workflow (Per CLAUDE.md Git Rules)

After each slice is verified:

```bash
# Merge slice to staging
git checkout staging && git merge feat/figma-redesign-<slice> && git push origin staging
# Verify on staging.cutsheet.xyz
# Merge staging to main when confirmed
git checkout main && git merge staging && git push origin main
# Delete feature branch
git branch -d feat/figma-redesign-<slice> && git push origin --delete feat/figma-redesign-<slice>
```
