import { LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import LeaderboardExperience from '../components/LeaderboardExperience'
import { supabase } from '../lib/supabaseClient'

export default function PublicLeaderboard() {
  const { slug } = useParams()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [payload, setPayload] = useState(null)
  const [pin, setPin] = useState('')
  const [requiresPin, setRequiresPin] = useState(false)

  useEffect(() => {
    const existingMeta = document.querySelector('meta[name="robots"]')
    const previousContent = existingMeta?.getAttribute('content')
    const meta = existingMeta || document.createElement('meta')
    meta.setAttribute('name', 'robots')
    meta.setAttribute('content', 'noindex, nofollow, noarchive')
    if (!existingMeta) document.head.appendChild(meta)

    return () => {
      if (existingMeta && previousContent) existingMeta.setAttribute('content', previousContent)
      if (!existingMeta) meta.remove()
    }
  }, [])

  useEffect(() => {
    loadLeaderboard()
    // The slug is the complete public lookup key for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function loadLeaderboard(accessPin = null) {
    setIsLoading(true)
    setError('')

    if (!supabase) {
      setError('This leaderboard is temporarily unavailable.')
      setIsLoading(false)
      return
    }

    const { data, error: loadError } = await supabase.rpc('get_aura_public_leaderboard', {
      p_pin: accessPin,
      p_slug: slug,
    })

    if (loadError) {
      setError('This leaderboard could not be loaded. Please try again.')
    } else if (data?.status === 'pin_required') {
      setPayload({ business_name: data.business_name })
      setRequiresPin(true)
      if (accessPin) setError('That PIN was not recognised. Please try again.')
    } else if (data?.status === 'ok') {
      setPayload(data)
      setRequiresPin(false)
    } else {
      setError('This leaderboard link is not active.')
    }
    setIsLoading(false)
  }

  async function submitPin(event) {
    event.preventDefault()
    await loadLeaderboard(pin)
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1450px]">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-300/10 text-violet-300">
              <Sparkles size={21} />
            </span>
            <div>
              <p className="text-base font-black tracking-[0.12em]">AURA</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Team recognition</p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 text-xs font-black text-slate-400">
            <ShieldCheck size={14} /> Read-only company view
          </span>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#09090c] p-12 text-center text-sm font-bold text-slate-400">
            Loading company leaderboard...
          </div>
        ) : requiresPin ? (
          <section className="mx-auto mt-20 max-w-md rounded-2xl border border-violet-300/15 bg-[#0b0a0e] p-6 text-center shadow-[0_30px_120px_rgba(139,92,246,0.10)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/[0.07] text-violet-200">
              <LockKeyhole size={21} />
            </span>
            <h1 className="mt-5 text-2xl font-black text-white">{payload?.business_name || 'Company leaderboard'}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Enter the company PIN to view this private recognition screen.</p>
            <form className="mt-5 space-y-3" onSubmit={submitPin}>
              <input
                autoFocus
                className="aura-field text-center text-lg tracking-[0.35em]"
                inputMode="numeric"
                maxLength={8}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                placeholder="PIN"
                required
                type="password"
                value={pin}
              />
              <button className="w-full rounded-xl bg-violet-300 px-5 py-3.5 text-sm font-black text-[#100722] hover:bg-violet-200" type="submit">
                View leaderboard
              </button>
              {error && <p className="text-sm font-bold text-rose-300">{error}</p>}
            </form>
          </section>
        ) : error ? (
          <div className="rounded-2xl border border-rose-300/15 bg-rose-400/[0.05] p-10 text-center">
            <p className="font-black text-white">Leaderboard unavailable</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
          </div>
        ) : (
          <>
            <section className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.17em] text-violet-200">Monthly recognition</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">{payload?.business_name}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
                Celebrating the team members recognised by customers this month.
              </p>
            </section>
            <LeaderboardExperience people={payload?.staff || []} />
          </>
        )}

        <footer className="mt-10 border-t border-white/[0.06] pt-5 text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">
          Recognition powered by AURA
        </footer>
      </div>
    </main>
  )
}
