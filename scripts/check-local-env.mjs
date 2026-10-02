import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const env = loadEnv('development', root, '')
const errors = []
const warnings = []
const has = (key) => {
  const value = String(env[key] || '').trim()
  return Boolean(value) && value !== '[SENSITIVE]'
}

for (const key of [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'GOOGLE_OAUTH_STATE_SECRET',
  'GOOGLE_TOKEN_ENCRYPTION_KEY',
  'AURA_APP_URL',
]) {
  if (!has(key)) errors.push(`Missing or unavailable ${key}`)
}

if (has('SUPABASE_URL') && env.SUPABASE_URL !== env.VITE_SUPABASE_URL) {
  errors.push('SUPABASE_URL and VITE_SUPABASE_URL must identify the same project.')
}

let oidcValid = false
if (has('VERCEL_OIDC_TOKEN')) {
  try {
    const claims = JSON.parse(Buffer.from(env.VERCEL_OIDC_TOKEN.split('.')[1], 'base64url'))
    oidcValid = Number(claims.exp) > Date.now() / 1000 + 60
  } catch {
    // Do not output any token or decoded claims.
  }
  if (!oidcValid && !has('AI_GATEWAY_API_KEY')) {
    errors.push('VERCEL_OIDC_TOKEN is expired or malformed. Refresh it or remove it and configure an AI API key; it takes precedence over OPENAI_API_KEY.')
  }
}
if (!has('AI_GATEWAY_API_KEY') && !has('OPENAI_API_KEY') && !oidcValid) {
  errors.push('Missing AI credentials: AI_GATEWAY_API_KEY, OPENAI_API_KEY or a fresh VERCEL_OIDC_TOKEN.')
}

if (has('AURA_APP_URL')) {
  try {
    const app = new URL(env.AURA_APP_URL)
    if (!['localhost', '127.0.0.1', '[::1]'].includes(app.hostname)) {
      errors.push('AURA_APP_URL must point to localhost for this local launch command.')
    }
    if (app.origin !== 'http://localhost:3000') {
      errors.push('This local launch command uses http://localhost:3000. Match AURA_APP_URL or adjust dev:full.')
    }
    if (has('GOOGLE_REDIRECT_URI') && env.GOOGLE_REDIRECT_URI !== `${app.origin}/api/google-oauth-callback`) {
      errors.push('GOOGLE_REDIRECT_URI must be the local app origin followed by /api/google-oauth-callback, and registered with Google.')
    }
  } catch {
    errors.push('AURA_APP_URL must be a valid URL.')
  }
}

if (!has('RESEND_API_KEY')) warnings.push('RESEND_API_KEY is missing; review notification emails cannot be sent.')
if (!has('AURA_EMAIL_FROM')) warnings.push('AURA_EMAIL_FROM is unset; verify the configured/default sender with Resend.')
if (env.VITE_GOOGLE_PLACES_ONBOARDING === 'true' && !has('GOOGLE_PLACES_API_KEY')) {
  errors.push('GOOGLE_PLACES_API_KEY is required when VITE_GOOGLE_PLACES_ONBOARDING=true.')
}

console.log('Harmony local configuration check (values are never displayed).')
for (const message of errors) console.error(`ERROR: ${message}`)
for (const message of warnings) console.warn(`WARNING: ${message}`)
if (errors.length) {
  console.error(`Not ready: ${errors.length} configuration issue(s). No server has been started.`)
  process.exitCode = 1
} else {
  console.log('Core configuration is present. Provider permissions, database migrations and real API calls still require verification.')
}
