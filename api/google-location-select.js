import {
  assertGoogleFeature,
  discoverGoogleLocations,
  getFreshGoogleAccessToken,
  getGoogleConnection,
  googleHttpError,
  publicGoogleConnection,
  requireGoogleUser,
} from '../server/google-business.js'
import { appendGoogleReviewEvent } from '../server/google-review-sync.js'
import { handleApiError, readJsonBody, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const body = readJsonBody(request)
    const connectionId = String(body.connectionId || '')
    const accountName = String(body.accountName || '')
    const locationName = String(body.locationName || '')
    if (!connectionId || !accountName || !locationName) {
      throw googleHttpError(400, 'Choose a Google business location.', 'LOCATION_REQUIRED')
    }

    const { admin, businessProfile, config, user } = await requireGoogleUser(request)
    assertGoogleFeature(config, 'connection')
    const connection = await getGoogleConnection(admin, user.id, {
      businessProfileId: businessProfile.id,
      status: 'pending_selection',
    })
    if (connection.id !== connectionId) {
      throw googleHttpError(409, 'That location choice has expired. Refresh and choose again.', 'LOCATION_SELECTION_STALE')
    }
    if (!connection.selection_expires_at || new Date(connection.selection_expires_at).getTime() <= Date.now()) {
      throw googleHttpError(410, 'This Google location selection has expired. Connect Google again.', 'SELECTION_EXPIRED')
    }

    const accessToken = await getFreshGoogleAccessToken(admin, connection, config)
    const candidates = await discoverGoogleLocations(accessToken)
    const selected = candidates.find(({ account, location }) => (
      account.name === accountName && location.name === locationName
    ))
    if (!selected) {
      throw googleHttpError(404, 'Google no longer returned that location. Refresh and choose again.', 'LOCATION_NOT_FOUND')
    }

    const address = [
      ...(selected.location.storefrontAddress?.addressLines || []),
      selected.location.storefrontAddress?.locality,
      selected.location.storefrontAddress?.administrativeArea,
      selected.location.storefrontAddress?.postalCode,
      selected.location.storefrontAddress?.regionCode,
    ].filter(Boolean).join(', ')
    const title = selected.location.title || selected.location.storeCode || selected.location.name
    const { data: activatedId, error: activationError } = await admin.rpc('activate_google_location', {
      p_business_profile_id: businessProfile.id,
      p_connection_id: connection.id,
      p_google_account_name: selected.account.name,
      p_google_account_title: selected.account.accountName || selected.account.name,
      p_google_location_address: address,
      p_google_location_name: selected.location.name,
      p_google_location_store_code: selected.location.storeCode || '',
      p_google_location_title: title,
      p_location_snapshot: selected.location,
      p_user_id: user.id,
    })
    if (activationError?.code === '55P03') {
      throw googleHttpError(409, activationError.message, 'GOOGLE_CONNECTION_BUSY')
    }
    if (activationError) throw activationError

    const { data: active, error: activeError } = await admin
      .from('google_connections')
      .select('*')
      .eq('id', activatedId)
      .single()
    if (activeError) throw activeError
    await appendGoogleReviewEvent(admin, {
      business_profile_id: businessProfile.id,
      details: { accountTitle: active.google_account_title, locationTitle: active.google_location_title },
      event_key: `connection-selected:${active.id}`,
      event_type: 'connection_selected',
      google_connection_id: active.id,
      user_id: user.id,
    })

    sendJson(response, 200, { connection: publicGoogleConnection(active) })
  } catch (error) {
    handleApiError(response, error)
  }
}
