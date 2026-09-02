import { Check, CheckCircle2, Clock3, Pencil, PowerOff, Search, Sparkles, Star, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { generateReply } from '../../utils/generateReply'
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

function ReplyWorkspace({ businessName, now, onSave, review, settings }) {
  const [draft, setDraft] = useState(() => getReply(review, businessName))
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
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{review.customer_name}</h3>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-black/[0.07] bg-white/35 px-3 py-2">
              <Star className="fill-[#3867F4] text-[#3867F4]" size={15} />
              <span className="text-sm font-black text-[#17201e]">{review.rating}.0</span>
            </div>
          </div>
          <p className="mt-5 text-base font-medium leading-7 text-slate-300">{review.text}</p>
        </div>

        <div className="p-5 sm:p-6">
          <div className={`rounded-xl border p-4 ${style.panel}`}>
            <div className={`flex items-center gap-2 text-sm font-black ${style.text}`}>
              <StatusIcon size={17} />
              {status.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#61716d]">{status.detail}</p>
          </div>

          {status.type === 'off' ? (
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
  const { account, actions, autoReplySettings, reviews } = useDashboard()
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
              <p className="mt-1 text-xs font-semibold text-[#72837e]">{visibleReviews.length} conversations</p>
            </div>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-black/[0.07] bg-white/35 px-3 sm:w-64">
              <Search size={16} className="text-[#71827d]" />
              <input
                aria-label="Search reviews"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#17201e] outline-none placeholder:text-[#81918d]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reviews"
                value={query}
              />
            </label>
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
                    <div>
                      <p className="font-black text-white">{review.customer_name}</p>
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
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${style.panel} ${style.text}`}>
                      <StatusIcon size={12} />
                      {status.type === 'sent' ? 'Replied' : status.type === 'scheduled' ? 'Scheduled' : 'Off'}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-300">{review.text}</p>
                </button>
              )
            })}

            {!visibleReviews.length && (
              <div className="p-10 text-center text-sm font-semibold text-[#71827d]">No reviews match that search.</div>
            )}
          </div>
        </div>

        {selectedReview ? (
          <ReplyWorkspace
            businessName={businessName}
            key={selectedReview.id}
            now={now}
            onSave={actions.updateReviewReply}
            review={selectedReview}
            settings={autoReplySettings}
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
