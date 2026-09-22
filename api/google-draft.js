import { getGoogleConnection, googleHttpError, publicGoogleDraft, requireGoogleUser } from '../server/google-business.js'
import { appendGoogleReviewEvent } from '../server/google-review-sync.js'
import { handleApiError, readJsonBody, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'PATCH') {
    response.setHeader('Allow', 'PATCH')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
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
