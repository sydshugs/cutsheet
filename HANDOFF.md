# Cutsheet — Design Handoff

All components listed below were designed and built in code by Claude Code.
No Figma handoff required — the design is complete and live.

## Brand Tokens (applied throughout)

| Token | Value |
|-------|-------|
| Background | `#09090b` |
| Sidebar bg | `#111113` |
| Card | `#18181b` |
| Primary | `#6366f1` |
| Primary light | `#818cf8` |
| Text primary | `#f4f4f5` |
| Text secondary | `#a1a1aa` |
| Text muted | `#71717a` |
| Text hint | `#52525b` |
| Border | `rgba(255,255,255,0.06)` |
| Active bg | `rgba(99,102,241,0.1)` |
| Active border | `#6366f1` |
| Font | Geist Sans |
| Mono | Geist Mono |

## Components Built

### `src/components/Sidebar.tsx`
Fully redesigned. URL-based navigation via React Router NavLink.
- Three labeled sections: ANALYZE, COMPARE, LIBRARY
- Collapsible: 220px expanded ↔ 64px collapsed (ChevronLeft/Right toggle)
- Active item: indigo bg + left border indicator + rounded-right border-radius
- Coming soon items: opacity 0.4, cursor default, click tooltip
- Bottom: UsageIndicator + Settings + User avatar → /settings
- Mobile (<768px): hidden. Replaced by bottom tab bar (Paid | Organic | A/B Test | More)
- "More" opens a bottom drawer with remaining nav items

### `src/components/AppLayout.tsx`
New layout shell for all /app/* routes.
- Flexbox layout: Sidebar (left) + TopBar (top) + `<Outlet />` (content)
- Owns: `useUsage()`, `useHistory()`, `useSwipeFile()`, `mobileOpen`, `showUpgradeModal`
- Passes shared state to child routes via `useOutletContext<AppSharedContext>()`
- TopBar callbacks registered by child pages via `registerCallbacks()`

### `src/components/UsageIndicator.tsx`
New component. Shows free plan usage in sidebar bottom.
- Expanded: labeled progress bar with usage count
- Collapsed: color dot indicator
- Colors: indigo (ok) → amber (60%+) → red (100%)
- Hidden for Pro users

### `src/components/ComingSoon.tsx`
Reusable placeholder for unreleased routes.
- 80px icon circle, title, description, "Coming soon" badge
- fadeIn entrance animation (0.4s ease-out)
- Used at: /app/display (Monitor icon), /app/competitor (Swords icon)

### `src/pages/app/PaidAdAnalyzer.tsx`
New page at /app/paid.
- Intent header: platform pills (All | Meta | TikTok | Google | YouTube) + format pills (Video | Static)
- Empty state: Zap icon, "Score your paid ad", feature pills, VideoDropzone
- Platform context prepended to Gemini prompt when platform !== 'all'
- All single-analyzer logic from old App.tsx (history, share, brief, CTA rewrite)
- ScoreCard in collapsible right panel (matches old App.tsx layout exactly)

### `src/pages/app/OrganicAnalyzer.tsx`
New page at /app/organic.
- Intent header: platform pills (All | TikTok | Instagram Reels | YouTube Shorts)
- Second Eye toggle: indigo switch, "Fresh first-time viewer perspective" sublabel
- Organic prompt always prepended (including platform="all")
- Second Eye: Claude call fires on analysis complete, output renders below ScoreCard
- Empty state: TrendingUp icon, organic-specific copy + pills

### Mobile Bottom Tab Bar (in `Sidebar.tsx`)
4 tabs: Paid (Zap) | Organic (TrendingUp) | A/B Test (GitBranch) | More (MoreHorizontal)
- Height 60px, background #111113, border-top rgba(255,255,255,0.06)
- Active tab: indigo icon + label. Inactive: #52525b
- "More" opens bottom drawer with: Display, Competitor, Batch, Swipe File

## Routes

| Path | Component | Notes |
|------|-----------|-------|
| /app | → /app/paid | Redirect |
| /app/paid | PaidAdAnalyzer | New |
| /app/organic | OrganicAnalyzer | New |
| /app/display | ComingSoon | Monitor icon |
| /app/ab-test | ABTestPage → PreFlightView | Existing |
| /app/competitor | ComingSoon | Swords icon |
| /app/batch | BatchPage → BatchView | Existing |
| /app/swipe-file | SwipeFilePage → SwipeFileView | Existing |

All /app/* routes wrapped in ProtectedRoute + onboarding check (via ProtectedRoute.tsx).
