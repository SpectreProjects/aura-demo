import { createClient } from '@supabase/supabase-js'

const businessId = '11111111-1111-1111-1111-111111111111'
const tokenUrl = 'https://oauth2.googleapis.com/token'

function redirectToSettings(status) {
  return {
    statusCode: 302,
    headers: {
      Location: `/app/settings?google=${status}`,
    },
  }
}

export async function handler(event) {
  const code = event.queryStringParameters?.code

  if (!code) {
    console.error('[Google OAuth] Missing auth code in callback.', event.queryStringParameters)
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Missing Google OAuth code',
      }),
    }
  }

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL,
  } = process.env

  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REDIRECT_URI ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !SUPABASE_URL
  ) {
    console.error('[Google OAuth] Missing required Netlify Function env vars.')
    return redirectToSettings('error')
  }

  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('[Google OAuth] Token exchange failed:', tokenData)
      return redirectToSettings('error')
    }

    const { access_token, expires_in, refresh_token, scope, token_type } = tokenData

    if (!refresh_token) {
      console.warn('[Google OAuth] No refresh_token returned. Ensure access_type=offline and prompt=consent are used.')
    }

    const expiresAt = new Date(Date.now() + Number(expires_in || 0) * 1000).toISOString()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase.from('google_connections').insert({
      access_token,
      active: true,
      business_id: businessId,
      connected_at: new Date().toISOString(),
      expires_at: expiresAt,
      refresh_token: refresh_token || null,
      user_id: null,
    })

    if (error) {
      console.error('[Google OAuth] Failed to store tokens in Supabase:', error)
      return redirectToSettings('error')
    }

    console.info('[Google OAuth] Google Business Profile connected.', {
      businessId,
      hasRefreshToken: Boolean(refresh_token),
      scope,
      tokenType: token_type,
    })

    return redirectToSettings('connected')
  } catch (error) {
    console.error('[Google OAuth] Callback failed:', error)
    return redirectToSettings('error')
  }
}
