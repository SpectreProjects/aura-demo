import { Check, CheckCircle2, Clock3, ExternalLink, MapPin, Pencil, Plus, PowerOff, Search, Sparkles, Star, UserPlus, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getReviewRecognitionSuggestions } from '../../utils/mvpRecognition'
import { generateReply } from '../../utils/generateReply'
import StaffModal from './components/StaffModal'
import { useDashboard } from './useDashboard'

const PAGE_LOAD_TIME = Date.now()

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

function getReply(review, businessName) {
  return review.aura_reply || generateReply(
    { author: review.customer_name || 'there', rating: Number(review.rating || 0) },
    businessName || 'our team',
  )
}

function delayInMilliseconds(settings) {
  const multipliers = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 }
  return Math.max(0, Number(settings.delayValue || 0)) * (multipliers[settings.delayUnit] || multipliers.hours)
}

function formatTimeRemaining(milliseconds) {
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000))
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`

  const hours = Math.ceil(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`

  const days = Math.ceil(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

function getReplyStatus(review, settings, now) {
  if (review.source === 'google_places') {
    return {
      detail: 'This is a live public-review sample. Reply status and publishing will switch on with the full Google Business Profile connection.',
      label: 'Google review preview',
      type: 'preview',
    }
  }

  if (!settings.enabled) {
    return {
      detail: 'Automatic replies are currently switched off in Settings.',
      label: 'AURA auto replies off',
      type: 'off',
    }
  }

  const sendAt = new Date(review.created_at).getTime() + delayInMilliseconds(settings)
  const remaining = sendAt - now
  if (remaining > 0) {
    return {
      detail: 'You can edit the prepared reply before it goes out.',
      label: `Reply being sent in ${formatTimeRemaining(remaining)}`,
      type: 'scheduled',
    }
  }

  return {
    detail: 'The reply has been sent automatically in your business voice.',
    label: 'AURA has auto replied',
    type: 'sent',
  }
}

const statusStyles = {
  off: {
    icon: PowerOff,
    panel: 'border-[#73827e]/20 bg-white/25',
    text: 'text-[#596964]',
  },
  preview: {
    icon: MapPin,
    panel: 'border-[#3867F4]/20 bg-[#3867F4]/[0.06]',
    text: 'text-[#315bd8]',
  },
  scheduled: {
    icon: Clock3,
    panel: 'border-[#3867F4]/20 bg-[#3867F4]/[0.06]',
    text: 'text-[#315bd8]',
  },
  sent: {
    icon: CheckCircle2,
    panel: 'border-[#2d8067]/20 bg-[#2d8067]/[0.07]',
    text: 'text-[#236750]',
  },
}

function TypewriterIntro({ text }) {
  const [visibleText, setVisibleText] = useState('')

  useEffect(() => {
    let index = 0
    let timeoutId

    function typeNextCharacter() {
      index += 1
      setVisibleText(text.slice(0, index))

      if (index < text.length) {
        const character = text[index - 1]
        const pause = character === ',' ? 125 : character === ' ' ? 42 : 28 + (index % 4) * 8
        timeoutId = window.setTimeout(typeNextCharacter, pause)
      }
    }

    timeoutId = window.setTimeout(typeNextCharacter, 220)
    return () => window.clearTimeout(timeoutId)
  }, [text])

  return (
    <h2 aria-label={text} className="whitespace-nowrap text-[clamp(0.88rem,3vw,2.9rem)] font-medium leading-none tracking-[-0.052em] text-white">
      <span aria-hidden="true">{visibleText}</span>
      <span
        aria-hidden="true"
        className={`ml-1 inline-block h-[0.86em] w-[4px] translate-y-[0.08em] rounded-full bg-[#3867F4] ${visibleText.length < text.length ? 'animate-pulse' : 'opacity-0'}`}
      />
    </h2>
  )
}

function RecognitionWorkspace({ categories, onAddCategory, onAddStaff, onAssignPoints, pointEvents, pointsRules, review, staff }) {
  const suggestions = useMemo(
    () => getReviewRecognitionSuggestions(review.text, staff, categories),
    [categories, review.text, staff],
  )
  const assignedEvents = useMemo(
    () => pointEvents.filter(
      (event) => event.review_id === review.id && event.event_type === 'review_award',
    ),
    [pointEvents, review.id],
  )
  const assignedStaffIds = useMemo(
    () => new Set(assignedEvents.map((event) => event.staff_id)),
    [assignedEvents],
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
        {assignedEvents.length > 0 && (
          <span className="shrink-0 rounded-full bg-[#2d8067]/10 px-2.5 py-1 text-[10px] font-black text-[#236750]">
            {assignedEvents.length} awarded
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
            return (
              <button
                aria-checked={isAssigned || isSelected}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
                  isAssigned
                    ? 'cursor-default border-[#2d8067]/15 bg-[#2d8067]/10 text-[#236750]'
                    : isSelected
                      ? 'border-[#3867F4] bg-[#3867F4] text-white'
                      : 'border-black/[0.08] bg-white/45 text-[#52645f] hover:border-[#3867F4]/35'
                }`}
                disabled={isAssigned}
                key={person.id}
                onClick={() => toggleStaff(person.id)}
                role="checkbox"
                type="button"
              >
                {isAssigned || isSelected ? <Check size={13} /> : <Plus size={13} />}
                {person.name}
                {isAssigned && <span className="font-semibold">· awarded</span>}
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

function ReplyWorkspace({ businessName, categories, now, onAddCategory, onAddStaff, onAssignPoints, onSave, pointEvents, pointsRules, review, settings, staff }) {
  const [draft, setDraft] = useState(() => review.source === 'google_places' ? '' : getReply(review, businessName))
  const [isEditing, setIsEditing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const status = getReplyStatus(review, settings, now)
  const style = statusStyles[status.type]
  const StatusIcon = style.icon

  async function saveReply() {
    await onSave(review.id, draft)
    setIsEditing(false)
    setIsSaved(true)
    window.setTimeout(() => setIsSaved(false), 1600)
  }

  return (
    <aside className="xl:sticky xl:top-24 xl:self-start">
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/95">
        <div className="border-b border-white/[0.07] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#697a75]">Selected review</p>
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
                    <a className="inline-flex items-center gap-1.5 text-2xl font-semibold tracking-[-0.03em] text-white hover:text-[#8aa5ff]" href={review.author_profile_url} rel="noreferrer" target="_blank">
                      {review.customer_name} <ExternalLink size={14} />
                    </a>
                  ) : (
                    <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">{review.customer_name}</h3>
                  )}
                  {review.relative_publish_time && <p className="mt-1 text-xs font-semibold text-slate-500">{review.relative_publish_time}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-black/[0.07] bg-white/35 px-3 py-2">
              <Star className="fill-[#3867F4] text-[#3867F4]" size={15} />
              <span className="text-sm font-black text-[#17201e]">{review.rating}.0</span>
            </div>
          </div>
          <p className="mt-5 text-base font-medium leading-7 text-slate-300">{review.text}</p>
          {review.google_maps_uri && (
            <a className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#7f9cff] hover:text-white" href={review.google_maps_uri} rel="noreferrer" target="_blank">
              Read this review on Google Maps <ExternalLink size={13} />
            </a>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <RecognitionWorkspace
            categories={categories}
            onAddCategory={onAddCategory}
            onAddStaff={onAddStaff}
            onAssignPoints={onAssignPoints}
            pointEvents={pointEvents}
            pointsRules={pointsRules}
            review={review}
            staff={staff}
          />

          <div className={`mt-5 rounded-xl border p-4 ${style.panel}`}>
            <div className={`flex items-center gap-2 text-sm font-black ${style.text}`}>
              <StatusIcon size={17} />
              {status.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#61716d]">{status.detail}</p>
          </div>

          {status.type === 'preview' ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#3867F4]/25 bg-white/25 p-4 text-sm font-semibold leading-6 text-[#5b6c67]">
              AURA can use this sample to preview staff mentions and rewards. It does not claim a reply was sent.
            </div>
          ) : status.type === 'off' ? (
            <Link
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#3867F4] px-4 text-sm font-black text-white transition hover:bg-[#2f5be0]"
              to="/dashboard/settings"
            >
              Turn on auto replies in Settings
            </Link>
          ) : (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#61716d]">
                  <Sparkles size={15} className="text-[#3867F4]" />
                  {status.type === 'scheduled' ? 'Prepared reply' : 'AURA reply'}
                </div>
                {!isEditing && (
                  <button
                    className="inline-flex items-center gap-2 text-xs font-black text-[#315bd8] transition hover:text-[#234dc9]"
                    onClick={() => setIsEditing(true)}
                    type="button"
                  >
                    <Pencil size={14} />
                    {status.type === 'scheduled' ? 'Edit before sending' : 'Edit reply'}
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="mt-3">
                  <textarea
                    aria-label="Edit AURA reply"
                    className="min-h-40 w-full resize-none rounded-xl border border-[#3867F4]/25 bg-white/45 p-4 text-sm font-medium leading-7 text-[#17201e] outline-none focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
                    onChange={(event) => setDraft(event.target.value)}
                    value={draft}
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3867F4] px-4 text-sm font-black text-white"
                      onClick={saveReply}
                      type="button"
                    >
                      <Check size={16} /> Save reply
                    </button>
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white/35 px-4 text-sm font-black text-[#4e5f5a]"
                      onClick={() => {
                        setDraft(getReply(review, businessName))
                        setIsEditing(false)
                      }}
                      type="button"
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-black/[0.07] bg-white/35 p-4">
                  <p className="text-sm font-medium leading-7 text-slate-200">{draft}</p>
                </div>
              )}

              {isSaved && <p className="mt-3 text-xs font-black text-[#236750]">Reply updated.</p>}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default function Reviews() {
  const { account, actions, autoReplySettings, categories, pointEvents, pointsRules, reviews, staff } = useDashboard()
  const [now, setNow] = useState(PAGE_LOAD_TIME)
  const [query, setQuery] = useState('')
  const [selectedReviewId, setSelectedReviewId] = useState(reviews[0]?.id || null)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const businessName = String(account?.businessProfile?.business_name || 'your business').replace(/\s+Demo$/i, '')
  const intro = `Let's see what people are saying about ${businessName}.`
  const cleanQuery = query.trim().toLowerCase()
  const visibleReviews = reviews.filter((review) =>
    !cleanQuery || review.customer_name?.toLowerCase().includes(cleanQuery) || review.text?.toLowerCase().includes(cleanQuery),
  )
  const selectedReview = reviews.find((review) => review.id === selectedReviewId) || visibleReviews[0] || reviews[0]
  const hasGooglePlace = Boolean(account?.businessProfile?.google_place_id)
  const hasGoogleReviews = reviews.some((review) => review.source === 'google_places')

  return (
    <div className="space-y-9 pb-12">
      <section className="flex h-28 items-center overflow-hidden border-b border-white/[0.055]">
        <TypewriterIntro key={intro} text={intro} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(390px,1.05fr)]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-semibold tracking-[-0.025em] text-white">Reviews</p>
              <p className="mt-1 text-xs font-semibold text-[#72837e]">
                {visibleReviews.length} conversations{hasGoogleReviews ? ' · relevance-ranked by Google' : ''}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.045] px-3 sm:w-56">
                <Search size={16} className="text-[#71827d]" />
                <input
                  aria-label="Search reviews"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-[#81918d]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search reviews"
                  value={query}
                />
              </label>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.045] px-4 text-xs font-black text-slate-300 transition hover:border-[#3867F4]/40 hover:text-white" onClick={actions.openBusinessSetup} type="button">
                <MapPin size={15} />
                {hasGooglePlace ? 'Change business' : 'Connect Google'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {visibleReviews.map((review) => {
              const isSelected = selectedReview?.id === review.id
              const status = getReplyStatus(review, autoReplySettings, now)
              const style = statusStyles[status.type]
              const StatusIcon = style.icon

              return (
                <button
                  className={`w-full p-5 text-left transition ${isSelected ? 'bg-[#3867F4]/[0.07]' : 'hover:bg-white/25'}`}
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
                            className={filled ? 'fill-[#3867F4] text-[#3867F4]' : 'text-black/10'}
                            key={index}
                            size={14}
                          />
                        ))}
                        <span className="ml-2 text-xs font-semibold text-[#71827d]">{formatReviewDate(review.created_at)}</span>
                      </div>
                      </div>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${style.panel} ${style.text}`}>
                      <StatusIcon size={12} />
                      {status.type === 'sent' ? 'Replied' : status.type === 'scheduled' ? 'Scheduled' : status.type === 'preview' ? 'Preview' : 'Off'}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-300">{review.text}</p>
                </button>
              )
            })}

            {!visibleReviews.length && (
              <div className="p-10 text-center">
                <p className="text-sm font-semibold text-[#71827d]">{query ? 'No reviews match that search.' : 'Connect the business to see its available Google reviews.'}</p>
                {!query && (
                  <button className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3867F4] px-5 text-sm font-black text-white" onClick={actions.openBusinessSetup} type="button">
                    <MapPin size={16} /> Connect Google reviews
                  </button>
                )}
              </div>
            )}
          </div>
          {hasGoogleReviews && (
            <div className="border-t border-white/[0.07] px-5 py-4 text-xs leading-5 text-slate-500">
              Google supplies a relevance-ranked sample of up to five reviews. Review text and author details are loaded live and are not saved by AURA.
            </div>
          )}
        </div>

        {selectedReview ? (
          <ReplyWorkspace
            businessName={businessName}
            categories={categories}
            key={selectedReview.id}
            now={now}
            onAddCategory={actions.addCategory}
            onAddStaff={actions.addStaff}
            onAssignPoints={actions.assignReviewPoints}
            onSave={actions.updateReviewReply}
            pointEvents={pointEvents}
            pointsRules={pointsRules}
            review={selectedReview}
            settings={autoReplySettings}
            staff={staff}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white/20 p-10 text-center text-sm text-[#71827d]">
            Select a review to see AURA&apos;s reply.
          </div>
        )}
      </section>
    </div>
  )
}
