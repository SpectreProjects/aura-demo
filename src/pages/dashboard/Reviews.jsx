import { AlertTriangle, Check, CheckCircle2, Clock3, ExternalLink, LoaderCircle, MapPin, Pencil, Plus, RefreshCw, RotateCcw, Save, Search, Send, Sparkles, Star, UserPlus, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import TypewriterIntro from '../../components/TypewriterIntro'
import { getReviewRecognitionSuggestions } from '../../utils/mvpRecognition'
import StaffModal from './components/StaffModal'
import { useDashboard } from './useDashboard'

function formatReviewDate(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Recently'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function stars(rating) {
  return Array.from({ length: 5 }, (_, index) => index < Number(rating || 0))
}

function draftText(review) {
  return String(review.draft?.editedText || review.draft?.generatedText || '').trim()
}

function getReplyStatus(review) {
  if (review.source === 'google_places') {
    return {
      detail: 'This public Google preview is not part of the connected Business Profile history.',
      label: 'Google review preview',
      type: 'preview',
    }
  }

  if (review.source === 'google_business') {
    if (review.draft?.status === 'published') {
      return {
        detail: 'Google confirmed this owner-approved reply.',
        label: 'Replied on Google',
        type: 'published',
      }
    }
    if (review.aura_reply) {
      return {
        detail: 'An owner reply already exists on Google, so AURA will not prepare another draft.',
        label: 'Already replied on Google',
        type: 'published',
      }
    }
    if (review.draft?.status === 'failed') {
      return {
        detail: 'The review is safe in AURA. Draft generation can be retried without publishing anything.',
        label: 'Draft needs retry',
        type: 'failed',
      }
    }
    if (review.draft?.status === 'generating' || (review.draft_eligible && !review.draft)) {
      return {
        detail: 'AURA is preparing a draft. The review remains visible even if generation takes longer.',
        label: 'Generating draft',
        type: 'generating',
      }
    }
    if (review.draft && draftText(review)) {
      return {
        detail: 'Review or edit the saved draft, then choose whether to publish it.',
        label: review.draft.status === 'edited' ? 'Edited draft ready' : 'Draft ready',
        type: 'ready',
      }
    }
    return {
      detail: 'This review was imported as history. AURA only creates drafts for reviews received after connection.',
      label: 'Historical review',
      type: 'historical',
    }
  }

  return {
    detail: 'This sample review cannot publish to Google.',
    label: 'AURA sample',
    type: 'preview',
  }
}

const statusStyles = {
  failed: {
    icon: AlertTriangle,
    panel: 'border-rose-400/20 bg-rose-500/[0.08]',
    text: 'text-rose-200',
  },
  generating: {
    icon: LoaderCircle,
    panel: 'border-[#d18a62]/25 bg-[#a96847]/[0.09]',
    text: 'text-[#e4aa87]',
  },
  historical: {
    icon: Clock3,
    panel: 'border-white/10 bg-white/[0.035]',
    text: 'text-slate-400',
  },
  preview: {
    icon: MapPin,
    panel: 'border-white/10 bg-white/[0.035]',
    text: 'text-slate-400',
  },
  ready: {
    icon: Clock3,
    panel: 'border-[#d18a62]/25 bg-[#a96847]/[0.09]',
    text: 'text-[#e4aa87]',
  },
  published: {
    icon: CheckCircle2,
    panel: 'border-emerald-400/20 bg-emerald-500/[0.08]',
    text: 'text-emerald-200',
  },
}

function visualGoogleReview(mode) {
  if (!mode) return null
  const base = {
    aura_reply: '',
    created_at: '2026-09-22T13:42:00.000Z',
    customer_name: 'Jamie MacLeod',
    draft_eligible: true,
    first_seen_at: '2026-09-22T13:45:00.000Z',
    id: 'visual-google-review',
    mentioned_staff: [],
    rating: mode === 'low-rating' ? 1 : 5,
    relative_publish_time: 'Today',
    source: 'google_business',
    text: mode === 'rating-only'
      ? ''
      : mode === 'low-rating'
        ? 'We waited far too long and nobody explained what was happening.'
        : 'Brilliant service from start to finish. The team made us feel so welcome.',
  }
  if (mode === 'failed') {
    return {
      ...base,
      draft: {
        id: 'visual-draft',
        lastErrorMessage: 'The AI service did not finish this draft. The review is safe and can be retried.',
        status: 'failed',
        version: 1,
      },
    }
  }
  const generatedText = mode === 'low-rating'
    ? 'Thank you for taking the time to share this, Jamie. We are sorry the wait was frustrating and that we did not keep you informed. We appreciate the feedback and will review it carefully with the team.'
    : mode === 'rating-only'
      ? 'Thanks so much for the five-star rating, Jamie. We really appreciate your support.'
      : 'Thanks so much for the lovely review, Jamie. We are delighted the team made you feel welcome, and we really appreciate your support.'
  return {
    ...base,
    aura_reply: mode === 'published' ? generatedText : '',
    aura_reply_updated_at: mode === 'published' ? '2026-09-22T14:10:00.000Z' : null,
    draft: {
      editedText: '',
      generatedText,
      id: 'visual-draft',
      notificationStatus: 'sent',
      publishedAt: mode === 'published' ? '2026-09-22T14:10:00.000Z' : null,
      status: mode === 'published' ? 'published' : 'generated',
      suggestedPublishAt: '2026-09-23T13:42:00.000Z',
      version: mode === 'published' ? 2 : 1,
    },
  }
}

function isReviewAwardUndo(event) {
  return event.event_type === 'manual_adjustment' && String(event.source_key || '').includes(':undo:')
}

function RecognitionWorkspace({ categories, onAddCategory, onAddStaff, onAssignPoints, onUndoPoints, pointEvents, pointsRules, review, staff }) {
  const suggestions = useMemo(
    () => getReviewRecognitionSuggestions(review.text, staff, categories),
    [categories, review.text, staff],
  )
  const assignedStaffIds = useMemo(
    () => {
      const pointsByStaff = new Map()
      pointEvents.forEach((event) => {
        if (event.review_id !== review.id || (event.event_type !== 'review_award' && !isReviewAwardUndo(event))) return
        pointsByStaff.set(event.staff_id, (pointsByStaff.get(event.staff_id) || 0) + Number(event.points_delta || 0))
      })
      return new Set(
        Array.from(pointsByStaff.entries())
          .filter(([, points]) => points > 0)
          .map(([staffId]) => staffId),
      )
    },
    [pointEvents, review.id],
  )
  const suggestedStaffIds = useMemo(
    () => Array.from(new Set(
      suggestions
        .filter((suggestion) => suggestion.status === 'matched')
        .flatMap((suggestion) => suggestion.matched_staff_ids)
        .filter((staffId) => !assignedStaffIds.has(staffId)),
    )),
    [assignedStaffIds, suggestions],
  )
  const activeStaff = useMemo(() => staff.filter((person) => person.is_active), [staff])
  const defaultPoints = Math.max(1, Number(pointsRules?.[review.rating] || 1))
  const [amount, setAmount] = useState(defaultPoints)
  const [selectedStaffIds, setSelectedStaffIds] = useState(suggestedStaffIds)
  const [staffSuggestion, setStaffSuggestion] = useState(null)
  const [isAwarding, setIsAwarding] = useState(false)
  const [undoingStaffId, setUndoingStaffId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  function toggleStaff(staffId) {
    if (assignedStaffIds.has(staffId)) return
    setErrorMessage('')
    setSuccessMessage('')
    setSelectedStaffIds((current) =>
      current.includes(staffId)
        ? current.filter((id) => id !== staffId)
        : [...current, staffId],
    )
  }

  async function assignPoints() {
    if (!selectedStaffIds.length) return
    setIsAwarding(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const result = await onAssignPoints({ amount, reviewId: review.id, staffIds: selectedStaffIds })
      if (result.assignedCount) {
        setSuccessMessage(
          `${amount} ${Number(amount) === 1 ? 'point' : 'points'} awarded to ${result.names.join(' and ')}.`,
        )
        setSelectedStaffIds([])
      }
    } catch (error) {
      setErrorMessage(error.message || 'AURA could not award those points. Please try again.')
    } finally {
      setIsAwarding(false)
    }
  }

  async function addSuggestedStaff(form) {
    const record = await onAddStaff(form)
    if (record?.id) setSelectedStaffIds((current) => [...new Set([...current, record.id])])
    return record
  }

  async function undoPoints(staffId) {
    setUndoingStaffId(staffId)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const result = await onUndoPoints({ reviewId: review.id, staffId })
      if (result.undoneCount) setSuccessMessage(`Recognition for ${result.name} has been undone.`)
    } catch (error) {
      setErrorMessage(error.message || 'AURA could not undo that recognition. Please try again.')
    } finally {
      setUndoingStaffId('')
    }
  }

  return (
    <div className="rounded-xl border border-[#3867F4]/20 bg-[#3867F4]/[0.055] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-[#315bd8]">
            <Sparkles size={15} /> Review recognition
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#4e625c]">
            AURA suggests the match. You stay in control of who receives points.
          </p>
        </div>
        {assignedStaffIds.size > 0 && (
          <span className="shrink-0 rounded-full bg-[#2d8067]/10 px-2.5 py-1 text-[10px] font-black text-[#236750]">
            {assignedStaffIds.size} awarded
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {suggestions.map((suggestion) => (
          <div className="rounded-xl border border-black/[0.07] bg-white/45 p-3" key={`${suggestion.name}-${suggestion.status}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-[#17201e]">AURA spotted {suggestion.name}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#667873]">
                  {suggestion.status === 'matched'
                    ? `Matched to ${suggestion.matched_staff_names.join(', ')}${suggestion.suggested_category ? ` in ${suggestion.suggested_category}` : ''}.`
                    : suggestion.status === 'ambiguous'
                      ? `There is more than one possible match. Choose the right person below${suggestion.suggested_category ? ` — the review sounds like ${suggestion.suggested_category}` : ''}.`
                      : `${suggestion.name} is not in your team yet${suggestion.suggested_category ? `. The review suggests ${suggestion.suggested_category}` : ''}.`}
                </p>
              </div>
              {suggestion.status === 'new' && (
                <button
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#3867F4] px-3 text-xs font-black text-white transition hover:bg-[#2f5be0]"
                  onClick={() => setStaffSuggestion(suggestion)}
                  type="button"
                >
                  <UserPlus size={14} /> Add {suggestion.name}
                </button>
              )}
            </div>
          </div>
        ))}

        {!suggestions.length && (
          <div className="rounded-xl border border-dashed border-black/10 bg-white/30 p-3 text-xs font-semibold leading-5 text-[#667873]">
            No named team member was spotted. You can still allocate the review manually.
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#3867F4]/15 pt-4">
        <div className="flex items-center gap-2 text-sm font-black text-[#17201e]">
          <Users size={16} className="text-[#315bd8]" /> Who should receive points?
        </div>
        <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
          {activeStaff.map((person) => {
            const isAssigned = assignedStaffIds.has(person.id)
            const isSelected = selectedStaffIds.includes(person.id)
            if (isAssigned) {
              return (
                <div className="inline-flex items-center overflow-hidden rounded-xl border border-[#2d8067]/15 bg-[#2d8067]/10 text-xs font-black text-[#236750]" key={person.id}>
                  <span className="inline-flex items-center gap-2 px-3 py-2">
                    <Check size={13} /> {person.name} <span className="font-semibold">· awarded</span>
                  </span>
                  <button
                    aria-label={`Undo recognition for ${person.name}`}
                    className="inline-flex items-center gap-1.5 border-l border-[#2d8067]/15 px-3 py-2 transition hover:bg-[#2d8067]/10 disabled:opacity-50"
                    disabled={undoingStaffId === person.id}
                    onClick={() => undoPoints(person.id)}
                    type="button"
                  >
                    <RotateCcw size={12} /> {undoingStaffId === person.id ? 'Undoing…' : 'Undo'}
                  </button>
                </div>
              )
            }

            return (
              <button
                aria-checked={isSelected}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
                  isSelected
                      ? 'border-[#3867F4] bg-[#3867F4] text-white'
                      : 'border-black/[0.08] bg-white/45 text-[#52645f] hover:border-[#3867F4]/35'
                }`}
                key={person.id}
                onClick={() => toggleStaff(person.id)}
                role="checkbox"
                type="button"
              >
                {isSelected ? <Check size={13} /> : <Plus size={13} />}
                {person.name}
              </button>
            )
          })}
        </div>

        {activeStaff.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-[7rem_1fr]">
            <label className="rounded-xl border border-black/[0.08] bg-white/45 px-3 py-2">
              <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#71827d]">Points each</span>
              <input
                aria-label="Points for each selected person"
                className="mt-0.5 w-full bg-transparent text-base font-black text-[#17201e] outline-none"
                max="100"
                min="1"
                onChange={(event) => setAmount(Math.min(100, Math.max(1, Number(event.target.value) || 1)))}
                type="number"
                value={amount}
              />
            </label>
            <button
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#3867F4] px-4 text-sm font-black text-white transition hover:bg-[#2f5be0] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!selectedStaffIds.length || isAwarding || Number(amount) < 1}
              onClick={assignPoints}
              type="button"
            >
              <Star className="fill-white" size={15} />
              {isAwarding
                ? 'Awarding…'
                : `Award ${amount || 0} ${Number(amount) === 1 ? 'point' : 'points'}${selectedStaffIds.length > 1 ? ` to ${selectedStaffIds.length} people` : ''}`}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs font-semibold text-[#667873]">Add a team member before assigning points.</p>
        )}

        {successMessage && (
          <p aria-live="polite" className="mt-3 flex items-center gap-2 text-xs font-black text-[#236750]">
            <CheckCircle2 size={15} /> {successMessage}
          </p>
        )}
        {errorMessage && (
          <p aria-live="polite" className="mt-3 text-xs font-black text-[#b83e50]">{errorMessage}</p>
        )}
      </div>

      {staffSuggestion && (
        <StaffModal
          allowAddAnother={false}
          categories={categories}
          initialCategory={staffSuggestion.suggested_category}
          initialName={staffSuggestion.name}
          onAddCategory={onAddCategory}
          onClose={() => setStaffSuggestion(null)}
          onSave={addSuggestedStaff}
          title={`Add ${staffSuggestion.name}`}
        />
      )}
    </div>
  )
}

function formatRecommendedTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No recommended time available'
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function requestKey() {
  return globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(36).slice(2)
}

function ReplyWorkspace({
  businessName,
  categories,
  initialPublishOpen = false,
  onAddCategory,
  onAddStaff,
  onAssignPoints,
  onGenerateDraft,
  onPublish,
  onSaveDraft,
  onUndoPoints,
  pointEvents,
  pointsRules,
  review,
  staff,
}) {
  const savedText = draftText(review)
  const [draft, setDraft] = useState(savedText)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPublishOpen, setIsPublishOpen] = useState(initialPublishOpen)
  const [isEarlyPublish, setIsEarlyPublish] = useState(initialPublishOpen)
  const status = getReplyStatus(review)
  const style = statusStyles[status.type]
  const StatusIcon = style.icon
  const needsCarefulReview = Number(review.rating) <= 2
  const recommendedAt = review.draft?.suggestedPublishAt

  async function saveDraft() {
    setBusyAction('save')
    setErrorMessage('')
    try {
      const updated = await onSaveDraft(
        review.id,
        review.draft.id,
        draft,
        review.draft.version,
      )
      setDraft(updated.editedText || updated.generatedText)
      setIsEditing(false)
      setIsSaved(true)
      window.setTimeout(() => setIsSaved(false), 1800)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBusyAction('')
    }
  }

  async function generateDraft() {
    setBusyAction('generate')
    setErrorMessage('')
    try {
      await onGenerateDraft(review.id, requestKey())
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBusyAction('')
    }
  }

  async function publishDraft() {
    setBusyAction('publish')
    setErrorMessage('')
    try {
      await onPublish(
        review.id,
        review.draft.id,
        savedText,
        review.draft.version,
        requestKey(),
      )
      setIsPublishOpen(false)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBusyAction('')
    }
  }

  return (
    <aside className="xl:sticky xl:top-24 xl:self-start">
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/95">
        <div className="border-b border-white/[0.07] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c838b]">Selected review</p>
              <div className="mt-3 flex items-center gap-3">
                {review.author_photo_url ? (
                  <img alt="" className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" src={review.author_photo_url} />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-sm font-black text-slate-300">
                    {review.customer_name?.slice(0, 1) || 'G'}
                  </span>
                )}
                <div>
                  {review.author_profile_url ? (
                    <a className="inline-flex items-center gap-1.5 text-2xl font-semibold tracking-[-0.03em] text-white hover:text-[#e4aa87]" href={review.author_profile_url} rel="noreferrer" target="_blank">
                      {review.customer_name} <ExternalLink aria-hidden="true" size={14} />
                    </a>
                  ) : (
                    <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">{review.customer_name}</h3>
                  )}
                  {review.relative_publish_time ? <p className="mt-1 text-xs font-semibold text-slate-500">{review.relative_publish_time}</p> : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.045] px-3 py-2">
              <Star className="fill-[#d18a62] text-[#d18a62]" size={15} />
              <span className="text-sm font-black text-white">{review.rating}.0</span>
            </div>
          </div>
          <p className="mt-5 text-base font-medium leading-7 text-slate-300">
            {review.text || <span className="italic text-slate-500">No written comment was left with this rating.</span>}
          </p>
          {review.google_maps_uri ? (
            <a className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#e4aa87] hover:text-white" href={review.google_maps_uri} rel="noreferrer" target="_blank">
              Read this review on Google Maps <ExternalLink aria-hidden="true" size={13} />
            </a>
          ) : null}
        </div>

        <div className="p-5 sm:p-6">
          <RecognitionWorkspace
            categories={categories}
            onAddCategory={onAddCategory}
            onAddStaff={onAddStaff}
            onAssignPoints={onAssignPoints}
            onUndoPoints={onUndoPoints}
            pointEvents={pointEvents}
            pointsRules={pointsRules}
            review={review}
            staff={staff}
          />

          <div className={'mt-5 rounded-xl border p-4 ' + style.panel}>
            <div className={'flex items-center gap-2 text-sm font-black ' + style.text}>
              <StatusIcon aria-hidden="true" className={status.type === 'generating' ? 'animate-spin' : ''} size={17} />
              {status.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{status.detail}</p>
          </div>

          {needsCarefulReview && review.source === 'google_business' ? (
            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-400/[0.08] p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-100"><AlertTriangle aria-hidden="true" size={16} /> Needs careful review</p>
              <p className="mt-2 text-sm leading-6 text-amber-100/70">This is a {review.rating}-star review. AURA keeps the language cautious, but an owner should check every word before publishing.</p>
            </div>
          ) : null}

          {status.type === 'preview' || status.type === 'historical' ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm font-semibold leading-6 text-slate-400">
              {status.type === 'preview'
                ? 'This sample can support staff recognition, but it cannot create or publish a Google reply.'
                : 'Historical imports are intentionally quiet: no draft and no email are created.'}
            </div>
          ) : null}

          {status.type === 'generating' ? (
            <div aria-busy="true" className="mt-5 flex min-h-32 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] text-sm font-semibold text-slate-300">
              <LoaderCircle aria-hidden="true" className="animate-spin text-[#d18a62]" size={19} /> Preparing a safe draft…
            </div>
          ) : null}

          {status.type === 'failed' ? (
            <div className="mt-5">
              <p className="text-sm leading-6 text-slate-400">{review.draft?.lastErrorMessage || 'Draft generation did not finish.'}</p>
              <button className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#a96847] px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60" disabled={Boolean(busyAction)} onClick={generateDraft} type="button">
                <RefreshCw aria-hidden="true" className={busyAction === 'generate' ? 'animate-spin' : ''} size={16} /> Retry draft
              </button>
            </div>
          ) : null}

          {status.type === 'ready' ? (
            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#e4aa87]">
                  <Sparkles aria-hidden="true" size={15} /> Saved AURA draft
                </div>
                {!isEditing ? (
                  <button className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-black text-[#e4aa87] transition hover:bg-white/[0.05] hover:text-white" onClick={() => setIsEditing(true)} type="button">
                    <Pencil aria-hidden="true" size={14} /> Edit draft
                  </button>
                ) : null}
              </div>

              {recommendedAt ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm leading-6 text-slate-400">
                  <Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-[#d18a62]" size={16} />
                  <span>Recommended publish time: <strong className="text-slate-200">{formatRecommendedTime(recommendedAt)}</strong>. You can publish whenever you are satisfied.</span>
                </div>
              ) : null}

              {isEditing ? (
                <div className="mt-3">
                  <label className="sr-only" htmlFor={'google-draft-' + review.id}>Edit AURA draft</label>
                  <textarea
                    aria-describedby={errorMessage ? 'google-draft-error' : undefined}
                    aria-invalid={Boolean(errorMessage)}
                    className="min-h-44 w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-4 text-sm font-medium leading-7 text-white outline-none focus:border-[#d18a62] focus:ring-4 focus:ring-[#d18a62]/10"
                    id={'google-draft-' + review.id}
                    onChange={(event) => {
                      setDraft(event.target.value)
                      setErrorMessage('')
                    }}
                    value={draft}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#a96847] px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60" disabled={Boolean(busyAction) || !draft.trim()} onClick={saveDraft} type="button">
                      <Save aria-hidden="true" size={16} /> {busyAction === 'save' ? 'Saving…' : 'Save draft'}
                    </button>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm font-bold text-slate-300" disabled={Boolean(busyAction)} onClick={() => { setDraft(savedText); setIsEditing(false); setErrorMessage('') }} type="button">
                      <X aria-hidden="true" size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-200">{savedText}</p>
                </div>
              )}

              <div aria-live="polite" className="min-h-6 pt-2" id="google-draft-error">
                {errorMessage ? <p className="text-xs font-bold text-rose-300" role="alert">{errorMessage}</p> : null}
                {!errorMessage && isSaved ? <p className="text-xs font-bold text-emerald-300">Draft saved. Nothing was published.</p> : null}
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm font-bold text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-wait disabled:opacity-60" disabled={Boolean(busyAction) || isEditing} onClick={generateDraft} type="button">
                  <RefreshCw aria-hidden="true" className={busyAction === 'generate' ? 'animate-spin' : ''} size={16} /> Regenerate
                </button>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#a96847] px-4 text-sm font-bold text-white transition hover:bg-[#bd7652] disabled:cursor-not-allowed disabled:opacity-50" disabled={Boolean(busyAction) || isEditing || !savedText} onClick={() => { setIsEarlyPublish(Boolean(recommendedAt && new Date(recommendedAt).getTime() > Date.now())); setIsPublishOpen(true) }} type="button">
                  <Send aria-hidden="true" size={16} /> Publish to Google
                </button>
              </div>
              {isEditing ? <p className="mt-2 text-xs text-slate-500">Save this edit before publishing so the confirmation shows the exact server-saved text.</p> : null}
            </div>
          ) : null}

          {status.type === 'published' ? (
            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Published reply</p>
              <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.05] p-4">
                <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-200">{review.aura_reply || savedText}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Publish to Google"
        errorMessage={errorMessage}
        isBusy={busyAction === 'publish'}
        isOpen={isPublishOpen}
        onClose={() => {
          setIsPublishOpen(false)
          setErrorMessage('')
        }}
        onConfirm={publishDraft}
        title={'Publish this reply for ' + businessName + '?'}
      >
        <p>This is the only action that sends text to Google. AURA will first check that a newer owner reply has not appeared, then publish this exact saved text:</p>
        <blockquote className="mt-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white">{savedText}</blockquote>
        {isEarlyPublish ? <p className="mt-4 text-sm text-amber-200">This is earlier than the recommended time. Publishing is still allowed because the timing is guidance only.</p> : null}
      </ConfirmDialog>
    </aside>
  )
}
export default function Reviews() {
  const { account, actions, categories, pointEvents, pointsRules, reviews, staff } = useDashboard()
  const [searchParams] = useSearchParams()
  const visualMode = import.meta.env.DEV ? searchParams.get('visual') : null
  const visualReview = visualGoogleReview(visualMode)
  const sourceReviews = visualReview ? [visualReview] : reviews
  const [query, setQuery] = useState('')
  const [selectedReviewId, setSelectedReviewId] = useState(searchParams.get('review') || sourceReviews[0]?.id || null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const [refreshError, setRefreshError] = useState('')

  useEffect(() => {
    document.title = 'Review drafts — AURA'
  }, [])

  async function refreshReviews() {
    setIsRefreshing(true)
    setRefreshError('')
    setRefreshMessage('')
    try {
      const result = await actions.syncGoogleReviews()
      setRefreshMessage(result.count
        ? 'Reviews refreshed. Any new eligible review has a draft ready or in progress.'
        : 'Reviews are up to date.')
    } catch (error) {
      setRefreshError(error.message)
    } finally {
      setIsRefreshing(false)
    }
  }

  const businessName = String(account?.businessProfile?.business_name || 'your business').replace(/\s+Demo$/i, '')
  const intro = "Let's see what people are saying about " + businessName + '.'
  const cleanQuery = query.trim().toLowerCase()
  const visibleReviews = sourceReviews.filter((review) =>
    !cleanQuery
    || review.customer_name?.toLowerCase().includes(cleanQuery)
    || review.text?.toLowerCase().includes(cleanQuery),
  )
  const selectedReview = sourceReviews.find((review) => review.id === selectedReviewId) || visibleReviews[0] || sourceReviews[0]
  const hasConnectedGoogleReviews = sourceReviews.some((review) => review.source === 'google_business')
  const hasPlacesPreview = sourceReviews.some((review) => review.source === 'google_places')

  return (
    <div className="space-y-9 pb-12">
      <section className="flex min-h-28 items-center border-b border-white/[0.055] py-4">
        <TypewriterIntro key={intro} text={intro} />
      </section>

      <div aria-live="polite" className="min-h-0">
        {refreshError ? <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200" role="alert">{refreshError}</p> : null}
        {!refreshError && refreshMessage ? <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200" role="status">{refreshMessage}</p> : null}
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(390px,1.05fr)]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-semibold tracking-[-0.025em] text-white">Reviews</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {visibleReviews.length} conversation{visibleReviews.length === 1 ? '' : 's'}
                {hasConnectedGoogleReviews ? ' · connected Business Profile' : hasPlacesPreview ? ' · public preview only' : ''}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.045] px-3 sm:w-56">
                <Search aria-hidden="true" className="text-slate-500" size={16} />
                <label className="sr-only" htmlFor="dashboard-review-search">Search reviews</label>
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
                  id="dashboard-review-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search reviews"
                  value={query}
                />
                {query ? (
                  <button aria-label="Clear review search" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" onClick={() => setQuery('')} type="button"><X aria-hidden="true" size={15} /></button>
                ) : null}
              </div>
              {hasConnectedGoogleReviews ? (
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.045] px-4 text-xs font-black text-slate-300 transition hover:border-[#d18a62]/40 hover:text-white disabled:cursor-wait disabled:opacity-60" disabled={isRefreshing} onClick={refreshReviews} type="button">
                  <RefreshCw aria-hidden="true" className={isRefreshing ? 'animate-spin' : ''} size={15} />
                  {isRefreshing ? 'Checking…' : 'Refresh'}
                </button>
              ) : (
                <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#a96847] px-4 text-xs font-black text-white" to="/setup/google">
                  <MapPin aria-hidden="true" size={15} /> Connect Google
                </Link>
              )}
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {visibleReviews.map((review) => {
              const isSelected = selectedReview?.id === review.id
              const status = getReplyStatus(review)
              const style = statusStyles[status.type]
              const StatusIcon = style.icon
              const badgeLabel = {
                failed: 'Retry',
                generating: 'Generating',
                historical: 'History',
                preview: 'Preview',
                published: 'Published',
                ready: 'Draft ready',
              }[status.type]

              return (
                <button
                  className={'w-full p-5 text-left transition ' + (isSelected ? 'bg-[#a96847]/[0.11]' : 'hover:bg-white/[0.035]')}
                  key={review.id}
                  onClick={() => setSelectedReviewId(review.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      {review.author_photo_url ? (
                        <img alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" src={review.author_photo_url} />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-black text-slate-300">{review.customer_name?.slice(0, 1) || 'G'}</span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-black text-white">{review.customer_name}</p>
                        <div className="mt-2 flex items-center gap-1">
                          {stars(review.rating).map((filled, index) => (
                            <Star
                              className={filled ? 'fill-[#d18a62] text-[#d18a62]' : 'text-white/10'}
                              key={index}
                              size={14}
                            />
                          ))}
                          <span className="ml-2 text-xs font-semibold text-slate-500">{formatReviewDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ' + style.panel + ' ' + style.text}>
                      <StatusIcon aria-hidden="true" className={status.type === 'generating' ? 'animate-spin' : ''} size={12} />
                      {badgeLabel}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-300">{review.text || 'No written comment.'}</p>
                  {Number(review.rating) <= 2 && review.source === 'google_business' ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-200"><AlertTriangle aria-hidden="true" size={13} /> Needs careful review</p>
                  ) : null}
                </button>
              )
            })}

            {!visibleReviews.length ? (
              <div className="p-10 text-center">
                <p className="text-sm font-semibold text-slate-500">{query ? 'No reviews match that search.' : 'Connect Google Business Profile to import the review history.'}</p>
                {query ? (
                  <button className="mt-4 text-sm font-bold text-[#e4aa87]" onClick={() => setQuery('')} type="button">Clear search</button>
                ) : (
                  <Link className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#a96847] px-5 text-sm font-black text-white" to="/setup/google">
                    <MapPin aria-hidden="true" size={16} /> Start Google setup
                  </Link>
                )}
              </div>
            ) : null}
          </div>

          {hasPlacesPreview && !hasConnectedGoogleReviews ? (
            <div className="border-t border-white/[0.07] px-5 py-4 text-xs leading-5 text-slate-500">
              These are public Google Places previews. Connect Business Profile before importing the full history or preparing owner drafts.
            </div>
          ) : null}
        </div>

        {selectedReview ? (
          <ReplyWorkspace
            businessName={businessName}
            categories={categories}
            initialPublishOpen={visualMode === 'publish-confirm'}
            key={`${selectedReview.id}:${selectedReview.draft?.version || 0}`}
            onAddCategory={actions.addCategory}
            onAddStaff={actions.addStaff}
            onAssignPoints={actions.assignReviewPoints}
            onGenerateDraft={actions.generateGoogleDraft}
            onPublish={actions.publishGoogleDraft}
            onSaveDraft={actions.saveGoogleDraft}
            onUndoPoints={actions.undoReviewPoints}
            pointEvents={pointEvents}
            pointsRules={pointsRules}
            review={selectedReview}
            staff={staff}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-10 text-center text-sm text-slate-500">
            Select a review to inspect its draft.
          </div>
        )}
      </section>
    </div>
  )
}
