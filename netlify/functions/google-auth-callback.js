export async function handler(event) {
  // TODO: Read the Google OAuth code and state from event.queryStringParameters.
  // TODO: Exchange the auth code for access and refresh tokens using GOOGLE_CLIENT_SECRET.
  // TODO: Store tokens in Supabase using SUPABASE_SERVICE_ROLE_KEY inside this function only.
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Google OAuth callback placeholder',
      hasCode: Boolean(event.queryStringParameters?.code),
    }),
  }
}
