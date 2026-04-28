# Google Business Profile Direct Integration

AURA will connect directly to Google Business Profile using OAuth and Netlify Functions. Zapier is not required.

## How it will work

1. A manager clicks **Connect Google Business Profile** in Settings.
2. A Netlify Function builds the Google OAuth URL.
3. Google redirects back to `google-auth-callback`.
4. The callback exchanges the auth code for tokens.
5. Tokens are stored securely in Supabase `google_connections`.
6. `sync-google-reviews` fetches Google Business Profile reviews and saves them into the existing Supabase `reviews` table.
7. Sync results are written to `google_review_sync_logs`.

## Required Netlify Function env vars

Set these in Netlify environment variables only:

```txt
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Security notes

- Never expose `GOOGLE_CLIENT_SECRET` in frontend code.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- These values are only for Netlify Functions.
- The React app should call the Functions, not Google APIs directly.

## Current placeholder functions

- `/.netlify/functions/google-auth-start`
- `/.netlify/functions/google-auth-callback`
- `/.netlify/functions/sync-google-reviews`

They currently return placeholder JSON so the frontend integration flow can be tested safely.
