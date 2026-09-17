---
version: alpha
name: AURA
description: Cinematic editorial marketing for a personal local-business review assistant.
colors:
  white: "#FFFFFF"
  black: "#080808"
  charcoal: "#242424"
  grey: "#626262"
  line: "#EAEAEA"
typography:
  sans:
    fontFamily: "DM Sans, Arial, sans-serif"
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
rounded:
  DEFAULT: "0"
spacing:
  page-gutter: "clamp(24px, 5vw, 88px)"
  editorial-max: "1170px"
components:
  button: {}
  navigation: {}
  review-demo: {}
  login-entry: {}
---

# AURA Design System

## Overview

### Creative North Star

Spyker’s September 2026 homepage: cinematic opening, condensed typography, staggered editorial photography, white space, a dramatic black statement and a quiet, spacious footer. Translate its pacing into the human world of local businesses; use original content and licensed imagery.

### Product context and register

- Audience: owners of cafés, restaurants, salons, trades and local services in Scotland and the UK, per the project brief.
- Page job: explain Aura’s personalised Google review replies and lead to account creation.
- Language: English (UK). Natural, warm, direct; no unsupported metrics, endorsements or free-trial promises.
- Register: brand marketing on `/`, with a restrained editorial extension on `/login`. Authenticated product screens retain their operational layout.
- Signature: the transition from a full-screen business photograph to an oversized black-and-white statement and an illustrative review-to-reply sequence.
- Anti-references: dashboard card grids, coloured gradients, stock SaaS feature icons, invented testimonials.
- Canonical runtime tokens: `src/pages/Landing.css`, scoped under `.aura-landing`; this document mirrors those tokens. Update both together when changing the identity. Do not migrate dashboard colours to these values.

## Colors

White and black carry the main section contrast. Charcoal is body copy, grey is secondary copy and pale grey is the divider colour. On black, secondary text is #AAAAAA. Photography supplies colour. Use current-colour focus outlines with clear offsets and system colours in forced-colours mode.

## Typography

Self-hosted Barlow Condensed 500 for display headings, small uppercase labels and account buttons. Self-hosted DM Sans 400–600 for body text, navigation and the wordmark. Fonts use the SIL Open Font License, included beside the font files. Body copy is 13–15px with generous line height; large display headings use a tight 0.94–0.99 line height. Do not use a registration mark without trademark evidence.

## Layout

The hero fills the small viewport height, with a 680px desktop / 640px mobile minimum. Main gutters scale from 24px to 88px. The editorial grid caps at 1170px. Responsive breakpoints are 1000px and 700px. Below 700px, editorial and benefit content become one column and the floating image composition becomes an ordered two-column image grid surrounding the text. Keep CTA labels readable and media geometry reserved.

## Elevation & Depth

Use tonal sections, photography, spacing and hairline borders. Avoid drop shadows, translucent cards and ornamental gradients across marketing content; the `/login` shell is the deliberate exception, using one soft ambient shadow to separate its rounded frame from the neutral canvas. Dark photo overlays exist to protect white text contrast. The navigation uses the native HTML dialog top layer.

## Shapes

Rectangular imagery, panels and buttons. The `/login` route uses a deep rounded outer frame and curved image-to-form seam as a contained authentication treatment. Circles are limited to the media control, illustrative avatar and process indicator.

## Components

### Buttons and actions

All primary CTAs say “Create an account” and link to `/signup`. Black on white; white on photography or black. Use 52–54px minimum height, an arrow, visible focus, restrained hover and active feedback. Existing login remains `/login`.

### Login entry

The `/login` screen extends the landing page through a cinematic copper-toned photograph, the plain AURA wordmark, oversized condensed type and a flat white sign-in panel. A deep rounded outer shell and curved overlapping seam frame the split composition; controls remain rectangular with hairline borders. Google and email/password authentication retain their production behaviour. Below tablet width, the photograph becomes a compact branded header and the white panel overlaps it with rounded top corners so the form keeps a comfortable single-column measure.

### Navigation and overlays

Menu on the left, AURA centred and Log in on the right. Menu is a full-screen modal dialog with native focus containment, Escape/close handling, restored trigger focus and locked background scrolling. Section links close the menu, scroll to the section and focus it. Footer includes account, login and existing legal routes. No public developer sign-in shortcut or waitlist form.

### Iconography

Lucide, mostly 14–22px, with thin strokes. Labels accompany actions except universally understood close/pause controls, which have accessible names. Stars are only part of clearly labelled illustrative examples.

### Motion

Slow 24-second crossfade and zoom in the hero with a pause control. Content shifts gently into place over 0.85 seconds; never conceal section content behind an opacity reveal. The scripted reply appears after 1.8 seconds once the demonstration is in view and supports replay. There is no live AI call or review posting. Reduced motion shows static hero imagery and the finished reply, without zoom, fades or parallax.

### Content and data visualization

All reviews and replies are explicitly illustrative. Photography depicts business categories, not named Aura customers or endorsements. Asset provenance lives in `public/landing/CREDITS.md`. No pricing, customer results, rankings or client logos without verified inputs.

## Do’s and Don’ts

- Do preserve spacious editorial pacing and natural business language.
- Do scope new landing styles and fonts to the marketing page.
- Don’t transfer marketing animations or spacing into operational dashboard screens.
- Don’t add fabricated evidence or claims to fill a layout.
