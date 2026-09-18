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
  copper: "#A96847"
  copper-bright: "#D18A62"
  product-glass: "rgba(255, 255, 255, 0.045)"
typography:
  sans:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
rounded:
  DEFAULT: "0px"
spacing:
  page-gutter: "clamp(24px, 5vw, 88px)"
  editorial-max: "1170px"
components:
  button: {}
  navigation: {}
  review-demo: {}
  signup-entry: {}
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
- Register: brand marketing on `/`, with restrained editorial extensions on `/signup` and `/login`. Authenticated product screens use smoked liquid glass, graphite depth and brushed-copper emphasis while retaining their operational hierarchy.
- Signature: the transition from a full-screen business photograph to an oversized black-and-white statement and an illustrative review-to-reply sequence.
- Anti-references: bright SaaS gradients, blue/purple AI branding, decorative stock illustrations, excessive pill shapes and invented testimonials.
- Canonical runtime tokens: `src/index.css` owns the project-wide type family, while `src/pages/Landing.css` owns the marketing colour and layout tokens scoped under `.aura-landing`. Update this document and those runtime owners together when changing the identity.

## Colors

White and black carry the main section contrast. Charcoal is body copy, grey is secondary copy and pale grey is the divider colour. On black, secondary text is #AAAAAA. Photography supplies colour on public pages. Product screens use #A96847 and #D18A62 as the only decorative accents, alongside semantic red/green states. Use current-colour focus outlines with clear offsets and system colours in forced-colours mode.

## Typography

Self-hosted Barlow Condensed 500 is the sole project-wide type family: display headings, body copy, navigation, controls, wordmark and data figures all use it. Hierarchy comes from scale, case, tracking, colour and spacing rather than switching families. Figures use lining, tabular numerals for stable dashboard alignment. The font uses the SIL Open Font License included beside the font file. Body copy keeps generous line height; large display headings use a tight 0.94–0.99 line height. Do not use a registration mark without trademark evidence.

## Layout

The hero fills the small viewport height, with a 680px desktop / 640px mobile minimum. Main gutters scale from 24px to 88px. The editorial grid caps at 1170px. Responsive breakpoints are 1000px and 700px. Below 700px, editorial and benefit content become one column and the floating image composition becomes an ordered two-column image grid surrounding the text. Keep CTA labels readable and media geometry reserved.

## Elevation & Depth

Public pages use tonal sections, photography, spacing and hairline borders without ornamental card effects. Product pages may use restrained smoked-glass surfaces, a diffuse silver top glow and deep black shadows to create an Apple-like liquid-glass hierarchy. Glass is functional: navigation, metrics, work panels and focused conversational steps only. Dark photo overlays exist to protect white text contrast. The navigation uses the native HTML dialog top layer.

## Shapes

Rectangular imagery, panels and buttons. The `/login` route and authenticated dashboard keep outer viewport edges flat and reserve one deep curve for an inward join: image-to-form on login and sidebar-to-workspace in the dashboard. Product cards use restrained 14–20px radii; conversational panels use up to 28px. Circles are limited to media controls, avatars, status dots and progress indicators.

## Components

### Buttons and actions

All primary CTAs say “Create an account” and link to `/signup`. Black on white; white on photography or black. Use 52–54px minimum height, an arrow, visible focus, restrained hover and active feedback. Existing login remains `/login`.

### Signup entry

The `/signup` entry is a white editorial canvas with a centred AURA wordmark, one hairline panel and the monochrome assistant orb. It presents one short typewritten prompt and one rectangular black Google action. Reuse the existing production Google OAuth component and its redirect unchanged. Keep email/password login on `/login`; the public account-creation entry asks only for Google. Reduced motion uses the static orb and renders the full prompt immediately.

### Login entry

The `/login` screen is a full-viewport split between cinematic copper-toned photography and a flat white sign-in panel. Outer edges stay square; only the inward join is deeply curved. The right panel contains one concise sign-in heading, Google and email/password authentication, the account-creation link and legal copy. Below tablet width, the photograph becomes a compact branded header and the white panel overlaps it with rounded top corners so the form keeps a comfortable single-column measure.

### Navigation and overlays

Menu on the left, AURA centred and Log in on the right. Menu is a full-screen modal dialog with native focus containment, Escape/close handling, restored trigger focus and locked background scrolling. Section links close the menu, scroll to the section and focus it. Footer includes account, login and existing legal routes. No public developer sign-in shortcut or waitlist form.

### Dashboard shell

The dashboard uses a flat graphite sidebar and a smoked-glass workspace joined by one deep inward curve. The sidebar wordmark is text-only and collapses to an icon rail through the existing control. Active navigation uses a slim copper edge and a quiet glass fill. The same shell, tokens and responsive bottom navigation apply to Overview, Reviews, Team, Leaderboard, Rewards and Settings.

### Conversational workflows

Staff, rewards, points and Google Business setup remain step-by-step conversations. They open on a darkened, blurred scrim in a focused graphite glass panel, with copper used for progress, focus and the primary action. Mobile panels stay within the small viewport and scroll internally. Native select popovers remain platform-owned; AURA owns the closed control geometry, type, border and focus state.

### Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native platform select | DESIGN.md + `premium-ui.json` | Native popup with AURA-authored closed control | Keyboard, narrow viewport, desktop browser |
| Form | Existing dashboard form and conversational modal patterns | Dashboard route components | Inline settings, modal stepper | Validation, loading, error and success states |
| Scrollbar | Global application stylesheet | `src/index.css` | Workspace and internally scrolling modal | Chromium screenshot + standards properties |

### Iconography

Lucide, mostly 14–22px, with thin strokes. Labels accompany actions except universally understood close/pause controls, which have accessible names. Stars are only part of clearly labelled illustrative examples.

### Motion

Slow 24-second crossfade and zoom in the hero with a pause control. Content shifts gently into place over 0.85 seconds; never conceal section content behind an opacity reveal. The scripted reply appears after 1.8 seconds once the demonstration is in view and supports replay. There is no live AI call or review posting. Reduced motion shows static hero imagery and the finished reply, without zoom, fades or parallax.

### Content and data visualization

All reviews and replies are explicitly illustrative. Photography depicts business categories, not named Aura customers or endorsements. Asset provenance lives in `public/landing/CREDITS.md`. No pricing, customer results, rankings or client logos without verified inputs.

## Do’s and Don’ts

- Do preserve spacious editorial pacing and natural business language.
- Do use the global Barlow Condensed family across marketing, authentication and product screens.
- Don’t transfer marketing animations or spacing into operational dashboard screens.
- Don’t add fabricated evidence or claims to fill a layout.
