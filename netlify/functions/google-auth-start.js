const googleOAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
const scope = 'https://www.googleapis.com/auth/business.manage'

export async function handler() {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env
  console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID)

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI',
      }),
    }
  }

  const params = new URLSearchParams({
    access_type: 'offline',
    client_id: GOOGLE_CLIENT_ID,
    prompt: 'consent',
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope,
  })

  return {
    statusCode: 302,
    headers: {
      Location: `${googleOAuthUrl}?${params.toString()}`,
    },
  }
}
