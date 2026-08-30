import {
  AlertTriangle,
  CheckCircle2,
  MessageSquareText,
  Search,
  Sparkles,
  Star,
  UserPlus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { generateReply } from '../../utils/generateReply'
import StaffModal from './components/StaffModal'
import { useDashboard } from './useDashboard'

const filters = ['All', 'Positive', 'Needs attention']

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
  return generateReply(
    { author: review.customer_name || 'there', rating: Number(review.rating || 0) },
    businessName || 'our team',
  )
}

export default function Reviews() {
  const { account, actions, categories, nameApprovals, reviews } = useDashboard()
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [selectedReviewId, setSelectedReviewId] = useState(reviews[0]?.id || null)

  const businessName = account?.businessProfile?.business_name || 'your business'
  const visibleReviews = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()

    return reviews.filter((review) => {
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Positive' && Number(review.rating) >= 4) ||
        (activeFilter === 'Needs attention' && Number(review.rating) <= 3)
      const matchesQuery =
        !cleanQuery ||
        review.customer_name?.toLowerCase().includes(cleanQuery) ||
        review.text?.toLowerCase().includes(cleanQuery)

      return matchesFilter && matchesQuery
    })
  }, [activeFilter, query, reviews])
  const selectedReview =
    reviews.find((review) => review.id === selectedReviewId) || visibleReviews[0] || reviews[0]
  const positiveCount = reviews.filter((review) => Number(review.rating) >= 4).length
  const attentionCount = reviews.filter((review) => Number(review.rating) <= 3).length

  async function handleApproveStaff(staffForm) {
    if (!selectedApproval) return
    await actions.approveName(selectedApproval, staffForm)
    setSelectedApproval(null)
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
            Review inbox
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white lg:text-5xl">Customer feedback</h2>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-400">
            Read every review, check AURA&apos;s response and keep track of feedback that needs attention.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2 text-xs font-black text-emerald-200">
          <Sparkles size={15} />
          Preview workspace
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['All reviews', reviews.length, MessageSquareText],
          ['Positive', positiveCount, CheckCircle2],
          ['Needs attention', attentionCount, AlertTriangle],
          ['Replies ready', reviews.length, Sparkles],
        ].map(([label, value, Icon]) => (
          <article className="rounded-2xl border border-white/[0.07] bg-[#0a0d0b]/90 p-4" key={label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200">
                <Icon size={17} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0a0d0b]/90 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                  activeFilter === filter
                    ? 'bg-emerald-300 text-[#06110c] shadow-[0_0_28px_rgba(110,231,183,0.15)]'
                    : 'border border-white/[0.07] bg-white/[0.025] text-slate-400 hover:text-white'
                }`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
          <label className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#060807] px-4 py-2.5 lg:w-80">
            <Search className="shrink-0 text-slate-500" size={17} />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reviews"
              value={query}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-3">
          {visibleReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0a0d0b]/80 p-10 text-center">
              <MessageSquareText className="mx-auto text-emerald-200" size={28} />
              <p className="mt-4 font-black text-white">No reviews in this view</p>
              <p className="mt-2 text-sm text-slate-500">Try another filter or search term.</p>
            </div>
          ) : (
            visibleReviews.map((review) => {
              const isSelected = selectedReview?.id === review.id
              const needsAttention = Number(review.rating) <= 3

              return (
                <button
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? 'border-emerald-300/35 bg-emerald-300/[0.065] shadow-[0_0_44px_rgba(110,231,183,0.07)]'
                      : 'border-white/[0.07] bg-[#0a0d0b]/90 hover:border-emerald-300/20 hover:bg-[#0d120f]'
                  }`}
                  key={review.id}
                  onClick={() => setSelectedReviewId(review.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-black text-white">{review.customer_name}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                            needsAttention
                              ? 'border border-amber-300/20 bg-amber-300/10 text-amber-200'
                              : 'border border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200'
                          }`}
                        >
                          {needsAttention ? 'Needs attention' : 'Reply ready'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {stars(review.rating).map((filled, index) => (
                          <Star
                            className={filled ? 'fill-emerald-300 text-emerald-300' : 'text-white/10'}
                            key={index}
                            size={14}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold text-slate-500">{formatReviewDate(review.created_at)}</span>
                      </div>
                    </div>
                    <span className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-black text-slate-300">
                      Google
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm font-medium leading-6 text-slate-300">{review.text}</p>
                  {review.mentioned_staff?.length > 0 && (
                    <p className="mt-4 text-xs font-black text-emerald-200">
                      Mentions {review.mentioned_staff.join(', ')}
                    </p>
                  )}
                </button>
              )
            })
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          {selectedReview ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0d0b]/95 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
              <div className="border-b border-white/[0.07] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Selected review</p>
                    <h3 className="mt-2 text-2xl font-black text-white">{selectedReview.customer_name}</h3>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2">
                    <Star className="fill-emerald-300 text-emerald-300" size={15} />
                    <span className="text-sm font-black text-emerald-100">{selectedReview.rating}.0</span>
                  </div>
                </div>
                <p className="mt-5 text-sm font-medium leading-7 text-slate-300">{selectedReview.text}</p>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                  <Sparkles size={15} />
                  AURA reply
                </div>
                <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.055] p-4">
                  <p className="text-sm font-medium leading-7 text-slate-200">
                    {getReply(selectedReview, businessName)}
                  </p>
                </div>
                {Number(selectedReview.rating) <= 3 && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100">
                    <AlertTriangle className="mt-0.5 shrink-0" size={17} />
                    We recommend checking this reply before it is sent.
                  </div>
                )}
                <button
                  className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm font-black text-slate-500"
                  disabled
                  type="button"
                >
                  Google publishing comes later
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0a0d0b]/80 p-10 text-center text-sm text-slate-500">
              Select a review to see the response.
            </div>
          )}
        </aside>
      </section>

      {nameApprovals.length > 0 && (
        <section className="rounded-2xl border border-white/[0.07] bg-[#0a0d0b]/90 p-5">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Names to confirm</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Is this someone on your team?</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {nameApprovals.map((approval) => (
              <article className="rounded-xl border border-white/[0.07] bg-[#060807] p-4" key={approval.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-black text-white">{approval.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">&ldquo;{approval.review_excerpt}&rdquo;</p>
                  </div>
                  <span className="rounded-lg bg-emerald-300 px-2.5 py-1 text-xs font-black text-[#06110c]">{approval.rating}★</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-[#06110c] transition hover:bg-emerald-200"
                    onClick={() => setSelectedApproval(approval)}
                    type="button"
                  >
                    <UserPlus size={17} />
                    Add to team
                  </button>
                  <button
                    className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-300 transition hover:text-white"
                    onClick={() => actions.ignoreName(approval.id)}
                    type="button"
                  >
                    Not staff
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedApproval && (
        <StaffModal
          categories={categories}
          initialName={selectedApproval.name}
          key={selectedApproval.id}
          onClose={() => setSelectedApproval(null)}
          onSave={handleApproveStaff}
          title="Add this person to your team"
        />
      )}
    </div>
  )
}
