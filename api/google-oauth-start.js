import {
  assertGoogleFeature,
  googleBusinessAuthorizationUrl,
  createGoogleOAuthSession,
  createOAuthState,
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
    const { businessProfile, config, user } = await requireGoogleUser(request)
    assertGoogleFeature(config, 'connection')
    const state = createOAuthState({ businessProfileId: businessProfile.id, userId: user.id }, config.stateSecret)
    const oauthSession = createGoogleOAuthSession(state, config.stateSecret)
    const url = googleBusinessAuthorizationUrl(config, state, oauthSession.challenge)
    response.setHeader('Set-Cookie', oauthSession.cookie)
    sendJson(response, 200, { url })
  } catch (error) {
    handleApiError(response, error)
  }
}
