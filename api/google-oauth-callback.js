import {
  discoverGoogleLocation,
  encryptGoogleToken,
  exchangeGoogleCode,
  getGoogleAdminClient,
  getGoogleConfig,
  verifyOAuthState,
} from '../server/google-business.js'

function redirect(response, status, detail) {
  const params = new URLSearchParams({ google: status })
  if (detail) params.set('detail', detail)
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.redirect(302, `/dashboard/settings?${params.toString()}`)
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).send('Method not allowed.')
    return
  }

  try {
    const config = getGoogleConfig()
    if (request.query.error) {
      redirect(response, 'error', request.query.error === 'access_denied' ? 'permission_denied' : 'google_error')
      return
    }

    const state = verifyOAuthState(request.query.state, config.stateSecret)
    if (!request.query.code) throw new Error('Google did not return an authorization code.')
    const tokenPayload = await exchangeGoogleCode(request.query.code, config)
    const { account, location } = await discoverGoogleLocation(tokenPayload.access_token)
    const admin = getGoogleAdminClient(config)

    const { data: existing, error: existingError } = await admin
      .from('google_connections')
      .select('id,refresh_token_encrypted')
      .eq('user_id', state.userId)
      .eq('business_profile_id', state.businessProfileId)
      .limit(1)
      .maybeSingle()
    if (existingError) throw existingError

    const connection = {
      access_token_encrypted: encryptGoogleToken(tokenPayload.access_token, config.tokenSecret),
      active: true,
      business_profile_id: state.businessProfileId,
      google_account_name: account.name,
      google_account_title: account.accountName || account.name,
      google_location_name: location.name,
      google_location_title: location.title || location.storeCode || location.name,
      granted_scope: tokenPayload.scope || 'https://www.googleapis.com/auth/business.manage',
      refresh_token_encrypted: tokenPayload.refresh_token
        ? encryptGoogleToken(tokenPayload.refresh_token, config.tokenSecret)
        : existing?.refresh_token_encrypted || null,
      token_expires_at: new Date(Date.now() + Number(tokenPayload.expires_in || 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      user_id: state.userId,
    }

    const query = existing
      ? admin.from('google_connections').update(connection).eq('id', existing.id)
      : admin.from('google_connections').insert(connection)
    const { error } = await query
    if (error) throw error

    redirect(response, 'connected')
  } catch (error) {
    console.error('[AURA Google OAuth]', error?.code || error?.message)
    const detail = error?.code === 'GOOGLE_API_APPROVAL_REQUIRED' ? 'approval_required' : 'connection_failed'
    redirect(response, 'error', detail)
  }
}
