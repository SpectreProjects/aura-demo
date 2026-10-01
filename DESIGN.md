---
version: alpha
name: Harmony
description: A quiet serif wordmark with an Apple-inspired writing reveal in burnt orange and white.
colors:
  copper: "#DB5926"
  white: "#FFFFFF"
typography:
  sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
  display:
    fontFamily: "TeX Gyre Termes, Georgia, serif"
rounded:
  DEFAULT: "0px"
spacing:
  page-gutter: "24px"
  hello-width: "638px"
components:
  apple-hello: {}
---

# Harmony Design System

## Overview

Harmony is the new identity for the review assistant used by local businesses in Scotland and the UK. This document replaces the previous AURA design direction.

The typography direction is the editorial serif character of Tiempos Headline, using the supplied TeX Gyre Termes family. Apple's hello greeting and ncdai's Apple Hello Effect from 21st.dev inform the stroke reveal. The first branding screen has one job: introduce the new visual direction. It contains only a flat orange background and a centred white, connected serif “Harmony”.

This is a brand hero on `/`. The existing authentication and dashboard routes retain their working behaviour and await a separate Harmony design brief. Their previous styling is not a reference for future Harmony work.

## Colors

Burnt orange `#DB5926` fills the entire viewport. White `#FFFFFF` is the only foreground colour. No gradients, textures, shadows or additional accents.

Runtime tokens live in `src/pages/Landing.css`: `--harmony-orange`, `--harmony-white`, `--harmony-page-gutter`, `--harmony-hello-width` and `--harmony-display-font`. This document mirrors those values. The body background uses the same orange to cover overscroll outside the page.

## Typography

TeX Gyre Termes is the brand serif. The wordmark uses its Italic cut, with custom connecting strokes between the letters. Font-derived SVG contours retain the supplied letter shapes and inherit white through `currentColor`. The font files are unmodified and self-hosted in `public/fonts/`, with normal, italic, bold and bold italic faces declared in `src/pages/Landing.css`. The supplied GUST licence is retained alongside them.

`src/components/ui/harmony-serif-paths.js` owns the wordmark contours, pen guides and connecting strokes. System typography remains available for future utility text; no utility text is visible on this opening screen.

## Layout

Fill the viewport and centre the name vertically and horizontally. The SVG scales down with the viewport, retains its 750:224 aspect ratio and has a maximum width of 638px. Keep 24px of edge clearance on small screens. Use the small viewport height so mobile browser controls do not obscure the name.

## Elevation & Depth

One flat surface. No cards, borders, overlays or glass effects.

## Shapes

Keep the serif contrast and italic letter shapes, with fine curved joins. Add no other visible shapes.

## Components

### Apple hello

`src/components/ui/apple-hello-effect.jsx` adapts the author's stroke-reveal technique to the filled serif contours using SVG masks and connecting strokes. Draw the name once on entry in 1.75 seconds, then leave it visible. Keep each pen guide and connecting stroke hidden until drawing starts, with explicit opacity delays, so undrawn letters never show starting dots. Reduced-motion settings show the finished word immediately.

Source: https://github.com/ncdai/chanhdai.com/blob/main/src/registry/components/apple-hello-effect/apple-hello-effect-english.tsx

The original MIT licence is retained in `src/components/ui/LICENSE.ncdai.txt`.

### Landing page

`src/pages/Landing.jsx` owns the page composition. No navigation, buttons, footer, photography or additional visible copy.

## Do's and Don'ts

### Canonical UI Map

The existing product interaction owners remain in place. This table records behaviour, not the retired visual direction. The brand opening has no interactive controls.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native platform select | `premium-ui.json` and dashboard components | Native selection controls | Keyboard and narrow viewport checks when these controls change |
| Form | Existing dashboard forms and business setup modal | Dashboard routes and `src/components/BusinessSetupModal.jsx` | Inline settings and modal steps | Validation, loading, error and success checks when forms change |
| Scrollbar | Global application stylesheet | `src/index.css` | Workspace and internally scrolling modal | Desktop and narrow viewport overflow checks |

### Brand rules

- Keep the exact orange and white palette.
- Keep the first screen empty apart from the greeting.
- Preserve the serif letter shapes and custom joins, and provide an accessible text equivalent.
- Honour reduced motion and keep the layout stable during animation.
- Do not carry forward the previous AURA marketing design.
- Expand the brand only when a subsequent brief calls for it.
