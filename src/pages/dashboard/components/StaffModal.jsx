import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronLeft, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const initialForm = {
  name: '',
  job_title: '',
  job_category: 'Front of House',
}

function getFirstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'this person'
}

function TypewriterQuestion({ text }) {
  const reduceMotion = useReducedMotion()
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : '')

  useEffect(() => {
    if (reduceMotion) return undefined

    let index = 0
    let timeoutId

    function typeNextCharacter() {
      index += 1
      setVisibleText(text.slice(0, index))

      if (index < text.length) {
        const character = text[index - 1]
        const pause = character === '?' ? 190 : character === ',' ? 110 : character === ' ' ? 36 : 24 + (index % 4) * 7
        timeoutId = window.setTimeout(typeNextCharacter, pause)
      }
    }

    timeoutId = window.setTimeout(typeNextCharacter, 180)
    return () => window.clearTimeout(timeoutId)
  }, [reduceMotion, text])

  const isTyping = visibleText.length < text.length

  return (
    <h2 aria-label={text} className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#17201e] sm:text-4xl">
      <span aria-hidden="true">{visibleText}</span>
      <span
        aria-hidden="true"
        className={`ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.08em] rounded-full bg-[#3867F4] ${isTyping ? 'animate-pulse' : 'opacity-0'}`}
      />
    </h2>
  )
}

export default function StaffModal({ categories, initialName = '', initialStaff, onClose, onSave, title }) {
  const reduceMotion = useReducedMotion()
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState({
    ...initialForm,
    ...(initialStaff || {}),
    name: initialStaff?.name || initialName,
    job_category: initialStaff?.job_category || categories[0] || 'Front of House',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [step, setStep] = useState(0)
  const inputRef = useRef(null)

  const firstName = getFirstName(form.name)
  const steps = useMemo(
    () => [
      { field: 'name', question: "What is the staff member's full name?" },
      { field: 'job_title', question: `What is ${firstName}'s job title?` },
      { field: 'job_category', question: `What department would you like to categorise ${firstName} in?` },
    ],
    [firstName],
  )

  useEffect(() => {
    const focusDelay = window.setTimeout(() => inputRef.current?.focus(), reduceMotion ? 0 : 850)
    return () => window.clearTimeout(focusDelay)
  }, [reduceMotion, step])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function goBack() {
    setDirection(-1)
    setStep((current) => Math.max(0, current - 1))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (step < steps.length - 1) {
      setDirection(1)
      setStep((current) => current + 1)
      return
    }

    setIsSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const activeStep = steps[step]
  const motionDistance = reduceMotion ? 0 : direction * 72

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17201e]/55 px-4 py-8 backdrop-blur-md">
      <form
        aria-label={title}
        className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/60 bg-[#edf5f2] text-[#17201e] shadow-[0_34px_140px_rgba(23,32,30,0.28)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b border-[#17201e]/10 px-6 py-5 sm:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#61736e]">Team setup</p>
            <p className="mt-1 text-sm font-semibold text-[#263632]">{title}</p>
          </div>
          <button
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#17201e]/10 bg-white/35 text-[#42534e] transition hover:bg-white/70 hover:text-[#17201e]"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex gap-2 px-6 pt-6 sm:px-8" role="progressbar" aria-label="Team setup progress" aria-valuemax={steps.length} aria-valuemin="1" aria-valuenow={step + 1}>
          {steps.map((item, index) => (
            <span
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${index <= step ? 'bg-[#3867F4]' : 'bg-[#cbd9d5]'}`}
              key={item.field}
            />
          ))}
        </div>

        <div className="px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="relative min-h-[245px] overflow-hidden sm:min-h-[270px]">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-0 flex flex-col"
                exit={{ opacity: 0, x: -motionDistance }}
                initial={{ opacity: 0, x: motionDistance }}
                key={activeStep.field}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <TypewriterQuestion text={activeStep.question} />

                <div className="mt-auto pt-8">
                  {activeStep.field === 'job_category' ? (
                    <select
                      aria-label="Department"
                      className="h-16 w-full rounded-2xl border border-[#17201e]/12 bg-white/55 px-5 text-lg font-semibold text-[#17201e] outline-none transition focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
                      onChange={(event) => updateField('job_category', event.target.value)}
                      ref={inputRef}
                      value={form.job_category}
                    >
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={activeStep.field === 'name' ? 'Full name' : 'Job title'}
                      autoComplete={activeStep.field === 'name' ? 'name' : 'organization-title'}
                      className="h-16 w-full rounded-2xl border border-[#17201e]/12 bg-white/55 px-5 text-lg font-semibold text-[#17201e] outline-none transition placeholder:text-[#80908b] focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
                      onChange={(event) => updateField(activeStep.field, event.target.value)}
                      placeholder={activeStep.field === 'name' ? 'Type their full name' : `Type ${firstName}'s job title`}
                      ref={inputRef}
                      required
                      value={form[activeStep.field]}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center gap-3">
            {step > 0 && (
              <button
                aria-label="Previous question"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#17201e]/12 bg-white/35 text-[#42534e] transition hover:bg-white/70"
                onClick={goBack}
                type="button"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <button
              className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#3867F4] px-6 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2f5be0] disabled:cursor-wait disabled:opacity-65"
              disabled={isSaving}
              type="submit"
            >
              {step === steps.length - 1 ? (isSaving ? 'Saving…' : initialStaff ? 'Save changes' : 'Complete') : 'Continue'}
              {step === steps.length - 1 ? <Check size={18} /> : <ArrowRight size={18} />}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#6d7e79]">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{initialStaff ? 'Performance history will be preserved' : 'They will be active when added'}</span>
          </div>
        </div>
      </form>
    </div>
  )
}
