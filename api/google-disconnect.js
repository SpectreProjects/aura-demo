import { getGoogleConnection, googleHttpError, requireGoogleUser } from '../server/google-business.js'
import { appendGoogleReviewEvent } from '../server/google-review-sync.js'
import { handleApiError, readJsonBody, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { mode } = readJsonBody(request)
    const { admin, businessProfile, user } = await requireGoogleUser(request)
    const isCancel = mode === 'cancel_pending'
    let connection = await getGoogleConnection(admin, user.id, {
      businessProfileId: businessProfile.id,
      required: false,
      status: isCancel ? 'pending_selection' : 'active',
    })
    if (!connection && !isCancel) {
      connection = await getGoogleConnection(admin, user.id, {
        businessProfileId: businessProfile.id,
        required: false,
        status: 'reconnect_required',
      })
    }

    if (!connection) {
      sendJson(response, 200, { disconnected: true })
      return
    }

    const { error } = await admin.rpc('disconnect_google_connection', {
      p_archive: isCancel,
      p_business_profile_id: businessProfile.id,
      p_connection_id: connection.id,
      p_user_id: user.id,
    })
    if (error?.code === '55P03') {
      throw googleHttpError(409, error.message, 'GOOGLE_CONNECTION_BUSY')
    }
    if (error) throw error

    await appendGoogleReviewEvent(admin, {
      business_profile_id: businessProfile.id,
      details: { mode: isCancel ? 'cancel_pending' : 'disconnect' },
      event_key: `connection-disconnected:${connection.id}:${isCancel ? 'pending' : 'active'}`,
      event_type: 'connection_disconnected',
      google_connection_id: connection.id,
      user_id: user.id,
    })
    sendJson(response, 200, { disconnected: true })
  } catch (error) {
    handleApiError(response, error)
  }
}
