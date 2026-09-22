import { publicGoogleConnection, requireGoogleUser } from '../server/google-business.js'
import { publicReplySettings } from '../server/google-review-workflow.js'
import { handleApiError, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { admin, businessProfile, config, user } = await requireGoogleUser(request)
    const [connectionsResult, settingsResult] = await Promise.all([
      admin
        .from('google_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('business_profile_id', businessProfile.id)
        .in('status', ['pending_selection', 'active', 'reconnect_required'])
        .order('connected_at', { ascending: false }),
      admin
        .from('aura_google_reply_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('business_profile_id', businessProfile.id)
        .maybeSingle(),
    ])
    if (connectionsResult.error) throw connectionsResult.error
    if (settingsResult.error) throw settingsResult.error

    const active = connectionsResult.data?.find((item) => item.status === 'active') || null
    const pending = connectionsResult.data?.find((item) => item.status === 'pending_selection') || null
    const reconnect = connectionsResult.data?.find((item) => item.status === 'reconnect_required') || null
    const settings = publicReplySettings(settingsResult.data, user.email || '')

    sendJson(response, 200, {
      connected: Boolean(active),
      connection: publicGoogleConnection(active || reconnect),
      features: config.features,
      needsSetup: !active || !settings.setupComplete,
      pendingConnection: publicGoogleConnection(pending),
      settings,
    })
  } catch (error) {
    handleApiError(response, error)
  }
}
