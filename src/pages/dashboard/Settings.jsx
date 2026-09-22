import { Link2, MapPin, RefreshCw, ShieldCheck, Unplug } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import GoogleReplySettingsForm from '../../components/GoogleReplySettingsForm'
import { callAuraApi } from '../../lib/auraApi'
import { useDashboard } from './useDashboard'

export default function Settings() {
  const { actions } = useDashboard()
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false)

  useEffect(() => {
    document.title = 'Google settings — AURA'
    const controller = new AbortController()
    callAuraApi('/api/google-status', null, 'GET', controller.signal)
      .then(setStatus)
      .catch((error) => {
        if (error.name !== 'AbortError') setErrorMessage(error.message)
      })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [])

  async function connectGoogle() {
    setIsBusy(true)
    setErrorMessage('')
    try {
      await actions.connectGoogleProfile()
    } catch (error) {
      setErrorMessage(error.message)
      setIsBusy(false)
    }
  }

  async function syncReviews() {
    setIsBusy(true)
    setErrorMessage('')
    setMessage('')
    try {
      const result = await actions.syncGoogleReviews()
      setMessage(`${result.count} review${result.count === 1 ? '' : 's'} checked. New eligible reviews have draft jobs ready.`)
      setStatus((current) => ({
        ...current,
        connection: { ...current.connection, lastSyncedAt: result.syncedAt },
      }))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function saveSettings(values) {
    const payload = await callAuraApi('/api/google-settings', values, 'PATCH')
    setStatus((current) => ({ ...current, needsSetup: false, settings: payload.settings }))
    setMessage('Tone, timing and notification settings saved.')
  }

  async function disconnectGoogle() {
    setIsBusy(true)
    setErrorMessage('')
    try {
      await callAuraApi('/api/google-disconnect', {})
      setStatus((current) => ({ ...current, connected: false, connection: null, needsSetup: true }))
      setMessage('Google disconnected. Your imported history remains archived and separate.')
      setIsDisconnectOpen(false)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  const connection = status?.connection
  const connected = status?.connected
  const reconnectRequired = connection?.status === 'reconnect_required'

  return (
    <div className="space-y-8 pb-12">
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#b47a59]">Google settings</p>
        <h2 className="max-w-4xl text-4xl font-medium leading-[1.08] tracking-[-0.045em] text-white lg:text-[3.35rem]">
          Keep the connection clear and every reply deliberate.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
          AURA can import reviews and prepare drafts. Only an owner can publish one, after reviewing the exact saved text.
        </p>
      </section>

      <div aria-live="polite" className="min-h-0">
        {errorMessage ? <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200" role="alert">{errorMessage}</p> : null}
        {!errorMessage && message ? <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200" role="status">{message}</p> : null}
      </div>

      <section className="max-w-4xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0a0e]/95">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d18a62]/25 bg-[#a96847]/10 text-[#e4aa87]">
              <Link2 aria-hidden="true" size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold tracking-[-0.025em] text-white">Google Business Profile</h3>
                {!isLoading ? (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${connected ? 'bg-emerald-400/10 text-emerald-300' : reconnectRequired ? 'bg-amber-400/10 text-amber-200' : 'bg-white/[0.07] text-slate-400'}`}>
                    {connected ? 'Connected' : reconnectRequired ? 'Reconnect needed' : 'Not connected'}
                  </span>
                ) : null}
              </div>
              {connected ? (
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                  <p className="flex items-center gap-2 font-semibold text-slate-200"><MapPin aria-hidden="true" className="text-[#d18a62]" size={15} /> {connection.locationTitle}</p>
                  {connection.locationAddress ? <p>{connection.locationAddress}</p> : null}
                  <p>Google account: {connection.accountTitle}{connection.locationStoreCode ? ` · ${connection.locationStoreCode}` : ''}</p>
                  <p className="flex items-center gap-2 text-xs"><ShieldCheck aria-hidden="true" className="text-emerald-300" size={14} /> AURA actively uses this one location.</p>
                </div>
              ) : (
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Connect Google, approve Business Profile access and confirm the one location AURA should use.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {connected ? (
              <>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:text-white disabled:cursor-wait disabled:opacity-50" disabled={isBusy} onClick={syncReviews} type="button">
                  <RefreshCw aria-hidden="true" className={isBusy ? 'animate-spin' : ''} size={16} /> Refresh reviews
                </button>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:text-white disabled:cursor-wait disabled:opacity-50" disabled={isBusy} onClick={connectGoogle} type="button">
                  <MapPin aria-hidden="true" size={16} /> Change location
                </button>
              </>
            ) : (
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#a96847] px-4 text-sm font-bold text-white transition hover:bg-[#bd7652] disabled:cursor-wait disabled:opacity-50" disabled={isBusy || isLoading} onClick={connectGoogle} type="button">
                <Link2 aria-hidden="true" size={16} /> {reconnectRequired ? 'Reconnect Google' : 'Connect Google'}
              </button>
            )}
          </div>
        </div>

        {connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.025] px-6 py-4 sm:px-7">
            <p className="text-xs leading-5 text-slate-500">Changing location archives this connection and its reviews instead of mixing them with the next location.</p>
            <button className="inline-flex items-center gap-2 text-xs font-bold text-rose-300 transition hover:text-rose-200" onClick={() => setIsDisconnectOpen(true)} type="button"><Unplug aria-hidden="true" size={14} /> Disconnect Google</button>
          </div>
        ) : null}
      </section>

      {status?.pendingConnection ? (
        <section className="max-w-4xl rounded-2xl border border-[#d18a62]/25 bg-[#a96847]/10 p-5">
          <h3 className="font-semibold text-white">A location still needs confirming</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">Google permission was granted, but AURA will not use a business until you select it.</p>
          <Link className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#e4aa87]" to="/setup/google">Continue location setup</Link>
        </section>
      ) : null}

      {connected && status?.settings ? (
        <section className="max-w-4xl rounded-2xl border border-white/[0.08] bg-[#0b0a0e]/95 p-6 sm:p-7">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b47a59]">Draft assistant</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white">Tone, timing and notifications</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">The recommended time never prevents an early manual publish.</p>
          </div>
          <GoogleReplySettingsForm
            initialSettings={status.settings}
            key={status.settings.updatedAt || 'google-settings'}
            onSubmit={saveSettings}
            submitLabel="Save settings"
          />
        </section>
      ) : null}

      {!connected && !isLoading ? (
        <section className="max-w-4xl rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <p className="text-sm font-semibold text-slate-400">Complete the guided connection before setting a tone or importing reviews.</p>
          <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#a96847] px-5 text-sm font-bold text-white" to="/setup/google">Open guided setup</Link>
        </section>
      ) : null}

      <ConfirmDialog
        confirmLabel="Disconnect Google"
        errorMessage={errorMessage}
        isBusy={isBusy}
        isOpen={isDisconnectOpen}
        onClose={() => setIsDisconnectOpen(false)}
        onConfirm={disconnectGoogle}
        title={`Disconnect ${connection?.locationTitle || 'Google Business Profile'}?`}
        tone="danger"
      >
        <p>AURA will stop checking this location. The connection and imported review history remain archived and separate, and you can reconnect later.</p>
      </ConfirmDialog>
    </div>
  )
}
