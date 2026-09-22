import {
  assertGoogleFeature,
  getGoogleConnection,
  googleHttpError,
  publicGoogleDraft,
  requireGoogleUser,
} from '../server/google-business.js'
import {
  appendGoogleReviewEvent,
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
  if (!['PATCH', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'PATCH, POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    if (request.method === 'POST') {
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
      return
    }

    const { draftId, text, version } = readJsonBody(request)
    const cleanText = String(text || '').trim()
    const expectedVersion = Number(version)
    if (!draftId || !cleanText || cleanText.length > 4096 || !Number.isInteger(expectedVersion)) {
      throw googleHttpError(400, 'Write a draft between 1 and 4,096 characters.', 'DRAFT_INVALID')
    }

    const { admin, businessProfile, user } = await requireGoogleUser(request)
    const connection = await getGoogleConnection(admin, user.id, {
      businessProfileId: businessProfile.id,
    })
    const { data: existing, error: existingError } = await admin
      .from('google_review_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .eq('business_profile_id', businessProfile.id)
      .eq('google_connection_id', connection.id)
      .maybeSingle()
    if (existingError) throw existingError
    if (!existing) throw googleHttpError(404, 'That AURA draft was not found.', 'DRAFT_NOT_FOUND')
    if (existing.status === 'published') {
      throw googleHttpError(409, 'Published replies cannot be changed from this draft.', 'DRAFT_ALREADY_PUBLISHED')
    }
    if (existing.publication_claim_id) {
      throw googleHttpError(
        409,
        'This reply is currently being published. Refresh the review before making another change.',
        'PUBLISH_IN_PROGRESS',
      )
    }

    const nextVersion = expectedVersion + 1
    const { data: updated, error } = await admin
      .from('google_review_drafts')
      .update({ edited_text: cleanText, last_error_code: null, last_error_message: null, status: 'edited', version: nextVersion })
      .eq('id', existing.id)
      .eq('version', expectedVersion)
      .is('publication_claim_id', null)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!updated) {
      throw googleHttpError(409, 'This draft changed in another tab. Reload it before saving.', 'DRAFT_VERSION_CONFLICT')
    }

    await appendGoogleReviewEvent(admin, {
      business_profile_id: businessProfile.id,
      details: { version: nextVersion },
      event_key: `draft-edited:${updated.id}:${nextVersion}`,
      event_type: 'draft_edited',
      google_connection_id: connection.id,
      google_review_draft_id: updated.id,
      google_review_id: updated.google_review_id,
      user_id: user.id,
    })
    sendJson(response, 200, { draft: publicGoogleDraft(updated) })
  } catch (error) {
    handleApiError(response, error)
  }
}
