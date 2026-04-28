import { Edit3, Gift, Trash2, Users } from 'lucide-react'

export default function RewardCard({ reward, onDelete, onEdit }) {
  return (
    <article className="aura-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Gift size={21} />
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
          {reward.pointsRequired} pts
        </span>
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-950">{reward.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{reward.description}</p>
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
        <Users size={16} />
        {reward.staffRole || 'All staff'}
      </div>
      {(onEdit || onDelete) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onEdit && (
            <button className="aura-button-secondary flex-1" type="button" onClick={onEdit}>
              <Edit3 size={16} />
              Edit
            </button>
          )}
          {onDelete && (
            <button className="aura-button-secondary flex-1" type="button" onClick={onDelete}>
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  )
}
