/* global process */

import assert from 'node:assert/strict'
import test from 'node:test'
import { generateGoogleReviewDraft } from './openai.js'

test('draft generation uses Gateway structured output without storing the response', async (context) => {
  const originalFetch = globalThis.fetch
  const originalGatewayKey = process.env.AI_GATEWAY_API_KEY
  const originalModel = process.env.AURA_GOOGLE_DRAFT_MODEL
  const originalOpenAiKey = process.env.OPENAI_API_KEY
  const originalOidcToken = process.env.VERCEL_OIDC_TOKEN
  let request

  process.env.AI_GATEWAY_API_KEY = 'gateway-test-key'
  process.env.AURA_GOOGLE_DRAFT_MODEL = 'openai/gpt-5.4'
  delete process.env.OPENAI_API_KEY
  delete process.env.VERCEL_OIDC_TOKEN
  globalThis.fetch = async (url, options) => {
    request = { body: JSON.parse(options.body), headers: options.headers, url }
    return new Response(JSON.stringify({
      output: [{ content: [{ text: '{"reply":"Thanks so much for the five stars."}', type: 'output_text' }] }],
      status: 'completed',
    }), { headers: { 'Content-Type': 'application/json' }, status: 200 })
  }

  context.after(() => {
    globalThis.fetch = originalFetch
    if (originalGatewayKey === undefined) delete process.env.AI_GATEWAY_API_KEY
    else process.env.AI_GATEWAY_API_KEY = originalGatewayKey
    if (originalModel === undefined) delete process.env.AURA_GOOGLE_DRAFT_MODEL
    else process.env.AURA_GOOGLE_DRAFT_MODEL = originalModel
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = originalOpenAiKey
    if (originalOidcToken === undefined) delete process.env.VERCEL_OIDC_TOKEN
    else process.env.VERCEL_OIDC_TOKEN = originalOidcToken
  })

  const result = await generateGoogleReviewDraft({
    businessName: 'AURA Café',
    review: { comment: '', rating: 5, reviewer_name: 'Jamie' },
    settings: {
      avoided_phrases: ['valued customer'],
      critical_example: 'Thanks for raising this.',
      escalation_wording: null,
      positive_example: 'Thanks so much for visiting.',
      preferred_phrases: ['Thanks so much'],
      tone_choice: 'warm_friendly',
    },
    userId: 'user-1',
  })

  assert.equal(result.reply, 'Thanks so much for the five stars.')
  assert.equal(request.url, 'https://ai-gateway.vercel.sh/v1/responses')
  assert.equal(request.headers.Authorization, 'Bearer gateway-test-key')
  assert.equal(request.body.model, 'openai/gpt-5.4')
  assert.equal(request.body.store, false)
  assert.equal(request.body.text.format.type, 'json_schema')
  assert.equal(request.body.text.format.strict, true)
  assert.match(request.body.input[1].content[0].text, /\[No written comment\]/)
})
