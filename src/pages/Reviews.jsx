import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  Save,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfig } from '../lib/supabaseClient'
import { generateReply } from '../utils/generateReply'

const BUSINESS_ID = '11111111-1111-1111-1111-111111111111'
const defaultStaffNames = ['Caitlin', 'Emma', 'Daniel', 'Sophie', 'John', 'Daniel']

const dateFilters = ['Today', 'Yesterday', '7 Days', '30 Days', 'This Month', 'Custom']
const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  posted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  auto_replied: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

function normalizeSupabaseReview(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    author: row.customer_name || 'Unknown customer',
    rating: Number(row.rating) || 0,
    text: row.review_text || '',
    suggestedReply: row.suggested_reply || '',
    status: row.status || 'pending',
    createdAt: row.created_at,
    source: 'Google',
  }
}

function normalizeMockReview(review, businessName, tone) {
  return {
    ...review,
    businessId: BUSINESS_ID,
    author: review.author,
    text: review.text,
    suggestedReply: review.suggestedReply || generateReply(review, businessName, tone),
    status: review.rating <= 2 ? 'pending' : 'approved',
    createdAt: review.date,
    source: 'Demo',
  }
}

function formatDateTime(value) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No date'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getEffectiveStatus(review, autoReplyEnabled) {
  if (review.status === 'posted' || review.status === 'approved' || review.status === 'auto_replied') {
    return review.status
  }

  return autoReplyEnabled ? 'auto_replied' : 'pending'
}

function getStatusLabel(status) {
  if (status === 'auto_replied') return 'Auto Replied'
  if (status === 'approved') return 'Approved'
  if (status === 'posted') return 'Posted'
  return 'Pending Approval'
}

function detectMentions(text, staffNames) {
  const lowerText = text.toLowerCase()
  return [...new Set(staffNames)]
    .filter(Boolean)
    .filter((name) => lowerText.includes(name.toLowerCase()))
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function matchesDateFilter(review, filter) {
  if (filter === 'Custom') return true
  if (!review.createdAt) return filter === '30 Days'

  const created = new Date(review.createdAt)
  if (Number.isNaN(created.getTime())) return false

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(startOfToday)
  yesterday.setDate(yesterday.getDate() - 1)

  if (filter === 'Today') return isSameDay(created, now)
  if (filter === 'Yesterday') return isSameDay(created, yesterday)
  if (filter === '7 Days') return created >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  if (filter === '30 Days') return created >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  if (filter === 'This Month') {
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
  }

  return true
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="aura-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function Reviews({ reviews, businessName, settings }) {
  const staffNames = settings.staffNames?.length ? settings.staffNames : defaultStaffNames
  const fallbackReviews = useMemo(
    () => reviews.map((review) => normalizeMockReview(review, businessName, settings.replyTone)),
    [businessName, reviews, settings.replyTone],
  )
  const [reviewRows, setReviewRows] = useState([])
  const [isUsingFallback, setIsUsingFallback] = useState(!supabase)
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState(null)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(Boolean(settings.autoReply))
  const [dateFilter, setDateFilter] = useState('30 Days')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    async function fetchReviews() {
      setIsLoading(true)
      console.info('[Supabase] Reviews env check:', {
        url: supabaseConfig.supabaseUrl || 'missing',
        clientInitialised: supabaseConfig.hasSupabaseConfig,
      })

      if (!supabase) {
        const message =
          'Supabase is not configured. Add real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values, then restart Vite.'
        console.warn('[Supabase] Reviews fallback reason:', message)
        setIsUsingFallback(true)
        setSupabaseError(message)
        setReviewRows(fallbackReviews)
        setIsLoading(false)
        return
      }

      const { data, error, status, statusText } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', BUSINESS_ID)
        .order('created_at', { ascending: false })

      console.info('[Supabase] Reviews business id:', BUSINESS_ID)
      console.info('[Supabase] Reviews raw response:', { data, error, status, statusText })

      if (error) {
        console.error('[Supabase] Reviews fetch error object:', error)
        console.error('[Supabase] Reviews fetch error JSON:', JSON.stringify(error, null, 2))
        setIsUsingFallback(true)
        setSupabaseError(
          `${error.message || 'Supabase query failed'}${error.code ? ` (${error.code})` : ''}`,
        )
        setReviewRows(fallbackReviews)
        setIsLoading(false)
        return
      }

      const mappedReviews = (Array.isArray(data) ? data : []).map(normalizeSupabaseReview)
      console.info('[Supabase] Reviews mapped for render:', mappedReviews)
      setIsUsingFallback(false)
      setSupabaseError(null)
      setReviewRows(mappedReviews)
      setIsLoading(false)
    }

    fetchReviews()
  }, [fallbackReviews])

  const enrichedReviews = useMemo(
    () =>
      reviewRows.map((review) => ({
        ...review,
        effectiveStatus: getEffectiveStatus(review, autoReplyEnabled),
        mentions: detectMentions(review.text, staffNames),
      })),
    [autoReplyEnabled, reviewRows, staffNames],
  )

  const filteredReviews = useMemo(() => {
    return enrichedReviews
      .filter((review) => matchesDateFilter(review, dateFilter))
      .filter((review) => ratingFilter === 'all' || review.rating === Number(ratingFilter))
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return sortOrder === 'newest' ? bTime - aTime : aTime - bTime
      })
  }, [dateFilter, enrichedReviews, ratingFilter, sortOrder])

  const stats = useMemo(() => {
    const total = filteredReviews.length
    const average = total
      ? (filteredReviews.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1)
      : '0.0'

    return {
      total,
      average,
      autoReplied: filteredReviews.filter((review) => review.effectiveStatus === 'auto_replied').length,
      needsApproval: filteredReviews.filter((review) => review.effectiveStatus === 'pending').length,
      nameMentions: filteredReviews.reduce((sum, review) => sum + review.mentions.length, 0),
    }
  }, [filteredReviews])

  async function updateReview(reviewId, updates) {
    setSavingId(reviewId)

    if (isUsingFallback || !supabase) {
      setReviewRows((current) =>
        current.map((review) => (review.id === reviewId ? { ...review, ...updates } : review)),
      )
      setSavingId(null)
      return true
    }

    const payload = {}
    if (updates.status) payload.status = updates.status
    if (Object.hasOwn(updates, 'suggestedReply')) payload.suggested_reply = updates.suggestedReply

    const { error } = await supabase.from('reviews').update(payload).eq('id', reviewId)

    if (error) {
      console.error('[Supabase] Review update error object:', error)
      console.error('[Supabase] Review update error JSON:', JSON.stringify(error, null, 2))
      setSupabaseError(
        `${error.message || 'Supabase update failed'}${error.code ? ` (${error.code})` : ''}`,
      )
      setSavingId(null)
      return false
    }

    setReviewRows((current) =>
      current.map((review) => (review.id === reviewId ? { ...review, ...updates } : review)),
    )
    setSavingId(null)
    return true
  }

  function startEditing(review) {
    setEditingId(review.id)
    setEditValue(review.suggestedReply || generateReply(review, businessName, settings.replyTone))
  }

  async function saveEdit(reviewId) {
    const saved = await updateReview(reviewId, { suggestedReply: editValue })
    if (saved) {
      setEditingId(null)
      setEditValue('')
    }
  }

  function downloadPdfPlaceholder() {
    console.info('[AURA PDF placeholder] Filtered reviews:', filteredReviews)
    const blob = new Blob([JSON.stringify(filteredReviews, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'aura-filtered-reviews.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">Reviews</h2>
          <p className="mt-1 text-sm text-slate-500">Manage and respond to customer reviews</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {isLoading
              ? 'Checking Supabase connection...'
              : isUsingFallback
                ? 'Using fallback data'
                : 'Connected to Supabase'}
          </p>
          {supabaseError && (
            <p className="mt-2 max-w-2xl text-xs font-medium leading-5 text-rose-600">
              Supabase error: {supabaseError}
            </p>
          )}
        </div>
        <button className="aura-button-secondary" type="button" onClick={downloadPdfPlaceholder}>
          <Download size={17} />
          Download PDF
        </button>
      </section>

      <section className="aura-card overflow-hidden p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-950">AURA Copilot (Auto Replier)</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Automatically generate replies for new reviews using your business tone of voice.
              </p>
              <button
                className={`mt-5 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-bold transition ${
                  autoReplyEnabled
                    ? 'border-violet-200 bg-violet-50 text-violet-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
                type="button"
                onClick={() => setAutoReplyEnabled((current) => !current)}
              >
                <span
                  className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                    autoReplyEnabled ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transition ${
                      autoReplyEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
                {autoReplyEnabled ? 'Auto Replier on' : 'Auto Replier off'}
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5">
            <p className="text-sm font-bold text-slate-500">Auto Reply Status</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {autoReplyEnabled ? 'Active' : 'Paused'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {autoReplyEnabled
                ? 'New pending reviews are treated as auto replied and can still be edited.'
                : 'Replies wait for review before approval or posting.'}
            </p>
          </div>
        </div>
      </section>

      <section className="aura-card p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {dateFilters.map((filter) => (
              <button
                key={filter}
                className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                  dateFilter === filter
                    ? 'bg-slate-950 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                type="button"
                onClick={() => setDateFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="aura-input max-w-44"
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value)}
            >
              <option value="all">All Ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} stars
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  className={`inline-flex items-center gap-1 rounded-2xl border px-3 py-2 text-sm font-bold ${
                    ratingFilter === String(rating)
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                  type="button"
                  onClick={() => setRatingFilter(String(rating))}
                >
                  {rating}
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                </button>
              ))}
            </div>
            <select
              className="aura-input ml-auto max-w-44"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FileText} label="Total Reviews" value={stats.total} />
        <StatCard icon={Star} label="Average Rating" value={stats.average} />
        <StatCard icon={Sparkles} label="Auto Replied" value={stats.autoReplied} />
        <StatCard icon={Clock} label="Needs Approval" value={stats.needsApproval} />
        <StatCard icon={Users} label="Name Mentions" value={stats.nameMentions} />
      </section>

      <section className="space-y-3">
        {isLoading && (
          <div className="aura-card p-8 text-center">
            <p className="font-semibold text-slate-950">Loading reviews...</p>
          </div>
        )}

        {!isLoading && filteredReviews.length === 0 && (
          <div className="aura-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Search size={22} />
            </div>
            <p className="text-lg font-bold text-slate-950">No reviews match these filters.</p>
            <p className="mt-2 text-sm text-slate-500">Try another date range, rating, or sort option.</p>
          </div>
        )}

        {filteredReviews.map((review) => {
          const isEditing = editingId === review.id
          const statusStyle = statusStyles[review.effectiveStatus] || statusStyles.pending

          return (
            <article key={review.id} className="aura-card p-5">
              <div className="grid gap-5 xl:grid-cols-[260px_1fr_1fr_220px]">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                      {getInitials(review.author)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-950">{review.author}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <CalendarDays size={13} />
                        {formatDateTime(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                      {review.source}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={15}
                          className={
                            index < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm leading-6 text-slate-600">{review.text}</p>
                  {review.mentions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {review.mentions.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700"
                        >
                          Mentions: {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    AURA Suggested Reply
                  </p>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {isEditing ? (
                      <textarea
                        className="aura-input min-h-32 resize-none bg-white"
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                      />
                    ) : (
                      <p className="text-sm leading-6 text-slate-700">
                        {review.suggestedReply ||
                          generateReply(review, businessName, settings.replyTone)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 xl:items-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyle}`}
                  >
                    {getStatusLabel(review.effectiveStatus)}
                  </span>
                  <p className="text-xs font-semibold text-slate-400">
                    {formatDateTime(review.createdAt)}
                  </p>

                  {isEditing ? (
                    <div className="flex w-full flex-wrap gap-2 xl:justify-end">
                      <button
                        className="aura-button-secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          setEditValue('')
                        }}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        className="aura-button disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={savingId === review.id}
                        type="button"
                        onClick={() => saveEdit(review.id)}
                      >
                        <Save size={16} />
                        {savingId === review.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex w-full flex-wrap gap-2 xl:justify-end">
                      {!autoReplyEnabled && review.effectiveStatus === 'pending' && (
                        <button
                          className="aura-button-secondary"
                          disabled={savingId === review.id}
                          type="button"
                          onClick={() => updateReview(review.id, { status: 'approved' })}
                        >
                          <CheckCircle2 size={16} />
                          Approve Reply
                        </button>
                      )}
                      <button
                        className="aura-button-secondary"
                        type="button"
                        onClick={() => startEditing(review)}
                      >
                        <Edit3 size={16} />
                        Edit Reply
                      </button>
                      {review.effectiveStatus !== 'posted' && (
                        <button
                          className="aura-button"
                          disabled={savingId === review.id}
                          type="button"
                          onClick={() => updateReview(review.id, { status: 'posted' })}
                        >
                          <Send size={16} />
                          Mark Posted
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
