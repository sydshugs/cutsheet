# Paid Ad Results V2 — Single Column + Tool Sheets Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the paid ad results page from split-panel to single-column layout with score-led hierarchy and slide-out tool sheets.

**Architecture:** Kill the right panel. ScoreHero + ActionStrip + QuickWins render at the top of a centered 680px column. Deep analysis and report cards follow below. Tools (Fix It, Brief, Policy) open as a ToolSheet overlay instead of tab switching. All token work from v1 carries forward.

**Tech Stack:** React 19, Vite 6, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-23-paid-ad-redesign-v2.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/ToolSheet.tsx` | Slide-out overlay panel for Fix It / Brief / Policy results |
| `src/components/ActionStrip.tsx` | Verdict-driven horizontal action button row |
| `src/components/QuickWins.tsx` | Top 3 improvements, always visible, expandable |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/app/PaidAdAnalyzer.tsx` | Remove right panel, single column, wire ToolSheet |
| `src/components/ScoreCard.tsx` | Strip to thin wrapper — remove actions, overflow menu |
| `src/components/ReportCards.tsx` | Adjust positioning for single-column context |

### NOT Modified
- `src/components/ScoreHero.tsx` — already redesigned in v1, used as-is
- `src/components/SecondEyePanel.tsx` — token-swept in v1, just repositioned
- `src/components/StaticSecondEyePanel.tsx` — same
- `src/components/FixItPanel.tsx` — renders inside ToolSheet, no changes
- `src/components/PolicyCheckPanel.tsx` — renders inside ToolSheet, no changes
- All services, hooks, types — untouched

---

## Task 1: Create ToolSheet component

**Files:**
- Create: `src/components/ToolSheet.tsx`

- [ ] **Step 1: Create ToolSheet.tsx**

This is a new overlay component. It slides in from the right (440px), dims the background, and renders children. It handles Escape key to close.

```tsx
import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ToolSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function ToolSheet({ open, onClose, title, children }: ToolSheetProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[440px] max-w-[90vw] flex flex-col"
            style={{ background: 'var(--surface-1)', borderLeft: '1px solid var(--border-subtle)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {title}
              </span>
              <button
                onClick={onClose}
                className="cs-btn-ghost p-1.5"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ToolSheet.tsx
git commit -m "feat: add ToolSheet slide-out overlay component"
```

---

## Task 2: Create ActionStrip component

**Files:**
- Create: `src/components/ActionStrip.tsx`

- [ ] **Step 1: Create ActionStrip.tsx**

Verdict-driven action button row. Primary button changes based on score.

```tsx
import { Loader2, Wand2, FileText, ShieldCheck, Share2, Sparkles, Lock } from 'lucide-react';
import { getVerdict, type Verdict } from '../lib/scoreColors';

interface ActionStripProps {
  overallScore: number;
  // Handlers
  onFixIt?: () => void;
  onGenerateBrief?: () => void;
  onCheckPolicies?: () => void;
  onShare?: () => void;
  onVisualize?: () => void;
  // Loading states
  fixItLoading?: boolean;
  briefLoading?: boolean;
  policyLoading?: boolean;
  visualizeLoading?: boolean;
  // Feature gates
  canVisualize?: boolean; // false for video
  isPro?: boolean;
  onUpgradeRequired?: (feature: string) => void;
}

function ActionButton({
  label, icon: Icon, onClick, loading, primary, disabled, loadingText,
}: {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  loading?: boolean;
  primary?: boolean;
  disabled?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={primary ? 'cs-btn-primary h-9 px-4' : 'cs-btn-ghost h-9 px-3'}
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {loadingText || label}
        </>
      ) : (
        <>
          <Icon size={14} />
          {label}
        </>
      )}
    </button>
  );
}

export function ActionStrip({
  overallScore, onFixIt, onGenerateBrief, onCheckPolicies, onShare,
  onVisualize, fixItLoading, briefLoading, policyLoading, visualizeLoading,
  canVisualize, isPro, onUpgradeRequired,
}: ActionStripProps) {
  const verdict = getVerdict(overallScore);
  const fixLabel = overallScore >= 8 ? 'Polish This Ad' : 'Fix This Ad';

  // Primary action changes based on verdict
  const primaryAction = verdict === 'Kill' ? 'fix'
    : verdict === 'Test' ? 'brief'
    : 'share';

  return (
    <div className="flex flex-wrap gap-2">
      {/* Fix It */}
      {onFixIt && (
        <ActionButton
          label={fixLabel}
          icon={Wand2}
          onClick={onFixIt}
          loading={fixItLoading}
          loadingText="Rewriting your ad..."
          primary={primaryAction === 'fix'}
        />
      )}

      {/* Brief */}
      {onGenerateBrief && (
        <ActionButton
          label="Brief"
          icon={FileText}
          onClick={onGenerateBrief}
          loading={briefLoading}
          loadingText="Writing brief..."
          primary={primaryAction === 'brief'}
        />
      )}

      {/* Policies */}
      {onCheckPolicies && (
        <ActionButton
          label="Ad Policies"
          icon={ShieldCheck}
          onClick={onCheckPolicies}
          loading={policyLoading}
          loadingText="Checking policies..."
        />
      )}

      {/* See Improved (static + Pro only) */}
      {canVisualize !== false && onVisualize && (
        isPro ? (
          <ActionButton
            label="See Improved"
            icon={Sparkles}
            onClick={onVisualize}
            loading={visualizeLoading}
          />
        ) : (
          <button
            type="button"
            onClick={() => onUpgradeRequired?.('visualize')}
            className="cs-btn-ghost h-9 px-3 opacity-50"
          >
            <Lock size={12} />
            See Improved
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              PRO
            </span>
          </button>
        )
      )}

      {/* Share (primary for Scale) */}
      {onShare && (
        <ActionButton
          label="Share Score"
          icon={Share2}
          onClick={onShare}
          primary={primaryAction === 'share'}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ActionStrip.tsx
git commit -m "feat: add ActionStrip verdict-driven action buttons"
```

---

## Task 3: Create QuickWins component

**Files:**
- Create: `src/components/QuickWins.tsx`

- [ ] **Step 1: Create QuickWins.tsx**

Always-visible top 3 improvements with expander.

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface QuickWinsProps {
  improvements: string[];
  loading?: boolean;
}

export function QuickWins({ improvements, loading }: QuickWinsProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="cs-card p-4 flex items-center gap-3">
        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
          Generating improvements...
        </span>
      </div>
    );
  }

  if (!improvements || improvements.length === 0) {
    return (
      <div className="cs-card p-4">
        <span className="text-xs" style={{ color: 'var(--success)' }}>
          No critical issues. This ad is ready.
        </span>
      </div>
    );
  }

  const visible = expanded ? improvements : improvements.slice(0, 3);
  const hasMore = improvements.length > 3;

  return (
    <div className="cs-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--ink-faint)' }}>
          Quick wins
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {visible.map((item, i) => (
          <motion.li
            key={i}
            initial={i >= 3 ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex gap-2.5 items-start"
          >
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              style={{ background: 'var(--accent)' }} />
            <span className="text-sm leading-relaxed"
              style={{ color: 'var(--ink-muted)' }}>
              {item}
            </span>
          </motion.li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium mt-3 bg-transparent border-none p-0 cursor-pointer transition-colors"
          style={{ color: 'var(--accent-text)' }}
        >
          {expanded ? 'Show less' : `All ${improvements.length} improvements`}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/QuickWins.tsx
git commit -m "feat: add QuickWins always-visible improvements component"
```

---

## Task 4: Restructure PaidAdAnalyzer.tsx — single column layout

This is the largest task. It removes the right panel and restructures to single column.

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx`

- [ ] **Step 1: Add imports for new components**

Add at the top of the file:
```tsx
import { ToolSheet } from '../../components/ToolSheet';
import { ActionStrip } from '../../components/ActionStrip';
import { QuickWins } from '../../components/QuickWins';
```

- [ ] **Step 2: Replace `rightTab` state with `toolSheet` state**

Find and replace:
```tsx
const [rightTab, setRightTab] = useState<"analysis" | "brief" | "policy">("analysis");
```
With:
```tsx
const [toolSheet, setToolSheet] = useState<null | "fixit" | "brief" | "policy">(null);
```

Update the `handleReset` function: replace `setRightTab("analysis")` with `setToolSheet(null)`.

- [ ] **Step 3: Update tool trigger handlers**

Find `handleGenerateBrief` — where it currently does `setRightTab("brief")`, change to `setToolSheet("brief")`.

Find `handleCheckPolicies` — where it currently does `setRightTab("policy")`, change to `setToolSheet("policy")`.

For Fix It — after `setFixItResult(result)`, add `setToolSheet("fixit")`.

- [ ] **Step 4: Replace the entire render section**

This is the core restructure. Replace the render return (from `return (` to the end) with a single-column layout. The key changes:

**Remove:** The right panel `div` entirely (the `shrink-0 w-[440px]` container and ALL its contents including the `<AnimatePresence>` tab switching, the `PlatformSwitcher` inside it, the `ScoreCard` render, the `SecondEyePanel`, the `StaticSecondEyePanel`, the brief tab content, the policy tab content).

**Keep:** The left panel content but restructure it. The new layout inside the main `<div>`:

```
<div className="flex flex-col flex-1 min-w-0 overflow-auto">
  {/* Empty state — same as before */}
  {status === "idle" && !loadedEntry ? (
    <PaidEmptyState ... />
  ) : (status !== "idle" || loadedEntry) ? (
    <div className="max-w-[680px] mx-auto w-full px-4 py-6">

      {/* 1. Platform Switcher */}
      <PlatformSwitcher ... />

      {/* 2. ScoreHero (extracted from ScoreCard) */}
      {activeResult?.scores && (
        <div className="mt-4">
          <ScoreHero
            score={activeResult.scores.overall}
            verdict={...}
            benchmark={...}
            platform={...}
            format={format}
            dimensions={[
              { name: "Hook", score: activeResult.scores.hook },
              { name: "Copy", score: activeResult.scores.clarity },
              { name: "Visual", score: activeResult.scores.production },
              { name: "CTA", score: activeResult.scores.cta },
            ]}
          />
        </div>
      )}

      {/* 3. ActionStrip */}
      {activeResult?.scores && (
        <div className="mt-4">
          <ActionStrip
            overallScore={activeResult.scores.overall}
            onFixIt={handleFixIt}
            onGenerateBrief={handleGenerateBrief}
            onCheckPolicies={handleCheckPolicies}
            onShare={handleCopy}
            onVisualize={handleVisualize}
            fixItLoading={fixItLoading}
            briefLoading={briefLoading}
            policyLoading={policyLoading}
            visualizeLoading={visualizeStatus === "loading"}
            canVisualize={format === "static"}
            isPro={isPro}
            onUpgradeRequired={onUpgradeRequired}
          />
        </div>
      )}

      {/* 4. QuickWins */}
      {activeResult?.scores && (
        <div className="mt-4">
          <QuickWins
            improvements={platformImprovements ?? activeResult.improvements ?? []}
            loading={improvementsLoading}
          />
        </div>
      )}

      {/* 5. Media Preview (AnalyzerView or VisualizePanel) */}
      <div className="mt-6">
        {/* Same conditional: VisualizePanel when active, else AnalyzerView */}
      </div>

      {/* 6. Deep Analysis — collapsible sections from ScoreCard */}
      {activeResult?.scores && (
        <div className="mt-6 flex flex-col gap-3">
          {/* Hook Analysis */}
          {activeResult.hookDetail && (
            <div className="cs-card p-5">
              <CollapsibleSection title="Hook Analysis" icon={<Lightbulb size={14} />}
                trailing={<span className="text-[10px] font-mono" style={{ color: getScoreColor(activeResult.scores.hook) }}>{activeResult.scores.hook}/10</span>}>
                <HookDetailCard hookDetail={activeResult.hookDetail} format={format} />
              </CollapsibleSection>
            </div>
          )}

          {/* Budget */}
          {(engineBudget || activeResult.budget) && (
            <div className="cs-card p-5">
              <CollapsibleSection title="Budget Recommendation" icon={<DollarSign size={14} />}>
                <BudgetCard engineBudget={engineBudget} budget={activeResult.budget} onNavigateSettings={() => navigate('/settings')} />
              </CollapsibleSection>
            </div>
          )}

          {/* Scene Breakdown (video only) */}
          {format === "video" && activeResult.scenes?.length > 0 && (
            <div className="cs-card p-5">
              <CollapsibleSection title="Scene Breakdown" icon={<Film size={14} />}>
                <SceneBreakdown scenes={activeResult.scenes} />
              </CollapsibleSection>
            </div>
          )}

          {/* Predicted Performance */}
          {prediction && (
            <div className="cs-card p-5">
              <CollapsibleSection title="Predicted Performance" icon={<TrendingUp size={14} />}>
                <PredictedPerformanceCard prediction={prediction} platform={platform} niche={rawUserContext?.niche} />
              </CollapsibleSection>
            </div>
          )}

          {/* Hashtags */}
          {activeResult.hashtags && (...hashtag rendering from ScoreCard...)}

          {/* Static Ad Checks (static only) */}
          {format === "static" && (
            <div className="cs-card p-5">
              <CollapsibleSection title="Ad Quality Checks" icon={<ShieldCheck size={14} />}>
                <StaticAdChecks scores={activeResult.scores} />
              </CollapsibleSection>
            </div>
          )}
        </div>
      )}

      {/* 7. Second Eye / Design Review */}
      {format === "video" && <SecondEyePanel result={secondEyeOutput} loading={secondEyeLoading} />}
      {format === "static" && <StaticSecondEyePanel result={staticSecondEyeResult} loading={staticSecondEyeLoading} />}

      {/* 8. Report Cards (markdown analysis) */}
      {status === "complete" && activeResult && (
        <div className="mt-6">
          <ReportCards
            file={file}
            markdown={activeResult.markdown}
            thumbnailDataUrl={activeResult.thumbnailDataUrl}
            onCopy={handleCopy}
            onExportPdf={handleExportPdf}
            onShare={handleShareLink}
            copied={copied}
            shareLoading={shareLoading}
            onReset={handleReset}
            onFileSelect={(f) => handleFileWithFormatCheck(f)}
          />
        </div>
      )}
    </div>
  ) : null}
</div>

{/* ToolSheet — renders outside the column */}
<ToolSheet
  open={toolSheet === "fixit"}
  onClose={() => setToolSheet(null)}
  title="Fix This Ad"
>
  {fixItResult ? (
    <FixItPanel result={fixItResult} />
  ) : fixItLoading ? (
    <div className="flex items-center gap-3 py-8">
      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
      <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Rewriting your ad...</span>
    </div>
  ) : null}
</ToolSheet>

<ToolSheet
  open={toolSheet === "brief"}
  onClose={() => setToolSheet(null)}
  title="Creative Brief"
>
  {brief ? (
    <div>
      {/* Brief markdown rendering + copy button — move from old brief tab */}
    </div>
  ) : briefLoading ? (
    <div className="flex items-center gap-3 py-8">
      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
      <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Writing your creative brief...</span>
    </div>
  ) : null}
</ToolSheet>

<ToolSheet
  open={toolSheet === "policy"}
  onClose={() => setToolSheet(null)}
  title="Ad Policy Check"
>
  {policyResult ? (
    <PolicyCheckPanel result={policyResult} onClose={() => setToolSheet(null)} />
  ) : policyLoading ? (
    <div className="flex items-center gap-3 py-8">
      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
      <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Checking ad policies...</span>
    </div>
  ) : null}
</ToolSheet>
```

**IMPORTANT:** The implementer MUST read the full current `PaidAdAnalyzer.tsx` before making changes. The pseudocode above shows the STRUCTURE — the actual implementation must preserve all existing handlers, state, effects, and business logic. Only the render layout changes.

- [ ] **Step 5: Remove the `showRightPanel` computed value**

It's no longer needed since there's no right panel. Find and remove:
```tsx
const showRightPanel = ...;
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: restructure to single column with tool sheets"
```

---

## Task 5: Simplify ScoreCard.tsx

ScoreCard is no longer the orchestrator. In the new layout, its sub-components are rendered directly by PaidAdAnalyzer. ScoreCard can be kept as a thin wrapper for the share page and other contexts, but the paid ad page no longer uses it as the main container.

**Files:**
- Modify: `src/components/ScoreCard.tsx`

- [ ] **Step 1: Verify ScoreCard is still used elsewhere**

Check if ScoreCard is imported anywhere besides PaidAdAnalyzer:
- `src/pages/SharePage.tsx` — likely uses it
- `src/pages/app/OrganicAnalyzer.tsx` — likely uses it
- `src/components/DisplayScoreCard.tsx` — might wrap it

If ScoreCard is used by other pages, DO NOT delete it. Just remove it from PaidAdAnalyzer's imports.

- [ ] **Step 2: Remove ScoreCard import from PaidAdAnalyzer**

In `PaidAdAnalyzer.tsx`, remove the ScoreCard import:
```tsx
// Remove: import { ScoreCard } from "../../components/ScoreCard";
```

And import the sub-components directly instead:
```tsx
import { ScoreHero } from '../../components/ScoreHero';
import { HookDetailCard } from '../../components/scorecard/HookDetailCard';
import { BudgetCard } from '../../components/scorecard/BudgetCard';
import SceneBreakdown from '../../components/SceneBreakdown';
import { StaticAdChecks } from '../../components/StaticAdChecks';
import PredictedPerformanceCard from '../../components/PredictedPerformanceCard';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';
```

(Some of these may already be imported — check first.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx src/components/ScoreCard.tsx
git commit -m "refactor: decouple ScoreCard from PaidAdAnalyzer, import sub-components directly"
```

---

## Task 6: Wire tool triggers and verify

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx`

- [ ] **Step 1: Wire Fix It to open ToolSheet**

Find `handleFixIt`. After it calls the service and sets `fixItResult`, ensure it also opens the tool sheet:
```tsx
setFixItResult(result);
setToolSheet("fixit");
```

If Fix It is already triggered and result exists, clicking "Fix This Ad" again should just open the sheet:
```tsx
const handleFixIt = async () => {
  if (fixItResult) {
    setToolSheet("fixit");
    return;
  }
  // ... existing loading/fetch logic ...
  setToolSheet("fixit"); // open after fetch completes
};
```

- [ ] **Step 2: Wire Brief to open ToolSheet**

Same pattern — `handleGenerateBrief` should `setToolSheet("brief")` after fetching.

- [ ] **Step 3: Wire Policy to open ToolSheet**

Same pattern — `handleCheckPolicies` should `setToolSheet("policy")` after fetching.

- [ ] **Step 4: Import getBenchmark for ScoreHero props**

ScoreHero needs benchmark data. Import and compute:
```tsx
import { getBenchmark } from '../../lib/benchmarks';
// In render:
const benchmark = activeResult?.scores
  ? getBenchmark(rawUserContext?.niche ?? '', rawUserContext?.platform ?? '', format === 'video' ? 'video' : 'static')
  : null;
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: wire tool triggers to ToolSheet, complete single-column layout"
```

---

## Task 7: Polish pass — spacing, animation, microcopy

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx`
- Modify: `src/components/ToolSheet.tsx`
- Modify: `src/components/QuickWins.tsx`

- [ ] **Step 1: Add stagger entrance for main column sections**

Wrap the score hero, action strip, quick wins, and deep analysis sections in motion.divs with staggered entrance:

```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: 0, ease: [0.16, 1, 0.3, 1] }}
>
  <ScoreHero ... />
</motion.div>

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
>
  <ActionStrip ... />
</motion.div>
```

- [ ] **Step 2: Verify all microcopy from spec**

Check that all labels match the spec:
- Verdict chip: Kill / Test / Scale
- Fix button: "Fix This Ad" / "Polish This Ad"
- Policy button: "Ad Policies"
- Brief button: "Brief"
- Empty improvements: "No critical issues. This ad is ready."
- Loading states: "Rewriting your ad..." / "Writing your creative brief..." / "Checking ad policies..."

- [ ] **Step 3: Final build check**

```bash
npm run build
```

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: v2 polish — entrance animations, microcopy, spacing"
git push
```

---

## Priority Order

| # | Task | Impact | Risk |
|---|------|--------|------|
| 1 | ToolSheet | New component, standalone | Low — no existing code touched |
| 2 | ActionStrip | New component, standalone | Low |
| 3 | QuickWins | New component, standalone | Low |
| 4 | PaidAdAnalyzer restructure | **Highest impact** — the layout change | **High** — touches 1156-line file |
| 5 | ScoreCard decoupling | Cleanup | Medium — must verify other consumers |
| 6 | Wire triggers | Completes the feature | Medium |
| 7 | Polish | Visual refinement | Low |

Tasks 1-3 can theoretically run in parallel (independent new files). Task 4 is the critical path.
