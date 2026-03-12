---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill whenever the user asks to build, modify, or fix web components, pages, or applications — including layout tweaks, styling changes, new sections, or visual polish. Generates creative, polished code that avoids generic AI aesthetics. Also triggers for design audits, visual consistency checks, and "make this look better" requests.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## Design Thinking

Before coding, understand the context and commit to a clear aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an intentional direction — brutally minimal, maximalist, retro-futuristic, organic, luxury, editorial, brutalist, art deco, soft/pastel, industrial, etc. Use these for inspiration but design one true to the project's identity.
- **Constraints**: Framework, performance, accessibility requirements.
- **Differentiation**: What makes this memorable? What's the one detail someone will notice?

Choose a clear conceptual direction and execute with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and characterful. Avoid generic defaults (Arial, Inter, Roboto, system fonts). Pair a distinctive display font with a refined body font. Type hierarchy should be crystal clear — use weight, size, and tracking to create separation.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Reserve white/bright text for primary content; use opacity layers for secondary/tertiary info.
- **Motion**: Focus on high-impact moments — one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions. Use CSS transitions for hover states that surprise. Prioritize CSS-only solutions.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Generous negative space OR controlled density. Break predictable grids when it serves the design.
- **Backgrounds & Visual Details**: Create atmosphere and depth. Apply gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, and grain overlays where they serve the aesthetic.
- **Glass-morphism**: `backdropFilter: "blur(16px)"` with `WebkitBackdropFilter` for cross-browser support. Pairs with translucent backgrounds like `rgba(255,255,255,0.03)` for a frosted glass effect.

Avoid generic AI aesthetics: overused font families, cliched purple-gradient-on-white schemes, predictable component patterns, cookie-cutter design that lacks context-specific character. Interpret creatively and make unexpected choices that feel genuinely designed for the context.

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.

---

## Cutsheet Design System

This project uses a token-based design system defined in `src/styles/tokens.css`. All new UI must use these tokens — never hardcode colors, radii, or font stacks.

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#08080F` | Page background (near-black) |
| `--surface` | `rgba(255,255,255,0.03)` | Card/panel backgrounds |
| `--surface-el` | `rgba(255,255,255,0.05)` | Elevated surface (pills, badges) |
| `--surface-dim` | `rgba(255,255,255,0.04)` | Subtle background |
| `--border` | `rgba(255,255,255,0.10)` | Default borders |
| `--border-strong` | `rgba(255,255,255,0.18)` | Emphasized borders |
| `--border-hover` | `rgba(255,255,255,0.2)` | Border on hover |
| `--ink` | `rgba(255,255,255,0.92)` | Primary text |
| `--ink-muted` | `rgba(255,255,255,0.5)` | Secondary text |
| `--ink-faint` | `rgba(255,255,255,0.25)` | Tertiary/hint text |
| `--label` | `#a5b4fc` | Section labels (indigo-200) |
| `--accent` | `#6366F1` | Primary accent (indigo-500) |
| `--accent-rgb` | `99, 102, 241` | For rgba() compositions |
| `--accent-hover` | `#5254CC` | Accent hover state |
| `--grad` | `linear-gradient(135deg, #6366F1, #8B5CF6)` | Accent gradient |
| `--success` | `#10B981` | Green — success/excellent |
| `--error` | `#EF4444` | Red — error/weak |
| `--warn` | `#F59E0B` | Amber — warning/average |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--sans` | `'Geist', sans-serif` | Body text, UI labels |
| `--mono` | `'Geist Mono', monospace` | Code, data, file names |

The app is dark-only (`isDark = true` hardcoded). No light mode tokens exist.

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `8px` | Small elements (pills, tags) |
| `--radius` | `16px` | Default cards, panels |
| `--radius-lg` | `20px` | Large cards |
| `--radius-xl` | `24px` | Hero cards, modals |

Always use tokens: `borderRadius: "var(--radius)"` — never hardcode `"12px"` or `"16px"`.

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | Subtle lift |
| `--shadow-md` | Card hover state |
| `--shadow-lg` | Modals, drawers |
| `--shadow-glow` | Indigo glow accent |

### Timing

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | `150ms` | Hover states |
| `--duration-mid` | `250ms` | Panels, reveals |
| `--duration-slow` | `400ms` | Page transitions |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default easing |
| `--spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy elements |

### Score-Band Semantics

Scores map to colors with this logic:
- **Excellent** (≥9): `--score-excellent` green `#10B981`
- **Good** (≥7): `--score-good` indigo `#6366F1`
- **Average** (≥5): `--score-average` amber `#F59E0B`
- **Weak** (<5): `--score-weak` red `#EF4444`

Each band has `-bg` (10% opacity fill) and `-border` (25% opacity border) variants.

### Section Label Pattern

All section labels follow this exact pattern to match the landing page:

```js
{
  fontFamily: "var(--sans)",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--label)",        // #a5b4fc indigo
  letterSpacing: "0.18em",
  textTransform: "uppercase",
}
```

### Card Pattern

Cards use glass-morphism with token borders:

```js
{
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
}
// Hover: boxShadow: "var(--shadow-md)", borderColor: "var(--border-hover)"
```

### Implementation Notes

- **Inline styles**: The app uses React inline styles (style={{...}}) — not CSS modules or Tailwind.
- **Dark-only**: `const isDark = true` is hardcoded in App.tsx. All colors assume dark background.
- **Token references in JS**: Use `"var(--token-name)"` string values inside style objects.
- **Focus rings**: Use `--focus-ring` token for keyboard focus states.
- **Scrollbars**: Styled thin (6px) with translucent thumbs in tokens.css.
- **Reduced motion**: Respected via `prefers-reduced-motion` media query in tokens.css.
