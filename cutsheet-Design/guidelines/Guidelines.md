# Cutsheet Design System Guidelines

## General Rules
* Dark mode only — never light mode, never light surfaces
* Use flexbox and grid for all layouts — absolute positioning only for overlays and decorative glows
* Keep components small and focused — one responsibility per file
* Refactor as you go — no duplicate color values or spacing values

## Design Tokens
* Background: #09090b
* Surface (cards): #18181b
* Border: rgba(255,255,255,0.06)
* Accent: #6366f1 (indigo)
* Text primary: #f4f4f5
* Text secondary: rgba(255,255,255,0.5)
* Text muted: #71717a
* Base font size: 14px
* Font family: Geist (fallback: Inter)

## Spacing
* Card padding: always 24px (p-6) — never 20px or 28px
* Section vertical padding: 80px mobile, 112px desktop (py-20 sm:py-28)
* Gap between cards: 24px (gap-6)
* Content max width: 1280px wide sections, 640px text-only sections

## Cards
* Every card: border-radius 16px, border 1px solid rgba(255,255,255,0.06), background rgba(255,255,255,0.02)
* Never use drop shadows on cards — borders only
* Featured/elevated card: background rgba(255,255,255,0.04)
* Active/selected card: border rgba(99,102,241,0.2), background rgba(99,102,241,0.06)

## Color Usage
* Indigo #6366f1 — all interactive elements, buttons, active states, focus rings
* Page accent colors (emerald, cyan, rose, etc.) — icon tiles ONLY, 76×76px
* Never use page accent color on buttons, borders, or text outside the icon tile
* Score colors: emerald 8–10, indigo 6–7.9, amber 4–5.9, red 1–3.9

## Typography
* Hero headlines: 72px, Bold 700, tracking -0.035em
* Section headlines: 40px, Semibold 600, tracking -0.025em
* Card titles: 24px, Semibold 600
* Section labels: 11px, Semibold 600, UPPERCASE, tracking 0.12em, zinc-500
* Body copy: 14px, Regular 400, line-height 1.6
* Metadata/captions: 12px, Regular 400, zinc-500
* Score hero number: 52px, Bold 700
* Dimension scores: 18px, Semibold 600

## Buttons
### Primary Button
* Background: #6366f1, hover: #4f46e5
* Text: white, 13px, font-weight 500
* Height: 40px, border-radius: 10px
* Use for: main CTA, Generate Brief, Enter Access Code
* One primary button per card maximum

### Ghost Button
* Border: 1px solid rgba(255,255,255,0.06)
* Background: transparent
* Text: zinc-400, 13px, font-weight 500
* Height: 40px, border-radius: 10px
* Use for: secondary actions, Analyze Another

### Pill Button (nav/CTA)
* Background: #6366f1, border-radius: 9999px
* Use for: landing page hero CTA only

## Score Bars (dimension bars)
* Track: #27272a, height 4px, border-radius 9999px
* Hook bar: #6366f1 (indigo)
* CTA bar: #8b5cf6 (violet)
* Visual bar: #06b6d4 (cyan)
* Brand bar: #f59e0b (amber)
* Bars always animate in on mount — never static

## Priority Fix Card
* Left border: 2px solid rgba(245,158,11,0.4)
* Background: rgba(245,158,11,0.05)
* Border radius: 8px
* Always visible — never collapsed
* Label: "PRIORITY FIX" 10px uppercase amber, tracking-wider

## Deep Dive Rows
* Height: 44px, border-top: 1px rgba(255,255,255,0.04)
* Chevron: 14px zinc-600, rotates 90° when open
* Collapsed by default except Priority Fix

## Navigation (app sidebar)
* Width: 220px expanded, 64px collapsed
* Active item: indigo bg rgba(99,102,241,0.1) + left border #6366f1
* Icon tile: 76×76px, border-radius 14px, page accent color only
* Bottom: UsageIndicator + Settings + User avatar

## Platform Pills
* Height: 28px, border-radius: 9999px, padding: 0 12px
* Default: bg-white/[0.04] border-white/[0.06] text-zinc-400
* Active: bg-indigo-500/10 border-indigo-500/30 text-indigo-300

## What NOT to do
* Never use light backgrounds (#ffffff, #f5f5f5) anywhere
* Never apply page accent color outside the 76×76px icon tile
* Never use more than one primary button per section
* Never add drop shadows to cards
* Never use font-weight below 400
* Never use border-radius below 8px on interactive elements
* Never place CTAs in the middle of content — always at the bottom of a section or card