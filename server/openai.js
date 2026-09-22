/* global process */

import crypto from 'node:crypto'
import { googleHttpError } from './google-business.js'
import { GOOGLE_DRAFT_MODEL, GOOGLE_DRAFT_PROMPT_VERSION } from './google-review-workflow.js'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const VERCEL_AI_GATEWAY_RESPONSES_URL = 'https://ai-gateway.vercel.sh/v1/responses'

const toneDescriptions = {
  concise_direct: 'concise, direct and appreciative',
  custom: 'faithful to the supplied examples and phrase guidance',
  polished_professional: 'polished, calm and professional without sounding corporate',
  relaxed_conversational: 'relaxed, conversational and natural',
  warm_friendly: 'warm, friendly and human',
}

function generationProvider() {
  const configuredModel = String(process.env.AURA_GOOGLE_DRAFT_MODEL || GOOGLE_DRAFT_MODEL).trim()
  const gatewayKey = String(process.env.AI_GATEWAY_API_KEY || '').trim()
  const oidcToken = String(process.env.VERCEL_OIDC_TOKEN || '').trim()
  if (gatewayKey || oidcToken) {
    return {
      credential: gatewayKey || oidcToken,
      label: 'Vercel AI Gateway',
      model: configuredModel.includes('/') ? configuredModel : `openai/${configuredModel}`,
      url: VERCEL_AI_GATEWAY_RESPONSES_URL,
    }
  }

  const apiKey = String(process.env.OPENAI_API_KEY || '').trim()
  if (apiKey) {
    return {
      credential: apiKey,
      label: 'OpenAI',
      model: configuredModel.replace(/^openai\//, ''),
      url: OPENAI_RESPONSES_URL,
    }
  }
  return null
}

function outputText(response) {
  if (typeof response.output_text === 'string') return response.output_text
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) return content.text
    }
  }
  return ''
}

function boundedText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function formatList(items) {
  return items?.length
    ? items.slice(0, 20).map((item) => `- ${boundedText(item, 120)}`).join('\n')
    : '- None supplied'
}

export async function generateGoogleReviewDraft({ businessName, review, settings, userId }) {
  const provider = generationProvider()
  if (!provider) {
    throw googleHttpError(503, 'AURA draft generation is not configured.', 'OPENAI_NOT_CONFIGURED')
  }

  const rating = Number(review.rating || 0)
  const hasComment = Boolean(String(review.comment || '').trim())
  const safetyIdentifier = crypto.createHash('sha256').update(String(userId)).digest('hex')
  const developerInstruction = [
    'You write owner-review drafts for AURA in natural UK English.',
    `The voice must be ${toneDescriptions[settings.tone_choice] || toneDescriptions.warm_friendly}.`,
    'Never invent an event, visit detail, promise, discount, compensation, contact detail, admission, investigation, outcome or fact not present in the review or approved guidance.',
    'Do not add phone numbers, email addresses or requests to contact the business unless the approved escalation wording explicitly supplies them.',
    'Do not repeat private or sensitive information.',
    'For a rating-only review, acknowledge the rating warmly without pretending the reviewer wrote anything.',
    'For one- or two-star reviews, be calm and empathetic without admitting liability; use the approved escalation wording only when relevant.',
    'Keep the reply concise, personal and ready for an owner to review. Return only the required JSON.',
  ].join(' ')

  const userContext = [
    `Business: ${boundedText(businessName, 200)}`,
    `Reviewer: ${boundedText(review.reviewer_name || 'Google reviewer', 160)}`,
    `Rating: ${rating} out of 5`,
    `Written review: ${hasComment ? boundedText(review.comment, 5000) : '[No written comment]'}`,
    `Preferred phrases:\n${formatList(settings.preferred_phrases)}`,
    `Avoided phrases:\n${formatList(settings.avoided_phrases)}`,
    `Approved positive example:\n${boundedText(settings.positive_example, 2000)}`,
    `Approved critical example:\n${boundedText(settings.critical_example, 2000)}`,
    `Approved escalation wording:\n${boundedText(settings.escalation_wording, 1000) || '[None supplied]'}`,
  ].join('\n\n')

  const body = {
    input: [
      { role: 'developer', content: [{ type: 'input_text', text: developerInstruction }] },
      { role: 'user', content: [{ type: 'input_text', text: userContext }] },
    ],
    max_output_tokens: 600,
    metadata: {
      feature: 'google-review-draft',
      prompt_version: GOOGLE_DRAFT_PROMPT_VERSION,
    },
    model: provider.model,
    reasoning: { effort: 'low' },
    safety_identifier: safetyIdentifier,
    store: false,
    text: {
      format: {
        name: 'aura_google_review_draft',
        schema: {
          additionalProperties: false,
          properties: { reply: { maxLength: 1200, minLength: 1, type: 'string' } },
          required: ['reply'],
          type: 'object',
        },
        strict: true,
        type: 'json_schema',
      },
      verbosity: 'low',
    },
  }

  let response
  try {
    response = await fetch(provider.url, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${provider.credential}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw googleHttpError(503, 'AURA could not generate this draft. Please retry.', 'OPENAI_UNAVAILABLE')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error(`[AURA ${provider.label}]`, response.status, payload?.error?.type || '', payload?.error?.code || '')
    throw googleHttpError(502, 'AURA could not generate this draft. Please retry.', 'OPENAI_REQUEST_FAILED')
  }
  if (payload.status === 'incomplete') {
    throw googleHttpError(502, 'AURA could not finish this draft. Please retry.', 'OPENAI_INCOMPLETE')
  }

  let parsed
  try {
    parsed = JSON.parse(outputText(payload))
  } catch {
    throw googleHttpError(502, 'AURA received an invalid draft. Please retry.', 'OPENAI_INVALID_OUTPUT')
  }
  const reply = String(parsed?.reply || '').trim()
  if (!reply || reply.length > 1200) {
    throw googleHttpError(502, 'AURA received an invalid draft. Please retry.', 'OPENAI_INVALID_OUTPUT')
  }

  return {
    model: provider.model,
    promptVersion: GOOGLE_DRAFT_PROMPT_VERSION,
    reply,
  }
}
