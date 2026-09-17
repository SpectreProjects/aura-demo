import { requireGoogleUser } from '../server/google-business.js'
import { handleApiError, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { admin, user } = await requireGoogleUser(request)
    const { data, error } = await admin
      .from('google_connections')
      .select('active,connected_at,google_account_title,google_location_title,last_synced_at')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('connected_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    sendJson(response, 200, { connected: Boolean(data), connection: data || null })
  } catch (error) {
    handleApiError(response, error)
  }
}
