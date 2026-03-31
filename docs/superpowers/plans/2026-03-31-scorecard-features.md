# ScoreCard Features — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 new features into ScoreCard, ScoreHero, HookAnalysisExpanded, and FixItPanel — one at a time, each independently mergeable to staging.

**Architecture:** Vite SPA (React 19 + TypeScript). No SSR. All styling via CSS custom properties + Tailwind. Components are client-side only. Data flows from analyzer page → ScoreCard → sub-components via props. Supabase writes happen directly from component, no API intermediary needed for feedback.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, framer-motion, lucide-react, Supabase client (`lib/supabase.ts`)

**Design reference repo:** `sydshugs/Cutsheetdesigns` — use for visual pattern only; DO NOT copy code verbatim.

---

## Prerequisites — Read Before Starting Any Feature

### Score Color Thresholds (CHANGE FROM CURRENT)

The current `getScoreColorByValue` uses: 9+ emerald, 7+ indigo, 5+ amber, else red.
The design spec requires: **7.0+ emerald, 5.0–6.9 amber, below 5.0 red.**

This is a **prerequisite change** that must land before F1 and F2. It is done as part of F1 Step 1.

Current (WRONG):
```ts
if (score >= 9) return "#10B981";  // emerald
if (score >= 7) return "#6366F1";  // indigo ← must remove
if (score >= 5) return "#F59E0B";  // amber
return "#EF4444";                  // red
```

Correct (from design reference `tokens.md` + task spec):
```ts
if (score >= 7) return "#10b981";  // emerald
if (score >= 5) return "#f59e0b";  // amber
return "#ef4444";                  // red
```

---

## Feature Slice Map

| Feature | Files modified | Staging-independently-shippable? |
|---------|---------------|--------------------------------|
| F1 — Confidence Bands | ScoreHero.tsx, ScoreCard.tsx | Yes |
| F2 — Score Delta | ScoreHero.tsx, ScoreCard.tsx | Yes (after F1) |
| F3 — Feedback Thumbs | FixItPanel.tsx, supabase migration | Yes (independent) |
| F4 — Hook Classification | HookAnalysisExpanded.tsx | Yes (independent) |

---

## Chunk 1: Confidence Bands + Score Color Fix

### Feature 1 — Score Confidence Bands

**Spec:**
- Range text below the overall score number: `"6.5 – 7.8 range"` in `text-[11px] text-zinc-500 font-mono`
- Confidence band behind each dimension bar: subtle lighter rectangle spanning rangeLow–rangeHigh of the bar track
- Props added: `scoreRange?: { low: number; high: number }` on ScoreHero; `dimensionOverrides` type extended to include `rangeLow?: number; rangeHigh?: number`
- When `scoreRange` is undefined, the range text and band are not rendered (graceful degradation)
- Range values come from the AI analysis response — for now, generate a ±0.65 synthetic range from the score in the analyzer page; when the AI is updated to return confidence, swap in real values

**Files:**
- Modify: `src/components/ScoreHero.tsx`
- Modify: `src/components/ScoreCard.tsx` (prop type + wiring)

---

- [ ] **Step 1: Fix score color thresholds in `ScoreCard.tsx`**

  Find `getScoreColorByValue` (line 91) and `getScoreLabel` (line 106) and update thresholds:

  ```ts
  export function getScoreColorByValue(score: number): string {
    if (score >= 7) return "#10b981";
    if (score >= 5) return "#f59e0b";
    return "#ef4444";
  }

  function getScoreTokenColor(score: number): string {
    if (score >= 7) return "var(--score-excellent)";
    if (score >= 5) return "var(--score-average)";
    return "var(--score-weak)";
  }

  function getScoreLabel(score: number): { label: string; color: string } {
    if (score >= 7) return { label: "Strong", color: "var(--score-excellent)" };
    if (score >= 5) return { label: "Average", color: "var(--score-average)" };
    return { label: "Weak", color: "var(--score-weak)" };
  }
  ```

- [ ] **Step 2: Fix score color threshold in `ScoreHero.tsx`**

  Find `scoreColor` function (line 95) and update:
  ```ts
  function scoreColor(score: number): string {
    if (score >= 7) return "#10b981";
    if (score >= 5) return "#f59e0b";
    return "#ef4444";
  }

  function scoreIndicator(score: number): string {
    if (score >= 7) return "▲";
    if (score >= 5) return "●";
    return "▼";
  }
  ```

- [ ] **Step 3: Extend `ScoreHeroProps` with confidence band props**

  In `ScoreHero.tsx`, update the interface:
  ```ts
  export interface ScoreHeroProps {
    score: number;
    verdict: string;
    benchmark?: number;
    dimensions: {
      name: string;
      score: number;
      rangeLow?: number;   // ← NEW
      rangeHigh?: number;  // ← NEW
    }[];
    platform?: string;
    format?: 'video' | 'static';
    youtubeFormat?: string;
    accentColor?: string;
    benchmarkLabelOverride?: string;
    scoreRange?: { low: number; high: number };  // ← NEW — overall score confidence interval
  }
  ```

- [ ] **Step 4: Render confidence range text below score in ScoreHero**

  In `ScoreHero` component, after the verdict label (around line 257), add:
  ```tsx
  {scoreRange && (
    <span className="text-[11px] text-zinc-600 font-mono mt-1">
      {scoreRange.low.toFixed(1)} – {scoreRange.high.toFixed(1)} range
    </span>
  )}
  ```

- [ ] **Step 5: Render confidence band behind dimension bar in ScoreHero**

  The dimension grid currently renders `motion.div` tiles with just a score number. Each tile needs a mini bar visualization. Add a bar track + confidence band behind each dimension:

  In the `resolvedDimensions.map(...)` block (lines 276–304), replace the current tile content with:
  ```tsx
  <motion.div
    key={dim.name}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
    className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg"
    style={{ background: 'rgba(255,255,255,0.015)' }}
  >
    {/* Score + indicator */}
    <span
      className="font-mono text-xs font-medium tabular-nums"
      style={{ color: dimDisplayColor }}
      aria-label={`${dim.name}: ${dim.score.toFixed(1)}`}
    >
      {scoreIndicator(dim.score)} {dim.score.toFixed(1)}
    </span>

    {/* Mini bar track with confidence band */}
    <div className="relative w-full h-[3px] bg-white/[0.06] rounded-full overflow-visible mx-1">
      {/* Confidence band — lighter overlay between rangeLow and rangeHigh */}
      {dim.rangeLow != null && dim.rangeHigh != null && (
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${(dim.rangeLow / 10) * 100}%`,
            width: `${((dim.rangeHigh - dim.rangeLow) / 10) * 100}%`,
            background: `${dimDisplayColor}30`,
          }}
        />
      )}
      {/* Score fill */}
      <motion.div
        className="absolute h-full rounded-full left-0 top-0"
        style={{ background: dimDisplayColor }}
        initial={{ width: 0 }}
        animate={{ width: `${(dim.score / 10) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>

    {/* Dimension name */}
    <span className="text-[9px] text-zinc-500 text-center leading-tight whitespace-nowrap">
      {dim.name}
    </span>
  </motion.div>
  ```

- [ ] **Step 6: Add `scoreRange` prop to `ScoreCardProps` and wire through**

  In `ScoreCard.tsx`:
  1. Add `scoreRange?: { low: number; high: number }` to `ScoreCardProps` interface
  2. Destructure it in the component signature
  3. Pass it through to `<ScoreHero scoreRange={scoreRange} ... />`

- [ ] **Step 7: Synthetic range generation in `PaidAdAnalyzer.tsx`**

  In `PaidAdAnalyzer.tsx`, after analysis completes, generate a ±0.65 synthetic range from the overall score. This is a placeholder until the AI model returns real confidence values:

  ```ts
  // In the result-handling section after analysis completes
  const syntheticRange = result?.scores?.overall != null ? {
    low:  Math.max(0, Math.round((result.scores.overall - 0.65) * 10) / 10),
    high: Math.min(10, Math.round((result.scores.overall + 0.65) * 10) / 10),
  } : undefined;
  ```

  Pass `scoreRange={syntheticRange}` to `<ScoreCard>`.

  Also extend the dimensions passed to ScoreCard to include synthetic ranges per dimension:
  ```ts
  // When building dimensionOverrides or the standard dimension array, add:
  dimensions.map(d => ({
    ...d,
    rangeLow:  Math.max(0, Math.round((d.score - 0.5) * 10) / 10),
    rangeHigh: Math.min(10, Math.round((d.score + 0.5) * 10) / 10),
  }))
  ```

  Note: Only do this for `PaidAdAnalyzer` now. Other analyzers can follow in a separate pass.

- [ ] **Step 8: Check imports**

  ```bash
  grep -n "^import" src/components/ScoreHero.tsx
  grep -n "^import" src/components/ScoreCard.tsx
  grep -n "^import" src/pages/app/PaidAdAnalyzer.tsx | grep -i "scorecard\|score"
  ```

  Verify nothing new needed (all existing imports suffice).

- [ ] **Step 9: Build check**

  ```bash
  cd /Users/atlas/cutsheet/.claude/worktrees/youthful-bohr && npm run lint
  ```
  Expected: 0 TypeScript errors.

- [ ] **Step 10: Commit F1**

  ```bash
  git add src/components/ScoreHero.tsx src/components/ScoreCard.tsx src/pages/app/PaidAdAnalyzer.tsx
  git commit -m "feat(scorecard): confidence bands + score color thresholds (7/5 split)

  - Fix score color: 7.0+ emerald, 5.0-6.9 amber, <5.0 red (was 9/7/5 split)
  - Add scoreRange prop to ScoreHero: renders 'X.X – Y.Y range' below score
  - Add rangeLow/rangeHigh to dimension type: renders confidence band behind mini bar
  - Add mini bar visualization to each dimension tile in the 4-metric grid
  - Wire synthetic ±0.65 range from PaidAdAnalyzer (placeholder until AI returns real CI)"
  ```

---

## Chunk 2: Score Delta on Re-Analysis

### Feature 2 — Score Delta

**Spec:**
- Overall delta: compact pill next to the score number, e.g. `"▲ 1.9 vs 3 days ago"` in emerald / `"▼ 0.4 vs 2 days ago"` in red
- Per-dimension delta chips: small `+1.2` / `-0.3` badge next to each dimension score — toggled by a `"Show changes"` / `"Hide changes"` button in the dimension section header
- `"Show changes"` toggle is indigo when active, outline when inactive
- Delta data comes from the previous analysis in history — computed in the analyzer page, passed as props
- When no previous analysis exists for the same file/platform, props are `undefined` and delta UI is hidden

**Files:**
- Modify: `src/components/ScoreHero.tsx`
- Modify: `src/components/ScoreCard.tsx` (props + wiring)
- Modify: `src/pages/app/PaidAdAnalyzer.tsx` (delta computation from history)
- Read: `src/hooks/useHistory.ts` (understand history shape before editing)

---

- [ ] **Step 1: Read `useHistory.ts` to understand HistoryEntry shape**

  ```bash
  cat src/hooks/useHistory.ts | head -60
  ```

  Identify the `HistoryEntry` type (particularly `scores`, `platform`, `analysisTime`). Delta is computed as `currentScore - previousEntry.scores.overall`.

- [ ] **Step 2: Add delta props to `ScoreHeroProps`**

  ```ts
  export interface ScoreHeroProps {
    // ...existing props...
    overallDelta?: number;          // ← NEW: signed number, e.g. +1.9 or -0.4
    overallDeltaLabel?: string;     // ← NEW: e.g. "vs 3 days ago"
    dimensionDeltas?: Record<string, number>;  // ← NEW: keyed by dimension name
  }
  ```

- [ ] **Step 3: Render overall delta pill in ScoreHero**

  After the score number and before the confidence range text (after Step 4 of F1), add:
  ```tsx
  {overallDelta != null && (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono mt-1.5",
        overallDelta > 0
          ? "bg-emerald-500/[0.08] border border-emerald-500/[0.2] text-emerald-400"
          : overallDelta < 0
          ? "bg-red-500/[0.08] border border-red-500/[0.2] text-red-400"
          : "bg-white/[0.04] border border-white/[0.08] text-zinc-500"
      )}
    >
      {overallDelta > 0 ? "▲" : overallDelta < 0 ? "▼" : "—"}{" "}
      {Math.abs(overallDelta).toFixed(1)}
      {overallDeltaLabel && <span className="ml-1 text-zinc-600 font-normal">{overallDeltaLabel}</span>}
    </div>
  )}
  ```

- [ ] **Step 4: Add "Show changes" toggle state to ScoreHero**

  Add internal state (only when `dimensionDeltas` is provided):
  ```tsx
  const hasDimDeltas = dimensionDeltas != null && Object.keys(dimensionDeltas).length > 0;
  const [showChanges, setShowChanges] = useState(true);
  ```

- [ ] **Step 5: Render "Show changes" toggle in dimension section header**

  Before the `grid` div in the dimension section (around line 274), add:
  ```tsx
  <div className="w-full flex items-center justify-between mb-2">
    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
      Dimensions
    </span>
    {hasDimDeltas && (
      <button
        onClick={() => setShowChanges(prev => !prev)}
        className={cn(
          "rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors border",
          showChanges
            ? "border-indigo-500/20 bg-indigo-500/[0.06] text-indigo-400"
            : "border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:text-zinc-400"
        )}
      >
        {showChanges ? "Hide changes" : "Show changes"}
      </button>
    )}
  </div>
  ```

- [ ] **Step 6: Render delta chip on each dimension tile**

  In the `resolvedDimensions.map(...)` block, after the score number, add:
  ```tsx
  {showChanges && dimensionDeltas?.[dim.name] != null && (
    <span
      className={cn(
        "text-[9px] font-semibold rounded px-1 py-0.5 font-mono",
        dimensionDeltas[dim.name] > 0
          ? "text-emerald-500 bg-emerald-500/[0.06]"
          : "text-red-400 bg-red-500/[0.06]"
      )}
    >
      {dimensionDeltas[dim.name] > 0 ? "+" : ""}{dimensionDeltas[dim.name].toFixed(1)}
    </span>
  )}
  ```

- [ ] **Step 7: Add delta props to `ScoreCardProps` and wire through**

  In `ScoreCard.tsx`:
  1. Add to interface:
     ```ts
     overallDelta?: number;
     overallDeltaLabel?: string;
     dimensionDeltas?: Record<string, number>;
     ```
  2. Destructure in component
  3. Pass to `<ScoreHero overallDelta={overallDelta} overallDeltaLabel={overallDeltaLabel} dimensionDeltas={dimensionDeltas} ... />`

- [ ] **Step 8: Compute delta from history in `PaidAdAnalyzer.tsx`**

  After the analysis completes and before rendering `<ScoreCard>`, compute delta from the most recent history entry for the same platform:

  ```ts
  // Somewhere in the state management section — after reading history
  const previousEntry = history
    .filter(e => e.platform === platform && e.id !== currentAnalysisId)
    .sort((a, b) => new Date(b.analysisTime).getTime() - new Date(a.analysisTime).getTime())[0];

  const overallDelta = previousEntry
    ? Math.round((scores.overall - previousEntry.scores.overall) * 10) / 10
    : undefined;

  const overallDeltaLabel = previousEntry
    ? `vs ${formatRelativeTime(new Date(previousEntry.analysisTime))}`
    : undefined;

  // Dimension deltas — only if previous entry has same dimension structure
  const dimensionDeltas: Record<string, number> | undefined = previousEntry?.scores
    ? {
        Hook:   Math.round((scores.hook      - previousEntry.scores.hook)       * 10) / 10,
        Copy:   Math.round((scores.clarity   - previousEntry.scores.clarity)    * 10) / 10,
        Visual: Math.round((scores.production - previousEntry.scores.production) * 10) / 10,
        CTA:    Math.round((scores.cta       - previousEntry.scores.cta)        * 10) / 10,
      }
    : undefined;
  ```

  Note: `formatRelativeTime` already exists in `ScoreCard.tsx` — import or duplicate it locally.

  Pass to `<ScoreCard overallDelta={overallDelta} overallDeltaLabel={overallDeltaLabel} dimensionDeltas={dimensionDeltas} ... />`.

- [ ] **Step 9: Import `cn` in ScoreHero if not already imported**

  ```bash
  grep -n "^import" src/components/ScoreHero.tsx | grep "utils\|cn"
  ```

  If missing, add: `import { cn } from "@/src/lib/utils";`

- [ ] **Step 10: Build check**

  ```bash
  npm run lint
  ```
  Expected: 0 errors.

- [ ] **Step 11: Commit F2**

  ```bash
  git add src/components/ScoreHero.tsx src/components/ScoreCard.tsx src/pages/app/PaidAdAnalyzer.tsx
  git commit -m "feat(scorecard): score delta on re-analysis

  - Overall delta pill: emerald/red with 'vs X days ago' label
  - Per-dimension delta chips: +/- badges on each dimension tile
  - 'Show/Hide changes' toggle button in dimension section header
  - Delta computed in PaidAdAnalyzer from most recent same-platform history entry"
  ```

---

## Chunk 3: Feedback Thumbs on AI Suggestions

### Feature 3 — User Feedback on AI Suggestions

**Spec:**
- Location: `FixItPanel.tsx` — ThumbsUp / ThumbsDown on each of the 3 rewrite sections (Hook, Body, CTA)
- UX: 40% opacity at rest → 100% on hover (matches reference design)
- Confirmation: after vote, show `"Thanks"` text inline next to the thumbs
- Persist: write to Supabase `suggestion_feedback` table
- Table schema (create via Supabase Dashboard SQL, not migration file):

```sql
CREATE TABLE IF NOT EXISTS suggestion_feedback (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id text,          -- fileName + analysisTime hash (client-generated)
  section     text NOT NULL, -- 'hook' | 'body' | 'cta'
  vote        text NOT NULL, -- 'up' | 'down'
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE suggestion_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON suggestion_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON suggestion_feedback FOR SELECT
  USING (auth.uid() = user_id);
```

- RLS: users can only insert/read their own feedback
- `analysis_id`: generated client-side as `btoa(fileName + analysisTime.toISOString()).slice(0, 20)` — not a real FK, just for correlation
- The Supabase write fires on vote — no debounce needed, low frequency
- If Supabase write fails, the UI still shows the vote (fail-silently)

**Files:**
- Modify: `src/components/FixItPanel.tsx`
- No new files needed

**IMPORTANT:** Create the `suggestion_feedback` table in Supabase Dashboard BEFORE testing this feature. Document the SQL above for the user.

---

- [ ] **Step 1: Create `suggestion_feedback` table**

  This requires running the SQL above in Supabase Dashboard → SQL Editor. **Do not start coding until this is confirmed by the user.**

  Provide the SQL to the user:
  ```
  TABLE: suggestion_feedback
  (SQL block from spec above)
  ```

- [ ] **Step 2: Read current `FixItPanel.tsx` fully**

  ```bash
  cat src/components/FixItPanel.tsx
  ```

  Understand: how the 3 sections (hook, body, CTA) are structured and where to inject the feedback row.

- [ ] **Step 3: Add imports to FixItPanel.tsx**

  ```tsx
  import { ThumbsUp, ThumbsDown } from "lucide-react";
  import { supabase } from "@/src/lib/supabase";
  import { useAuth } from "@/src/context/AuthContext";
  ```

- [ ] **Step 4: Add `FeedbackRow` component inside FixItPanel.tsx (before the main component)**

  ```tsx
  type Vote = "up" | "down" | null;

  interface FeedbackRowProps {
    vote: Vote;
    onVote: (v: Vote) => void;
  }

  function FeedbackRow({ vote, onVote }: FeedbackRowProps) {
    return (
      <div className="flex items-center gap-2 mt-2 opacity-40 hover:opacity-100 transition-opacity">
        <button
          onClick={() => onVote(vote === "up" ? null : "up")}
          aria-label="This was helpful"
          aria-pressed={vote === "up"}
          className={cn(
            "rounded-lg border p-1.5 cursor-pointer transition-colors",
            vote === "up"
              ? "border-indigo-500/30 bg-indigo-500/[0.08]"
              : "border-white/[0.06] bg-transparent hover:border-white/[0.12]"
          )}
        >
          <ThumbsUp size={12} color={vote === "up" ? "#818cf8" : "#52525b"} />
        </button>
        <button
          onClick={() => onVote(vote === "down" ? null : "down")}
          aria-label="This was not helpful"
          aria-pressed={vote === "down"}
          className={cn(
            "rounded-lg border p-1.5 cursor-pointer transition-colors",
            vote === "down"
              ? "border-red-500/30 bg-red-500/[0.06]"
              : "border-white/[0.06] bg-transparent hover:border-white/[0.12]"
          )}
        >
          <ThumbsDown size={12} color={vote === "down" ? "#f87171" : "#52525b"} />
        </button>
        {vote !== null && (
          <span className="text-[10px] text-zinc-600">Thanks</span>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 5: Add feedback state + Supabase handler to `FixItPanel` component**

  Add props for `analysisId?: string` to `FixItPanelProps`:
  ```ts
  interface FixItPanelProps {
    result: FixItResult;
    onCopyAll?: () => void;
    mediaType?: "static" | "video";
    analysisId?: string;  // ← NEW
  }
  ```

  Add state and handler inside `FixItPanel`:
  ```tsx
  const { user } = useAuth();
  const [hookVote, setHookVote] = useState<Vote>(null);
  const [bodyVote, setBodyVote] = useState<Vote>(null);
  const [ctaVote, setCtaVote] = useState<Vote>(null);

  const persistVote = async (section: "hook" | "body" | "cta", vote: Vote) => {
    if (!user || !vote) return;
    // Fire-and-forget — fail silently
    supabase.from("suggestion_feedback").insert({
      user_id: user.id,
      analysis_id: analysisId ?? null,
      section,
      vote,
    }).then(({ error }) => {
      if (error) console.warn("[FixItPanel] feedback write failed:", error.message);
    });
  };

  const handleHookVote  = (v: Vote) => { setHookVote(v);  persistVote("hook",  v); };
  const handleBodyVote  = (v: Vote) => { setBodyVote(v);  persistVote("body",  v); };
  const handleCtaVote   = (v: Vote) => { setCtaVote(v);   persistVote("cta",   v); };
  ```

- [ ] **Step 6: Inject `<FeedbackRow>` at the bottom of each rewrite section in the JSX**

  Locate the three rewrite sections in the return JSX (Hook, Body, CTA). After the existing content in each section card, add:

  - After hook rewrite content: `<FeedbackRow vote={hookVote} onVote={handleHookVote} />`
  - After body rewrite content: `<FeedbackRow vote={bodyVote} onVote={handleBodyVote} />`
  - After CTA rewrite content: `<FeedbackRow vote={ctaVote} onVote={handleCtaVote} />`

- [ ] **Step 7: Wire `analysisId` from PaidAdAnalyzer**

  In `PaidAdAnalyzer.tsx`, compute `analysisId` when analysis completes:
  ```ts
  const analysisId = fileName && analysisTime
    ? btoa(`${fileName}:${analysisTime.toISOString()}`).slice(0, 20)
    : undefined;
  ```

  Pass to `<FixItPanel analysisId={analysisId} ... />`.

- [ ] **Step 8: Check icon imports in FixItPanel**

  ```bash
  grep -n "ThumbsUp\|ThumbsDown" src/components/FixItPanel.tsx
  grep -n "^import.*lucide" src/components/FixItPanel.tsx
  ```

  Confirm `ThumbsUp` and `ThumbsDown` appear in the import line.

- [ ] **Step 9: Build check**

  ```bash
  npm run lint
  ```

- [ ] **Step 10: Commit F3**

  ```bash
  git add src/components/FixItPanel.tsx src/pages/app/PaidAdAnalyzer.tsx
  git commit -m "feat(scorecard): feedback thumbs on AI rewrite suggestions

  - FeedbackRow component: ThumbsUp/Down with 40% opacity, 'Thanks' confirmation
  - Persists to Supabase suggestion_feedback table (fire-and-forget, fail-silent)
  - Added to all 3 rewrite sections: Hook, Body, CTA
  - analysisId wired from PaidAdAnalyzer for correlation"
  ```

---

## Chunk 4: Hook Type Classification

### Feature 4 — Hook Type Classification

**Spec (from reference repo + task description):**

The new HookAnalysisExpanded replaces the current compact inline layout with a richer structure:

1. **Header card** — large circular ring progress (88px), score color, verdict badge, platform context pill (e.g. `"Top 8% on TikTok"` if score ≥ 8, or `"Below TikTok avg"` if score < 6)
2. **Hook type classification pill** — prominent pill at top: e.g. `"Pattern Interrupt"` | `"Question Hook"` | `"Bold Claim"` | `"Story Open"` | `"Problem Agitate"` — parsed from existing `data.hookType`
3. **Alternative hook callout** — when hook type is parsed AND score < 7, show a "Try instead" card suggesting a different hook type with a one-sentence rationale (static text based on hook type + score band, no new AI call)
4. **Sub-score bars** — replace the current progress ring with the new `SubScoreRow` pattern from the reference: icon, label, score, bar fill, description
5. **Preserve existing data** — `scrollStopFactor`, `firstImpression`, `fix`, `moments` (video timeline) — all must still render

**Score color change propagation:** `scoreColor` in HookAnalysisExpanded also needs the updated thresholds (7/5 split, not 9/7/5). Update the local `STRENGTH_CONFIG` thresholds.

**Alternative hook type suggestions** (static mapping — no AI call):

```ts
const HOOK_ALTERNATIVES: Record<string, string> = {
  "Pattern Interrupt": "Question Hook — opens a curiosity loop your audience needs to resolve.",
  "Question Hook":     "Bold Claim — stakes a contrarian position that stops the scroll.",
  "Bold Claim":        "Story Open — 'I was struggling with X until...' builds instant relatability.",
  "Story Open":        "Pattern Interrupt — unexpected visual or audio shock resets attention.",
  "Problem Agitate":   "Question Hook — 'What if you never had to deal with X again?' is softer and broader.",
};
const DEFAULT_HOOK_ALTERNATIVE = "Question Hook — opens a curiosity loop that earns the scroll.";
```

**Files:**
- Modify: `src/components/HookAnalysisExpanded.tsx`

---

- [ ] **Step 1: Read HookAnalysisExpanded.tsx fully**

  ```bash
  cat src/components/HookAnalysisExpanded.tsx
  ```

  Understand the full existing structure: `parseHookData`, `STRENGTH_CONFIG`, `SCRUBBER_DOTS`, `HookAnalysisExpandedProps`, and the full JSX.

- [ ] **Step 2: Update score color thresholds in HookAnalysisExpanded**

  Update `STRENGTH_CONFIG` to use the new 7/5 thresholds:
  ```ts
  const STRENGTH_CONFIG = {
    strong:   { percent: 85, color: '#10b981', label: 'Strong',   bgColor: 'rgba(16,185,129,0.06)' },
    moderate: { percent: 55, color: '#f59e0b', label: 'Moderate', bgColor: 'rgba(245,158,11,0.06)' },
    weak:     { percent: 25, color: '#ef4444', label: 'Weak',     bgColor: 'rgba(239,68,68,0.06)'  },
  };
  ```

  Update the `strength` derivation in `parseHookData`:
  ```ts
  // was: /strong|scroll.?stop/i → 'strong', /weak/ → 'weak', else 'moderate'
  // Now add hookScore-based fallback:
  const strength: 'strong' | 'moderate' | 'weak' =
    hookScore != null
      ? (hookScore >= 7 ? 'strong' : hookScore >= 5 ? 'moderate' : 'weak')
      : (/strong|scroll.?stop/i.test(strengthRaw) ? 'strong' : /weak/i.test(strengthRaw) ? 'weak' : 'moderate');
  ```

  This means `HookAnalysisExpandedProps` needs a `hookScore?: number` prop so the threshold-based logic can kick in:
  ```ts
  interface HookAnalysisExpandedProps {
    content: string;
    format: 'video' | 'static';
    hookScore?: number;   // ← NEW: 0–10 from ScoreCard scores.hook
    platform?: string;    // ← NEW: e.g. "TikTok" — for platform context pill
  }
  ```

- [ ] **Step 3: Add hook type classification constants**

  Add above the component:
  ```ts
  const HOOK_ALTERNATIVES: Record<string, string> = {
    "Pattern Interrupt": "Question Hook — opens a curiosity loop your audience needs to resolve.",
    "Question Hook":     "Bold Claim — stakes a contrarian position that stops the scroll.",
    "Bold Claim":        "Story Open — 'I was struggling with X until...' builds instant relatability.",
    "Story Open":        "Pattern Interrupt — unexpected visual or audio shock resets attention.",
    "Problem Agitate":   "Question Hook — 'What if you never had to deal with X again?' is softer and broader.",
  };
  const DEFAULT_HOOK_ALTERNATIVE = "Question Hook — opens a curiosity loop that earns the scroll.";

  const HOOK_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    "Pattern Interrupt": { bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)",  text: "#818cf8" },
    "Question Hook":     { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  text: "#34d399" },
    "Bold Claim":        { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  text: "#fbbf24" },
    "Story Open":        { bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.2)",  text: "#a78bfa" },
    "Problem Agitate":   { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   text: "#f87171" },
  };
  const DEFAULT_HOOK_TYPE_COLOR = { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", text: "#a1a1aa" };
  ```

- [ ] **Step 4: Add `RingProgress` SVG component**

  Add before `HookAnalysisExpanded`:
  ```tsx
  function RingProgress({ score, size = 88 }: { score: number; size?: number }) {
    const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const filled = (score / 10) * circumference;
    const cx = size / 2;
    const cy = size / 2;
    return (
      <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#27272a" strokeWidth={5} />
        <circle
          cx={cx} cy={cy} r={radius} fill="none"
          stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference * 0.25}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize={16} fontWeight={700} fontFamily="Geist, sans-serif">
          {score.toFixed(1)}
        </text>
        <text x={cx} y={cy + 11} textAnchor="middle" fill="#52525b" fontSize={9} fontFamily="Geist, sans-serif">
          /10
        </text>
      </svg>
    );
  }
  ```

- [ ] **Step 5: Rewrite the main JSX of `HookAnalysisExpanded`**

  Replace the current `return (...)` with the new layout:

  ```tsx
  export function HookAnalysisExpanded({ content, format, hookScore, platform }: HookAnalysisExpandedProps) {
    const data = parseHookData(content, hookScore);
    const strengthConfig = STRENGTH_CONFIG[data.strength];
    const isStrong = data.verdict === 'strong';
    const hookColor = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';
    const resolvedScore = hookScore ?? (data.strength === 'strong' ? 8 : data.strength === 'moderate' ? 5.5 : 3);

    // Normalize hook type for lookup (strip " — explanation" suffix)
    const hookTypeKey = data.hookType.split(/[—–-]/)[0].trim();
    const hookTypeStyle = HOOK_TYPE_COLORS[hookTypeKey] ?? DEFAULT_HOOK_TYPE_COLOR;

    // Platform context pill (only for strong/weak scores)
    const platformContext = platform && resolvedScore >= 8
      ? `Top ${resolvedScore >= 9 ? "5" : "15"}% on ${platform}`
      : platform && resolvedScore < 5
      ? `Below ${platform} avg`
      : null;

    // Alternative hook — show when score < 7 and hookType is parseable
    const alternativeHook = resolvedScore < 7 && hookTypeKey in HOOK_ALTERNATIVES
      ? HOOK_ALTERNATIVES[hookTypeKey]
      : resolvedScore < 7
      ? DEFAULT_HOOK_ALTERNATIVE
      : null;

    // Moments (video only)
    const moments = format === 'video' ? parseVideoMoments(content) : [];

    return (
      <div className="space-y-3">

        {/* ── Header card — ring + verdict + hook type pill ── */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <RingProgress score={resolvedScore} size={72} />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {/* Verdict badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: strengthConfig.bgColor, color: strengthConfig.color }}
              >
                {strengthConfig.label}
              </span>
              {/* Hook type classification pill */}
              {hookTypeKey && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: hookTypeStyle.bg, border: `1px solid ${hookTypeStyle.border}`, color: hookTypeStyle.text }}
                >
                  {hookTypeKey}
                </span>
              )}
            </div>
            {/* Platform context */}
            {platformContext && (
              <span className="text-[10px] text-zinc-500">{platformContext}</span>
            )}
          </div>
        </div>

        {/* ── Alternative hook callout — only when score < 7 ── */}
        {alternativeHook && (
          <div className="rounded-lg px-3 py-2.5 bg-white/[0.015] border border-white/[0.04]">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 block mb-1">Try instead</span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{alternativeHook}</p>
          </div>
        )}

        {/* ── Recommendation / fix ── */}
        {!data.noFix && data.fix && (
          <div className="rounded-lg p-3 bg-white/[0.015] border border-white/[0.04]">
            <div className="flex items-start gap-2.5">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: isStrong ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}
              >
                {isStrong
                  ? <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                  : <Sparkles size={12} style={{ color: '#f59e0b' }} />}
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block mb-0.5">
                  {isStrong ? 'No Changes Needed' : 'Suggestion'}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{data.fix}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Format-specific panels (static / video) — PRESERVED ── */}
        {format === 'static' ? (
          <div className="grid grid-cols-2 gap-2">
            {data.scrollStopFactor && (
              <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wide block mb-1">Scroll-Stop</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{data.scrollStopFactor}</p>
              </div>
            )}
            {data.firstImpression && (
              <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wide block mb-1">First Glance</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{data.firstImpression}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Video scrubber */}
            <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wide block mb-2">Timeline</span>
              <div className="relative">
                <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                  <div className="h-full rounded-full w-full" style={{ background: 'linear-gradient(90deg, #10b98180 0%, #10b98180 40%, #f59e0b80 70%, #ef444480 100%)' }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  {SCRUBBER_DOTS.map(dot => (
                    <span key={dot.ts} className="text-[8px] font-mono text-zinc-600">{dot.ts}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Timestamp moments */}
            {moments.length > 0 && (
              <div className="space-y-1.5">
                {moments.slice(0, 3).map((m, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5">
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0 w-8">{m.ts}</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 6: Extract video moments parsing to a named function**

  The current component has an IIFE for parsing moments. Extract it:
  ```ts
  function parseVideoMoments(content: string) {
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    const result: { ts: string; label: string; text: string; color: string }[] = [];
    for (const line of lines) {
      const tsMatch = line.match(/(\d+:\d+|\d+s)/);
      if (tsMatch) {
        const ts = tsMatch[1];
        const text = line.replace(tsMatch[0], '').replace(/^[\s:—–\-*]+/, '').replace(/\*\*/g, '').trim();
        if (!text || text.length < 5) continue;
        const tsNum = parseInt(ts);
        const color = tsNum <= 1 ? '#10b981' : tsNum <= 3 ? '#d97706' : '#ef4444';
        result.push({ ts, label: '', text, color });
      }
    }
    return result.slice(0, 5);
  }
  ```

- [ ] **Step 7: Update `parseHookData` to accept `hookScore` param**

  Signature change:
  ```ts
  function parseHookData(content: string, hookScore?: number) {
    // ...existing parsing...
    // Update strength derivation:
    const strength: 'strong' | 'moderate' | 'weak' = hookScore != null
      ? (hookScore >= 7 ? 'strong' : hookScore >= 5 ? 'moderate' : 'weak')
      : (/strong|scroll.?stop/i.test(strengthRaw) ? 'strong' : /weak/i.test(strengthRaw) ? 'weak' : 'moderate');
    // ...
  }
  ```

- [ ] **Step 8: Wire `hookScore` and `platform` from ScoreCard → HookAnalysisExpanded**

  In `ScoreCard.tsx`, find where `<HookAnalysisExpanded>` is rendered (around line 371):
  ```tsx
  <HookAnalysisExpanded
    content={hookSection.content}
    format={format ?? 'static'}
    hookScore={scores.hook}    // ← NEW
    platform={platform}        // ← NEW
  />
  ```

- [ ] **Step 9: Verify icon imports in HookAnalysisExpanded**

  ```bash
  grep -n "^import" src/components/HookAnalysisExpanded.tsx
  grep -n "<CheckCircle2\|<Sparkles\|<TrendingUp\|<Lightbulb\|<Zap\|<Eye\|<Clock" src/components/HookAnalysisExpanded.tsx
  ```

  Confirm `CheckCircle2`, `Sparkles` are in the import. Remove any icons that were imported but are no longer used in JSX.

- [ ] **Step 10: Build check**

  ```bash
  npm run lint
  ```

- [ ] **Step 11: Commit F4**

  ```bash
  git add src/components/HookAnalysisExpanded.tsx src/components/ScoreCard.tsx
  git commit -m "feat(scorecard): hook type classification + ring progress + alternative hook callout

  - RingProgress SVG replaces inline progress ring
  - Hook type classification pill: Pattern Interrupt, Question Hook, Bold Claim, etc.
  - Platform context pill: 'Top 8% on TikTok' / 'Below TikTok avg'
  - Alternative hook callout: 'Try instead' card shown when score < 7
  - parseHookData now accepts hookScore for threshold-based strength derivation
  - parseVideoMoments extracted from IIFE to named function
  - Score thresholds updated: 7/5 split in STRENGTH_CONFIG"
  ```

---

## Final Verification (Before Merge to Staging)

Run per CLAUDE.md `superpowers:verification-before-completion`:

- [ ] `npm run lint` → 0 TypeScript errors
- [ ] `npm run build` → exit 0
- [ ] Icon import audit on every touched file:
  ```bash
  for f in src/components/ScoreHero.tsx src/components/ScoreCard.tsx src/components/FixItPanel.tsx src/components/HookAnalysisExpanded.tsx; do
    echo "=== $f ===" && grep -c "^import" $f && grep -oE "<[A-Z][a-zA-Z]+" $f | sort | uniq
  done
  ```
- [ ] No hardcoded hex in JSX except: score colors (documented exceptions), DOMPurify-processed content
- [ ] No `transition-all` added
- [ ] No `use client` directive added anywhere
- [ ] `suggestion_feedback` table confirmed created in Supabase before testing F3
- [ ] Supabase RLS confirmed: `suggestion_feedback` only writable by authenticated users matching `user_id`

---

## Staging Workflow (Per CLAUDE.md)

Each feature ships independently. After each feature's commit:

```bash
# From feat/scorecard-features branch — after each feature commit
git checkout staging && git merge feat/scorecard-features && git push origin staging
# Verify staging.cutsheet.xyz — check the feature visually
git checkout main && git merge staging && git push origin main
git branch -d feat/scorecard-features-fN  # delete per-feature branch when done
```
