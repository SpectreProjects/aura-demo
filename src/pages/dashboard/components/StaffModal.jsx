import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronLeft, Plus, X } from 'lucide-react'
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

export default function StaffModal({ allowAddAnother = true, categories, initialName = '', initialStaff, onAddCategory, onClose, onSave, title }) {
  const reduceMotion = useReducedMotion()
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState({
    ...initialForm,
    ...(initialStaff || {}),
    name: initialStaff?.name || initialName,
    job_category: initialStaff?.job_category || categories[0] || 'Front of House',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [savedFirstName, setSavedFirstName] = useState('')
  const [step, setStep] = useState(0)
  const inputRef = useRef(null)
  const newCategoryRef = useRef(null)

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

  function startAnotherStaffMember() {
    setDirection(1)
    setForm({
      ...initialForm,
      job_category: categories[0] || 'Front of House',
    })
    setStep(0)
    setIsComplete(false)
    setSavedFirstName('')
    setIsCreatingCategory(false)
    setNewCategory('')
    setCategoryError('')
  }

  async function addCategory() {
    const cleanName = newCategory.trim()
    if (!cleanName) {
      setCategoryError('Enter a department name first.')
      newCategoryRef.current?.focus()
      return
    }

    const existingCategory = categories.find((category) => category.toLowerCase() === cleanName.toLowerCase())
    const categoryName = existingCategory || cleanName

    setIsAddingCategory(true)
    setCategoryError('')
    try {
      if (!existingCategory) await onAddCategory(cleanName)
      updateField('job_category', categoryName)
      setNewCategory('')
      setIsCreatingCategory(false)
    } finally {
      setIsAddingCategory(false)
    }
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
      setSavedFirstName(firstName)
      setIsComplete(true)
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

        {isComplete ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[430px] flex-col justify-center px-6 py-10 sm:px-8"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div aria-live="polite">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3867F4] text-white shadow-[0_12px_34px_rgba(56,103,244,0.24)]">
                <Check size={26} strokeWidth={2.5} />
              </span>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[0.2em] text-[#61736e]">Team updated</p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#17201e] sm:text-4xl">
                {initialStaff
                  ? `All set, ${savedFirstName}'s staff details have been updated.`
                  : `All set, ${savedFirstName} has been added as a member of staff.`}
              </h2>
              <p className="mt-4 text-sm font-medium leading-6 text-[#61736e]">
                {initialStaff ? 'Their existing performance history has been preserved.' : 'Their profile is ready and active.'}
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {!initialStaff && allowAddAnother && (
                <button
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#3867F4] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2f5be0]"
                  onClick={startAnotherStaffMember}
                  type="button"
                >
                  <Plus size={18} />
                  Add another staff member
                </button>
              )}
              <button
                className={`h-14 rounded-2xl border border-[#17201e]/12 bg-white/45 px-6 text-sm font-black text-[#33433f] transition hover:bg-white/80 ${!initialStaff && allowAddAnother ? '' : 'sm:col-span-2'}`}
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="flex gap-2 px-6 pt-6 sm:px-8" role="progressbar" aria-label="Team setup progress" aria-valuemax={steps.length} aria-valuemin="1" aria-valuenow={step + 1}>
          {steps.map((item, index) => (
            <span
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${index <= step ? 'bg-[#3867F4]' : 'bg-[#cbd9d5]'}`}
              key={item.field}
            />
          ))}
        </div>

        <div className="px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className={`relative overflow-hidden ${activeStep.field === 'job_category' ? 'min-h-[315px]' : 'min-h-[245px] sm:min-h-[270px]'}`}>
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
                    <div className="space-y-3">
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

                      <AnimatePresence initial={false} mode="wait">
                        {!isCreatingCategory ? (
                          <motion.button
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#3867F4]/25 bg-[#3867F4]/5 text-sm font-black text-[#315bd8] transition hover:border-[#3867F4]/45 hover:bg-[#3867F4]/10"
                            initial={{ opacity: 0, y: 6 }}
                            key="add-category-button"
                            onClick={() => {
                              setIsCreatingCategory(true)
                              window.setTimeout(() => newCategoryRef.current?.focus(), 80)
                            }}
                            type="button"
                          >
                            <Plus size={17} />
                            Add a new department
                          </motion.button>
                        ) : (
                          <motion.div
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                            initial={{ opacity: 0, y: 6 }}
                            key="add-category-field"
                          >
                              <div className="flex gap-2">
                                <input
                                  aria-label="New department name"
                                  className="h-12 min-w-0 flex-1 rounded-2xl border border-[#17201e]/12 bg-white/55 px-4 text-sm font-semibold text-[#17201e] outline-none transition placeholder:text-[#80908b] focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
                                  onChange={(event) => {
                                    setNewCategory(event.target.value)
                                    setCategoryError('')
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      event.preventDefault()
                                      addCategory()
                                    }
                                  }}
                                  placeholder="New department name"
                                  ref={newCategoryRef}
                                  value={newCategory.trimStart()}
                                />
                                <button
                                  className="rounded-2xl bg-[#3867F4] px-5 text-sm font-black text-white transition hover:bg-[#2f5be0] disabled:cursor-wait disabled:opacity-60"
                                  disabled={isAddingCategory}
                                  onClick={addCategory}
                                  type="button"
                                >
                                  {isAddingCategory ? 'Adding…' : 'Add'}
                                </button>
                                <button
                                  aria-label="Cancel adding department"
                                  className="flex w-12 shrink-0 items-center justify-center rounded-2xl border border-[#17201e]/12 bg-white/35 text-[#61736e] transition hover:bg-white/70"
                                  onClick={() => {
                                    setIsCreatingCategory(false)
                                    setNewCategory('')
                                    setCategoryError('')
                                  }}
                                  type="button"
                                >
                                  <X size={17} />
                                </button>
                              </div>
                              {categoryError && <p className="px-1 text-xs font-bold text-[#b83e50]">{categoryError}</p>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
          </>
        )}
      </form>
    </div>
  )
}
