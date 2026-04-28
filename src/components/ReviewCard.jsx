import { CheckCircle2, Clock, Star } from 'lucide-react'
import { generateReply } from '../utils/generateReply'

export default function ReviewCard({ review, businessName, tone, compact = false }) {
  const isNegative = review.rating <= 2
  const reply = generateReply(review, businessName, tone)

  return (
    <article className="aura-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-950">{review.author}</h3>
            <span className="text-sm text-slate-400">{review.date}</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={16}
                className={index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
              />
            ))}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
            isNegative ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {isNegative ? <Clock size={14} /> : <CheckCircle2 size={14} />}
          {isNegative ? 'Needs approval' : 'Ready reply'}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{review.text}</p>

      {!compact && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Suggested reply
          </p>
          <p className="text-sm leading-6 text-slate-700">{reply}</p>
        </div>
      )}
    </article>
  )
}
