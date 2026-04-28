export async function handler() {
  // TODO: Build the Google OAuth URL with GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI,
  // requested Google Business Profile scopes, state verification, and offline access.
  // TODO: Return a redirect response or JSON containing the URL once OAuth is wired.
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Google OAuth start placeholder',
    }),
  }
}
