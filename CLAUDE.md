# Cutsheet — Project Rules

## Overview
Cutsheet is a video analysis SaaS built with React 19 + Vite 6 + TypeScript + Tailwind CSS v4. Dark-first design system with light mode support.

## Tech Stack
- **Framework:** React 19 (SPA, no SSR)
- **Build:** Vite 6 with `@tailwindcss/vite` plugin
- **Styling:** Tailwind CSS v4 + CSS custom properties in `src/styles/tokens.css`
- **Components:** CVA (class-variance-authority) + Radix UI primitives
- **Icons:** lucide-react
- **Animation:** framer-motion
- **Routing:** react-router-dom v7
- **Backend:** Supabase (auth/db), Express (API), Stripe (payments)
- **AI:** Google Gemini API
- **Path alias:** `@/` maps to project root

## Project Structure
```
src/
├── components/          # App components
│   └── ui/              # Reusable UI primitives (Button, SegmentedControl, etc.)
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── services/            # API services
├── lib/utils.ts         # cn() helper (clsx + tailwind-merge)
├── styles/tokens.css    # Design tokens (CSS custom properties)
├── types/               # TypeScript types
├── utils/               # Utility functions
├── theme.ts             # Light/dark theme token maps
├── index.css            # Tailwind imports + global styles
└── App.tsx              # Root component
api/                     # Vercel serverless functions
```

## Design System

### Color Tokens (from `src/styles/tokens.css`)
- **Background:** `--bg: #08080F` (near-black)
- **Surfaces:** `--surface` (3% white), `--surface-el` (5% white)
- **Borders:** `--border` (10% white), `--border-strong` (18% white)
- **Text:** `--ink` (92% white), `--ink-muted` (50%), `--ink-faint` (25%)
- **Accent:** `--accent: #6366F1` (indigo), `--accent-hover: #5254CC`
- **Gradient:** `--grad: linear-gradient(135deg, #6366F1, #8B5CF6)`
- **Semantic:** `--success: #10B981`, `--error: #EF4444`, `--warn: #F59E0B`
- **Score bands:** excellent (green), good (indigo), average (amber), weak (red)

### Typography
- **Sans:** Geist (`--sans`)
- **Mono:** Geist Mono (`--mono`)
- **Logo font:** TBJ Interval (custom, `@font-face` in tokens.css)
- **Display:** Outfit (used in landing page headings)

### Spacing & Radius
- `--radius-sm: 8px`, `--radius: 16px`, `--radius-lg: 20px`, `--radius-xl: 24px`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`

### Component Patterns
- Use `cn()` from `src/lib/utils.ts` for className merging
- Use CVA for component variants (see `src/components/ui/button.tsx`)
- Use CSS custom properties for theme values, Tailwind utilities for layout
- Button variants: default, destructive, outline, secondary, ghost, link

### Theme System (`src/theme.ts`)
- Two modes: `light` (default) and `dark`
- Dark mode uses aurora-style radial gradients on background
- Light mode: `#FAFAF9` background, `#111110` text

## Figma Integration (MCP)

When translating Figma designs to code:
1. **Use existing tokens** — map Figma colors to CSS custom properties, not hardcoded hex values
2. **Use existing components** — check `src/components/ui/` before creating new ones
3. **Use `cn()` for classNames** — always merge with `cn()`, never concatenate strings
4. **Use CVA for variants** — if a component has multiple visual states, use class-variance-authority
5. **Use lucide-react for icons** — match Figma icons to lucide equivalents
6. **Use framer-motion for animations** — `motion.div` with `initial`/`animate`/`exit` props
7. **Follow file conventions** — components in PascalCase, hooks with `use` prefix, services as plain modules
8. **Responsive approach** — mobile-first with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
9. **Path imports** — use `@/src/...` alias for imports

## Dev Server
- `npm run dev` → port 3000
- `npm run preview` → port 4173
- `npm run lint` → TypeScript check (`tsc --noEmit`)
- `npm run build` → production build

## Git
- Main branch: `main`
- Keep commits focused and descriptive
