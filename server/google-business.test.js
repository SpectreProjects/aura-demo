import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import {
  createGoogleOAuthSession,
  createOAuthState,
  decryptGoogleToken,
  encryptGoogleToken,
  googleReviewUrl,
  googleReviewsUrl,
  publicGoogleConnection,
  publicGoogleDraft,
  requireGoogleOAuthSession,
  verifyOAuthState,
} from './google-business.js'

const secret = 'test-secret-that-is-long-enough-for-aura'

test('OAuth state verifies ownership data and rejects tampering or expiry', () => {
  const now = Date.parse('2026-09-22T12:00:00.000Z')
  const state = createOAuthState({ businessProfileId: 'business-1', userId: 'user-1' }, secret, now)
  const payload = verifyOAuthState(state, secret, now + 1000)

  assert.equal(payload.businessProfileId, 'business-1')
  assert.equal(payload.userId, 'user-1')
  assert.throws(() => verifyOAuthState(`${state}tampered`, secret, now + 1000), /invalid/i)
  assert.throws(() => verifyOAuthState(state, secret, now + 11 * 60 * 1000), /expired/i)
})

test('OAuth consent is bound to the browser that started it with PKCE', () => {
  const secret = 'browser-binding-secret'
  const state = createOAuthState({ businessProfileId: 'business-1', userId: 'user-1' }, secret, 1_000)
  const session = createGoogleOAuthSession(state, secret, 1_000)
  const cookieValue = session.cookie.match(/^[^=]+=([^;]+)/)?.[1]
  const request = { headers: { cookie: `another=value; __Host-aura_google_oauth=${cookieValue}` } }

  const verifier = requireGoogleOAuthSession(request, state, secret, 1_001)
  assert.equal(typeof verifier, 'string')
  assert.ok(verifier.length >= 43)
  assert.equal(session.challenge, crypto.createHash('sha256').update(verifier).digest('base64url'))
  assert.throws(
    () => requireGoogleOAuthSession({ headers: {} }, state, secret, 1_001),
    /Start the Google connection from this AURA browser/,
  )
  assert.throws(
    () => requireGoogleOAuthSession(request, `${state}tampered`, secret, 1_001),
    /Start the Google connection from this AURA browser/,
  )
})

test('Google OAuth tokens round-trip through authenticated encryption', () => {
  const encrypted = encryptGoogleToken('refresh-token-value', secret)

  assert.notEqual(encrypted, 'refresh-token-value')
  assert.match(encrypted, /^v1\./)
  assert.equal(decryptGoogleToken(encrypted, secret), 'refresh-token-value')
  assert.throws(() => decryptGoogleToken(`${encrypted}broken`, secret))
})

test('Google review URLs only accept saved resource names', () => {
  assert.equal(
    googleReviewsUrl({ google_account_name: 'accounts/123', google_location_name: 'locations/456' }),
    'https://mybusiness.googleapis.com/v4/accounts/123/locations/456/reviews',
  )
  assert.equal(
    googleReviewUrl('accounts/123/locations/456/reviews/789'),
    'https://mybusiness.googleapis.com/v4/accounts/123/locations/456/reviews/789',
  )
  assert.throws(() => googleReviewUrl('https://example.com/reviews/789'), /invalid/i)
})

test('public serializers never expose encrypted credentials', () => {
  const connection = publicGoogleConnection({
    access_token_encrypted: 'secret-access',
    google_account_title: 'Owner account',
    google_location_title: 'AURA Café',
    id: 'connection-1',
    refresh_token_encrypted: 'secret-refresh',
    status: 'active',
  })
  const draft = publicGoogleDraft({
    generated_text: 'Thank you for the lovely review.',
    id: 'draft-1',
    status: 'generated',
    version: 2,
  })

  assert.equal(connection.locationTitle, 'AURA Café')
  assert.equal('access_token_encrypted' in connection, false)
  assert.equal('refresh_token_encrypted' in connection, false)
  assert.equal(draft.generatedText, 'Thank you for the lovely review.')
  assert.equal('model' in draft, false)
})
