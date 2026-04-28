import { Medal, MessageCircle, Sparkles } from 'lucide-react'

export default function StaffCard({ staff, rank }) {
  const rankStyle =
    rank === 0
      ? 'bg-amber-100 text-amber-700'
      : rank === 1
        ? 'bg-slate-200 text-slate-700'
        : rank === 2
          ? 'bg-orange-100 text-orange-700'
          : 'bg-sky-100 text-sky-700'

  return (
    <article className="aura-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            {staff.name.slice(0, 1)}
          </div>
          <div>
            <h3 className="font-bold text-slate-950">{staff.name}</h3>
            <p className="text-sm text-slate-500">{staff.mentions} guest mentions</p>
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${rankStyle}`}>
          <Medal size={18} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <Sparkles className="mb-2 text-sky-600" size={17} />
          <p className="text-2xl font-bold text-slate-950">{staff.points}</p>
          <p className="text-xs font-semibold text-slate-500">Points</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <MessageCircle className="mb-2 text-emerald-600" size={17} />
          <p className="text-2xl font-bold text-slate-950">{staff.fiveStarMentions}</p>
          <p className="text-xs font-semibold text-slate-500">5-star mentions</p>
        </div>
      </div>
    </article>
  )
}
