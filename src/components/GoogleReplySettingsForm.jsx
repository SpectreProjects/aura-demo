import { Bell, Check, Clock3, MessageSquareText } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

const toneOptions = [
  { value: 'warm_friendly', label: 'Warm & friendly', detail: 'Natural, welcoming and personal.' },
  { value: 'polished_professional', label: 'Polished & professional', detail: 'Calm and considered, without corporate language.' },
  { value: 'relaxed_conversational', label: 'Relaxed & conversational', detail: 'Casual and easy-going while still thoughtful.' },
  { value: 'concise_direct', label: 'Concise & direct', detail: 'Short, clear and appreciative.' },
  { value: 'custom', label: 'Follow my examples', detail: 'Let the approved examples lead the voice.' },
]

const delayOptions = [
  { value: 0, label: 'Immediate' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 360, label: '6 hours' },
  { value: 1440, label: '24 hours' },
]

function inferCustomDelay(minutes) {
  if (minutes > 0 && minutes % 1440 === 0) return { unit: 'days', value: minutes / 1440 }
  if (minutes > 0 && minutes % 60 === 0) return { unit: 'hours', value: minutes / 60 }
  return { unit: 'minutes', value: Math.max(1, minutes || 30) }
}

function delayToMinutes(value, unit) {
  const multipliers = { days: 1440, hours: 60, minutes: 1 }
  return Math.round(Number(value) * (multipliers[unit] || 1))
}

function initialForm(settings) {
  const minutes = Number(settings?.recommendedDelayMinutes ?? 120)
  const isPreset = delayOptions.some((option) => option.value === minutes)
  const custom = inferCustomDelay(minutes)
  return {
    avoidedPhrases: (settings?.avoidedPhrases || []).join('\n'),
    criticalExample: settings?.criticalExample || '',
    customDelayUnit: custom.unit,
    customDelayValue: custom.value,
    delayChoice: isPreset ? String(minutes) : 'custom',
    escalationWording: settings?.escalationWording || '',
    notificationEmail: settings?.notificationEmail || '',
    notificationsEnabled: settings?.notificationsEnabled !== false,
    positiveExample: settings?.positiveExample || '',
    preferredPhrases: (settings?.preferredPhrases || []).join('\n'),
    toneChoice: settings?.toneChoice || 'warm_friendly',
  }
}

export default function GoogleReplySettingsForm({ initialSettings, onSubmit, submitLabel = 'Save tone and timing' }) {
  const [form, setForm] = useState(() => initialForm(initialSettings))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const criticalExampleRef = useRef(null)
  const customDelayValueRef = useRef(null)
  const notificationEmailRef = useRef(null)
  const avoidedPhrasesRef = useRef(null)
  const positiveExampleRef = useRef(null)
  const preferredPhrasesRef = useRef(null)
  const recommendedDelayMinutes = useMemo(
    () => form.delayChoice === 'custom'
      ? delayToMinutes(form.customDelayValue, form.customDelayUnit)
      : Number(form.delayChoice),
    [form.customDelayUnit, form.customDelayValue, form.delayChoice],
  )

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setFormError('')
  }

  function validate() {
    const next = {}
    if (!form.preferredPhrases.trim()) next.preferredPhrases = 'Add at least one phrase AURA may use.'
    if (!form.avoidedPhrases.trim()) next.avoidedPhrases = 'Add at least one phrase AURA should avoid.'
    if (!form.positiveExample.trim()) next.positiveExample = 'Add one positive-review reply you would approve.'
    if (!form.criticalExample.trim()) next.criticalExample = 'Add one critical-review reply you would approve.'
    if (!Number.isInteger(recommendedDelayMinutes) || recommendedDelayMinutes < 0 || recommendedDelayMinutes > 10080) {
      next.customDelayValue = 'Choose a delay no longer than seven days.'
    }
    if (form.notificationsEnabled && !/^\S+@\S+\.\S+$/.test(form.notificationEmail.trim())) {
      next.notificationEmail = 'Enter the email address that should receive draft alerts.'
    }
    setErrors(next)
    const first = ['preferredPhrases', 'avoidedPhrases', 'positiveExample', 'criticalExample', 'customDelayValue', 'notificationEmail'].find((field) => next[field])
    const fieldRefs = {
      avoidedPhrases: avoidedPhrasesRef,
      criticalExample: criticalExampleRef,
      customDelayValue: customDelayValueRef,
      notificationEmail: notificationEmailRef,
      positiveExample: positiveExampleRef,
      preferredPhrases: preferredPhrasesRef,
    }
    fieldRefs[first]?.current?.focus()
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    setFormError('')
    try {
      await onSubmit({
        avoidedPhrases: form.avoidedPhrases,
        criticalExample: form.criticalExample,
        escalationWording: form.escalationWording,
        notificationEmail: form.notificationEmail,
        notificationsEnabled: form.notificationsEnabled,
        positiveExample: form.positiveExample,
        preferredPhrases: form.preferredPhrases,
        recommendedDelayMinutes,
        toneChoice: form.toneChoice,
      })
    } catch (error) {
      if (error.fields) setErrors(error.fields)
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit}>
      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-lg font-semibold text-white">
          <MessageSquareText aria-hidden="true" className="text-[#d18a62]" size={19} />
          How should AURA sound?
        </legend>
        <p className="text-sm leading-6 text-slate-400">Choose a starting voice. Your approved examples carry the most weight.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {toneOptions.map((option) => (
            <label className={`cursor-pointer rounded-xl border p-4 transition ${form.toneChoice === option.value ? 'border-[#d18a62]/70 bg-[#d18a62]/10' : 'border-white/10 bg-white/[0.035] hover:border-white/20'}`} key={option.value}>
              <input
                checked={form.toneChoice === option.value}
                className="sr-only"
                name="toneChoice"
                onChange={() => update('toneChoice', option.value)}
                type="radio"
                value={option.value}
              />
              <span className="block font-semibold text-white">{option.label}</span>
              <span className="mt-1 block text-sm leading-5 text-slate-400">{option.detail}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block" htmlFor="google-preferred-phrases">
          <span className="text-sm font-semibold text-white">Phrases you like</span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">One per line or separated by commas.</span>
          <textarea
            aria-describedby={errors.preferredPhrases ? 'google-preferred-phrases-error' : undefined}
            aria-invalid={Boolean(errors.preferredPhrases)}
            className="mt-2 min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
            id="google-preferred-phrases"
            onChange={(event) => update('preferredPhrases', event.target.value)}
            placeholder="Thanks so much\nWe really appreciate it"
            ref={preferredPhrasesRef}
            required
            value={form.preferredPhrases}
          />
          <span className="mt-1 block min-h-5 text-xs font-semibold text-rose-300" id="google-preferred-phrases-error">{errors.preferredPhrases || ''}</span>
        </label>
        <label className="block" htmlFor="google-avoided-phrases">
          <span className="text-sm font-semibold text-white">Phrases to avoid</span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">Include anything that feels corporate or unlike you.</span>
          <textarea
            aria-describedby={errors.avoidedPhrases ? 'google-avoided-phrases-error' : undefined}
            aria-invalid={Boolean(errors.avoidedPhrases)}
            className="mt-2 min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
            id="google-avoided-phrases"
            onChange={(event) => update('avoidedPhrases', event.target.value)}
            placeholder="Valued customer\nWe strive for excellence"
            ref={avoidedPhrasesRef}
            required
            value={form.avoidedPhrases}
          />
          <span className="mt-1 block min-h-5 text-xs font-semibold text-rose-300" id="google-avoided-phrases-error">{errors.avoidedPhrases || ''}</span>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block" htmlFor="google-positive-example">
          <span className="text-sm font-semibold text-white">Approved positive-review example</span>
          <textarea
            aria-describedby={errors.positiveExample ? 'google-positive-example-error' : undefined}
            aria-invalid={Boolean(errors.positiveExample)}
            className="mt-2 min-h-36 w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-white outline-none focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
            id="google-positive-example"
            onChange={(event) => update('positiveExample', event.target.value)}
            ref={positiveExampleRef}
            required
            value={form.positiveExample}
          />
          <span className="mt-1 block min-h-5 text-xs font-semibold text-rose-300" id="google-positive-example-error">{errors.positiveExample || ''}</span>
        </label>
        <label className="block" htmlFor="google-critical-example">
          <span className="text-sm font-semibold text-white">Approved critical-review example</span>
          <textarea
            aria-describedby={errors.criticalExample ? 'google-critical-example-error' : undefined}
            aria-invalid={Boolean(errors.criticalExample)}
            className="mt-2 min-h-36 w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-white outline-none focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
            id="google-critical-example"
            onChange={(event) => update('criticalExample', event.target.value)}
            ref={criticalExampleRef}
            required
            value={form.criticalExample}
          />
          <span className="mt-1 block min-h-5 text-xs font-semibold text-rose-300" id="google-critical-example-error">{errors.criticalExample || ''}</span>
        </label>
      </div>

      <label className="block" htmlFor="google-escalation-wording">
        <span className="text-sm font-semibold text-white">Optional wording for a serious concern</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">Only add contact or escalation wording you are comfortable using publicly.</span>
        <textarea
          className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-white outline-none focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
          id="google-escalation-wording"
          onChange={(event) => update('escalationWording', event.target.value)}
          value={form.escalationWording}
        />
      </label>

      <fieldset className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5">
        <legend className="flex items-center gap-2 px-1 text-lg font-semibold text-white">
          <Clock3 aria-hidden="true" className="text-[#d18a62]" size={19} /> Recommended publish time
        </legend>
        <p className="text-sm leading-6 text-slate-400">AURA makes the draft immediately. This is guidance only — you can publish earlier whenever you are happy.</p>
        <div className="flex flex-wrap gap-2">
          {delayOptions.map((option) => (
            <label className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition ${form.delayChoice === String(option.value) ? 'border-[#d18a62]/70 bg-[#d18a62]/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/20'}`} key={option.value}>
              <input
                checked={form.delayChoice === String(option.value)}
                className="sr-only"
                name="delayChoice"
                onChange={() => update('delayChoice', String(option.value))}
                type="radio"
              />
              {option.label}
            </label>
          ))}
          <label className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition ${form.delayChoice === 'custom' ? 'border-[#d18a62]/70 bg-[#d18a62]/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/20'}`}>
            <input checked={form.delayChoice === 'custom'} className="sr-only" name="delayChoice" onChange={() => update('delayChoice', 'custom')} type="radio" />
            Custom
          </label>
        </div>
        {form.delayChoice === 'custom' ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <label htmlFor="google-custom-delay">
              <span className="sr-only">Custom delay amount</span>
              <input
                aria-describedby={errors.customDelayValue ? 'google-custom-delay-error' : undefined}
                aria-invalid={Boolean(errors.customDelayValue)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-white outline-none focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
                id="google-custom-delay"
                min="1"
                onChange={(event) => update('customDelayValue', event.target.value)}
                ref={customDelayValueRef}
                type="number"
                value={form.customDelayValue}
              />
            </label>
            <label htmlFor="google-custom-delay-unit">
              <span className="sr-only">Custom delay unit</span>
              <select
                className="h-12 w-full rounded-xl border border-white/10 bg-[#171419] px-4 text-white outline-none focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
                id="google-custom-delay-unit"
                onChange={(event) => update('customDelayUnit', event.target.value)}
                value={form.customDelayUnit}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </label>
            <span className="min-h-5 text-xs font-semibold text-rose-300 sm:col-span-2" id="google-custom-delay-error">{errors.customDelayValue || ''}</span>
          </div>
        ) : null}
      </fieldset>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            checked={form.notificationsEnabled}
            className="mt-1 h-4 w-4 accent-[#d18a62]"
            onChange={(event) => update('notificationsEnabled', event.target.checked)}
            type="checkbox"
          />
          <span>
            <span className="flex items-center gap-2 font-semibold text-white"><Bell aria-hidden="true" size={17} /> Email me when each new draft is ready</span>
            <span className="mt-1 block text-sm leading-6 text-slate-400">Historical imports do not send emails.</span>
          </span>
        </label>
        {form.notificationsEnabled ? (
          <label className="mt-4 block" htmlFor="google-notification-email">
            <span className="text-sm font-semibold text-white">Notification email</span>
            <input
              aria-describedby={errors.notificationEmail ? 'google-notification-email-error' : undefined}
              aria-invalid={Boolean(errors.notificationEmail)}
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-white outline-none focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
              id="google-notification-email"
              onChange={(event) => update('notificationEmail', event.target.value)}
              ref={notificationEmailRef}
              required
              type="email"
              value={form.notificationEmail}
            />
            <span className="mt-1 block min-h-5 text-xs font-semibold text-rose-300" id="google-notification-email-error">{errors.notificationEmail || ''}</span>
          </label>
        ) : null}
      </div>

      <div aria-live="polite" className="min-h-6">
        {formError ? <p className="text-sm font-semibold text-rose-300" role="alert">{formError}</p> : null}
      </div>

      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a96847] px-6 text-sm font-bold text-white transition hover:bg-[#bd7652] disabled:cursor-wait disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Saving…' : <><Check aria-hidden="true" size={17} /> {submitLabel}</>}
      </button>
    </form>
  )
}
