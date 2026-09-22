import { assertGoogleFeature, getGoogleConnection, googleHttpError, requireGoogleUser } from '../server/google-business.js'
import {
  listGoogleReviews,
  processDraftJobs,
  processDraftNotifications,
  syncGoogleConnection,
} from '../server/google-review-sync.js'
import { handleApiError, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { admin, businessProfile, config, user } = await requireGoogleUser(request)
    const connection = await getGoogleConnection(admin, user.id, {
      businessProfileId: businessProfile.id,
    })
    let syncResult = {}
    if (request.method === 'POST') {
      assertGoogleFeature(config, 'syncing')
      const now = new Date().toISOString()
      const nextManualSync = new Date(Date.now() + 60_000).toISOString()
      const { data: syncPermit, error: permitError } = await admin
        .from('google_connections')
        .update({ manual_sync_available_at: nextManualSync })
        .eq('id', connection.id)
        .eq('status', 'active')
        .or(`manual_sync_available_at.is.null,manual_sync_available_at.lte.${now}`)
        .select('id')
        .maybeSingle()
      if (permitError) throw permitError
      if (!syncPermit) {
        throw googleHttpError(429, 'You can refresh Google reviews once each minute.', 'SYNC_RATE_LIMITED')
      }
      const result = await syncGoogleConnection({ admin, config, connection })
      const drafts = await processDraftJobs({
        admin,
        businessProfileId: businessProfile.id,
        config,
        limit: 20,
      })
      const notifications = await processDraftNotifications({
        admin,
        businessProfileId: businessProfile.id,
        limit: 20,
      })
      syncResult = { ...result, drafts, notifications }
    }
    const reviews = await listGoogleReviews(admin, {
      businessProfileId: businessProfile.id,
      connectionId: connection.id,
      userId: user.id,
    })
    sendJson(response, 200, { ...syncResult, reviews })
  } catch (error) {
    handleApiError(response, error)
  }
}
