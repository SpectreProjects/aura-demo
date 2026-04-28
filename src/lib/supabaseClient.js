import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasSupabaseConfig =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'PASTE_MY_PROJECT_URL' &&
  supabaseUrl !== 'PASTE_MY_PROJECT_URL_HERE' &&
  supabaseAnonKey !== 'PASTE_MY_PUBLISHABLE_KEY' &&
  supabaseAnonKey !== 'PASTE_MY_PUBLISHABLE_KEY_HERE'

console.info('[Supabase] URL:', supabaseUrl || 'missing')
console.info('[Supabase] Client initialised:', Boolean(hasSupabaseConfig))

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null

export const supabaseConfig = {
  hasSupabaseConfig: Boolean(hasSupabaseConfig),
  supabaseUrl,
}
