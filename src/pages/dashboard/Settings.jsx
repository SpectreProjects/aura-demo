import { CheckCircle2, Settings as SettingsIcon, ShieldAlert } from 'lucide-react'
import { supabaseConfig } from '../../lib/supabaseClient'
import { useDashboard } from './useDashboard'

export default function Settings() {
  const { connectionStatus, technicalNotice } = useDashboard()
  const isConnected = connectionStatus === 'connected'

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.065] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
        <p className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
          Settings
        </p>
        <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white">
          Workspace settings.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Basic setup information for this MVP. Customer-facing workflow settings can live here later.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isConnected ? 'bg-emerald-300 text-slate-950' : 'bg-amber-300 text-slate-950'}`}>
              {isConnected ? <CheckCircle2 size={22} /> : <ShieldAlert size={22} />}
            </span>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">Data connection</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isConnected
                  ? 'Shared dashboard data is connected.'
                  : 'The MVP is currently using this browser for data while shared tables are not connected.'}
              </p>
            </div>
          </div>

          {technicalNotice && (
            <div className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              {technicalNotice}
            </div>
          )}
        </article>

        <article className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
              <SettingsIcon size={22} />
            </span>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">Deployment variables</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add these in Vercel when you want shared data between browsers and devices.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {[
              ['VITE_SUPABASE_URL', supabaseConfig.supabaseUrl ? 'Set' : 'Missing'],
              ['VITE_SUPABASE_ANON_KEY', supabaseConfig.hasSupabaseConfig ? 'Set' : 'Missing'],
            ].map(([key, value]) => (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#050816]/72 px-4 py-3" key={key}>
                <code className="text-sm font-bold text-slate-200">{key}</code>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${value === 'Set' ? 'bg-emerald-300 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
