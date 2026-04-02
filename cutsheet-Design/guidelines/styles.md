# Cutsheet Style Guide

## Visual Language
Cutsheet is a precision tool for performance marketers.
The aesthetic is: dark, data-forward, clinical confidence.
Reference: Linear (restraint) + Motion app (metric clarity).
NOT: consumer app, startup playful, generic SaaS purple gradient.

## Dark Mode Rules
* Background is always #09090b — not pure black (#000), not dark gray (#111)
* Cards sit one level above background: #18181b
* Elevated elements (modals, dropdowns): #1f1f23
* Never use white backgrounds, never use light mode surfaces

## Depth & Layering
* Three levels only: background → surface → elevated
* Depth is created through border opacity, not shadows
* Ambient glows are subtle: max opacity 15% for background glows
* Grain texture at 3% opacity over hero sections adds premium depth
* No drop shadows on cards — 1px border at 6% white opacity only

## Color Philosophy
* One accent color: indigo #6366f1
* Used on: buttons, active states, focus rings, benchmark bars, pills
* Everything else is zinc (neutral dark grays)
* Score colors (emerald/amber/red) appear only on score values — never decoratively
* Page accent colors (cyan, rose, emerald, sky) appear ONLY on 76×76px icon tiles
* No rainbows, no gradients on interactive elements

## Typography Personality
* Headlines are confident and tight: tracking -0.03em minimum
* One italic word per hero headline — adds personality without gimmicks
* Section labels are whispered: 11px, uppercase, wide tracking, zinc-500
* Numbers are the hero: score values are always the largest element in their container
* Body copy is minimal — if you can cut a sentence, cut it

## Iconography
* lucide-react only — no mixing icon libraries
* Icon size: 14px for inline, 16px for standalone, 20px for feature icons
* Icon color: zinc-500 default, zinc-300 on hover, accent color when active
* Never filled icons — always outline style

## Animation Principles
* Bars animate in on mount: 800ms ease-out from 0 to target width
* Fade-ins: 400ms, translateY 8px → 0, staggered by 100ms
* Score count-up: requestAnimationFrame, 600ms duration
* Hover states: 150ms transition — never instant, never slow
* Reduced motion: always respect prefers-reduced-motion

## Spacing Philosophy
* Generous but not wasteful — let elements breathe
* Cards never touch each other: minimum 24px gap
* Section transitions marked by 1px border-white/[0.04] dividers
* Sections alternate background tone subtly: #09090b ↔ #0d0d12
* Content never touches viewport edge on mobile: minimum 16px padding

## What Feels Right
* A score card that looks like a Bloomberg terminal crossed with a design tool
* Priority fixes that feel like a senior creative director talking to you
* Benchmark bars that feel like real data, not decoration
* The whole product feeling like it was built by someone who actually runs ads

## What Feels Wrong
* Anything that looks like it came from a template
* Colorful gradients on backgrounds or cards
* Rounded corners over 24px on cards
* Icons that are too large or too decorative
* Copy that sounds like an AI wrote it
* Any light-colored surface in the app