import crypto from 'node:crypto'
import {
  assertGoogleFeature,
  claimGoogleConnectionOperation,
  getFreshGoogleAccessToken,
  getGoogleConnection,
  googleHttpError,
  googleRequest,
  googleReviewUrl,
  publicGoogleDraft,
  releaseGoogleConnectionOperation,
  requireGoogleUser,
} from '../server/google-business.js'
import { effectiveDraftText } from '../server/google-review-workflow.js'
import { appendGoogleReviewEvent } from '../server/google-review-sync.js'
import { handleApiError, readJsonBody, sendJson } from '../server/places.js'

const PUBLICATION_CLAIM_TTL_MS = 5 * 60_000

async function recordPublishConflict(admin, { businessProfile, connection, draft, review, user }) {
  await appendGoogleReviewEvent(admin, {
    business_profile_id: businessProfile.id,
    details: { reason: 'remote_reply_changed' },
    event_key: `publish-conflict:${draft.id}:v${draft.version}`,
    event_type: 'publish_conflict',
    google_connection_id: connection.id,
    google_review_draft_id: draft.id,
    google_review_id: review.id,
    user_id: user.id,
  })
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  let publicationClaim = null
  let connectionOperation = null
  try {
    const { confirmedText, draftId, idempotencyKey, version } = readJsonBody(request)
    const cleanConfirmedText = String(confirmedText || '').trim()
    const cleanIdempotencyKey = String(idempotencyKey || '').trim()
    const expectedVersion = Number(version)
    if (
      !draftId || !cleanConfirmedText || cleanConfirmedText.length > 4096 ||
      cleanIdempotencyKey.length < 8 || cleanIdempotencyKey.length > 200 ||
      !Number.isInteger(expectedVersion)
    ) {
      throw googleHttpError(400, 'The confirmed Google reply is invalid.', 'PUBLISH_REQUEST_INVALID')
    }

    const { admin, businessProfile, config, user } = await requireGoogleUser(request)
    assertGoogleFeature(config, 'manualPublish')
    const connection = await getGoogleConnection(admin, user.id, {
      businessProfileId: businessProfile.id,
    })
    const { data: draft, error: draftError } = await admin
      .from('google_review_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .eq('business_profile_id', businessProfile.id)
      .eq('google_connection_id', connection.id)
      .maybeSingle()
    if (draftError) throw draftError
    if (!draft) throw googleHttpError(404, 'That AURA draft was not found.', 'DRAFT_NOT_FOUND')

    const savedText = effectiveDraftText(draft)
    if (draft.status === 'published') {
      if (
        savedText === cleanConfirmedText &&
        draft.publication_idempotency_key === cleanIdempotencyKey &&
        Number(draft.publication_request_version) === expectedVersion
      ) {
        sendJson(response, 200, { draft: publicGoogleDraft(draft), published: true, reply: savedText })
        return
      }
      throw googleHttpError(
        409,
        'This reply has already been published from a different confirmation.',
        'DRAFT_ALREADY_PUBLISHED',
      )
    }
    if (savedText !== cleanConfirmedText || Number(draft.version) !== expectedVersion) {
      throw googleHttpError(
        409,
        'This draft changed after the confirmation opened. Review the latest saved text before publishing.',
        'DRAFT_VERSION_CONFLICT',
      )
    }
    const { data: review, error: reviewError } = await admin
      .from('google_reviews')
      .select('*')
      .eq('id', draft.google_review_id)
      .eq('user_id', user.id)
      .eq('business_profile_id', businessProfile.id)
      .eq('google_connection_id', connection.id)
      .maybeSingle()
    if (reviewError) throw reviewError
    if (!review) throw googleHttpError(404, 'That Google review was not found.', 'GOOGLE_REVIEW_NOT_FOUND')

    const claimId = crypto.randomUUID()
    const claimStartedAt = new Date().toISOString()
    const claimExpiresAt = new Date(Date.now() + PUBLICATION_CLAIM_TTL_MS).toISOString()
    const { data: claimedDraft, error: claimError } = await admin
      .from('google_review_drafts')
      .update({
        publication_claim_expires_at: claimExpiresAt,
        publication_claim_id: claimId,
        publication_claimed_at: claimStartedAt,
        publication_idempotency_key: cleanIdempotencyKey,
        publication_request_version: expectedVersion,
      })
      .eq('id', draft.id)
      .eq('user_id', user.id)
      .eq('business_profile_id', businessProfile.id)
      .eq('google_connection_id', connection.id)
      .eq('version', expectedVersion)
      .in('status', ['generated', 'edited'])
      .or(`publication_claim_id.is.null,publication_claim_expires_at.lt.${claimStartedAt}`)
      .select('*')
      .maybeSingle()
    if (claimError) throw claimError
    if (!claimedDraft) {
      const { data: latestDraft, error: latestError } = await admin
        .from('google_review_drafts')
        .select('*')
        .eq('id', draft.id)
        .eq('user_id', user.id)
        .eq('business_profile_id', businessProfile.id)
        .eq('google_connection_id', connection.id)
        .maybeSingle()
      if (latestError) throw latestError
      if (latestDraft?.status === 'published') {
        sendJson(response, 200, {
          draft: publicGoogleDraft(latestDraft),
          published: true,
          reply: effectiveDraftText(latestDraft),
        })
        return
      }
      if (latestDraft?.publication_claim_id) {
        throw googleHttpError(
          409,
          'This reply is already being published. Wait a moment, then refresh the review.',
          'PUBLISH_IN_PROGRESS',
        )
      }
      throw googleHttpError(
        409,
        'This draft changed after the confirmation opened. Review the latest saved text before publishing.',
        'DRAFT_VERSION_CONFLICT',
      )
    }
    publicationClaim = { admin, claimId, draftId: draft.id }
    const operationOwner = await claimGoogleConnectionOperation(admin, connection.id, 'publish')
    if (!operationOwner) {
      throw googleHttpError(
        409,
        'AURA is refreshing this Google location. Wait a moment, then publish again.',
        'GOOGLE_CONNECTION_BUSY',
      )
    }
    connectionOperation = { admin, connectionId: connection.id, ownerId: operationOwner }

    await appendGoogleReviewEvent(admin, {
      business_profile_id: businessProfile.id,
      details: { version: expectedVersion },
      event_key: `publish-started:${draft.id}:v${expectedVersion}`,
      event_type: 'publish_started',
      google_connection_id: connection.id,
      google_review_draft_id: draft.id,
      google_review_id: review.id,
      user_id: user.id,
    })

    const accessToken = await getFreshGoogleAccessToken(admin, connection, config)
    const reviewUrl = googleReviewUrl(review.google_review_name)
    const currentGoogleReview = await googleRequest(reviewUrl, accessToken)
    const remoteReply = currentGoogleReview.reviewReply
    let googleReply
    let reconciled = false

    if (remoteReply?.comment) {
      if (String(remoteReply.comment).trim() === savedText) {
        googleReply = remoteReply
        reconciled = true
      } else {
        await recordPublishConflict(admin, {
          businessProfile,
          connection,
          draft,
          review,
          user,
        })
        throw googleHttpError(
          409,
          'Google already has a different owner reply. Refresh the review before publishing anything else.',
          'GOOGLE_REPLY_CONFLICT',
        )
      }
    } else {
      googleReply = await googleRequest(`${reviewUrl}/reply`, accessToken, {
        body: JSON.stringify({ comment: savedText }),
        method: 'PUT',
      })
    }

    const googleUpdatedAt = googleReply.updateTime || new Date().toISOString()
    const { data: finalDraft, error: finalizeError } = await admin.rpc('finalize_google_review_publication', {
      p_business_profile_id: businessProfile.id,
      p_claim_id: claimId,
      p_draft_id: draft.id,
      p_google_connection_id: connection.id,
      p_google_review_id: review.id,
      p_google_updated_at: googleUpdatedAt,
      p_reconciled: reconciled,
      p_reply_text: savedText,
      p_user_id: user.id,
    })
    if (finalizeError) throw finalizeError
    if (!finalDraft) throw new Error('The published Google reply could not be finalised locally.')
    publicationClaim = null
    await releaseGoogleConnectionOperation(admin, connection.id, operationOwner)
    connectionOperation = null

    sendJson(response, 200, {
      draft: publicGoogleDraft(finalDraft),
      published: true,
      reconciled,
      reply: savedText,
      updatedAt: googleUpdatedAt,
    })
  } catch (error) {
    if (connectionOperation) {
      await releaseGoogleConnectionOperation(
        connectionOperation.admin,
        connectionOperation.connectionId,
        connectionOperation.ownerId,
      )
    }
    if (publicationClaim) {
      await publicationClaim.admin
        .from('google_review_drafts')
        .update({
          publication_claim_expires_at: null,
          publication_claim_id: null,
          publication_claimed_at: null,
        })
        .eq('id', publicationClaim.draftId)
        .eq('publication_claim_id', publicationClaim.claimId)
    }
    handleApiError(response, error)
  }
}
