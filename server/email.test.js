/* global process */

import assert from 'node:assert/strict'
import test from 'node:test'
import { sendGoogleDraftReadyEmail } from './email.js'

test('draft email has a stable idempotency key and links to one review', async (context) => {
  const originalFetch = globalThis.fetch
  const originalApiKey = process.env.RESEND_API_KEY
  const originalAppUrl = process.env.AURA_APP_URL
  const originalFrom = process.env.AURA_EMAIL_FROM
  let request

  process.env.RESEND_API_KEY = 'resend-test-key'
  process.env.AURA_APP_URL = 'https://staging.aurareviewplatform.com/'
  process.env.AURA_EMAIL_FROM = 'AURA <drafts@example.com>'
  globalThis.fetch = async (url, options) => {
    request = { body: JSON.parse(options.body), headers: options.headers, url }
    return new Response(JSON.stringify({ id: 'email-1' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  context.after(() => {
    globalThis.fetch = originalFetch
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalApiKey
    if (originalAppUrl === undefined) delete process.env.AURA_APP_URL
    else process.env.AURA_APP_URL = originalAppUrl
    if (originalFrom === undefined) delete process.env.AURA_EMAIL_FROM
    else process.env.AURA_EMAIL_FROM = originalFrom
  })

  await sendGoogleDraftReadyEmail({
    businessName: 'AURA & Co',
    draftId: 'draft-123',
    email: 'owner@example.com',
    rating: 2,
    reviewId: 'review-456',
    reviewerName: '<Jamie>',
  })

  assert.equal(request.url, 'https://api.resend.com/emails')
  assert.equal(request.headers['Idempotency-Key'], 'aura-google-draft-draft-123')
  assert.match(request.body.subject, /careful review/i)
  assert.match(request.body.text, /staging\.aurareviewplatform\.com\/dashboard\/reviews\?review=review-456/)
  assert.match(request.body.html, /&lt;Jamie&gt;/)
  assert.doesNotMatch(request.body.html, /<Jamie>/)
})
