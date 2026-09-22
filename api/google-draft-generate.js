import {
  assertGoogleFeature,
  getGoogleConnection,
  googleHttpError,
  requireGoogleUser,
} from '../server/google-business.js'
import {
  enqueueDraftJob,
  listGoogleReviews,
  processDraftJobs,
  processDraftNotifications,
} from '../server/google-review-sync.js'
import {
  MAX_MANUAL_DRAFTS_PER_BUSINESS_HOUR,
  MAX_MANUAL_DRAFTS_PER_REVIEW_WINDOW,
} from '../server/google-review-workflow.js'
import { handleApiError, readJsonBody, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { idempotencyKey, reviewId } = readJsonBody(request)
    const cleanKey = String(idempotencyKey || '').trim()
    if (!reviewId || cleanKey.length < 8 || cleanKey.length > 200) {
      throw googleHttpError(400, 'A valid review and request key are required.', 'DRAFT_REQUEST_INVALID')
    }

    const { admin, businessProfile, config, user } = await requireGoogleUser(request)
    assertGoogleFeature(config, 'draftGeneration')
    const connection = await getGoogleConnection(admin, user.id, {
      businessProfileId: businessProfile.id,
    })
    const [{ data: review, error: reviewError }, { data: existingDraft, error: draftError }] = await Promise.all([
      admin
        .from('google_reviews')
        .select('*')
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .eq('business_profile_id', businessProfile.id)
        .eq('google_connection_id', connection.id)
        .maybeSingle(),
      admin
        .from('google_review_drafts')
        .select('*')
        .eq('google_review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ])
    if (reviewError) throw reviewError
    if (draftError) throw draftError
    if (!review) throw googleHttpError(404, 'That Google review was not found.', 'GOOGLE_REVIEW_NOT_FOUND')
    if (!review.draft_eligible || review.reply_comment) {
      throw googleHttpError(409, 'AURA cannot generate a new draft for this review.', 'DRAFT_NOT_ELIGIBLE')
    }
    if (existingDraft?.status === 'published') {
      throw googleHttpError(409, 'This reply is already published on Google.', 'DRAFT_ALREADY_PUBLISHED')
    }
    if (existingDraft?.publication_claim_id) {
      throw googleHttpError(
        409,
        'This reply is currently being published. Refresh the review before regenerating it.',
        'PUBLISH_IN_PROGRESS',
      )
    }

    const manualKey = `manual-draft:${review.id}:${cleanKey}`
    const { data: existingRequest, error: existingRequestError } = await admin
      .from('google_review_draft_jobs')
      .select('id')
      .eq('idempotency_key', manualKey)
      .maybeSingle()
    if (existingRequestError) throw existingRequestError

    if (!existingRequest) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString()
      const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString()
      const [reviewLimit, businessLimit] = await Promise.all([
        admin
          .from('google_review_draft_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('google_review_id', review.id)
          .like('idempotency_key', 'manual-draft:%')
          .gte('created_at', tenMinutesAgo),
        admin
          .from('google_review_draft_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('business_profile_id', businessProfile.id)
          .like('idempotency_key', 'manual-draft:%')
          .gte('created_at', oneHourAgo),
      ])
      if (reviewLimit.error) throw reviewLimit.error
      if (businessLimit.error) throw businessLimit.error
      if (
        Number(reviewLimit.count || 0) >= MAX_MANUAL_DRAFTS_PER_REVIEW_WINDOW ||
        Number(businessLimit.count || 0) >= MAX_MANUAL_DRAFTS_PER_BUSINESS_HOUR
      ) {
        throw googleHttpError(
          429,
          'AURA has generated several versions recently. Review the latest draft or try again later.',
          'DRAFT_RATE_LIMITED',
        )
      }
    }

    const jobKind = existingDraft && existingDraft.status !== 'failed' ? 'regenerate' : 'generate'
    await enqueueDraftJob(admin, {
      connection,
      idempotencyKey: manualKey,
      jobKind,
      review,
    })
    await processDraftJobs({ admin, businessProfileId: businessProfile.id, config, limit: 5 })
    await processDraftNotifications({ admin, businessProfileId: businessProfile.id, limit: 5 })
    const reviews = await listGoogleReviews(admin, {
      businessProfileId: businessProfile.id,
      connectionId: connection.id,
      userId: user.id,
    })
    sendJson(response, 200, { review: reviews.find((item) => item.id === review.id) || null })
  } catch (error) {
    handleApiError(response, error)
  }
}
