import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const toneOptions = [
  { value: 'warm_friendly', label: 'Warm & friendly', detail: 'Natural, welcoming and personal.' },
  { value: 'polished_professional', label: 'Polished & professional', detail: 'Calm and considered, without corporate language.' },
  { value: 'relaxed_conversational', label: 'Relaxed & conversational', detail: 'Casual and easy-going while still thoughtful.' },
  { value: 'concise_direct', label: 'Concise & direct', detail: 'Short, clear and appreciative.' },
  { value: 'custom', label: 'Follow my examples', detail: 'Let the approved examples lead the voice.' },
]

const delayOptions = [
  { value: '0', label: 'Immediate' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours', note: 'Recommended' },
  { value: '360', label: '6 hours' },
  { value: '1440', label: '24 hours' },
  { value: 'custom', label: 'Custom' },
]

const progressByStep = [
  { sectionIndex: 1, sectionLabel: 'Your voice', position: 1, total: 6 },
  { sectionIndex: 1, sectionLabel: 'Your voice', position: 2, total: 6 },
  { sectionIndex: 1, sectionLabel: 'Your voice', position: 3, total: 6 },
  { sectionIndex: 1, sectionLabel: 'Your voice', position: 4, total: 6 },
  { sectionIndex: 1, sectionLabel: 'Your voice', position: 5, total: 6 },
  { sectionIndex: 1, sectionLabel: 'Your voice', position: 6, total: 6 },
  { sectionIndex: 2, sectionLabel: 'Your routine', position: 1, total: 2 },
  { sectionIndex: 2, sectionLabel: 'Your routine', position: 2, total: 2 },
  { sectionIndex: 3, sectionLabel: 'Ready', position: 1, total: 3 },
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

function cleanPhrases(values) {
  if (Array.isArray(values)) return values.map((value) => String(value).trim()).filter(Boolean)
  return String(values || '').split(/[\n,]/).map((value) => value.trim()).filter(Boolean)
}

function createInitialForm(settings) {
  const minutes = Number(settings?.recommendedDelayMinutes ?? 120)
  const custom = inferCustomDelay(minutes)
  const isPreset = delayOptions.some((option) => option.value === String(minutes))
  return {
    avoidedPhrases: cleanPhrases(settings?.avoidedPhrases),
    criticalExample: settings?.criticalExample || '',
    customDelayUnit: custom.unit,
    customDelayValue: custom.value,
    delayChoice: isPreset ? String(minutes) : 'custom',
    escalationWording: settings?.escalationWording || '',
    notificationEmail: settings?.notificationEmail || '',
    notificationsEnabled: settings?.notificationsEnabled !== false,
    positiveExample: settings?.positiveExample || '',
    preferredPhraseDraft: '',
    preferredPhrases: cleanPhrases(settings?.preferredPhrases),
    toneChoice: settings?.toneChoice || 'warm_friendly',
    avoidedPhraseDraft: '',
  }
}

function loadDraft(storageKey, initialSettings) {
  const fallback = { form: createInitialForm(initialSettings), restored: false, step: 0 }
  if (!storageKey || typeof window === 'undefined') return fallback
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey))
    if (parsed?.version !== 1 || !parsed.form) return fallback
    return {
      form: { ...fallback.form, ...parsed.form },
      restored: true,
      step: Math.min(8, Math.max(0, Number(parsed.step) || 0)),
    }
  } catch {
    return fallback
  }
}

function toneLabel(value) {
  return toneOptions.find((option) => option.value === value)?.label || 'Custom voice'
}

function timingLabel(form, minutes) {
  if (form.delayChoice === 'custom') {
    const unit = Number(form.customDelayValue) === 1 ? form.customDelayUnit.replace(/s$/, '') : form.customDelayUnit
    return `${form.customDelayValue} ${unit}`
  }
  return delayOptions.find((option) => option.value === String(minutes))?.label || `${minutes} minutes`
}

function PhraseEditor({ draft, error, field, inputRef, label, onChange, onDraftChange, placeholder, values }) {
  function addDraft() {
    const additions = cleanPhrases(draft)
    if (!additions.length) return values
    const next = [...values]
    additions.forEach((phrase) => {
      if (!next.some((value) => value.toLowerCase() === phrase.toLowerCase())) next.push(phrase)
    })
    onChange(next)
    onDraftChange('')
    return next
  }

  function handleKeyDown(event) {
    if (event.isComposing || !['Enter', ','].includes(event.key)) return
    event.preventDefault()
    addDraft()
  }

  return (
    <div className="ga-phrase-editor">
      <span className="sr-only" id={`${field}-label`}>{label}</span>
      <div className={`ga-chip-input ${error ? 'has-error' : ''}`}>
        {values.map((phrase, index) => (
          <span className="ga-chip" key={`${phrase}-${index}`}>
            <input
              aria-label={`Edit phrase ${index + 1}`}
              onChange={(event) => onChange(values.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
              value={phrase}
            />
            <button aria-label={`Remove ${phrase}`} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} type="button">
              <X aria-hidden="true" size={13} />
            </button>
          </span>
        ))}
        <input
          aria-describedby={error ? `${field}-error` : undefined}
          aria-invalid={Boolean(error)}
          aria-labelledby={`${field}-label`}
          className="ga-chip-draft"
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length ? 'Add another phrase' : placeholder}
          ref={inputRef}
          value={draft}
        />
        <button aria-label="Add phrase" className="ga-add-chip" disabled={!draft.trim()} onClick={addDraft} type="button">
          <Plus aria-hidden="true" size={16} />
        </button>
      </div>
      <p className="ga-inline-error" id={`${field}-error`}>{error || 'Press Enter or comma to add a phrase.'}</p>
    </div>
  )
}

export default function GoogleSetupConversationForm({
  connectionId,
  initialSettings,
  location,
  onEditBusiness,
  onProgressChange,
  onSubmit,
}) {
  const shouldReduceMotion = useReducedMotion()
  const storageKey = connectionId ? `aura-google-setup-draft:v1:${connectionId}` : ''
  const [loaded] = useState(() => loadDraft(storageKey, initialSettings))
  const [form, setForm] = useState(loaded.form)
  const [step, setStep] = useState(loaded.step)
  const [direction, setDirection] = useState(1)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [restored, setRestored] = useState(loaded.restored)
  const headingRef = useRef(null)
  const activeInputRef = useRef(null)
  const recommendedDelayMinutes = useMemo(
    () => form.delayChoice === 'custom'
      ? delayToMinutes(form.customDelayValue, form.customDelayUnit)
      : Number(form.delayChoice),
    [form.customDelayUnit, form.customDelayValue, form.delayChoice],
  )

  useEffect(() => {
    onProgressChange?.(progressByStep[step])
    window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
  }, [onProgressChange, step])

  useEffect(() => {
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ form, savedAt: new Date().toISOString(), step, version: 1 }))
    } catch {
      // Setup remains usable when browser storage is unavailable.
    }
  }, [form, step, storageKey])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setFormError('')
  }

  function goTo(nextStep) {
    setDirection(nextStep > step ? 1 : -1)
    setError('')
    setFormError('')
    setStep(nextStep)
  }

  function startAgain() {
    const next = createInitialForm(initialSettings)
    setForm(next)
    setStep(0)
    setDirection(-1)
    setError('')
    setRestored(false)
    try {
      if (storageKey) window.localStorage.removeItem(storageKey)
    } catch {
      // The in-memory form is still reset.
    }
  }

  function validateCurrent(candidate = form) {
    let message = ''
    if (step === 1 && !candidate.preferredPhrases.some((value) => value.trim())) message = 'Add at least one phrase AURA may use.'
    if (step === 2 && !candidate.avoidedPhrases.some((value) => value.trim())) message = 'Add at least one phrase AURA should avoid.'
    if (step === 3 && !candidate.positiveExample.trim()) message = 'Add one positive-review reply you would happily publish.'
    if (step === 4 && !candidate.criticalExample.trim()) message = 'Add one critical-review reply you would happily publish.'
    if (step === 6 && (!Number.isInteger(recommendedDelayMinutes) || recommendedDelayMinutes < 0 || recommendedDelayMinutes > 10080)) {
      message = 'Choose a waiting period no longer than seven days.'
    }
    if (step === 7 && candidate.notificationsEnabled && !/^\S+@\S+\.\S+$/.test(candidate.notificationEmail.trim())) {
      message = 'Enter the email address that should receive draft alerts.'
    }
    setError(message)
    if (message) window.requestAnimationFrame(() => activeInputRef.current?.focus())
    return !message
  }

  function continueStep() {
    let candidate = form
    if (step === 1 && form.preferredPhraseDraft.trim()) {
      candidate = {
        ...form,
        preferredPhraseDraft: '',
        preferredPhrases: [...form.preferredPhrases, form.preferredPhraseDraft.trim()],
      }
      setForm(candidate)
    }
    if (step === 2 && form.avoidedPhraseDraft.trim()) {
      candidate = {
        ...form,
        avoidedPhraseDraft: '',
        avoidedPhrases: [...form.avoidedPhrases, form.avoidedPhraseDraft.trim()],
      }
      setForm(candidate)
    }
    if (!validateCurrent(candidate)) return
    goTo(Math.min(8, step + 1))
  }

  async function submitSetup() {
    setIsSubmitting(true)
    setFormError('')
    try {
      await onSubmit({
        avoidedPhrases: form.avoidedPhrases.map((value) => value.trim()).filter(Boolean),
        criticalExample: form.criticalExample.trim(),
        escalationWording: form.escalationWording.trim(),
        notificationEmail: form.notificationEmail.trim(),
        notificationsEnabled: form.notificationsEnabled,
        positiveExample: form.positiveExample.trim(),
        preferredPhrases: form.preferredPhrases.map((value) => value.trim()).filter(Boolean),
        recommendedDelayMinutes,
        toneChoice: form.toneChoice,
      })
      try {
        if (storageKey) window.localStorage.removeItem(storageKey)
      } catch {
        // The submitted settings are already saved server-side.
      }
    } catch {
      setFormError('We couldn’t save that yet. Your answers are still here.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const variants = {
    enter: (travel) => ({ opacity: 0, x: shouldReduceMotion ? 0 : travel * 34 }),
    centre: { opacity: 1, x: 0 },
    exit: (travel) => ({ opacity: 0, x: shouldReduceMotion ? 0 : travel * -24 }),
  }

  return (
    <div className="ga-conversation">
      {restored ? (
        <div className="ga-restored-draft" role="status">
          <span>We restored your unfinished setup on this device.</span>
          <button onClick={startAgain} type="button">Start again</button>
        </div>
      ) : null}

      <AnimatePresence custom={direction} initial={false} mode="wait">
        <motion.div
          animate="centre"
          className="ga-question"
          custom={direction}
          exit="exit"
          initial="enter"
          key={step}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          variants={variants}
        >
          {step === 0 ? (
            <>
              <p className="ga-kicker">Choose a starting voice</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>How should AURA sound when it replies for you?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">Choose the closest starting point. We’ll fine-tune it with your examples.</p>
              <fieldset className="ga-choice-grid ga-tone-grid">
                <legend className="sr-only">Choose AURA’s starting tone</legend>
                {toneOptions.map((option) => (
                  <label className={`ga-choice-card ${form.toneChoice === option.value ? 'is-selected' : ''}`} key={option.value}>
                    <input checked={form.toneChoice === option.value} name="toneChoice" onChange={() => update('toneChoice', option.value)} type="radio" value={option.value} />
                    <strong>{option.label}</strong>
                    <span>{option.detail}</span>
                    {form.toneChoice === option.value ? <Check aria-hidden="true" size={17} /> : null}
                  </label>
                ))}
              </fieldset>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <p className="ga-kicker">The words that feel like you</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>What sounds naturally like your business?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">Add one or more phrases you’re happy for AURA to use.</p>
              <PhraseEditor draft={form.preferredPhraseDraft} error={error} field="preferred-phrases" inputRef={activeInputRef} label="Preferred phrases" onChange={(value) => update('preferredPhrases', value)} onDraftChange={(value) => update('preferredPhraseDraft', value)} placeholder="Thanks so much" values={form.preferredPhrases} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="ga-kicker">Keep it sounding human</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>What should AURA never say?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">Add anything that feels stiff, overused or unlike you.</p>
              <PhraseEditor draft={form.avoidedPhraseDraft} error={error} field="avoided-phrases" inputRef={activeInputRef} label="Avoided phrases" onChange={(value) => update('avoidedPhrases', value)} onDraftChange={(value) => update('avoidedPhraseDraft', value)} placeholder="Valued customer" values={form.avoidedPhrases} />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className="ga-kicker">A great review</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>How would you reply to a great review?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">Paste a reply you’ve used before, or write one you would happily publish.</p>
              <label className="ga-field" htmlFor="positive-example">
                <span className="sr-only">Positive review reply example</span>
                <textarea aria-describedby="positive-example-note positive-example-error" aria-invalid={Boolean(error)} id="positive-example" onChange={(event) => update('positiveExample', event.target.value)} ref={activeInputRef} rows="6" value={form.positiveExample} />
                <small id="positive-example-note">Your examples teach AURA more than the tone choice.</small>
                <span className="ga-inline-error" id="positive-example-error">{error}</span>
              </label>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <p className="ga-kicker">When something went wrong</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>How would you reply when something went wrong?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">Show AURA how you stay calm, helpful and human without making promises.</p>
              <label className="ga-field" htmlFor="critical-example">
                <span className="sr-only">Critical review reply example</span>
                <textarea aria-describedby="critical-example-error" aria-invalid={Boolean(error)} id="critical-example" onChange={(event) => update('criticalExample', event.target.value)} ref={activeInputRef} rows="6" value={form.criticalExample} />
                <span className="ga-inline-error" id="critical-example-error">{error}</span>
              </label>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <p className="ga-kicker">Optional escalation wording</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>If a review needs taking offline, what should AURA say?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">Only add contact wording you’re comfortable publishing publicly.</p>
              <label className="ga-field" htmlFor="escalation-wording">
                <span className="sr-only">Optional public contact wording</span>
                <textarea id="escalation-wording" onChange={(event) => update('escalationWording', event.target.value)} ref={activeInputRef} rows="5" value={form.escalationWording} />
              </label>
            </>
          ) : null}

          {step === 6 ? (
            <>
              <p className="ga-kicker">A sensible rhythm</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>How long should AURA usually wait before suggesting it’s time to publish?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">The draft appears straight away. This is guidance only—you can publish earlier.</p>
              <fieldset className="ga-choice-grid ga-delay-grid">
                <legend className="sr-only">Choose a recommended waiting period</legend>
                {delayOptions.map((option) => (
                  <label className={`ga-choice-card ga-delay-card ${form.delayChoice === option.value ? 'is-selected' : ''}`} key={option.value}>
                    <input checked={form.delayChoice === option.value} name="delayChoice" onChange={() => update('delayChoice', option.value)} type="radio" />
                    <strong>{option.label}</strong>
                    {option.note ? <span>{option.note}</span> : null}
                    {form.delayChoice === option.value ? <Check aria-hidden="true" size={17} /> : null}
                  </label>
                ))}
              </fieldset>
              {form.delayChoice === 'custom' ? (
                <div className="ga-custom-delay">
                  <label htmlFor="custom-delay-value"><span className="sr-only">Custom waiting period</span><input aria-describedby="custom-delay-error" aria-invalid={Boolean(error)} id="custom-delay-value" min="1" onChange={(event) => update('customDelayValue', event.target.value)} ref={activeInputRef} type="number" value={form.customDelayValue} /></label>
                  <label htmlFor="custom-delay-unit"><span className="sr-only">Custom waiting period unit</span><select id="custom-delay-unit" onChange={(event) => update('customDelayUnit', event.target.value)} value={form.customDelayUnit}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></label>
                  <span className="ga-inline-error" id="custom-delay-error">{error}</span>
                </div>
              ) : null}
            </>
          ) : null}

          {step === 7 ? (
            <>
              <p className="ga-kicker">Draft alerts</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>Where should we tell you a new draft is ready?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">Past reviews won’t trigger emails.</p>
              <fieldset className="ga-choice-grid ga-notification-grid">
                <legend className="sr-only">Choose whether to receive draft emails</legend>
                <label className={`ga-choice-card ${form.notificationsEnabled ? 'is-selected' : ''}`}>
                  <input checked={form.notificationsEnabled} name="notifications" onChange={() => update('notificationsEnabled', true)} type="radio" />
                  <strong>Email me</strong>
                  <span>Send a concise alert when a new draft is ready.</span>
                  {form.notificationsEnabled ? <Check aria-hidden="true" size={17} /> : null}
                </label>
                <label className={`ga-choice-card ${!form.notificationsEnabled ? 'is-selected' : ''}`}>
                  <input checked={!form.notificationsEnabled} name="notifications" onChange={() => update('notificationsEnabled', false)} type="radio" />
                  <strong>Don’t send emails</strong>
                  <span>New drafts will wait in your dashboard.</span>
                  {!form.notificationsEnabled ? <Check aria-hidden="true" size={17} /> : null}
                </label>
              </fieldset>
              {form.notificationsEnabled ? (
                <label className="ga-field ga-email-field" htmlFor="notification-email">
                  <span>Email address</span>
                  <input aria-describedby="notification-email-error" aria-invalid={Boolean(error)} autoComplete="email" id="notification-email" onChange={(event) => update('notificationEmail', event.target.value)} ref={activeInputRef} type="email" value={form.notificationEmail} />
                  <span className="ga-inline-error" id="notification-email-error">{error}</span>
                </label>
              ) : null}
            </>
          ) : null}

          {step === 8 ? (
            <>
              <p className="ga-kicker">One last check</p>
              <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>Everything look right?<span aria-hidden="true" className="ga-question-cursor" /></h1>
              <p className="ga-lead">Check your business, voice and routine before we import your reviews.</p>
              <div className="ga-summary-grid">
                <article className="ga-summary-card">
                  <div><span>Business</span><strong>{location?.locationTitle || 'Selected business'}</strong><small>{location?.locationAddress || 'Google Business Profile'}</small></div>
                  <button onClick={onEditBusiness} type="button"><Pencil aria-hidden="true" size={14} /> Edit</button>
                </article>
                <article className="ga-summary-card">
                  <div><span>Voice</span><strong>{toneLabel(form.toneChoice)}</strong><small>{form.preferredPhrases.length} preferred · {form.avoidedPhrases.length} avoided</small></div>
                  <button onClick={() => goTo(0)} type="button"><Pencil aria-hidden="true" size={14} /> Edit</button>
                </article>
                <article className="ga-summary-card">
                  <div><span>Routine</span><strong>{timingLabel(form, recommendedDelayMinutes)}</strong><small>{form.notificationsEnabled ? `Alerts to ${form.notificationEmail}` : 'No email alerts'}</small></div>
                  <button onClick={() => goTo(6)} type="button"><Pencil aria-hidden="true" size={14} /> Edit</button>
                </article>
              </div>
              <p className="ga-never-publish"><Check aria-hidden="true" size={17} /> AURA will never publish a reply without you.</p>
              {formError ? <p className="ga-form-error" role="alert">{formError}</p> : null}
            </>
          ) : null}

          <div className="ga-step-footer">
            <button className="ga-back-button" disabled={step === 0 || isSubmitting} onClick={() => goTo(Math.max(0, step - 1))} type="button">
              <ArrowLeft aria-hidden="true" size={16} /> Back
            </button>
            <span>Saved on this device</span>
            {step === 5 && !form.escalationWording.trim() ? (
              <button className="ga-quiet-button" onClick={continueStep} type="button">Skip for now</button>
            ) : null}
            {step < 8 ? (
              <button className="ga-primary" onClick={continueStep} type="button">Continue <ArrowRight aria-hidden="true" size={16} /></button>
            ) : (
              <button className="ga-primary" disabled={isSubmitting} onClick={submitSetup} type="button">
                {isSubmitting ? 'Saving…' : 'Import my reviews'} {!isSubmitting ? <ArrowRight aria-hidden="true" size={16} /> : null}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
