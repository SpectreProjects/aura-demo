import { Check, Clock3, Power } from 'lucide-react'
import { useState } from 'react'
import { useDashboard } from './useDashboard'

export default function Settings() {
  const { actions, autoReplySettings } = useDashboard()
  const [draft, setDraft] = useState(autoReplySettings)
  const [isSaved, setIsSaved] = useState(false)

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

      <form className="max-w-3xl overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90" onSubmit={saveSettings}>
        <div className="flex items-start justify-between gap-5 border-b border-white/[0.07] p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/35 text-[#263632]">
              <Power size={20} />
            </span>
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.025em] text-white">Automatic review replies</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
                When switched on, AURA prepares and sends a natural response to every new Google review.
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
            {draft.enabled ? 'Automatic replies are on.' : 'AURA will not send replies automatically.'}
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
