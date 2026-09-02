import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronLeft, Minus, Plus, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function firstNameOf(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'this staff member'
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

export default function PointsModal({ onClose, onSave, person }) {
  const reduceMotion = useReducedMotion()
  const [amount, setAmount] = useState(5)
  const [direction, setDirection] = useState(1)
  const [error, setError] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [operation, setOperation] = useState('add')
  const [reason, setReason] = useState('')
  const [savedAdjustment, setSavedAdjustment] = useState(null)
  const [step, setStep] = useState(0)
  const inputRef = useRef(null)

  const firstName = firstNameOf(person.name)
  const actionWord = operation === 'add' ? 'add to' : 'remove from'
  const activeQuestion = [
    'What would you like to do?',
    `How many points would you like to ${actionWord} ${firstName}?`,
    `Why are you ${operation === 'add' ? 'adding' : 'removing'} these points?`,
  ][step]

  useEffect(() => {
    if (step === 0 || isComplete) return undefined
    const focusDelay = window.setTimeout(() => inputRef.current?.focus(), reduceMotion ? 0 : 850)
    return () => window.clearTimeout(focusDelay)
  }, [isComplete, reduceMotion, step])

  function chooseOperation(nextOperation) {
    setDirection(1)
    setOperation(nextOperation)
    setStep(1)
  }

  function goBack() {
    setDirection(-1)
    setError('')
    setStep((current) => Math.max(0, current - 1))
  }

  function resetAdjustment() {
    setAmount(5)
    setDirection(1)
    setError('')
    setIsComplete(false)
    setOperation('add')
    setReason('')
    setSavedAdjustment(null)
    setStep(0)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (step === 1) {
      const numericAmount = Math.abs(Number(amount))
      if (!Number.isFinite(numericAmount) || numericAmount < 1) {
        setError('Enter at least 1 point to continue.')
        return
      }
      setDirection(1)
      setStep(2)
      return
    }

    if (!reason.trim()) {
      setError('Add a reason for this adjustment.')
      return
    }

    const numericAmount = Math.abs(Number(amount))
    setIsSaving(true)
    try {
      await onSave({
        amount: operation === 'remove' ? -numericAmount : numericAmount,
        reason: reason.trim(),
        staffId: person.id,
      })
      setSavedAdjustment({ amount: numericAmount, operation })
      setIsComplete(true)
    } catch {
      setError('The points could not be updated. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const motionDistance = reduceMotion ? 0 : direction * 72

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17201e]/55 px-4 py-8 backdrop-blur-md">
      <form
        aria-label={`Manage ${person.name}'s points`}
        className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/60 bg-[#edf5f2] text-[#17201e] shadow-[0_34px_140px_rgba(23,32,30,0.28)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b border-[#17201e]/10 px-6 py-5 sm:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#61736e]">Private manager action</p>
            <p className="mt-1 text-sm font-semibold text-[#263632]">Manage {person.name}&apos;s points</p>
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

        {isComplete ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[460px] flex-col justify-center px-6 py-10 sm:px-8"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div aria-live="polite">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3867F4] text-white shadow-[0_12px_34px_rgba(56,103,244,0.24)]">
                <Check size={26} strokeWidth={2.5} />
              </span>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[0.2em] text-[#61736e]">Points updated</p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#17201e] sm:text-4xl">
                All set, {savedAdjustment.amount} {savedAdjustment.amount === 1 ? 'point has' : 'points have'} been{' '}
                {savedAdjustment.operation === 'add' ? 'added to' : 'removed from'} {firstName}&apos;s balance.
              </h2>
              <p className="mt-4 text-sm font-medium leading-6 text-[#61736e]">The reason has been saved in their private points history.</p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#3867F4] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2f5be0]"
                onClick={resetAdjustment}
                type="button"
              >
                <SlidersHorizontal size={18} />
                Adjust more points
              </button>
              <button
                className="h-14 rounded-2xl border border-[#17201e]/12 bg-white/45 px-6 text-sm font-black text-[#33433f] transition hover:bg-white/80"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 border-b border-[#17201e]/8 bg-white/20 px-6 py-4 sm:px-8">
              {[
                ['This month', person.monthly_points],
                ['Lifetime', person.lifetime_points],
                ['Private balance', person.redeemable_points],
              ].map(([label, value]) => (
                <div className="rounded-2xl border border-[#17201e]/10 bg-white/45 px-3 py-3 sm:px-4" key={label}>
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#71817d] sm:text-[10px]">{label}</p>
                  <p className="mt-1 text-xl font-black text-[#17201e] sm:text-2xl">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 px-6 pt-6 sm:px-8" role="progressbar" aria-label="Points adjustment progress" aria-valuemax="3" aria-valuemin="1" aria-valuenow={step + 1}>
              {[0, 1, 2].map((index) => (
                <span className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${index <= step ? 'bg-[#3867F4]' : 'bg-[#cbd9d5]'}`} key={index} />
              ))}
            </div>

            <div className="px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
              <div className="relative min-h-[250px] overflow-hidden sm:min-h-[270px]">
                <AnimatePresence initial={false} mode="wait" custom={direction}>
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute inset-0 flex flex-col"
                    exit={{ opacity: 0, x: -motionDistance }}
                    initial={{ opacity: 0, x: motionDistance }}
                    key={`${step}-${activeQuestion}`}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TypewriterQuestion text={activeQuestion} />

                    <div className="mt-auto pt-8">
                      {step === 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            className="group flex min-h-24 items-center gap-4 rounded-2xl border border-[#3867F4]/25 bg-[#3867F4]/[0.06] px-5 text-left transition hover:-translate-y-0.5 hover:border-[#3867F4]/50 hover:bg-[#3867F4]/10"
                            onClick={() => chooseOperation('add')}
                            type="button"
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3867F4] text-white shadow-[0_10px_24px_rgba(56,103,244,0.2)]">
                              <Plus size={21} />
                            </span>
                            <span>
                              <span className="block text-base font-black text-[#17201e]">Add points</span>
                              <span className="mt-1 block text-xs font-semibold text-[#667873]">Recognise something positive</span>
                            </span>
                          </button>
                          <button
                            className="group flex min-h-24 items-center gap-4 rounded-2xl border border-[#17201e]/12 bg-white/45 px-5 text-left transition hover:-translate-y-0.5 hover:border-[#17201e]/25 hover:bg-white/75"
                            onClick={() => chooseOperation('remove')}
                            type="button"
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#17201e]/12 bg-white/70 text-[#42534e]">
                              <Minus size={21} />
                            </span>
                            <span>
                              <span className="block text-base font-black text-[#17201e]">Remove points</span>
                              <span className="mt-1 block text-xs font-semibold text-[#667873]">Correct their balance</span>
                            </span>
                          </button>
                        </div>
                      )}

                      {step === 1 && (
                        <input
                          aria-label="Number of points"
                          className="h-16 w-full rounded-2xl border border-[#17201e]/12 bg-white/55 px-5 text-lg font-semibold text-[#17201e] outline-none transition placeholder:text-[#80908b] focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
                          min="1"
                          onChange={(event) => setAmount(event.target.value)}
                          placeholder="Enter the number of points"
                          ref={inputRef}
                          required
                          type="number"
                          value={amount}
                        />
                      )}

                      {step === 2 && (
                        <textarea
                          aria-label="Reason for points adjustment"
                          className="min-h-28 w-full resize-none rounded-2xl border border-[#17201e]/12 bg-white/55 px-5 py-4 text-base font-semibold leading-6 text-[#17201e] outline-none transition placeholder:text-[#80908b] focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
                          onChange={(event) => setReason(event.target.value)}
                          placeholder={operation === 'add' ? 'For example, brilliant guest feedback' : 'For example, correcting a previous award'}
                          ref={inputRef}
                          required
                          value={reason}
                        />
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {error && <p aria-live="polite" className="mt-3 text-sm font-bold text-rose-600">{error}</p>}

              {step > 0 && (
                <div className="mt-5 flex items-center gap-3">
                  <button
                    aria-label="Previous question"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#17201e]/12 bg-white/35 text-[#42534e] transition hover:bg-white/70"
                    onClick={goBack}
                    type="button"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#3867F4] px-6 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2f5be0] disabled:cursor-wait disabled:opacity-65"
                    disabled={isSaving}
                    type="submit"
                  >
                    {step === 2 ? (isSaving ? 'Saving…' : operation === 'add' ? 'Add points' : 'Remove points') : 'Continue'}
                    {step === 2 ? (operation === 'add' ? <Plus size={18} /> : <Minus size={18} />) : <ArrowRight size={18} />}
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#6d7e79]">
                <span>Step {step + 1} of 3</span>
                <span>Only managers can see this</span>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
