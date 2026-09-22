export const GOOGLE_DRAFT_PROMPT_VERSION = 'google-review-draft-v1'
export const GOOGLE_DRAFT_MODEL = 'openai/gpt-5.4'
export const MAX_DRAFT_ATTEMPTS = 4
export const MAX_NOTIFICATION_ATTEMPTS = 4
export const MAX_MANUAL_DRAFTS_PER_REVIEW_WINDOW = 5
export const MAX_MANUAL_DRAFTS_PER_BUSINESS_HOUR = 20

const TONE_CHOICES = new Set([
  'warm_friendly',
  'polished_professional',
  'relaxed_conversational',
  'concise_direct',
  'custom',
])

export function isFeatureEnabled(value, defaultValue = true) {
  if (value == null || value === '') return defaultValue
  return !['0', 'false', 'off', 'disabled', 'no'].includes(String(value).trim().toLowerCase())
}

export function cleanPhraseList(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(/[\n,]/)
  return Array.from(new Set(
    source
      .map((item) => String(item).trim().slice(0, 120))
      .filter(Boolean),
  )).slice(0, 20)
}

export function validateReplySettings(input, fallbackEmail = '') {
  const toneChoice = String(input?.toneChoice || input?.tone_choice || '')
  const positiveExample = String(input?.positiveExample || input?.positive_example || '').trim()
  const criticalExample = String(input?.criticalExample || input?.critical_example || '').trim()
  const escalationWording = String(input?.escalationWording || input?.escalation_wording || '').trim()
  const notificationEmail = String(
    input?.notificationEmail || input?.notification_email || fallbackEmail || '',
  ).trim()
  const preferredPhrases = cleanPhraseList(input?.preferredPhrases || input?.preferred_phrases)
  const avoidedPhrases = cleanPhraseList(input?.avoidedPhrases || input?.avoided_phrases)
  const recommendedDelayMinutes = Number(
    input?.recommendedDelayMinutes ?? input?.recommended_delay_minutes,
  )

  const errors = {}
  if (!TONE_CHOICES.has(toneChoice)) errors.toneChoice = 'Choose how AURA should sound.'
  if (!preferredPhrases.length) errors.preferredPhrases = 'Add at least one phrase AURA may use.'
  if (!avoidedPhrases.length) errors.avoidedPhrases = 'Add at least one phrase AURA should avoid.'
  if (!positiveExample || positiveExample.length > 2000) {
    errors.positiveExample = 'Add one approved positive-review example (up to 2,000 characters).'
  }
  if (!criticalExample || criticalExample.length > 2000) {
    errors.criticalExample = 'Add one approved critical-review example (up to 2,000 characters).'
  }
  if (!Number.isInteger(recommendedDelayMinutes) || recommendedDelayMinutes < 0 || recommendedDelayMinutes > 10080) {
    errors.recommendedDelayMinutes = 'Choose a recommended delay between immediate and seven days.'
  }
  if (escalationWording.length > 1000) {
    errors.escalationWording = 'Keep escalation wording under 1,000 characters.'
  }
  if (input?.notificationsEnabled !== false && input?.notifications_enabled !== false) {
    if (!/^\S+@\S+\.\S+$/.test(notificationEmail) || notificationEmail.length > 320) {
      errors.notificationEmail = 'Enter the email address that should receive draft alerts.'
    }
  }

  return {
    errors,
    settings: {
      avoided_phrases: avoidedPhrases,
      critical_example: criticalExample,
      escalation_wording: escalationWording || null,
      notification_email: notificationEmail || null,
      notifications_enabled: input?.notificationsEnabled !== false && input?.notifications_enabled !== false,
      positive_example: positiveExample,
      preferred_phrases: preferredPhrases,
      recommended_delay_minutes: recommendedDelayMinutes,
      tone_choice: toneChoice,
    },
  }
}

export function recommendedPublishAt(reviewCreatedAt, delayMinutes) {
  const createdAt = new Date(reviewCreatedAt)
  if (Number.isNaN(createdAt.getTime())) throw new Error('Review creation time is invalid.')
  return new Date(createdAt.getTime() + Number(delayMinutes || 0) * 60_000).toISOString()
}

export function classifyReviewEligibility({ featureEnabled = true, hasReply, reviewCreatedAt, selectedAt }) {
  if (!featureEnabled) return { eligible: false, reason: 'feature_disabled' }
  if (hasReply) return { eligible: false, reason: 'already_replied' }

  const reviewTime = new Date(reviewCreatedAt).getTime()
  const selectedTime = new Date(selectedAt).getTime()
  if (!Number.isFinite(reviewTime) || !Number.isFinite(selectedTime) || reviewTime <= selectedTime) {
    return { eligible: false, reason: 'historical_import' }
  }
  return { eligible: true, reason: 'new_after_connection' }
}

export function retryAt(attempt, from = Date.now()) {
  const safeAttempt = Math.max(1, Number(attempt) || 1)
  const minutes = Math.min(60, 2 ** (safeAttempt - 1) * 5)
  return new Date(Number(from) + minutes * 60_000).toISOString()
}

export function effectiveDraftText(draft) {
  return String(draft?.edited_text || draft?.generated_text || '').trim()
}

export function publicReplySettings(row, fallbackEmail = '') {
  if (!row) {
    return {
      avoidedPhrases: [],
      criticalExample: '',
      escalationWording: '',
      notificationEmail: fallbackEmail,
      notificationsEnabled: true,
      positiveExample: '',
      preferredPhrases: [],
      recommendedDelayMinutes: 120,
      setupComplete: false,
      toneChoice: 'warm_friendly',
    }
  }
  return {
    avoidedPhrases: row.avoided_phrases || [],
    criticalExample: row.critical_example || '',
    escalationWording: row.escalation_wording || '',
    notificationEmail: row.notification_email || fallbackEmail,
    notificationsEnabled: row.notifications_enabled !== false,
    positiveExample: row.positive_example || '',
    preferredPhrases: row.preferred_phrases || [],
    recommendedDelayMinutes: Number(row.recommended_delay_minutes || 0),
    setupComplete: Boolean(row.setup_completed_at),
    toneChoice: row.tone_choice || 'warm_friendly',
    updatedAt: row.updated_at || null,
  }
}
