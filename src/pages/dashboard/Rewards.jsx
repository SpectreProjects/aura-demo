import { Edit3, Gift, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import RewardModal from './components/RewardModal'
import { useDashboard } from './useDashboard'

export default function Rewards() {
  const { actions, pointsRules, rewards } = useDashboard()
  const [editorReward, setEditorReward] = useState(null)

  function openEdit(reward) {
    setEditorReward(reward)
  }

  function openAdd() {
    setEditorReward({})
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:flex-row lg:items-end">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
            Rewards
          </p>
          <h2 className="max-w-3xl text-4xl font-medium leading-[1.08] tracking-[-0.045em] text-white lg:text-[3.35rem]">
            Manage rewards that turn praise into motivation.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Keep the incentive ladder simple, visible and easy for managers to update.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-300 px-5 py-3.5 text-sm font-black text-[#100722] shadow-[0_0_32px_rgba(167,139,250,0.12)] transition hover:-translate-y-0.5 hover:bg-violet-200"
          onClick={openAdd}
          type="button"
        >
          Add reward
          <Plus size={18} />
        </button>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="mb-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-200">Points rules</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-white">How reviews become points</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            4 and 5 star staff mentions earn points. 1 to 3 star reviews are tracked in staff stats but do not earn points.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          {[5, 4, 3, 2, 1].map((rating) => {
            const earnsPoints = rating >= 4

            return (
              <label className="rounded-xl border border-white/[0.07] bg-[#060807] p-4" key={rating}>
                <span className="block text-sm font-black text-white">
                  {rating} star{rating === 1 ? '' : 's'}
                </span>
                <input
                  className="aura-field mt-3 px-3 py-2 font-black disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!earnsPoints}
                  min="0"
                  onChange={(event) => actions.updatePointsRule(rating, event.target.value)}
                  type="number"
                  value={pointsRules[rating]}
                />
                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  {earnsPoints ? 'points per mention' : 'tracked only'}
                </span>
              </label>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rewards.map((reward) => (
          <article
            className="rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-300/20 hover:bg-[#111016]"
            key={reward.id}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-300 text-[#100722]">
                <Gift size={21} />
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  reward.is_active ? 'bg-violet-300 text-slate-950' : 'bg-white/10 text-slate-300'
                }`}
              >
                {reward.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="mt-5 text-xl font-black text-white">{reward.title}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{reward.description}</p>
            <p className="mt-5 rounded-xl border border-white/[0.07] bg-[#060807] px-4 py-3 text-sm font-black text-white">
              {reward.points_required} points required
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/12"
                onClick={() => openEdit(reward)}
                type="button"
              >
                <Edit3 size={16} />
                Edit
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-400/16"
                onClick={() => actions.deleteReward(reward.id)}
                type="button"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>
          </article>
        ))}
      </section>

      {editorReward && (
        <RewardModal
          initialReward={editorReward.id ? editorReward : null}
          key={editorReward.id || 'add-reward'}
          onClose={() => setEditorReward(null)}
          onSave={actions.saveReward}
        />
      )}
    </div>
  )
}
