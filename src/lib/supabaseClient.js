import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
