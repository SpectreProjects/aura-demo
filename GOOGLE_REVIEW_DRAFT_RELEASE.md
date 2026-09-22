# AURA Google reviews: draft-only release contract

## Safety boundary

AURA may discover reviews, import them, generate a draft and notify the owner without further interaction. AURA must never publish, schedule or queue a Google reply automatically. The only publication path is an authenticated owner opening one saved draft, reviewing the exact text and confirming **Publish to Google** in an AURA-owned confirmation dialog.

No background job, scheduled endpoint or retry worker may call Google's reply endpoint.

## Customer journey

1. Create or sign in to an AURA account.
2. Separately connect Google Business Profile and grant `business.manage`.
3. Confirm one location, even when Google returns only one.
4. Save the required tone examples, phrase guidance, recommended delay and notification choice.
5. Import the complete review history.
6. Poll every 15 minutes and allow an owner-triggered refresh.
7. For an unreplied review created after location selection, generate one draft immediately.
8. Let the owner edit, save, regenerate or publish early.
9. Publish only the exact server-saved text after an explicit confirmation and a current Google-state check.

Standard accounts have one active location. Selecting another archives the previous connection and retains its review history. Enterprise multi-location management is outside this release.

## Reply rules

- Use UK English and the owner-approved tone pack.
- Do not invent events, promises, discounts, compensation, contact details or admissions.
- Rating-only reviews receive a concise response with no invented specifics.
- One- and two-star reviews are labelled **Needs careful review** and still receive a cautious draft.
- The recommended publish time is the original Google review time plus the selected delay. It never blocks early publication.

## Data and permission rules

- Encrypted Google tokens, jobs and audit writes are server-only.
- RLS applies to every exposed table.
- Standard accounts can have at most one active location and one pending selection.
- Imported reviews are scoped by AURA owner, business and connection.
- Generation, notification and publication requests are idempotent.
- A successful Google response, or reconciliation with the same exact remote text, is required before a draft is marked published.
- An AI or email failure never prevents the review itself from appearing.

## Release gates

- Migrate and verify an isolated staging database before production.
- Use a separate staging Vercel project, hostname and Google OAuth client.
- Prove tenant isolation, retry/idempotency, revoked-access recovery and the desktop/mobile visual state matrix.
- Roll out to Connor's internal account for 48 hours, then one trusted customer.
- The controlled live publication requires Connor to choose the location and safe review before the final confirmation.

