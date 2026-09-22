# AURA Product UX Contract

## Product context

- Audience: owners of UK cafés, restaurants, salons, trades and other local businesses.
- Primary job: review an AURA-written Google response, adjust it if needed and deliberately publish it.
- Locale: English (UK); dates use `en-GB`, operational times use Europe/London.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| Google permission and manual-publication boundary | `GOOGLE_REVIEW_DRAFT_RELEASE.md` | Product contract | 2026-09-22 |
| OAuth and environment configuration | `GOOGLE_BUSINESS_PROFILE_SETUP.md` | Integration runbook | 2026-09-22 |
| Data lifecycle, RLS and connection states | `supabase/migrations/20260922161000_google_review_draft_only_release.sql` | Database contract | 2026-09-22 |
| Visual identity | `DESIGN.md` | Design contract | 2026-09-22 |
| Billing and payment | `STRIPE_SETUP.md` | Existing billing runbook; unchanged here | 2026-09-22 |
| Legal copy | `src/pages/LegalPage.jsx` | Existing product copy; unchanged here | 2026-09-22 |

## Visual contract

- Existing runtime CSS remains canonical; `DESIGN.md` mirrors accepted intent and tokens.
- Activation and draft review are product surfaces: smoked graphite glass, restrained copper emphasis, clear semantic warning/success states.
- The dashboard shell and shared control geometry remain the sibling reference. No marketing animation enters the operational flow.

## Canonical UI map

| Capability | Canonical owner | Allowed variant | Verification |
|---|---|---|---|
| Location choice | Native radio group in an AURA search/list surface | One or many results | Keyboard, clear search, narrow viewport |
| Tone and timing form | `GoogleReplySettingsForm` | Activation and Settings | Validation, busy, error, success |
| Confirmation | App-owned native `<dialog>` wrapper | Manual Google publish, disconnect | Focus, Escape, exact-text confirmation |
| Status feedback | Persistent inline banner/status region | Info, warning, error, success | Live region, stable geometry |
| Scrollbar | Global `src/index.css` baseline | Internal modal geometry only | Chromium and Firefox computed style |

## Flow ledger

| Operation | Trigger | Pending | Success | Failure recovery | Focus outcome |
|---|---|---|---|---|---|
| Connect Google | Connect Google Business Profile | Stable busy button then Google's screen | Return to location selection | Permission/expiry explanation plus retry | Location heading |
| Select location | Use this location | Stable busy button | Tone and timing step | Keep selection and show inline retry | Next step heading |
| Save tone/settings | Save and import reviews | Stable busy button | Import step | Preserve all non-sensitive values | First invalid field or import heading |
| Refresh reviews | Refresh reviews | Existing content remains visible | Updated count/status | Inline retry; reviews remain visible | Trigger |
| Edit draft | Save draft | Stable busy button | Stay on selected review | Keep textarea open with error | Draft editor/summary |
| Regenerate draft | Regenerate | Stable draft panel | Replace saved generated text | Existing draft remains, Retry offered | Draft heading |
| Publish reply | Publish to Google, then confirm dialog | Dialog remains open and busy | Exact remote text shown as published | Conflict/error stays in dialog | Selected review heading |
| Disconnect | Disconnect Google, then confirm | Dialog remains open and busy | Setup banner and reconnect action | Error stays in dialog | Connect action |

## Navigation and responsive behaviour

- Routes use `{Page} — AURA` document titles.
- New signups go to `/setup/google`; existing users remain free to use `/dashboard` and see a setup banner.
- Activation step state is server-derived. Browser Back may return to explanatory steps but cannot invent a completed server state.
- Location results and reviews stack at narrow widths; every action and full address remains available.
- Sticky dashboard chrome must not cover focused fields or dialog actions.

## Async, permissions and resilience

- External side effects are pessimistic. No publication success appears before Google confirms or the same exact remote reply is reconciled.
- Mutations block duplicate activation and carry idempotency keys where repetition can occur.
- Review refresh preserves stale usable content. AI/email failures are independent and recoverable.
- Generation retries use bounded exponential backoff; manual Retry is always available after terminal failure.
- A 401 follows the existing sign-in path. Google revocation becomes `reconnect_required`, not a generic empty state.
- Server ownership checks remain authoritative; browser visibility never grants access.

## Validation and confirmation

- Product forms use `noValidate`, inline text errors, `aria-invalid`, associated descriptions and first-invalid focus.
- Tone choice, preferred phrase guidance, avoided phrase guidance, both examples and recommended delay are required. Custom delay is 0 to 10,080 minutes.
- Reply drafts are 1 to 4,096 characters.
- Publish and disconnect use app-owned dialogs; browser `alert`, `confirm` and `prompt` are forbidden.
- Textareas use `resize: none`; failed saves preserve the owner's text.

## Verification

- Required: lint, unit tests, production build, strict premium UI audit, migration/RLS/advisor checks and browser state matrix.
- Browser matrix: desktop and mobile widths; loading, permission denied, no/one/many locations, imported history, generated/failed/edited/published drafts, rating-only and low-rating reviews, email failure, revoked access and reconnect.
- Security proof: one authenticated AURA owner cannot read or mutate another owner's connection, location, review, draft, settings, job or audit data.
- Canonical sibling: the current dashboard Settings and conversational modal patterns, corrected where they conflict with this contract.
