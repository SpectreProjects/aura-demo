# Google Business Profile integration

AURA uses two separate Google permissions:

1. Google sign-in creates or opens the customer's private AURA account.
2. Google Business Profile OAuth grants `business.manage` so AURA can discover managed locations, import reviews and publish only a reply the owner explicitly confirms.

The Places API preview is separate. A Places API key cannot read a customer's complete Business Profile review history and cannot publish owner replies.

## Draft-only production boundary

AURA checks for reviews and creates drafts in the background. It never publishes a reply in the background. The only code path that calls Google's reply endpoint is `POST /api/google-reply`, which requires:

- an authenticated AURA owner;
- the active selected location;
- a saved draft ID and current version;
- the exact server-saved text;
- an explicit confirmation from the AURA dialog;
- a fresh check that Google does not already hold a different owner reply.

No cron or retry worker imports that publication handler.

## Isolated environments

Use separate infrastructure for staging and production.

| Concern | Staging | Production |
|---|---|---|
| App | Separate Vercel project | Existing AURA Vercel project |
| Hostname | `staging.aurareviewplatform.com` | `aurareviewplatform.com` |
| OAuth client | Dedicated staging Web client | Dedicated production Web client |
| OAuth callback | `https://staging.aurareviewplatform.com/api/google-oauth-callback` | `https://aurareviewplatform.com/api/google-oauth-callback` |
| Database | Supabase branch or dedicated AURA Staging project | AURA production project |
| Email links | Staging hostname | Production hostname |

Never point a staging deployment at production Supabase credentials or the production Google OAuth client.

## Google Cloud configuration

Use the Google Cloud project approved for Google Business Profile API access and enable the APIs used by this release:

- Google My Business API, for review listing and owner replies;
- My Business Account Management API, for managed accounts;
- My Business Business Information API, for managed locations;
- Places API (New), only for the optional public preview already present in AURA.

Create an OAuth 2.0 Client ID with application type **Web application** for each environment. Add the exact environment callback URI and request only:

```text
https://www.googleapis.com/auth/business.manage
```

OAuth branding verification and Google Business Profile API access are separate checks. Before the controlled live test, verify that the intended Cloud project has non-zero Business Profile quota and can list the tester's accounts and locations.

If the consent screen is still in Testing, add each tester as a test user. Customer rollout requires the production consent configuration and any Google verification requested for the scope.

## Vercel environment variables

Set these independently in the staging and production projects:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_OAUTH_STATE_SECRET=
GOOGLE_TOKEN_ENCRYPTION_KEY=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CRON_SECRET=
AURA_APP_URL=

AI_GATEWAY_API_KEY=
AURA_GOOGLE_DRAFT_MODEL=openai/gpt-5.4

RESEND_API_KEY=
AURA_EMAIL_FROM=
```

Vercel deployments may use the automatically managed `VERCEL_OIDC_TOKEN` instead of `AI_GATEWAY_API_KEY`. A direct `OPENAI_API_KEY` is supported only as a server-side fallback. The draft request uses structured output and `store: false` in every case.

The browser still requires its existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never prefix the Google client secret, encryption key, cron secret, AI credential, refresh token or Supabase service-role key with `VITE_`.

Generate state, encryption and cron secrets with a cryptographically secure random generator. Use different values in staging and production.

## Feature controls

These server-only flags default on and can pause one part of the integration without deleting data:

```text
AURA_GOOGLE_CONNECTION_ENABLED=true
AURA_GOOGLE_SYNC_ENABLED=true
AURA_GOOGLE_DRAFTS_ENABLED=true
AURA_GOOGLE_MANUAL_PUBLISH_ENABLED=true
```

Setting a flag to `false`, `off`, `disabled`, `no` or `0` disables that capability. There is intentionally no automatic-publish flag or endpoint.

## Supabase migration order

For a branch cloned from production, apply:

```text
supabase/migrations/20260922161000_google_review_draft_only_release.sql
```

For a new empty staging project, first apply the existing AURA base schemas, including `SUPABASE_GOOGLE_CONNECTIONS_SCHEMA.sql`, and then apply the canonical migration above.

The migration:

- adds pending, active, reconnect, disconnected and archived connection states;
- permits only one active location per standard AURA business;
- safely removes unused plaintext token columns and keeps encrypted tokens server-only;
- creates owner reply settings, draft records, bounded idempotent jobs and append-only audit events;
- retains archived connections and reviews when the location changes;
- enables RLS and gives browser roles only the minimum owner-scoped read access.

After migration, run `supabase/tests/google_review_draft_release.sql`, inspect migration history, and run Supabase security and performance advisors. Do not apply the release migration to production until all staging checks pass.

## Runtime flow

1. `/api/google-oauth-start` verifies the AURA session and creates a signed, ten-minute OAuth state.
2. Google displays the real `business.manage` consent screen.
3. `/api/google-oauth-callback` exchanges the code and saves a short-lived `pending_selection` connection with encrypted tokens.
4. `/api/google-locations` lists every managed account and location.
5. The owner confirms one location; the server re-fetches it from Google before atomically activating it.
6. Tone, phrase, example, timing and notification settings are saved.
7. The complete review history is imported. Only reviews whose original Google creation time is after location confirmation are eligible for drafts and emails.
8. Vercel calls `/api/google-review-sync-cron` every 15 minutes with `Authorization: Bearer $CRON_SECRET`; owners can also refresh manually.
9. A new review appears even if AI generation fails. Generation and email retries are bounded, idempotent and recoverable.
10. The owner edits or regenerates the saved draft, presses **Publish to Google**, reviews the exact text and confirms it.

## Staging verification checklist

- Account creation leads to the separate Google activation journey.
- Permission denial leaves AURA unconnected and recoverable.
- No-location, one-location and several-location states are visually verified.
- A single result still requires confirmation; multiple results support search.
- Initial import produces no historical drafts or emails.
- A genuinely new review creates one draft and one email despite repeated sync calls.
- One- and two-star reviews show **Needs careful review**.
- Rating-only reviews do not invent review details.
- Editing and regeneration never publish.
- Publishing before the recommended time is allowed but explicitly warned.
- Repeated publish requests do not duplicate publication or audit/usage records.
- A different remote owner reply produces a conflict instead of being overwritten.
- Revoked Google access becomes `reconnect_required` and reconnecting archives the previous connection.
- One authenticated owner cannot read another owner's location, reviews, settings or drafts.
- Desktop and mobile screenshots are added to the visual QA pack.

Production rollout remains Connor's internal account for 48 hours, then one trusted customer, before wider availability.
