import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function readInitialAuthCallback() {
  if (typeof window === 'undefined') {
    return { errorCode: null, hasError: false, isPasswordRecovery: false }
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(window.location.search)
  const getParam = (name) => hashParams.get(name) || queryParams.get(name)

  return {
    errorCode: getParam('error_code'),
    hasError: Boolean(getParam('error') || getParam('error_code')),
    isPasswordRecovery: getParam('type') === 'recovery',
  }
}

// Supabase removes auth details from the URL while the client starts. Capture only
// the non-secret recovery state first so the reset route can distinguish a real
// recovery callback from an ordinary signed-in browser session.
export const initialAuthCallback = readInitialAuthCallback()

const hasSupabaseConfig =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'PASTE_MY_PROJECT_URL' &&
  supabaseUrl !== 'PASTE_MY_PROJECT_URL_HERE' &&
  supabaseAnonKey !== 'PASTE_MY_PUBLISHABLE_KEY' &&
  supabaseAnonKey !== 'PASTE_MY_PUBLISHABLE_KEY_HERE'

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null

export const supabaseConfig = {
  hasSupabaseConfig,
  supabaseUrl,
}
