export const GOOGLE_SIGN_IN_NEXT_KEY = 'aura-google-sign-in-next'

export function consumeGoogleSignInDestination(storage) {
  const destination = storage.getItem(GOOGLE_SIGN_IN_NEXT_KEY)
  storage.removeItem(GOOGLE_SIGN_IN_NEXT_KEY)
  return destination === '/setup/google' ? destination : null
}
