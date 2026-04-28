# Google Business Profile Direct Integration

AURA connects directly to Google Business Profile using OAuth and Netlify Functions. Zapier is not required.

## Local Google OAuth settings

In Google Cloud Console, configure the OAuth client:

- Authorized JavaScript origin: `http://localhost:8888`
- Authorized redirect URI: `http://localhost:8888/.netlify/functions/google-auth-callback`

The scope used by AURA is:

```txt
https://www.googleapis.com/auth/business.manage
```

## Required Netlify Function env vars

Set these in `.env` for `netlify dev`, and in Netlify environment variables for deployment:

```txt
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8888/.netlify/functions/google-auth-callback
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Local secrets live in the root `.env` file. This file must stay ignored by Git and must not be committed.

## Security notes

- Never expose `GOOGLE_CLIENT_SECRET` in frontend code.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- These values are only for Netlify Functions.
- Supabase Auth remains AURA's login system. Google OAuth is only for connecting Google Business Profile.

## Local development

Run the app through Netlify so Functions are available:

```bash
netlify dev
```

Open:

```txt
http://localhost:8888
```

Then go to Settings and click **Connect Google Business Profile**.

## OAuth behaviour

`google-auth-start` redirects to:

```txt
https://accounts.google.com/o/oauth2/v2/auth
```

It sends:

- `client_id`
- `redirect_uri`
- `response_type=code`
- `access_type=offline`
- `prompt=consent`
- `scope=https://www.googleapis.com/auth/business.manage`

`access_type=offline` and `prompt=consent` are important because Google may only return a `refresh_token` when consent is forced.

## Callback behaviour

`google-auth-callback` exchanges the code at:

```txt
https://oauth2.googleapis.com/token
```

Then it stores the tokens in Supabase `google_connections` using `SUPABASE_SERVICE_ROLE_KEY` inside the Netlify Function.

On success, the user is redirected to:

```txt
/app/settings?google=connected
```

On error, the user is redirected to:

```txt
/app/settings?google=error
```

## Review syncing

Review syncing is not implemented yet. The placeholder endpoint is:

```txt
/.netlify/functions/sync-google-reviews
```

The future sync will fetch Google Business Profile reviews and save them into the existing Supabase `reviews` table.
