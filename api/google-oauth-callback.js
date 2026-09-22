import {
  assertGoogleFeature,
  clearGoogleOAuthSessionCookie,
  encryptGoogleToken,
  exchangeGoogleCode,
  getGoogleAdminClient,
  getGoogleConfig,
  requireGoogleOAuthSession,
  verifyOAuthState,
} from '../server/google-business.js'

function redirect(response, status, detail) {
  const params = new URLSearchParams({ google: status })
  if (detail) params.set('detail', detail)
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.setHeader('Set-Cookie', clearGoogleOAuthSessionCookie())
  response.redirect(302, `/setup/google?${params.toString()}`)
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).send('Method not allowed.')
    return
  }

  try {
    const config = getGoogleConfig()
    assertGoogleFeature(config, 'connection')
    const rawState = String(request.query.state || '')
    const state = verifyOAuthState(rawState, config.stateSecret)
    const codeVerifier = requireGoogleOAuthSession(request, rawState, config.stateSecret)
    if (request.query.error) {
      redirect(response, 'error', request.query.error === 'access_denied' ? 'permission_denied' : 'google_error')
      return
    }

    if (!request.query.code) {
      redirect(response, 'error', 'missing_code')
      return
    }

    const tokenPayload = await exchangeGoogleCode(request.query.code, config, codeVerifier)
    const admin = getGoogleAdminClient(config)
    const { data: ownedBusiness, error: ownershipError } = await admin
      .from('business_profiles')
      .select('id')
      .eq('id', state.businessProfileId)
      .eq('user_id', state.userId)
      .maybeSingle()
    if (ownershipError || !ownedBusiness) throw new Error('AURA could not verify the Google connection owner.')

    const { data: openConnections, error: connectionError } = await admin
      .from('google_connections')
      .select('id,status,refresh_token_encrypted')
      .eq('user_id', state.userId)
      .eq('business_profile_id', state.businessProfileId)
      .in('status', ['pending_selection', 'active', 'reconnect_required'])
      .order('connected_at', { ascending: false })
    if (connectionError) throw connectionError

    const pending = openConnections?.find((connection) => connection.status === 'pending_selection')
    const active = openConnections?.find((connection) => connection.status === 'active')
    const reconnect = openConnections?.find((connection) => connection.status === 'reconnect_required')
    const connectedAt = new Date().toISOString()
    const pendingConnection = {
      access_token_encrypted: encryptGoogleToken(tokenPayload.access_token, config.tokenSecret),
      active: false,
      business_profile_id: state.businessProfileId,
      connected_at: connectedAt,
      granted_scope: tokenPayload.scope || 'https://www.googleapis.com/auth/business.manage',
      last_error_code: null,
      refresh_token_encrypted: tokenPayload.refresh_token
        ? encryptGoogleToken(tokenPayload.refresh_token, config.tokenSecret)
        : pending?.refresh_token_encrypted || active?.refresh_token_encrypted || reconnect?.refresh_token_encrypted || null,
      selection_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: 'pending_selection',
      token_expires_at: new Date(Date.now() + Number(tokenPayload.expires_in || 3600) * 1000).toISOString(),
      updated_at: connectedAt,
      user_id: state.userId,
    }

    const query = pending
      ? admin.from('google_connections').update(pendingConnection).eq('id', pending.id)
      : admin.from('google_connections').insert(pendingConnection)
    const { error } = await query
    if (error) throw error

    redirect(response, 'select_location')
  } catch (error) {
    console.error('[AURA Google OAuth]', error?.code || error?.message)
    const detail = error?.code === 'GOOGLE_API_APPROVAL_REQUIRED'
      ? 'approval_required'
      : error?.code === 'GOOGLE_CONNECTION_DISABLED'
        ? 'temporarily_paused'
        : 'connection_failed'
    redirect(response, 'error', detail)
  }
}
