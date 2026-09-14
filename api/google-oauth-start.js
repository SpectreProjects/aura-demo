import { createOAuthState, requireGoogleUser } from '../server/google-business.js'
import { handleApiError, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { businessProfile, config, user } = await requireGoogleUser(request)
    const state = createOAuthState({ businessProfileId: businessProfile.id, userId: user.id }, config.stateSecret)
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('include_granted_scopes', 'true')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('redirect_uri', config.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'https://www.googleapis.com/auth/business.manage')
    url.searchParams.set('state', state)
    sendJson(response, 200, { url: url.toString() })
  } catch (error) {
    handleApiError(response, error)
  }
}
