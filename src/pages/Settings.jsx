import { RefreshCw, Save, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

export default function Settings({ settings, setSettings }) {
  const [draft, setDraft] = useState({
    ...settings,
    staffNamesText: settings.staffNames.join(', '),
  })
  const [googleResponse, setGoogleResponse] = useState('')
  const [googleError, setGoogleError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const staffNames = useMemo(
    () =>
      draft.staffNamesText
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    [draft.staffNamesText],
  )

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function saveSettings(event) {
    event.preventDefault()
    setSettings({
      businessName: draft.businessName.trim() || 'Hilton Glasgow Demo',
      replyTone: draft.replyTone,
      autoReply: draft.autoReply,
      negativeApprovalRequired: draft.negativeApprovalRequired,
      staffNames,
    })
  }

  function resetDraft() {
    setDraft({
      ...settings,
      staffNamesText: settings.staffNames.join(', '),
    })
  }

  async function callGoogleFunction(endpoint) {
    setIsGoogleLoading(true)
    setGoogleError('')
    setGoogleResponse('')

    try {
      const response = await fetch(endpoint)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Request failed with ${response.status}`)
      }

      setGoogleResponse(data.message || JSON.stringify(data))
    } catch (error) {
      console.error('[Google Business Profile] Function call failed:', error)
      setGoogleError(error.message)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <form className="aura-card p-5 sm:p-6" onSubmit={saveSettings}>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Workspace settings</h2>
            <p className="mt-1 text-sm text-slate-500">Stored locally and ready to swap for Supabase later.</p>
          </div>
          <div className="flex gap-2">
            <button className="aura-button-secondary" type="button" onClick={resetDraft}>
              <X size={17} />
              Reset
            </button>
            <button className="aura-button" type="submit">
              <Save size={17} />
              Save
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Business name</span>
            <input
              className="aura-input"
              value={draft.businessName}
              onChange={(event) => updateField('businessName', event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Reply tone</span>
            <select
              className="aura-input"
              value={draft.replyTone}
              onChange={(event) => updateField('replyTone', event.target.value)}
            >
              <option>Warm and professional</option>
              <option>Friendly and concise</option>
              <option>Formal and reassuring</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <span>
              <span className="block text-sm font-bold text-slate-800">Auto-reply toggle</span>
              <span className="block text-sm text-slate-500">Marks positive replies as ready</span>
            </span>
            <input
              checked={draft.autoReply}
              className="h-5 w-5 accent-slate-950"
              type="checkbox"
              onChange={(event) => updateField('autoReply', event.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <span>
              <span className="block text-sm font-bold text-slate-800">Negative approval required</span>
              <span className="block text-sm text-slate-500">Keeps 1-2 star replies manual</span>
            </span>
            <input
              checked={draft.negativeApprovalRequired}
              className="h-5 w-5 accent-slate-950"
              type="checkbox"
              onChange={(event) => updateField('negativeApprovalRequired', event.target.checked)}
            />
          </label>
        </div>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-bold text-slate-700">Staff names list</span>
          <textarea
            className="aura-input min-h-28 resize-none"
            value={draft.staffNamesText}
            onChange={(event) => updateField('staffNamesText', event.target.value)}
          />
        </label>
        </form>

        <section className="aura-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Google Business Profile</h2>
              <p className="mt-1 text-sm text-slate-500">
                Connect directly to Google Business Profile for future review syncing.
              </p>
              <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                Status: Not connected
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="aura-button-secondary"
                disabled={isGoogleLoading}
                type="button"
                onClick={() => callGoogleFunction('/.netlify/functions/google-auth-start')}
              >
                <Search size={17} />
                Connect Google Business Profile
              </button>
              <button
                className="aura-button"
                disabled={isGoogleLoading}
                type="button"
                onClick={() => callGoogleFunction('/.netlify/functions/sync-google-reviews')}
              >
                <RefreshCw size={17} />
                Sync Reviews
              </button>
            </div>
          </div>
          {googleResponse && (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {googleResponse}
            </p>
          )}
          {googleError && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {googleError}
            </p>
          )}
        </section>
      </div>

      <aside className="aura-card h-fit p-5">
        <h2 className="text-lg font-bold text-slate-950">Recognition roster</h2>
        <p className="mt-1 text-sm text-slate-500">Names detected in review text.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {staffNames.map((name) => (
            <span key={name} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
              {name}
            </span>
          ))}
        </div>
      </aside>
    </div>
  )
}
