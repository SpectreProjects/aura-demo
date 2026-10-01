---
version: alpha
name: Harmony
description: A Pacifico wordmark with a scroll portal and floating Harmony navigation.
colors:
  copper: "#DB5926"
  white: "#FFFFFF"
  navigation-ink: "#1D1D1F"
typography:
  sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
  display:
    fontFamily: "Pacifico, cursive"
rounded:
  DEFAULT: "0px"
spacing:
  page-gutter: "24px"
  hello-width: "1000px"
components:
  apple-hello: {}
  navbar: {}
---

# Harmony Design System

## Overview

Harmony is the new identity for the review assistant used by local businesses in Scotland and the UK. This document replaces the previous AURA design direction.

The typography direction is the supplied Pacifico Regular font, using ncdai's Apple Hello Effect from 21st.dev as the animation reference. The first branding screen has one job: introduce the new visual direction. It contains a flat orange background, a centred white, naturally connected “Harmony”, the subsequently requested floating navigation at the top, and a Get Started call to action beneath the word.

This is a brand hero on `/`. The existing authentication and dashboard routes retain their working behaviour and await a separate Harmony design brief. Their previous styling is not a reference for future Harmony work.

## Colors

Burnt orange `#DB5926` fills the opening viewport. White `#FFFFFF` colours the wordmark and becomes the full page background after scrolling through the word. The white navbar uses `#1D1D1F` for readable labels and its primary action, with the supplied orange H logo. The hero has no gradients or textures.

Runtime tokens live in `src/pages/Landing.css`: `--harmony-orange`, `--harmony-white`, `--harmony-page-gutter`, `--harmony-hello-width`, `--harmony-cta-gap` and `--harmony-display-font`. This document mirrors those values. The body background uses the same orange to cover overscroll outside the page.

## Typography

Pacifico Regular is the brand display font. The wordmark uses contours exported from the supplied TTF with native font spacing and natural connections, without added connector lines. The contours retain the supplied letter shapes and inherit white through `currentColor`. The font is unmodified and self-hosted in `public/fonts/`, with its face declared in `src/pages/Landing.css`. Its SIL Open Font Licence is retained alongside it.

`src/components/ui/harmony-pacifico-paths.js` owns the wordmark contours and invisible pen guides. The navbar uses system sans-serif typography at 14px, keeping utility labels distinct from the Pacifico brand lettering.

## Layout

Fill the viewport and centre the name vertically and horizontally. The SVG scales down with the viewport, retains its 824:294 aspect ratio and has a maximum artwork width of 1000px, giving its visible lettering approximately the same 960px span as the navbar. The artwork stays centred independently of the CTA. A height-based cap leaves room for the navbar and button on short screens. Keep 24px of edge clearance on small screens. Use the small viewport height so mobile browser controls do not obscure the name. A 340svh portal region pins the 100svh opening stage during 240svh of native scroll travel. A blank 100svh white section follows.

## Elevation & Depth

The hero stays flat. The floating navbar adds a restrained border and shadow to remain visible over both orange and white. Its mobile disclosure uses the same opaque white surface; no glass effects.

## Shapes

Keep the supplied Pacifico curves and naturally joined letter shapes. The navbar and primary action use pill corners; the mobile panel uses a 24px radius.

## Components

### Apple hello

`src/components/ui/apple-hello-effect.jsx` preserves the author's two-stroke sequence, accelerated with a 0.65 duration scale and a gentle, near-linear cubic easing curve `[0.25, 0.1, 0.75, 0.9]` for more continuous writing. The first stroke takes 0.52 seconds; the second starts at 0.455 seconds and takes 1.82 seconds. Each guide switches to full opacity immediately when its drawing starts, without a fade. The name finishes in about 2.3 seconds and remains visible. Two animated pen guides reveal the genuine Pacifico contours through an SVG mask, adapting the reference's fixed hello geometry to the requested font and name. Undrawn guides are hidden, preventing premature starting dots. Reduced-motion settings show the finished word immediately.

Source: https://github.com/ncdai/chanhdai.com/blob/main/src/registry/components/apple-hello-effect/apple-hello-effect-english.tsx

The original MIT licence is retained in `src/components/ui/LICENSE.ncdai.txt`.

### Scroll portal

`src/components/ui/glyph-portal.jsx` owns the scroll-only wrapper, inspired by the visible Glyph Portal reference at https://21st.dev/@Legacy/components/glyph-portal. The reference source requires sign-in and has not been copied or installed. No picker, annotations, buttons, hints or demo copy are included.

Native scroll drives exponential scale directly, without capturing wheel or touch input. The camera moves into a solid point of the existing Pacifico stroke (403, 133 in its 824 by 294 artwork coordinates). Responsive geometry sizes the final zoom so white ink covers all viewport corners. No colour fade or overlay creates the white finish. Scrolling back reverses the zoom without replaying the greeting.

After the writing callback finishes, the wrapper removes its now redundant SVG mask through CSS, leaving identical font contours. This prevents mask caching artefacts during large zooms or viewport resizing, without modifying the lettering component or its animation timing. Reduced motion uses two ordinary viewport sections, orange then white, without zooming.

### Navbar

`src/components/ui/navbar-1.jsx` and `navbar-1.css` own the fixed floating white pill, adapting the visible reference at https://21st.dev/@preetsuthar17/components/navbar-1. The reference source requires sign-in and has not been copied or installed. The supplied logo is unmodified in `public/brand/harmony-logo.png`; CSS frames the transparent padding without changing its artwork.

The selected labels are How it works, Features and Pricing. These remain static preview labels until genuine page destinations exist. Log in links to `/login`, Get started to `/signup`, and the H logo returns to the top of `/` without replaying the writing animation. Below 768px the labels and Log in move into an animated disclosure, with a 44px menu toggle. Escape closes it and returns focus to the toggle; outside pointer input and switching to desktop also close it. Reduced motion removes the disclosure animation. All clickable controls have a visible keyboard focus outline.

### Interactive hover button

`src/components/ui/interactive-hover-button.jsx` and its scoped CSS adapt the public manual source at https://magicui.design/docs/components/interactive-hover-button, linked by the requested 21st component. The JSX uses a router link to `/signup` instead of a button, with a single accessible name. A small orange dot expands to fill the white pill over 300ms while the first label exits and a white label with arrow enters. Keyboard focus uses the same state with a visible outline. Reduced motion switches states immediately. The standard colours are white with orange lettering; hover colours are orange with white lettering and a white border.

The compact call to action has a 44px minimum height, 13px text and 20px side padding. It sits 48–72px beneath the enlarged artwork frame, with a gap that scales with viewport height. The word remains centred independently of the button. A separate portal slot fades it out during the first 6% of scroll travel and hides it from interaction afterwards, so the zoom continues into uninterrupted white. Reduced motion keeps it visible on the ordinary orange section.

### Landing page

`src/pages/Landing.jsx` owns the page composition. It composes the unchanged Harmony greeting inside the scroll portal, followed by plain white. It also mounts the fixed Navbar1 above the scroll stage and supplies the Get Started call to action to its separate portal slot. No footer, photography or additional marketing content.

## Do's and Don'ts

### Canonical UI Map

The existing product interaction owners remain in place. This table records behaviour, not the retired visual direction. The brand opening adds the requested navigation; the greeting and zoom remain unchanged.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| CTA | InteractiveHoverButton | `src/components/ui/interactive-hover-button.jsx` and its scoped CSS | White rest state, orange hover/focus state | Signup destination, keyboard focus, mobile layout and hidden state after scrolling |
| Navigation | Navbar1 | `src/components/ui/navbar-1.jsx` and its scoped CSS | Desktop pill and mobile disclosure | Logo and auth destinations, mobile open/close, Escape focus, and 390px overflow checks |
| Select/Listbox | Native platform select | `premium-ui.json` and dashboard components | Native selection controls | Keyboard and narrow viewport checks when these controls change |
| Form | Existing dashboard forms and business setup modal | Dashboard routes and `src/components/BusinessSetupModal.jsx` | Inline settings and modal steps | Validation, loading, error and success checks when forms change |
| Scrollbar | Global application stylesheet | `src/index.css` | Workspace and internally scrolling modal | Desktop and narrow viewport overflow checks |

### Brand rules

- Keep the exact orange and white brand palette, with dark utility text in the white navigation.
- Keep the first screen limited to the greeting, requested navigation and Get Started call to action.
- Preserve the Pacifico letter shapes and natural connections, and provide an accessible text equivalent.
- Honour reduced motion and keep the layout stable during animation.
- Do not carry forward the previous AURA marketing design.
- Expand the brand only when a subsequent brief calls for it.
