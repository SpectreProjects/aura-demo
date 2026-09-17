# Google Business Profile integration

AURA uses two separate Google integrations:

- **Places API (New)** finds a business and displays a small public review preview.
- **Google Business Profile APIs** use OAuth to pull the complete review list and publish owner replies.

The Places API key cannot read private Business Profile data or post replies. Every AURA customer must grant the `business.manage` OAuth permission using a Google account that owns or manages the relevant verified location.

## Current external blocker

On 14 September 2026, the AURA Google Cloud project's My Business Account Management API quota was `0 requests per minute` and marked non-adjustable. Google has therefore not granted Business Profile API access to this project yet.

Check the inbox of the Google account used for the application for a response from Google Business Profile API support. Confirm that the application used the same Cloud project (`aura-494720`). If Google asks for more information, reply to that existing case rather than opening duplicate applications.

After approval, the quota should normally show `300 requests per minute` and the Google My Business API should become visible in the API Library.

## Google Cloud requirements

Enable these APIs in the approved project:

- Google My Business API
- My Business Account Management API
- My Business Business Information API
- My Business Notifications API
- My Business Verifications API
- My Business Place Actions API
- My Business Lodging API
- Places API (New), for AURA's optional business-search preview

Configure an OAuth 2.0 Client ID with application type **Web application**.

Production redirect URI:

```text
https://aurareviewplatform.com/api/google-oauth-callback
```

Local redirect URI, when using `vercel dev`:

```text
http://localhost:3000/api/google-oauth-callback
```

The OAuth consent screen must include:

```text
https://www.googleapis.com/auth/business.manage
```

If the consent screen remains in Testing, add every person who will test the connection as a test user. For customer use, publish the consent screen and complete any Google verification requested for the scope.

## Vercel environment variables

Add these as encrypted environment variables for Production and Preview:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://aurareviewplatform.com/api/google-oauth-callback
GOOGLE_OAUTH_STATE_SECRET=
GOOGLE_TOKEN_ENCRYPTION_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are accepted as server fallbacks, but the non-`VITE_` names are preferred for server functions.

Generate the state and encryption secrets with a cryptographically secure random generator. Never prefix server-only values with `VITE_`, and never expose the Google client secret, token encryption key, refresh tokens or Supabase service-role key to frontend code.

## Supabase setup

Run `SUPABASE_GOOGLE_CONNECTIONS_SCHEMA.sql` in the Supabase project used by the production `VITE_SUPABASE_URL`. It:

- stores Google access and refresh tokens encrypted by the Vercel server;
- removes browser access to token-bearing rows;
- stores imported Google reviews separately per AURA user and business;
- enables RLS for every exposed table;
- gives authenticated users read-only access to their own imported reviews.

Run Supabase security and performance advisors after applying the SQL.

## Live flow

1. A signed-in AURA user opens Dashboard → Settings and selects **Connect Google**.
2. `/api/google-oauth-start` verifies the Supabase session and creates a signed, short-lived OAuth state.
3. Google asks the business owner to grant `business.manage`.
4. `/api/google-oauth-callback` exchanges the code, discovers the first managed account/location and securely stores encrypted tokens.
5. **Pull reviews** requests the complete paginated review list and stores it in Supabase.
6. Saving a reply for an imported Google review calls Google's `updateReply` endpoint and records the returned reply state.

For businesses managing multiple locations, the current first version connects the first location returned by Google. Add a location-selection screen before onboarding multi-location groups.

## Verification checklist

- Google My Business API quota is greater than zero.
- OAuth consent returns the user to `/dashboard/settings?google=connected`.
- Google connection status shows the expected location.
- Pull reviews imports more than the five-review Places preview.
- A manual test reply appears on the verified Google Business Profile.
- Refresh-token renewal still works after the initial access token expires.
- Supabase advisors report no security or performance findings.
