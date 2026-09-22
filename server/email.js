/* global process */

import { googleHttpError } from './google-business.js'

const RESEND_URL = 'https://api.resend.com/emails'

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function appOrigin() {
  const explicit = String(process.env.AURA_APP_URL || '').trim().replace(/\/$/, '')
  if (explicit) return explicit
  const vercelHost = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim()
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  return 'https://aurareviewplatform.com'
}

async function sendEmail({ html, idempotencyKey, subject, text, to }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim()
  const from = String(process.env.AURA_EMAIL_FROM || 'AURA <info@spectreprojects.co.uk>').trim()
  if (!apiKey) throw googleHttpError(503, 'Draft email delivery is not configured.', 'EMAIL_NOT_CONFIGURED')

  let response
  try {
    response = await fetch(RESEND_URL, {
      body: JSON.stringify({ from, html, subject, text, to: [to] }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey.slice(0, 256),
      },
      method: 'POST',
      signal: AbortSignal.timeout(12_000),
    })
  } catch {
    throw googleHttpError(503, 'Draft email delivery is temporarily unavailable.', 'EMAIL_UNAVAILABLE')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('[AURA Resend]', response.status, payload?.name || payload?.message || '')
    throw googleHttpError(502, 'Draft email delivery failed.', 'EMAIL_DELIVERY_FAILED')
  }
  return payload
}

export async function sendGoogleDraftReadyEmail({ businessName, draftId, email, rating, reviewId, reviewerName }) {
  const reviewUrl = `${appOrigin()}/dashboard/reviews?review=${encodeURIComponent(reviewId)}`
  const careful = Number(rating) <= 2
  const subject = careful
    ? `AURA draft needs careful review · ${businessName}`
    : `A new AURA review draft is ready · ${businessName}`
  const headline = careful ? 'A draft needs careful review' : 'Your new review draft is ready'
  const summary = `${reviewerName || 'A Google reviewer'} left a ${rating}-star review for ${businessName}.`

  return sendEmail({
    html: [
      `<h1>${escapeHtml(headline)}</h1>`,
      `<p>${escapeHtml(summary)}</p>`,
      '<p>AURA has prepared a draft. Nothing has been published to Google.</p>',
      `<p><a href="${escapeHtml(reviewUrl)}">Review the draft in AURA</a></p>`,
    ].join(''),
    idempotencyKey: `aura-google-draft-${draftId}`,
    subject,
    text: `${headline}\n\n${summary}\nAURA has prepared a draft. Nothing has been published to Google.\n\n${reviewUrl}`,
    to: email,
  })
}

