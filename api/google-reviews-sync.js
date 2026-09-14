import {
  getFreshGoogleAccessToken,
  getGoogleConnection,
  googleRatingToNumber,
  googleRequest,
  googleReviewsUrl,
  publicGoogleReview,
  requireGoogleUser,
} from '../server/google-business.js'
import { handleApiError, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { admin, businessProfile, config, user } = await requireGoogleUser(request)
    const connection = await getGoogleConnection(admin, user.id)
    const accessToken = await getFreshGoogleAccessToken(admin, connection, config)
    const baseUrl = googleReviewsUrl(connection)
    const reviews = []
    let pageToken = ''

    do {
      const url = new URL(baseUrl)
      url.searchParams.set('pageSize', '50')
      if (pageToken) url.searchParams.set('pageToken', pageToken)
      const payload = await googleRequest(url.toString(), accessToken)
      reviews.push(...(payload.reviews || []))
      pageToken = payload.nextPageToken || ''
    } while (pageToken && reviews.length < 1000)

    const syncedAt = new Date().toISOString()
    const rows = reviews.map((review) => ({
      business_profile_id: businessProfile.id,
      comment: review.comment || '',
      google_connection_id: connection.id,
      google_review_id: review.reviewId || review.name?.split('/').pop(),
      google_review_name: review.name,
      last_synced_at: syncedAt,
      rating: googleRatingToNumber(review.starRating),
      raw_review: review,
      reply_comment: review.reviewReply?.comment || null,
      reply_updated_at: review.reviewReply?.updateTime || null,
      review_created_at: review.createTime || syncedAt,
      review_updated_at: review.updateTime || review.createTime || syncedAt,
      reviewer_name: review.reviewer?.displayName || 'Google reviewer',
      user_id: user.id,
    }))

    if (rows.length) {
      const { error } = await admin.from('google_reviews').upsert(rows, { onConflict: 'google_review_name' })
      if (error) throw error
    }

    const [connectionUpdate, syncLogInsert] = await Promise.all([
      admin.from('google_connections').update({ last_synced_at: syncedAt, updated_at: syncedAt }).eq('id', connection.id),
      admin.from('google_review_sync_logs').insert({
        business_profile_id: businessProfile.id,
        google_connection_id: connection.id,
        reviews_found: reviews.length,
        reviews_imported: rows.length,
        status: 'success',
        user_id: user.id,
      }),
    ])
    if (connectionUpdate.error) throw connectionUpdate.error
    if (syncLogInsert.error) throw syncLogInsert.error

    sendJson(response, 200, { count: rows.length, reviews: rows.map(publicGoogleReview), syncedAt })
  } catch (error) {
    handleApiError(response, error)
  }
}
