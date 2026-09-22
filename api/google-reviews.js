import { getGoogleConnection, requireGoogleUser } from '../server/google-business.js'
import { listGoogleReviews } from '../server/google-review-sync.js'
import { handleApiError, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { admin, businessProfile, user } = await requireGoogleUser(request)
    const connection = await getGoogleConnection(admin, user.id, {
      businessProfileId: businessProfile.id,
    })
    const reviews = await listGoogleReviews(admin, {
      businessProfileId: businessProfile.id,
      connectionId: connection.id,
      userId: user.id,
    })
    sendJson(response, 200, { reviews })
  } catch (error) {
    handleApiError(response, error)
  }
}
