# Cutsheet Component Patterns

## ScoreCard (primary results view)
- Width: 380px desktop, full width mobile
- Sections in order:
  1. Score Hero (overall score + benchmark bar)
  2. Dimension Tiles (2×2 grid)
  3. Platform Pills (horizontal scroll)
  4. Deep Dive Rows (collapsible)
  5. Action Buttons

## Dimension Tile
- Size: 2×2 grid, each tile ~160px wide
- Score number: 18px semibold, color-coded
- Label: 11px, zinc-500

## Priority Fix Card
- Always visible, never collapsed
- Left border: 2px amber
- Background: rgba(245,158,11,0.05)

## Deep Dive Row
- Height: 44px
- Border-top: 1px rgba(255,255,255,0.04)
- Chevron rotates 90° on open

## CTA Buttons
- Primary: bg-indigo-600, white text
- Ghost: border-white/[0.06], zinc-400 text
- Height: 40px, border-radius: 10px