import crypto from 'node:crypto'
import { sendGoogleDraftReadyEmail } from './email.js'
import {
  claimGoogleConnectionOperation,
  getFreshGoogleAccessToken,
  googleRatingToNumber,
  googleRequest,
  googleReviewsUrl,
  markConnectionReconnectRequired,
  publicGoogleReview,
  releaseGoogleConnectionOperation,
} from './google-business.js'
import {
  classifyReviewEligibility,
  GOOGLE_DRAFT_MODEL,
  GOOGLE_DRAFT_PROMPT_VERSION,
  MAX_DRAFT_ATTEMPTS,
  MAX_NOTIFICATION_ATTEMPTS,
  recommendedPublishAt,
  retryAt,
} from './google-review-workflow.js'
import { generateGoogleReviewDraft } from './openai.js'

function cleanError(error) {
  return {
    code: String(error?.code || 'DRAFT_WORKER_ERROR').slice(0, 120),
    message: String(error?.message || 'AURA could not complete this background task.').slice(0, 1000),
  }
}

export async function appendGoogleReviewEvent(admin, event) {
  const { error } = await admin
    .from('google_review_events')
    .upsert(event, { ignoreDuplicates: true, onConflict: 'event_key' })
  if (error) throw error
}

export async function enqueueDraftJob(admin, { connection, idempotencyKey, jobKind = 'generate', review }) {
  const { data: openJob, error: openJobError } = await admin
    .from('google_review_draft_jobs')
    .select('*')
    .eq('google_review_id', review.id)
    .in('status', ['pending', 'processing', 'retry'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (openJobError) throw openJobError
  if (openJob) {
    if (openJob.status !== 'processing') {
      const { data: expedited, error: expediteError } = await admin
        .from('google_review_draft_jobs')
        .update({ next_attempt_at: new Date().toISOString() })
        .eq('id', openJob.id)
        .select('*')
        .single()
      if (expediteError) throw expediteError
      return { ...expedited, wasEnqueued: false }
    }
    return { ...openJob, wasEnqueued: false }
  }

  const { data, error } = await admin
    .from('google_review_draft_jobs')
    .upsert({
      business_profile_id: review.business_profile_id,
      google_connection_id: connection.id,
      google_review_id: review.id,
      idempotency_key: idempotencyKey,
      job_kind: jobKind,
      max_attempts: MAX_DRAFT_ATTEMPTS,
      next_attempt_at: new Date().toISOString(),
      status: 'pending',
      user_id: review.user_id,
    }, { ignoreDuplicates: true, onConflict: 'idempotency_key' })
    .select('*')
    .maybeSingle()
  if (error && error.code !== '23505') throw error
  if (data) return { ...data, wasEnqueued: true }

  if (error?.code === '23505') {
    const { data: racedJob, error: racedJobError } = await admin
      .from('google_review_draft_jobs')
      .select('*')
      .eq('google_review_id', review.id)
      .in('status', ['pending', 'processing', 'retry'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (racedJobError) throw racedJobError
    if (racedJob) return { ...racedJob, wasEnqueued: false }
  }

  const { data: existing, error: existingError } = await admin
    .from('google_review_draft_jobs')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existingError) throw existingError
  return existing ? { ...existing, wasEnqueued: false } : null
}

async function fetchGoogleReviews(accessToken, connection) {
  const reviews = []
  let pageToken = ''
  do {
    const url = new URL(googleReviewsUrl(connection))
    url.searchParams.set('pageSize', '50')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const payload = await googleRequest(url.toString(), accessToken)
    reviews.push(...(payload.reviews || []))
    pageToken = payload.nextPageToken || ''
  } while (pageToken && reviews.length < 5000)
  return reviews
}

export async function listGoogleReviews(admin, { businessProfileId, connectionId, userId, limit = 500 }) {
  let query = admin
    .from('google_reviews')
    .select('*,google_review_drafts(*)')
    .eq('user_id', userId)
    .eq('business_profile_id', businessProfileId)
    .order('review_created_at', { ascending: false })
    .limit(Math.min(1000, Math.max(1, Number(limit) || 500)))
  if (connectionId) query = query.eq('google_connection_id', connectionId)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(publicGoogleReview)
}

export async function syncGoogleConnection({ admin, config, connection }) {
  if (!config.features.syncing) {
    return { count: 0, draftsQueued: 0, skipped: true, syncedAt: null }
  }

  const operationOwner = await claimGoogleConnectionOperation(admin, connection.id, 'sync')
  if (!operationOwner) {
    return { busy: true, count: 0, draftsQueued: 0, skipped: true, syncedAt: null }
  }

  const syncedAt = new Date().toISOString()
  try {
    const accessToken = await getFreshGoogleAccessToken(admin, connection, config)
    const reviews = await fetchGoogleReviews(accessToken, connection)
    const reviewNames = reviews.map((review) => review.name).filter(Boolean)
    const existingByName = new Map()

    for (let index = 0; index < reviewNames.length; index += 100) {
      const { data, error } = await admin
        .from('google_reviews')
        .select('id,google_review_name,first_seen_at,draft_eligible,draft_eligibility_reason')
        .eq('google_connection_id', connection.id)
        .in('google_review_name', reviewNames.slice(index, index + 100))
      if (error) throw error
      for (const row of data || []) existingByName.set(row.google_review_name, row)
    }

    const rows = reviews.map((review) => {
      const existing = existingByName.get(review.name)
      const createdAt = review.createTime || syncedAt
      const eligibility = classifyReviewEligibility({
        hasReply: Boolean(review.reviewReply?.comment),
        reviewCreatedAt: createdAt,
        selectedAt: connection.selected_at || connection.connected_at,
      })
      return {
        business_profile_id: connection.business_profile_id,
        comment: review.comment || '',
        draft_eligible: eligibility.eligible,
        draft_eligibility_reason: eligibility.reason,
        first_seen_at: existing?.first_seen_at || syncedAt,
        google_connection_id: connection.id,
        google_review_id: review.reviewId || review.name?.split('/').pop(),
        google_review_name: review.name,
        last_synced_at: syncedAt,
        rating: googleRatingToNumber(review.starRating),
        raw_review: review,
        remote_reply_last_seen_at: review.reviewReply ? syncedAt : null,
        reply_comment: review.reviewReply?.comment || null,
        reply_updated_at: review.reviewReply?.updateTime || null,
        review_created_at: createdAt,
        review_updated_at: review.updateTime || createdAt,
        reviewer_name: review.reviewer?.displayName || 'Google reviewer',
        user_id: connection.user_id,
      }
    })

    let savedRows = []
    if (rows.length) {
      const { data, error } = await admin
        .from('google_reviews')
        .upsert(rows, { onConflict: 'google_connection_id,google_review_name' })
        .select('*')
      if (error) throw error
      savedRows = data || []
    }

    const { data: settings, error: settingsError } = await admin
      .from('aura_google_reply_settings')
      .select('setup_completed_at')
      .eq('business_profile_id', connection.business_profile_id)
      .maybeSingle()
    if (settingsError) throw settingsError

    let draftsQueued = 0
    if (config.features.draftGeneration && settings?.setup_completed_at) {
      for (const review of savedRows.filter((row) => row.draft_eligible && !row.reply_comment)) {
        const job = await enqueueDraftJob(admin, {
          connection,
          idempotencyKey: `google-review:${review.id}:initial`,
          review,
        })
        if (job?.wasEnqueued) draftsQueued += 1
      }
    }

    const [connectionUpdate, syncLogInsert] = await Promise.all([
      admin
        .from('google_connections')
        .update({ last_error_code: null, last_synced_at: syncedAt, updated_at: syncedAt })
        .eq('id', connection.id),
      admin.from('google_review_sync_logs').insert({
        business_profile_id: connection.business_profile_id,
        google_connection_id: connection.id,
        reviews_found: reviews.length,
        reviews_imported: savedRows.length,
        status: 'success',
        user_id: connection.user_id,
      }),
    ])
    if (connectionUpdate.error) throw connectionUpdate.error
    if (syncLogInsert.error) throw syncLogInsert.error

    return { count: savedRows.length, draftsQueued, skipped: false, syncedAt }
  } catch (error) {
    const safe = cleanError(error)
    if (error.code === 'GOOGLE_RECONNECT_REQUIRED') {
      await markConnectionReconnectRequired(admin, connection, error.code)
    }
    await admin.from('google_review_sync_logs').insert({
      business_profile_id: connection.business_profile_id,
      google_connection_id: connection.id,
      message: safe.message,
      status: 'failed',
      user_id: connection.user_id,
    })
    throw error
  } finally {
    await releaseGoogleConnectionOperation(admin, connection.id, operationOwner)
  }
}

async function claimDraftJob(admin, job, workerId) {
  const nextAttempt = Number(job.attempts || 0) + 1
  const { data, error } = await admin
    .from('google_review_draft_jobs')
    .update({ attempts: nextAttempt, locked_at: new Date().toISOString(), status: 'processing', worker_id: workerId })
    .eq('id', job.id)
    .in('status', ['pending', 'retry'])
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

async function loadDraftJobContext(admin, job) {
  const [reviewResult, settingsResult, businessResult, draftResult] = await Promise.all([
    admin.from('google_reviews').select('*').eq('id', job.google_review_id).maybeSingle(),
    admin.from('aura_google_reply_settings').select('*').eq('business_profile_id', job.business_profile_id).maybeSingle(),
    admin.from('business_profiles').select('id,business_name').eq('id', job.business_profile_id).maybeSingle(),
    admin.from('google_review_drafts').select('*').eq('google_review_id', job.google_review_id).maybeSingle(),
  ])
  const error = reviewResult.error || settingsResult.error || businessResult.error || draftResult.error
  if (error) throw error
  if (!reviewResult.data || !settingsResult.data?.setup_completed_at || !businessResult.data) {
    throw Object.assign(new Error('Finish tone and timing setup before generating drafts.'), {
      code: 'GOOGLE_SETTINGS_REQUIRED',
      status: 409,
    })
  }
  return {
    business: businessResult.data,
    draft: draftResult.data,
    review: reviewResult.data,
    settings: settingsResult.data,
  }
}

async function failDraftJob(admin, job, context, error) {
  const safe = cleanError(error)
  const preserveDraft = Boolean(
    context?.draft?.publication_claim_id ||
    context?.draft?.status === 'published' ||
    ['DRAFT_STATE_CHANGED', 'GOOGLE_REVIEW_ALREADY_REPLIED', 'PUBLISH_IN_PROGRESS'].includes(safe.code)
  )
  const terminal = preserveDraft || Number(job.attempts || 0) >= Number(job.max_attempts || MAX_DRAFT_ATTEMPTS)
  const suggestedPublish = context?.settings
    ? recommendedPublishAt(context.review.review_created_at, context.settings.recommended_delay_minutes)
    : new Date().toISOString()

  if (context?.review && !preserveDraft) {
    const failedDraft = {
      business_profile_id: job.business_profile_id,
      generation_attempts: job.attempts,
      google_connection_id: job.google_connection_id,
      google_review_id: job.google_review_id,
      last_error_code: safe.code,
      last_error_message: safe.message,
      model: GOOGLE_DRAFT_MODEL,
      notification_status: 'disabled',
      prompt_version: GOOGLE_DRAFT_PROMPT_VERSION,
      status: 'failed',
      suggested_publish_at: suggestedPublish,
      user_id: job.user_id,
      version: Number(context.draft?.version || 0) + 1,
    }
    if (context.draft) {
      await admin
        .from('google_review_drafts')
        .update(failedDraft)
        .eq('id', context.draft.id)
        .eq('version', context.draft.version)
        .neq('status', 'published')
        .is('publication_claim_id', null)
    } else {
      await admin.from('google_review_drafts').insert(failedDraft)
    }
  }

  await admin
    .from('google_review_draft_jobs')
    .update({
      last_error_code: safe.code,
      last_error_message: safe.message,
      locked_at: null,
      next_attempt_at: retryAt(job.attempts),
      status: terminal ? 'failed' : 'retry',
      worker_id: null,
    })
    .eq('id', job.id)

  await appendGoogleReviewEvent(admin, {
    business_profile_id: job.business_profile_id,
    details: { attempt: job.attempts, code: safe.code, terminal },
    event_key: `draft-failed:${job.id}:${job.attempts}`,
    event_type: 'draft_failed',
    google_connection_id: job.google_connection_id,
    google_review_id: job.google_review_id,
    user_id: job.user_id,
  })
}

async function runDraftJob(admin, config, job) {
  let context
  try {
    context = await loadDraftJobContext(admin, job)
    if (context.review.reply_comment) {
      throw Object.assign(new Error('Google already has an owner reply for this review.'), {
        code: 'GOOGLE_REVIEW_ALREADY_REPLIED',
        status: 409,
      })
    }
    if (context.draft?.status === 'published') {
      throw Object.assign(new Error('This reply is already published on Google.'), {
        code: 'GOOGLE_REVIEW_ALREADY_REPLIED',
        status: 409,
      })
    }
    if (context.draft?.publication_claim_id) {
      throw Object.assign(new Error('This draft is currently being published.'), {
        code: 'PUBLISH_IN_PROGRESS',
        status: 409,
      })
    }

    const generated = await generateGoogleReviewDraft({
      businessName: context.business.business_name,
      review: context.review,
      settings: context.settings,
      userId: job.user_id,
    })
    const isRegeneration = job.job_kind === 'regenerate'
    const priorNotificationStatus = context.draft?.notification_status
    const notificationStatus = isRegeneration && priorNotificationStatus
      ? priorNotificationStatus
      : context.settings.notifications_enabled ? 'pending' : 'disabled'

    const nextDraft = {
      business_profile_id: job.business_profile_id,
      edited_text: null,
      generated_text: generated.reply,
      generation_attempts: job.attempts,
      google_connection_id: job.google_connection_id,
      google_review_id: job.google_review_id,
      last_error_code: null,
      last_error_message: null,
      model: generated.model,
      notification_next_attempt_at: notificationStatus === 'pending' ? new Date().toISOString() : null,
      notification_status: notificationStatus,
      prompt_version: generated.promptVersion,
      status: 'generated',
      suggested_publish_at: recommendedPublishAt(
        context.review.review_created_at,
        context.settings.recommended_delay_minutes,
      ),
      user_id: job.user_id,
      version: Number(context.draft?.version || 0) + 1,
    }
    const draftResult = context.draft
      ? await admin
          .from('google_review_drafts')
          .update(nextDraft)
          .eq('id', context.draft.id)
          .eq('version', context.draft.version)
          .neq('status', 'published')
          .is('publication_claim_id', null)
          .select('*')
          .maybeSingle()
      : await admin
          .from('google_review_drafts')
          .insert(nextDraft)
          .select('*')
          .single()
    const { data: draft, error: draftError } = draftResult
    if (draftError) throw draftError
    if (!draft) {
      throw Object.assign(new Error('The draft changed while AURA was generating a response.'), {
        code: 'DRAFT_STATE_CHANGED',
        status: 409,
      })
    }

    const { error: jobError } = await admin
      .from('google_review_draft_jobs')
      .update({
        completed_at: new Date().toISOString(),
        google_review_draft_id: draft.id,
        last_error_code: null,
        last_error_message: null,
        locked_at: null,
        status: 'succeeded',
        worker_id: null,
      })
      .eq('id', job.id)
    if (jobError) throw jobError

    await appendGoogleReviewEvent(admin, {
      business_profile_id: job.business_profile_id,
      details: { model: generated.model, promptVersion: generated.promptVersion },
      event_key: isRegeneration ? `draft-regenerated:${job.id}` : `draft-generated:${context.review.id}`,
      event_type: isRegeneration ? 'draft_regenerated' : 'draft_generated',
      google_connection_id: job.google_connection_id,
      google_review_draft_id: draft.id,
      google_review_id: job.google_review_id,
      user_id: job.user_id,
    })
    return draft
  } catch (error) {
    await failDraftJob(admin, job, context, error)
    return null
  }
}

export async function processDraftJobs({ admin, businessProfileId, config, limit = 10 }) {
  if (!config.features.draftGeneration) return { failed: 0, processed: 0 }
  const now = new Date().toISOString()
  const staleBefore = new Date(Date.now() - 10 * 60_000).toISOString()
  let staleQuery = admin
    .from('google_review_draft_jobs')
    .select('*')
    .eq('status', 'processing')
    .lt('locked_at', staleBefore)
  if (businessProfileId) staleQuery = staleQuery.eq('business_profile_id', businessProfileId)
  const { data: staleJobs, error: staleError } = await staleQuery.limit(25)
  if (staleError) throw staleError
  for (const staleJob of staleJobs || []) {
    let context
    try {
      context = await loadDraftJobContext(admin, staleJob)
    } catch {
      context = null
    }
    await failDraftJob(
      admin,
      staleJob,
      context,
      Object.assign(new Error('A previous draft worker stopped before completion.'), {
        code: 'DRAFT_WORKER_INTERRUPTED',
      }),
    )
  }

  let query = admin
    .from('google_review_draft_jobs')
    .select('*')
    .in('status', ['pending', 'retry'])
    .lte('next_attempt_at', now)
  if (businessProfileId) query = query.eq('business_profile_id', businessProfileId)
  query = query
    .order('created_at', { ascending: true })
    .limit(Math.max(1, Math.min(25, Number(limit) || 10)))
  const { data: jobs, error } = await query
  if (error) throw error

  const workerId = crypto.randomUUID()
  let processed = 0
  let failed = 0
  for (const job of jobs || []) {
    const claimed = await claimDraftJob(admin, job, workerId)
    if (!claimed) continue
    const draft = await runDraftJob(admin, config, claimed)
    processed += 1
    if (!draft) failed += 1
  }
  return { failed, processed }
}

async function claimNotification(admin, draft) {
  const { data, error } = await admin
    .from('google_review_drafts')
    .update({
      notification_attempts: Number(draft.notification_attempts || 0) + 1,
      notification_status: 'sending',
    })
    .eq('id', draft.id)
    .in('notification_status', ['pending', 'failed'])
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function processDraftNotifications({ admin, businessProfileId, limit = 10 }) {
  const staleBefore = new Date(Date.now() - 10 * 60_000).toISOString()
  let staleQuery = admin
    .from('google_review_drafts')
    .select('*')
    .eq('notification_status', 'sending')
    .lt('updated_at', staleBefore)
  if (businessProfileId) staleQuery = staleQuery.eq('business_profile_id', businessProfileId)
  const { data: staleNotifications, error: staleError } = await staleQuery.limit(25)
  if (staleError) throw staleError
  for (const staleDraft of staleNotifications || []) {
    const terminal = Number(staleDraft.notification_attempts || 0) >= MAX_NOTIFICATION_ATTEMPTS
    const { error: recoveryError } = await admin
      .from('google_review_drafts')
      .update({
        notification_next_attempt_at: terminal ? null : retryAt(staleDraft.notification_attempts),
        notification_status: 'failed',
      })
      .eq('id', staleDraft.id)
    if (recoveryError) throw recoveryError
    await appendGoogleReviewEvent(admin, {
      business_profile_id: staleDraft.business_profile_id,
      details: { attempt: staleDraft.notification_attempts, code: 'NOTIFICATION_WORKER_INTERRUPTED', terminal },
      event_key: `notification-failed:${staleDraft.id}:${staleDraft.notification_attempts}:interrupted`,
      event_type: 'notification_failed',
      google_connection_id: staleDraft.google_connection_id,
      google_review_draft_id: staleDraft.id,
      google_review_id: staleDraft.google_review_id,
      user_id: staleDraft.user_id,
    })
  }

  let query = admin
    .from('google_review_drafts')
    .select('*')
    .in('notification_status', ['pending', 'failed'])
    .lte('notification_next_attempt_at', new Date().toISOString())
    .lt('notification_attempts', MAX_NOTIFICATION_ATTEMPTS)
  if (businessProfileId) query = query.eq('business_profile_id', businessProfileId)
  query = query
    .order('created_at', { ascending: true })
    .limit(Math.max(1, Math.min(25, Number(limit) || 10)))
  const { data: dueDrafts, error } = await query
  if (error) throw error

  let failed = 0
  let sent = 0
  for (const draftCandidate of dueDrafts || []) {
    const draft = await claimNotification(admin, draftCandidate)
    if (!draft) continue
    const [reviewResult, settingsResult, businessResult] = await Promise.all([
      admin.from('google_reviews').select('*').eq('id', draft.google_review_id).maybeSingle(),
      admin.from('aura_google_reply_settings').select('*').eq('business_profile_id', draft.business_profile_id).maybeSingle(),
      admin.from('business_profiles').select('business_name').eq('id', draft.business_profile_id).maybeSingle(),
    ])

    try {
      const errorResult = reviewResult.error || settingsResult.error || businessResult.error
      if (errorResult) throw errorResult
      if (!settingsResult.data?.notifications_enabled || !settingsResult.data.notification_email) {
        await admin.from('google_review_drafts').update({ notification_status: 'disabled' }).eq('id', draft.id)
        continue
      }
      const delivery = await sendGoogleDraftReadyEmail({
        businessName: businessResult.data?.business_name || 'your business',
        draftId: draft.id,
        email: settingsResult.data.notification_email,
        rating: reviewResult.data.rating,
        reviewId: reviewResult.data.id,
        reviewerName: reviewResult.data.reviewer_name,
      })
      await admin.from('google_review_drafts').update({
        notification_next_attempt_at: null,
        notification_provider_id: delivery.id || null,
        notification_sent_at: new Date().toISOString(),
        notification_status: 'sent',
      }).eq('id', draft.id)
      await appendGoogleReviewEvent(admin, {
        business_profile_id: draft.business_profile_id,
        details: { provider: 'resend' },
        event_key: `notification-sent:${draft.id}`,
        event_type: 'notification_sent',
        google_connection_id: draft.google_connection_id,
        google_review_draft_id: draft.id,
        google_review_id: draft.google_review_id,
        user_id: draft.user_id,
      })
      sent += 1
    } catch (notificationError) {
      const safe = cleanError(notificationError)
      const terminal = Number(draft.notification_attempts || 0) >= MAX_NOTIFICATION_ATTEMPTS
      await admin.from('google_review_drafts').update({
        notification_next_attempt_at: terminal ? null : retryAt(draft.notification_attempts),
        notification_status: 'failed',
      }).eq('id', draft.id)
      await appendGoogleReviewEvent(admin, {
        business_profile_id: draft.business_profile_id,
        details: { attempt: draft.notification_attempts, code: safe.code, terminal },
        event_key: `notification-failed:${draft.id}:${draft.notification_attempts}`,
        event_type: 'notification_failed',
        google_connection_id: draft.google_connection_id,
        google_review_draft_id: draft.id,
        google_review_id: draft.google_review_id,
        user_id: draft.user_id,
      })
      failed += 1
    }
  }
  return { failed, sent }
}

export async function runGoogleReviewWorker({ admin, config, connectionLimit = 20, jobLimit = 10 }) {
  const { data: connections, error } = await admin
    .from('google_connections')
    .select('*')
    .eq('status', 'active')
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(connectionLimit)
  if (error) throw error

  const connectionResults = []
  for (const connection of connections || []) {
    try {
      connectionResults.push({ connectionId: connection.id, ...(await syncGoogleConnection({ admin, config, connection })) })
    } catch (syncError) {
      connectionResults.push({ connectionId: connection.id, error: cleanError(syncError) })
    }
  }
  const drafts = await processDraftJobs({ admin, config, limit: jobLimit })
  const notifications = await processDraftNotifications({ admin, limit: jobLimit })
  return { connections: connectionResults, drafts, notifications }
}
