import { CheckCircle2, MessageSquareText, SearchCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { createExcerpt } from '../../utils/mvpRecognition'
import StaffModal from './components/StaffModal'
import { useDashboard } from './useDashboard'

const initialForm = {
  customer_name: '',
  rating: 5,
  text: '',
}

export default function Reviews() {
  const { actions, categories, nameApprovals, reviews } = useDashboard()
  const [form, setForm] = useState(initialForm)
  const [publishResult, setPublishResult] = useState(null)
  const [selectedApproval, setSelectedApproval] = useState(null)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handlePublish(event) {
    event.preventDefault()
    const result = await actions.publishReview(form)
    setPublishResult(result)
    setForm(initialForm)
  }

  async function handleApproveStaff(staffForm) {
    if (!selectedApproval) return
    await actions.approveName(selectedApproval, staffForm)
    setSelectedApproval(null)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-[2rem] border border-white/10 bg-white/[0.065] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:flex-row lg:items-end">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
            Reviews
          </p>
          <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white">
            Create test reviews and recognise great service.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Publish a manual review, find staff names and award points for 4 and 5 star mentions.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#050816]/70 p-4">
          <p className="text-sm font-bold text-slate-400">New names found</p>
          <p className="mt-2 text-4xl font-black text-white">{nameApprovals.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl"
          onSubmit={handlePublish}
        >
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,0.16)]">
              <MessageSquareText size={21} />
            </span>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">Manual review creator</h3>
              <p className="text-sm leading-6 text-slate-400">Use real wording to test the recognition flow.</p>
            </div>
          </div>

          <input
            className="aura-field"
            onChange={(event) => updateField('customer_name', event.target.value)}
            placeholder="Customer name"
            required
            value={form.customer_name}
          />

          <div className="mt-4 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${
                  Number(form.rating) === rating
                    ? 'border-white bg-white text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,0.16)]'
                    : 'border-white/10 bg-white/8 text-slate-300 hover:bg-white/12 hover:text-white'
                }`}
                key={rating}
                onClick={() => updateField('rating', rating)}
                type="button"
              >
                {rating}★
              </button>
            ))}
          </div>

          <textarea
            className="aura-textarea mt-4 min-h-44"
            onChange={(event) => updateField('text', event.target.value)}
            placeholder="Example: Caitlin was excellent and Maya looked after our table beautifully."
            required
            value={form.text}
          />

          <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200" type="submit">
            Publish review
            <SearchCheck size={18} />
          </button>
        </form>

        <div className="space-y-6">
          {publishResult && (
            <section className="rounded-[1.7rem] border border-emerald-300/20 bg-emerald-400/10 p-5 text-emerald-50 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                  <CheckCircle2 size={22} />
                </span>
                <div>
                  <h3 className="font-black">Review published</h3>
                  <p className="mt-2 text-sm leading-6 text-emerald-100">
                    {publishResult.matchedNames.length
                      ? `Staff found: ${publishResult.matchedNames.join(', ')}. Points awarded: ${publishResult.pointsAwarded}.`
                      : 'No existing team members were matched yet.'}
                  </p>
                  {publishResult.newNames.length > 0 && (
                    <p className="mt-2 text-sm font-bold text-white">
                      Couldn&apos;t find: {publishResult.newNames.join(', ')}.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="mb-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">New names found</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-white">
                Couldn&apos;t find these members of staff
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                These names appeared in reviews, but they&apos;re not in your team yet. Add them to track the mention; 4 and 5 star mentions also earn points.
              </p>
            </div>

            {nameApprovals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.045] p-6 text-sm font-semibold text-slate-400">
                No new names need approval right now.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {nameApprovals.map((approval) => (
                  <article className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-white" key={approval.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-100">Detected name</p>
                        <h4 className="mt-1 text-2xl font-black">{approval.name}</h4>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                        {approval.rating} star{approval.rating === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-amber-50">"{approval.review_excerpt}"</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200"
                        onClick={() => setSelectedApproval(approval)}
                        type="button"
                      >
                        <UserPlus size={17} />
                        Add to team
                      </button>
                      <button
                        className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/12"
                        onClick={() => actions.ignoreName(approval.id)}
                        type="button"
                      >
                        Ignore
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <h3 className="text-2xl font-black tracking-tight text-white">Recent reviews</h3>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.045] p-6 text-sm font-semibold text-slate-400">
              No reviews have been published yet.
            </div>
          ) : (
            reviews.slice(0, 6).map((review) => (
              <article className="rounded-3xl border border-white/10 bg-[#050816]/72 p-4" key={review.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{review.customer_name}</p>
                    <p className="mt-1 text-sm text-slate-400">{review.mentioned_staff.length ? review.mentioned_staff.join(', ') : 'No team members matched'}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                    {review.rating}★
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{createExcerpt(review.text, 150)}</p>
              </article>
            ))
          )}
        </div>
      </section>

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
