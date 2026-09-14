import { Check, Clock3, Link2, Power, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDashboard } from './useDashboard'

export default function Settings() {
  const { actions, autoReplySettings } = useDashboard()
  const [searchParams] = useSearchParams()
  const googleResult = searchParams.get('google')
  const googleDetail = searchParams.get('detail')
  const [draft, setDraft] = useState(autoReplySettings)
  const [isSaved, setIsSaved] = useState(false)
  const [googleStatus, setGoogleStatus] = useState({ connected: false, loading: true })
  const [googleMessage, setGoogleMessage] = useState(() => {
    if (googleDetail === 'approval_required') {
      return 'Google permission was granted, but this Cloud project is still waiting for Business Profile API approval.'
    }
    if (googleResult === 'connected') return 'Google Business Profile connected successfully.'
    if (googleResult === 'error') return 'Google could not finish the connection. Please try again.'
    return ''
  })
  const [isGoogleBusy, setIsGoogleBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    actions.getGoogleConnectionStatus()
      .then((status) => mounted && setGoogleStatus({ ...status, loading: false }))
      .catch((error) => {
        if (!mounted) return
        setGoogleStatus({ connected: false, loading: false })
        setGoogleMessage(error.message)
      })
    return () => { mounted = false }
  }, [actions])

  async function connectGoogle() {
    setIsGoogleBusy(true)
    setGoogleMessage('')
    try {
      await actions.connectGoogleProfile()
    } catch (error) {
      setGoogleMessage(error.message)
      setIsGoogleBusy(false)
    }
  }

  async function syncReviews() {
    setIsGoogleBusy(true)
    setGoogleMessage('')
    try {
      const result = await actions.syncGoogleReviews()
      setGoogleMessage(`${result.count} Google review${result.count === 1 ? '' : 's'} pulled into AURA.`)
      setGoogleStatus((current) => ({
        ...current,
        connection: { ...current.connection, last_synced_at: result.syncedAt },
      }))
    } catch (error) {
      setGoogleMessage(error.code === 'GOOGLE_API_APPROVAL_REQUIRED'
        ? 'Your Google Cloud project still has zero Business Profile API quota. Google must approve the existing application before reviews can be pulled.'
        : error.message)
    } finally {
      setIsGoogleBusy(false)
    }
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
    setIsSaved(false)
  }

  async function saveSettings(event) {
    event.preventDefault()
    await actions.updateAutoReplySettings(draft)
    setIsSaved(true)
  }

  return (
    <div className="space-y-8 pb-12">
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#5c6d68]">Settings</p>
        <h2 className="max-w-4xl text-4xl font-medium leading-[1.08] tracking-[-0.045em] text-white lg:text-[3.35rem]">
          Choose when AURA replies to your reviews.
        </h2>
      </section>

      <section className="max-w-3xl overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#3867F4]/25 bg-[#3867F4]/10 text-[#8aa5ff]">
              <Link2 size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold tracking-[-0.025em] text-white">Google Business Profile</h3>
                {!googleStatus.loading && (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${googleStatus.connected ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.07] text-slate-400'}`}>
                    {googleStatus.connected ? 'Connected' : 'Not connected'}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Let AURA pull all reviews and publish replies after the business owner grants permission.
              </p>
              {googleStatus.connection?.google_location_title && (
                <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-300">
                  <ShieldCheck size={14} className="text-emerald-300" /> {googleStatus.connection.google_location_title}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3867F4] px-4 text-sm font-black text-white transition hover:bg-[#2f5be0] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isGoogleBusy || googleStatus.loading}
              onClick={googleStatus.connected ? syncReviews : connectGoogle}
              type="button"
            >
              {googleStatus.connected ? <RefreshCw size={16} className={isGoogleBusy ? 'animate-spin' : ''} /> : <Link2 size={16} />}
              {isGoogleBusy ? 'Working...' : googleStatus.connected ? 'Pull reviews' : 'Connect Google'}
            </button>
          </div>
        </div>
        {googleMessage && (
          <p aria-live="polite" className="border-t border-white/[0.07] px-6 py-4 text-sm font-semibold leading-6 text-slate-300 sm:px-7">
            {googleMessage}
          </p>
        )}
      </section>

      <form className="max-w-3xl overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90" noValidate onSubmit={saveSettings}>
        <div className="flex items-start justify-between gap-5 border-b border-white/[0.07] p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/35 text-[#263632]">
              <Power size={20} />
            </span>
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.025em] text-white">Automatic review replies</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
                When switched on, AURA prepares a natural response for every new Google review. Publishing automation can be enabled after the Google connection is approved and tested.
              </p>
            </div>
          </div>

          <button
            aria-checked={draft.enabled}
            aria-label="Automatic review replies"
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${draft.enabled ? 'bg-[#3867F4]' : 'bg-[#aebfba]'}`}
            onClick={() => updateDraft('enabled', !draft.enabled)}
            role="switch"
            type="button"
          >
            <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${draft.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className={`p-6 transition-opacity sm:p-7 ${draft.enabled ? 'opacity-100' : 'pointer-events-none opacity-40'}`}>
          <div className="flex items-center gap-3">
            <Clock3 size={18} className="text-[#3867F4]" />
            <div>
              <h3 className="font-semibold text-white">Reply delay</h3>
              <p className="mt-1 text-sm text-slate-400">Set this to 0 if you want replies sent immediately.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.2fr]">
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#687a75]">Wait for</span>
              <input
                className="h-14 w-full rounded-xl border border-black/[0.08] bg-white/45 px-4 text-base font-semibold text-[#17201e] outline-none focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
                min="0"
                onChange={(event) => updateDraft('delayValue', event.target.value)}
                type="number"
                value={draft.delayValue}
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#687a75]">Time period</span>
              <select
                className="h-14 w-full rounded-xl border border-black/[0.08] bg-white/45 px-4 text-base font-semibold text-[#17201e] outline-none focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
                onChange={(event) => updateDraft('delayUnit', event.target.value)}
                value={draft.delayUnit}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] bg-white/[0.08] px-6 py-5 sm:px-7">
          <p className="text-sm font-semibold text-[#61736e]">
            {draft.enabled ? 'Automatic reply preparation is on.' : 'AURA will not prepare replies automatically.'}
          </p>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#3867F4] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2f5be0]"
            type="submit"
          >
            {isSaved ? <Check size={17} /> : null}
            {isSaved ? 'Saved' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
