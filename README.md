# AURA Review Platform

AURA is a React/Vite application for importing Google Business Profile reviews, generating owner-reviewed response drafts and supporting staff recognition. Google replies are draft-only: no background worker can publish to Google.

## Local checks

```text
npm ci
npm test
npm run lint
npm run build
```

## Local development

Put the matching development credentials in ignored `.env.local`, including the Supabase public/server keys, Google client credentials, OAuth state and token-encryption secrets, and AI credentials. Use `AURA_APP_URL=http://localhost:3000` and `GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-oauth-callback`. Register that callback with Google and the local `/dashboard` Auth return URL with Supabase. Keep the token-encryption key aligned with the saved Google connections.

Run `npm run dev:full`, then open `http://localhost:3000/signup` to test real sign-in, separate Business Profile consent and explicit location selection. The launcher aligns a private, ignored `.env` runtime file with `.env.local` for Vercel API functions, preserving any different previous file in ignored local backups. Optional notification emails require a Resend key and verified sender.

Run `npm run dev:ui` for an explicit visual-only dashboard preview. Authenticated accounts use their own workspace and Business Profile reviews, without the old Google Places sample. Both Google steps request an account chooser. Incomplete setup and saved credentials encrypted with an unavailable key lead to guided setup or reconnect.

The guided Google activation states can be reviewed locally at `/setup/google?visual=connect`, `locations`, `no-locations`, `tone`, `import`, `complete` and `denied`. Draft workspace states are available at `/dashboard/reviews?preview=demo&visual=draft`, `low-rating`, `rating-only`, `failed`, `published` and `publish-confirm` in development only.

## Release documents

- `GOOGLE_REVIEW_DRAFT_RELEASE.md` — immutable product and safety contract.
- `GOOGLE_BUSINESS_PROFILE_SETUP.md` — environment, migration and release runbook.
- `UX-CONTRACT.md` — interaction, responsive and accessibility contract.
- `DESIGN.md` — canonical visual language.

The production migration is `supabase/migrations/20260922161000_google_review_draft_only_release.sql`. Apply and verify it in an isolated staging environment before production.
