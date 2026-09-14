import { publicGoogleReview, requireGoogleUser } from '../server/google-business.js'
import { handleApiError, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { admin, businessProfile, user } = await requireGoogleUser(request)
    const { data, error } = await admin
      .from('google_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('business_profile_id', businessProfile.id)
      .order('review_created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    sendJson(response, 200, { reviews: (data || []).map(publicGoogleReview) })
  } catch (error) {
    handleApiError(response, error)
  }
}
