# Cutsheet Figma Make Setup

## Stack
React 19 + Vite 6 + TypeScript + Tailwind CSS v4

## Key files in production codebase
- src/styles/tokens.css — CSS variables (matches this kit)
- src/index.css — global styles
- src/components/ScoreCard.tsx — primary results component
- src/components/ScoreHero.tsx — score number + benchmark bar
- src/components/ui/ — landing page components
- src/pages/app/ — analyzer pages

## Workflow
1. Design component in Figma Make
2. Screenshot and share with Claude Chat
3. Claude Chat writes implementation prompt
4. Claude Code implements into existing codebase

## Font
Geist (already loaded). Use Inter as fallback in Figma.