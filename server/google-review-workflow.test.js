import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyReviewEligibility,
  cleanPhraseList,
  effectiveDraftText,
  isFeatureEnabled,
  publicReplySettings,
  recommendedPublishAt,
  retryAt,
  validateReplySettings,
} from './google-review-workflow.js'

test('reply settings require the owner-approved examples and a valid delay', () => {
  const invalid = validateReplySettings({
    notificationsEnabled: true,
    recommendedDelayMinutes: 10081,
    toneChoice: 'robotic',
  })

  assert.deepEqual(Object.keys(invalid.errors).sort(), [
    'avoidedPhrases',
    'criticalExample',
    'notificationEmail',
    'positiveExample',
    'preferredPhrases',
    'recommendedDelayMinutes',
    'toneChoice',
  ])

  const valid = validateReplySettings({
    avoidedPhrases: 'valued customer\nreach out privately',
    criticalExample: 'Thanks for raising this. We are sorry it fell short.',
    notificationEmail: 'owner@example.com',
    notificationsEnabled: true,
    positiveExample: 'Thanks so much, Jamie. We really appreciate it.',
    preferredPhrases: ['Thanks so much', 'We really appreciate it'],
    recommendedDelayMinutes: 10080,
    toneChoice: 'warm_friendly',
  })

  assert.deepEqual(valid.errors, {})
  assert.equal(valid.settings.recommended_delay_minutes, 10080)
  assert.deepEqual(valid.settings.avoided_phrases, ['valued customer', 'reach out privately'])
})

test('notifications may be disabled without collecting an email address', () => {
  const result = validateReplySettings({
    avoidedPhrases: 'valued customer',
    criticalExample: 'Thank you for the feedback.',
    notificationsEnabled: false,
    positiveExample: 'Thank you for the lovely review.',
    preferredPhrases: 'thank you',
    recommendedDelayMinutes: 0,
    toneChoice: 'concise_direct',
  })

  assert.deepEqual(result.errors, {})
  assert.equal(result.settings.notification_email, null)
  assert.equal(result.settings.notifications_enabled, false)
})

test('only reviews created after location confirmation are draft eligible', () => {
  const selectedAt = '2026-09-22T12:00:00.000Z'

  assert.deepEqual(classifyReviewEligibility({
    hasReply: false,
    reviewCreatedAt: '2026-09-22T11:59:59.000Z',
    selectedAt,
  }), { eligible: false, reason: 'historical_import' })
  assert.deepEqual(classifyReviewEligibility({
    hasReply: false,
    reviewCreatedAt: '2026-09-22T12:00:01.000Z',
    selectedAt,
  }), { eligible: true, reason: 'new_after_connection' })
  assert.deepEqual(classifyReviewEligibility({
    hasReply: true,
    reviewCreatedAt: '2026-09-22T12:00:01.000Z',
    selectedAt,
  }), { eligible: false, reason: 'already_replied' })
})

test('recommended time is calculated from the original Google review time', () => {
  assert.equal(
    recommendedPublishAt('2026-09-22T12:00:00.000Z', 120),
    '2026-09-22T14:00:00.000Z',
  )
})

test('retry delays back off and are bounded at one hour', () => {
  const from = Date.parse('2026-09-22T12:00:00.000Z')
  assert.equal(retryAt(1, from), '2026-09-22T12:05:00.000Z')
  assert.equal(retryAt(4, from), '2026-09-22T12:40:00.000Z')
  assert.equal(retryAt(20, from), '2026-09-22T13:00:00.000Z')
})

test('feature flags fail closed only when explicitly disabled', () => {
  assert.equal(isFeatureEnabled(undefined), true)
  assert.equal(isFeatureEnabled('false'), false)
  assert.equal(isFeatureEnabled('OFF'), false)
  assert.equal(isFeatureEnabled('true'), true)
})

test('draft and public-setting helpers expose only owner-facing values', () => {
  assert.equal(effectiveDraftText({ edited_text: ' Owner edit ', generated_text: 'Generated' }), 'Owner edit')
  assert.deepEqual(cleanPhraseList('Thanks\nThanks,Cheers'), ['Thanks', 'Cheers'])
  assert.equal(publicReplySettings(null, 'owner@example.com').notificationEmail, 'owner@example.com')
})
