import { CheckCircle2, Clock, Edit3, Save, Send, Star, X } from 'lucide-react'
import { generateReply } from '../utils/generateReply'

export default function ReviewCard({
  review,
  businessName,
  tone,
  compact = false,
  editing = false,
  editValue = '',
  onApprove,
  onEdit,
  onEditChange,
  onMarkPosted,
  onSaveEdit,
  onCancelEdit,
}) {
  const isNegative = review.rating <= 2
  const reply = review.suggestedReply || generateReply(review, businessName, tone)
  const statusLabel =
    review.status === 'posted'
      ? 'Posted'
      : review.status === 'approved'
        ? 'Approved'
        : isNegative
          ? 'Needs approval'
          : 'Ready reply'

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
          {statusLabel}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{review.text}</p>

      {!compact && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Suggested reply
          </p>
          {editing ? (
            <textarea
              className="aura-input min-h-32 resize-none bg-white"
              value={editValue}
              onChange={(event) => onEditChange?.(event.target.value)}
            />
          ) : (
            <p className="text-sm leading-6 text-slate-700">{reply}</p>
          )}
        </div>
      )}

      {!compact && (onApprove || onMarkPosted || onEdit) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {editing ? (
            <>
              <button className="aura-button-secondary" type="button" onClick={onCancelEdit}>
                <X size={16} />
                Cancel
              </button>
              <button className="aura-button" type="button" onClick={onSaveEdit}>
                <Save size={16} />
                Save reply
              </button>
            </>
          ) : (
            <>
              <button className="aura-button-secondary" type="button" onClick={onEdit}>
                <Edit3 size={16} />
                Edit reply
              </button>
              <button className="aura-button-secondary" type="button" onClick={onApprove}>
                <CheckCircle2 size={16} />
                Approve reply
              </button>
              <button className="aura-button" type="button" onClick={onMarkPosted}>
                <Send size={16} />
                Mark posted
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}
