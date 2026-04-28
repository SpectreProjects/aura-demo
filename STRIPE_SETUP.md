# AURA Stripe Test Mode Setup

AURA currently includes a safe frontend placeholder for Stripe checkout. It does not expose a Stripe secret key and does not create real Checkout Sessions from the browser.

## Required frontend env vars

Set these in local `.env` and in Netlify environment variables:

```txt
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Do not add `STRIPE_SECRET_KEY` to Vite frontend env vars.

## Plans

- Starter: £29/month
- Growth: £59/month
- Multi-location: £99/month

## Real checkout next step

Real Stripe Checkout requires a backend endpoint or Netlify Function:

1. Create Stripe products/prices in Stripe test mode.
2. Add `STRIPE_SECRET_KEY` only to Netlify environment variables for the Function.
3. Create a Netlify Function such as `netlify/functions/create-checkout-session.js`.
4. The frontend Pricing page should call that function with the selected plan.
5. The Function should create a Stripe Checkout Session and return `session.url`.
6. The frontend redirects the browser to `session.url`.

The current Pricing page logs the selected plan and shows a placeholder alert so the UI is ready without unsafe secret-key usage.

## Netlify notes

In Netlify, configure:

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - future serverless-only `STRIPE_SECRET_KEY`

Keep `STRIPE_SECRET_KEY` out of the React app and out of Git.
