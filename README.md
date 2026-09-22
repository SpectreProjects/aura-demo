# AURA Review Platform

AURA is a React/Vite application for importing Google Business Profile reviews, generating owner-reviewed response drafts and supporting staff recognition. Google replies are draft-only: no background worker can publish to Google.

## Local checks

```text
npm ci
npm test
npm run lint
npm run build
```

The guided Google activation states can be reviewed locally at `/setup/google?visual=connect`, `locations`, `no-locations`, `tone`, `import`, `complete` and `denied`. Draft workspace states are available at `/dashboard/reviews?visual=draft`, `low-rating`, `rating-only`, `failed`, `published` and `publish-confirm` in development only.

## Release documents

- `GOOGLE_REVIEW_DRAFT_RELEASE.md` — immutable product and safety contract.
- `GOOGLE_BUSINESS_PROFILE_SETUP.md` — environment, migration and release runbook.
- `UX-CONTRACT.md` — interaction, responsive and accessibility contract.
- `DESIGN.md` — canonical visual language.

The production migration is `supabase/migrations/20260922161000_google_review_draft_only_release.sql`. Apply and verify it in an isolated staging environment before production.
