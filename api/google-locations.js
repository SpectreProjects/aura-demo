import {
  assertGoogleFeature,
  discoverGoogleLocations,
  getFreshGoogleAccessToken,
  getGoogleConnection,
  publicGoogleLocation,
  requireGoogleUser,
  googleHttpError,
} from '../server/google-business.js'
import { handleApiError, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { admin, businessProfile, config, user } = await requireGoogleUser(request)
    assertGoogleFeature(config, 'connection')
    const connection = await getGoogleConnection(admin, user.id, {
      businessProfileId: businessProfile.id,
      status: 'pending_selection',
    })
    if (!connection.selection_expires_at || new Date(connection.selection_expires_at).getTime() <= Date.now()) {
      await admin.from('google_connections').update({
        access_token_encrypted: null,
        archived_at: new Date().toISOString(),
        refresh_token_encrypted: null,
        selection_expires_at: null,
        status: 'archived',
        updated_at: new Date().toISOString(),
      }).eq('id', connection.id)
      throw googleHttpError(410, 'This Google location selection has expired. Connect Google again.', 'SELECTION_EXPIRED')
    }

    const accessToken = await getFreshGoogleAccessToken(admin, connection, config)
    const candidates = await discoverGoogleLocations(accessToken)
    sendJson(response, 200, {
      connectionId: connection.id,
      expiresAt: connection.selection_expires_at,
      locations: candidates.map(({ account, location }) => publicGoogleLocation(account, location)),
    })
  } catch (error) {
    handleApiError(response, error)
  }
}

