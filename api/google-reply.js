import {
  getFreshGoogleAccessToken,
  getGoogleConnection,
  googleRequest,
  requireGoogleUser,
} from '../server/google-business.js'
import { handleApiError, readJsonBody, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { reply, reviewId } = readJsonBody(request)
    const cleanReply = String(reply || '').trim()
    if (!cleanReply || cleanReply.length > 4096) {
      sendJson(response, 400, { error: 'Write a reply between 1 and 4,096 characters.' })
      return
    }

    const { admin, businessProfile, config, user } = await requireGoogleUser(request)
    const { data: review, error: reviewError } = await admin
      .from('google_reviews')
      .select('id,google_review_name')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .eq('business_profile_id', businessProfile.id)
      .maybeSingle()
    if (reviewError) throw reviewError
    if (!review) {
      sendJson(response, 404, { error: 'That Google review was not found.' })
      return
    }

    const connection = await getGoogleConnection(admin, user.id)
    const accessToken = await getFreshGoogleAccessToken(admin, connection, config)
    const url = `https://mybusiness.googleapis.com/v4/${review.google_review_name}/reply`
    const payload = await googleRequest(url, accessToken, {
      body: JSON.stringify({ comment: cleanReply }),
      method: 'PUT',
    })
    const updatedAt = payload.updateTime || new Date().toISOString()
    const { error } = await admin
      .from('google_reviews')
      .update({ reply_comment: cleanReply, reply_updated_at: updatedAt, review_updated_at: updatedAt })
      .eq('id', review.id)
    if (error) throw error

    sendJson(response, 200, { reply: cleanReply, updatedAt })
  } catch (error) {
    handleApiError(response, error)
  }
}
