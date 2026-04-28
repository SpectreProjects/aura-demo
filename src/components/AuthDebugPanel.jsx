import { supabaseConfig } from '../lib/supabaseClient'

export default function AuthDebugPanel({ lastAuthError, session }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Auth debug</p>
      <div className="mt-3 space-y-1 text-xs font-semibold text-slate-600">
        <p>Supabase URL loaded: {supabaseConfig.supabaseUrl ? 'true' : 'false'}</p>
        <p>Current session: {session ? 'yes' : 'no'}</p>
        <p>Last auth error: {lastAuthError || 'none'}</p>
      </div>
    </div>
  )
}
