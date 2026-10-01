---
version: alpha
name: Harmony
description: A Pacifico wordmark with the Apple Hello writing reveal in burnt orange and white.
colors:
  copper: "#DB5926"
  white: "#FFFFFF"
typography:
  sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
  display:
    fontFamily: "Pacifico, cursive"
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

The typography direction is the supplied Pacifico Regular font, using ncdai's Apple Hello Effect from 21st.dev as the animation reference. The first branding screen has one job: introduce the new visual direction. It contains only a flat orange background and a centred white, naturally connected “Harmony”.

This is a brand hero on `/`. The existing authentication and dashboard routes retain their working behaviour and await a separate Harmony design brief. Their previous styling is not a reference for future Harmony work.

## Colors

Burnt orange `#DB5926` fills the opening viewport. White `#FFFFFF` is the only foreground colour and becomes the full page background after scrolling through the word. No gradients, textures, shadows or additional accents.

Runtime tokens live in `src/pages/Landing.css`: `--harmony-orange`, `--harmony-white`, `--harmony-page-gutter`, `--harmony-hello-width` and `--harmony-display-font`. This document mirrors those values. The body background uses the same orange to cover overscroll outside the page.

## Typography

Pacifico Regular is the brand display font. The wordmark uses contours exported from the supplied TTF with native font spacing and natural connections, without added connector lines. The contours retain the supplied letter shapes and inherit white through `currentColor`. The font is unmodified and self-hosted in `public/fonts/`, with its face declared in `src/pages/Landing.css`. Its SIL Open Font Licence is retained alongside it.

`src/components/ui/harmony-pacifico-paths.js` owns the wordmark contours and invisible pen guides. System typography remains available for future utility text; no utility text is visible on this opening screen.

## Layout

Fill the viewport and centre the name vertically and horizontally. The SVG scales down with the viewport, retains its 824:294 aspect ratio and has a maximum width of 638px. Keep 24px of edge clearance on small screens. Use the small viewport height so mobile browser controls do not obscure the name. A 340svh portal region pins the 100svh opening stage during 240svh of native scroll travel. A blank 100svh white section follows.

## Elevation & Depth

One flat surface. No cards, borders, overlays or glass effects.

## Shapes

Keep the supplied Pacifico curves and naturally joined letter shapes. Add no other visible shapes.

## Components

### Apple hello

`src/components/ui/apple-hello-effect.jsx` preserves the author's two-stroke sequence, accelerated with a 0.65 duration scale and a gentle, near-linear cubic easing curve `[0.25, 0.1, 0.75, 0.9]` for more continuous writing. The first stroke takes 0.52 seconds; the second starts at 0.455 seconds and takes 1.82 seconds. Each guide switches to full opacity immediately when its drawing starts, without a fade. The name finishes in about 2.3 seconds and remains visible. Two animated pen guides reveal the genuine Pacifico contours through an SVG mask, adapting the reference's fixed hello geometry to the requested font and name. Undrawn guides are hidden, preventing premature starting dots. Reduced-motion settings show the finished word immediately.

Source: https://github.com/ncdai/chanhdai.com/blob/main/src/registry/components/apple-hello-effect/apple-hello-effect-english.tsx

The original MIT licence is retained in `src/components/ui/LICENSE.ncdai.txt`.

### Scroll portal

`src/components/ui/glyph-portal.jsx` owns the scroll-only wrapper, inspired by the visible Glyph Portal reference at https://21st.dev/@Legacy/components/glyph-portal. The reference source requires sign-in and has not been copied or installed. No picker, annotations, buttons, hints or demo copy are included.

Native scroll drives exponential scale directly, without capturing wheel or touch input. The camera moves into a solid point of the existing Pacifico stroke (403, 133 in its 824 by 294 artwork coordinates). Responsive geometry sizes the final zoom so white ink covers all viewport corners. No colour fade or overlay creates the white finish. Scrolling back reverses the zoom without replaying the greeting.

After the writing callback finishes, the wrapper removes its now redundant SVG mask through CSS, leaving identical font contours. This prevents mask caching artefacts during large zooms or viewport resizing, without modifying the lettering component or its animation timing. Reduced motion uses two ordinary viewport sections, orange then white, without zooming.

### Landing page

`src/pages/Landing.jsx` owns the page composition. It composes the unchanged Harmony greeting inside the scroll portal, followed by plain white. No navigation, buttons, footer, photography or additional visible copy.

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
- Preserve the Pacifico letter shapes and natural connections, and provide an accessible text equivalent.
- Honour reduced motion and keep the layout stable during animation.
- Do not carry forward the previous AURA marketing design.
- Expand the brand only when a subsequent brief calls for it.
