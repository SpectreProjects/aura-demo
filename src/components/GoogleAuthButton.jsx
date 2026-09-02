import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.71-.06-1.4-.19-2.06H12v3.89h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.98-.9 6.63-2.4l-3.24-2.52c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.39 13.91A6.02 6.02 0 0 1 6.07 12c0-.66.11-1.3.32-1.91v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.51l3.35-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.6C7.18 7.72 9.39 5.96 12 5.96Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function GoogleAuthButton({ label = 'Continue with Google', onError }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleGoogleAuth() {
    onError?.('')

    if (!supabase) {
      onError?.('Google sign in is not available right now. Please try again soon.')
      return
    }

    setIsLoading(true)

    const redirectTo = new URL('/dashboard', window.location.origin).toString()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) {
      console.error('[Supabase Auth] Google sign in error:', error)
      onError?.('We could not start Google sign in. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <button
      className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isLoading}
      onClick={handleGoogleAuth}
      type="button"
    >
      <GoogleMark />
      {isLoading ? 'Connecting to Google...' : label}
    </button>
  )
}
