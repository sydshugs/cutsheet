# Demo Video Structure & Content Polish — Design Spec

## Problem

The Remotion product demo has two categories of issues:

1. **Structural:** Scenes are raw (no shared frame), transitions cut hard, the token system is scattered, and there's no canonical timeline reference.
2. **Content:** Scenes show abstract mockups instead of the real app UX. The PreFlight scene doesn't show actual ad creatives being compared. The analyzer scenes don't reflect how the product actually looks and works.

## Scope

9 structural/visual improvements + 2 content improvements (11 total). Audio intentionally excluded.

**Structural (1-6):**
1. Video spec header with canvas/timeline
2. AppWindow wrapper (dark frosted glass mac chrome)
3. Between-scene transitions with 22-frame overlap
4. Color palette restructured as named system
5. Full font stack (sans, mono, display)
6. Frame + seconds documented per scene

**Visual consistency (7-9):**
7. Step labels → pill badges
8. Scene title typography (display font + gradient)
9. Consistent card styling via shared `CARD_STYLE`

**Content richness (10-11):**
10. PreFlight scene shows actual ad creative images + richer data
11. All analyzer scenes show more realistic UX matching the real app

---

## 1. Video Spec Header

**File:** `CutsheetDemo.tsx`

Comment block with post-overlap timeline (see Section 3 for overlap math):

```ts
/**
 * Cutsheet Product Demo
 * ─────────────────────
 * Canvas:   1280 × 720 @ 30fps
 * Duration: 956 frames / 31.9s
 * Scenes:   8 (22-frame crossfade overlap between each)
 *
 * Timeline (post-overlap):
 * ┌──────────────┬───────┬────────┬─────────┐
 * │ Scene        │ From  │ Frames │ Seconds │
 * ├──────────────┼───────┼────────┼─────────┤
 * │ Intro        │     0 │    150 │    5.0s │
 * │ Dropzone     │   128 │    150 │    5.0s │
 * │ Analyzing    │   256 │    120 │    4.0s │
 * │ Scorecard    │   354 │    150 │    5.0s │
 * │ Improvements │   482 │    120 │    4.0s │
 * │ CTA Rewrite  │   580 │    120 │    4.0s │
 * │ Budget       │   678 │    150 │    5.0s │
 * │ Pre-Flight   │   806 │    150 │    5.0s │
 * └──────────────┴───────┴────────┴─────────┘
 * Last scene ends at 806 + 150 = 956
 */
```

Each `<Sequence>` gets an inline comment: `{/* Dropzone — 150f / 5.0s */}`

---

## 2. AppWindow Wrapper

**New file:** `src/components/remotion/AppWindow.tsx`

Dark frosted glass mac-style window chrome (content area only, no sidebar/top bar).

### Design

- **Title bar:** 36px tall, `rgba(255,255,255,0.03)` bg, `backdropFilter: 'blur(12px)'`, bottom border `rgba(255,255,255,0.06)`
- **Traffic light dots:** 3 circles (12px diameter), left-aligned with 8px gap
  - Close: `#FF5F57`, Minimize: `#FFBD2E`, Maximize: `#27C93F`
- **Title text:** Centered, `fontSize: 11`, `TOKENS.fontMono`, `TOKENS.inkFaint`, defaults to `"cutsheet.xyz"`
- **Content area:** `flex: 1`, renders `children`, no extra padding
- **Outer frame:** `borderRadius: TOKENS.radiusLg` (20px), `border: 1px solid ${TOKENS.border}`, `overflow: 'hidden'`
- **Dimensions:** ~85% canvas width (1088px), ~80% canvas height (576px), centered

### Props

```ts
interface AppWindowProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties; // for animation pass-through
}
```

### Integration

The AppWindow replaces each scene's outermost card wrapper. Scene `AbsoluteFill` still handles `backgroundColor`, and the step label sits **above and to the left** of the AppWindow intentionally (label at `top: 28, left: 36`; window top edge at ~72px).

**Exception:** IntroScene does NOT use AppWindow — full-bleed logo reveal.

---

## 3. Between-Scene Transitions

### Changes to `helpers.ts`

Update `sceneEnvelope` return type from `number` to `{ opacity: number; transform: string }`:

```ts
export function sceneEnvelope(
  frame: number,
  totalFrames: number,
  fadeFrames = 22,
): { opacity: number; transform: string } {
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOutCubic,
  });
  const fadeOut = interpolate(frame, [totalFrames - fadeFrames, totalFrames], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOutCubic,
  });
  const envelope = fadeIn * fadeOut;
  const scale = interpolate(envelope, [0, 1], [0.95, 1]);
  return { opacity: envelope, transform: `scale(${scale})` };
}
```

### Migration pattern for all 7 scenes that call `sceneEnvelope`

Before:
```tsx
const envelope = sceneEnvelope(frame, 150);
// ...
<AbsoluteFill style={{ backgroundColor: TOKENS.bg, fontFamily: TOKENS.fontSans, opacity: envelope }}>
```

After:
```tsx
const envelope = sceneEnvelope(frame, 150);
// ...
<AbsoluteFill style={{ backgroundColor: TOKENS.bg, fontFamily: TOKENS.fontSans, ...envelope }}>
```

The spread `...envelope` applies both `opacity` and `transform`.

**IntroScene:** Currently does NOT call `sceneEnvelope` (uses manual interpolation). Update it to use `sceneEnvelope` for consistency and apply `...envelope` to its root.

### Overlap math

8 scenes, 7 boundaries, 22-frame overlap each:

| # | Scene | From | Duration | End |
|---|-------|------|----------|-----|
| 0 | Intro | 0 | 150 | 150 |
| 1 | Dropzone | 128 | 150 | 278 |
| 2 | Analyzing | 256 | 120 | 376 |
| 3 | Scorecard | 354 | 150 | 504 |
| 4 | Improvements | 482 | 120 | 602 |
| 5 | CTA Rewrite | 580 | 120 | 700 |
| 6 | Budget | 678 | 150 | 828 |
| 7 | Pre-Flight | 806 | 150 | 956 |

**Total:** `DEMO_DURATION_FRAMES = 956` (~31.9s at 30fps)

---

## 4. Color Palette as a System

**File:** `tokens.ts`

Restructure with named section headers (see Section 5 for `fontDisplay`). Add `import type { CSSProperties } from 'react'` at top for shared style constants.

```ts
import type { CSSProperties } from 'react';

export const TOKENS = {
  // ── Backgrounds ──
  bg: '#09090b',
  surface: 'rgba(255,255,255,0.03)',
  surfaceEl: 'rgba(255,255,255,0.05)',

  // ── Borders ──
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  // ── Text ──
  ink: 'rgba(255,255,255,0.92)',
  inkMuted: 'rgba(255,255,255,0.5)',
  inkFaint: 'rgba(255,255,255,0.25)',

  // ── Accent ──
  accent: '#6366F1',
  accentHover: '#5254CC',
  violet: '#8B5CF6',

  // ── Semantic ──
  success: '#10B981',
  error: '#EF4444',
  warn: '#F59E0B',

  // ── Score Bands ──
  scoreExcellent: '#10B981',
  scoreGood: '#6366F1',
  scoreAverage: '#F59E0B',
  scoreWeak: '#EF4444',

  // ── Typography ──
  fontSans: "'Geist', system-ui, sans-serif",
  fontMono: "'Geist Mono', monospace",
  fontDisplay: "'Outfit', 'Geist', system-ui, sans-serif",

  // ── Radii ──
  radius: 16,
  radiusSm: 8,
  radiusLg: 20,
  radiusXl: 24,
} as const;
```

**Note:** Outfit font is available via the `<link>` tag in `index.html` and works in the Remotion `<Player>` since it renders in the same DOM. If server-side rendering via `renderMedia()` is added later, Outfit must be loaded via `@remotion/google-fonts`.

---

## 5. Full Font Stack

`fontDisplay` added to tokens (above). Usage:
- `fontSans` — body text, labels, descriptions
- `fontMono` — data values, step labels, scores
- `fontDisplay` — scene headings

---

## 6. Frame + Seconds Per Scene

Covered by the spec header in Section 1 and inline `<Sequence>` comments.

---

## 7. Step Labels → Pill Badges

Shared style constant in `tokens.ts`:

```ts
export const STEP_LABEL_STYLE: CSSProperties = {
  position: 'absolute',
  top: 28,
  left: 36,
  fontSize: 10,
  fontFamily: TOKENS.fontMono,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: '#818cf8',
  background: 'rgba(99, 102, 241, 0.1)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: 999,
  padding: '4px 12px',
};
```

All 7 scenes (not Intro) apply `style={STEP_LABEL_STYLE}` to their step label div.

---

## 8. Scene Title Typography

Shared style constant in `tokens.ts`:

```ts
export const HEADING_STYLE: CSSProperties = {
  fontFamily: TOKENS.fontDisplay,
  fontSize: 26,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};
```

---

## 9. Consistent Card Styling

Shared style constant in `tokens.ts`:

```ts
export const CARD_STYLE: CSSProperties = {
  background: TOKENS.surface,
  border: `1px solid ${TOKENS.border}`,
  borderRadius: TOKENS.radiusLg,
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};
```

Scenes spread `...CARD_STYLE` into their main content cards.

---

## 10. PreFlight Scene — Real Ad Creatives + Richer Data

**Current:** Two abstract variant cards with scores, strengths/weaknesses text, winner badge.

**New:** Mirror the actual PreFlight UX with real ad images.

### Static assets

Save the two provided ad creative images to:
- `public/demos/variant-a.png` — "There's no creative." ad
- `public/demos/variant-b.png` — "We skipped the ad." ad

Referenced in Remotion via `<Img src={staticFile('demos/variant-a.png')} />`.

### Scene layout (150 frames)

Inside AppWindow, two-column layout:

**Left column (Variant A) / Right column (Variant B):**
- **Image thumbnail** (rounded corners, `objectFit: 'cover'`, ~180px wide × 180px tall) — spring entrance
- Below image: variant label ("VARIANT A" / "VARIANT B") in mono
- **Score** (large 32px mono): "8.4 /10" (`scoreGood` — indigo) vs "4.5 /10" (`scoreAverage` — amber) with color-coded score band
  - Score thresholds: ≥9 excellent/green, ≥7 good/indigo, ≥5 average/amber, <5 weak/red
- **Would Scale badge:** "✓ Would Scale" (green) / "✗ Don't Scale" (red)
- **Key Strength** line (green label + text)
- **Key Weakness** line (red label + text)

**Bottom section (reveals at frame 90):**
- **PREDICTED WINNER** card with gradient top border (indigo→violet):
  - Trophy icon + "Variant A" + confidence badge ("HIGH" in green)
  - Predicted lift: "15–25% higher CTR/CVR" in green chip
- **HEAD-TO-HEAD** row: Hook 🎣 / CTA 📢 / Retention ⚡ — each shows winner

**Animation sequence:**
- Frame 0-10: AppWindow + step label fade in
- Frame 10-15: Variant A image + card springs in
- Frame 18-23: Variant B image + card springs in
- Frame 30-70: Scores count up (0 → final)
- Frame 75: Would Scale badges appear
- Frame 90: Winner card springs in from bottom, losing variant dims to 40%
- Frame 100: Head-to-head pills stagger in
- Frame 128-150: Scene fade-out

---

## 11. Analyzer Scenes — Richer UX Content

Each scene should show more of what the real app does, matching the actual component patterns from the codebase.

### DropzoneScene (Scene 1 — 150f / 5.0s)

**Current:** Generic dropzone card.
**Enhanced:** Match real `VideoDropzone.tsx` more closely:
- Show a video thumbnail placeholder (dark gradient rectangle) inside the dropzone before the "file drops"
- After file "drops" (frame 30+), show the actual filename badge ("summer-campaign-v2.mp4 · 12.4 MB") sliding in
- File format pills match the real app: MP4, MOV, WEBM, JPG, PNG, WEBP
- "Browse Files" button with indigo accent

### AnalyzingScene (Scene 2 — 120f / 4.0s)

**Current:** Shimmer bar + cycling hints.
**Enhanced:**
- Show a **thumbnail preview** of the "uploaded" creative (`demos/variant-a.png`, dimmed to 40% opacity) at top of the analysis card
- Below thumbnail: filename + file size text
- Progress bar with indigo gradient fill (animated)
- Cycling analysis steps (match real Gemini prompt stages): "Analyzing hook strength...", "Evaluating scene transitions...", "Scoring CTA clarity...", "Measuring emotional pull..."
- Small "Gemini 2.5 Flash" model badge in bottom-right of the card

### ScorecardScene (Scene 3 — 150f / 5.0s)

**Current:** Arc gauge + 4 metric bars + badge.
**Enhanced:** Match real `ScoreCard.tsx` layout more closely:
- Arc gauge with **color glow** matching score band (add `filter: drop-shadow(0 0 8px ${color})`)
- Score number in large mono with "/10" suffix
- Status badge (e.g., "Good") with tinted background
- 4 metric bars matching real app labels: **Hook Strength**, **Message Clarity**, **CTA Effectiveness**, **Production Quality**
- Each bar uses its own score-band color (not all the same)
- Below metrics: "✦ Rewrite CTA" button hint (since CTA score is 3/10 — below threshold)
- Model attribution: "Gemini 2.5 Flash" in muted text

### ImprovementsScene (Scene 4 — 120f / 4.0s)

**Current:** 3 bullet points.
**Enhanced:** Match real app's "Improve This Ad" section:
- Heading: "Improve This Ad"
- 3 improvement bullets with lightbulb icons, pulled from mock data:
  1. "Strengthen the CTA — make it action-oriented and urgent"
  2. "Add motion to the first 2 seconds to improve scroll-stop"
  3. "Include social proof (ratings, reviews) to boost credibility"
- Each bullet staggers in with slideUp animation

### CTARewriteScene (Scene 5 — 120f / 4.0s)

**Current:** Before/after text.
**Enhanced:**
- Show the "✦ Rewrite CTA" button being "clicked" (indigo pulse)
- Before CTA in a dimmed card: original weak CTA text
- After CTA types in char-by-char in a highlighted card: improved CTA with green checkmark
- "Powered by Gemini" attribution text

### BudgetScene (Scene 6 — 150f / 5.0s)

**Current:** Budget card with platform + daily spend.
**Enhanced:** Match real `ScoreCard.tsx` budget recommendation section:
- **Verdict badge** at top: "Boost It" in green with rocket icon (matches real app's Boost It / Test It / Fix First verdicts)
- Data rows:
  - Platform: "TikTok + Meta"
  - Daily Budget: "$100–$200/day"
  - Duration: "7 days"
  - Reason: brief text explaining the recommendation
- Below: **Recommended Hashtags** section with staggered pill tags
  - TikTok: #ForYou, #AdCreative, #MarketingTips
  - Meta: #DigitalMarketing, #AdStrategy
- Final CTA: "Ready to scale?" text

---

## Files Changed

| File | Change |
|------|--------|
| `public/demos/variant-a.png` | **NEW** — Ad creative image for PreFlight Variant A |
| `public/demos/variant-b.png` | **NEW** — Ad creative image for PreFlight Variant B |
| `src/components/remotion/AppWindow.tsx` | **NEW** — Frosted glass mac chrome wrapper |
| `src/components/remotion/tokens.ts` | Restructure, add `fontDisplay`, add `CARD_STYLE`, `STEP_LABEL_STYLE`, `HEADING_STYLE`, React CSSProperties import |
| `src/components/remotion/helpers.ts` | `sceneEnvelope` returns `{opacity, transform}` with scale; bump fadeFrames 18→22 |
| `src/components/remotion/CutsheetDemo.tsx` | Spec header, overlap sequences by 22f, `DEMO_DURATION_FRAMES = 956`, per-sequence comments |
| `src/components/remotion/scenes/IntroScene.tsx` | Use `sceneEnvelope` + `fontDisplay`, no AppWindow |
| `src/components/remotion/scenes/DropzoneScene.tsx` | AppWindow, shared styles, enhanced content (thumbnail, file info) |
| `src/components/remotion/scenes/AnalyzingScene.tsx` | AppWindow, shared styles, enhanced (thumbnail, model badge, real analysis steps) |
| `src/components/remotion/scenes/ScorecardScene.tsx` | AppWindow, shared styles, enhanced (glow gauge, real metric labels, CTA rewrite hint) |
| `src/components/remotion/scenes/ImprovementsScene.tsx` | AppWindow, shared styles, enhanced (real improvement text) |
| `src/components/remotion/scenes/CTARewriteScene.tsx` | AppWindow, shared styles, enhanced (button click animation, Gemini attribution) |
| `src/components/remotion/scenes/BudgetScene.tsx` | AppWindow, shared styles, enhanced (verdict badge, hashtags, duration) |
| `src/components/remotion/scenes/PreFlightScene.tsx` | AppWindow, shared styles, **major rewrite** (real images, winner card, head-to-head, predicted lift) |
| `src/pages/DemoPage.tsx` | Update duration text from "37s" to "32s" |

---

## Verification

1. `npm run build` — 0 errors
2. `/demo` — play all 8 scenes:
   - AppWindow frosted glass chrome wraps every scene (except Intro)
   - Crossfade transitions are smooth with subtle scale (no hard cuts)
   - Step labels are indigo pill badges
   - Scene headings use Outfit display font with gradient
   - Cards share uniform styling
   - PreFlight shows actual ad creative images side-by-side
   - Scorecard shows real metric labels + color-coded bars
   - Budget shows verdict badge + hashtags
3. Total duration ~32s
4. `?seq=N` Puppeteer mode still works
5. Glass player controls still function correctly
