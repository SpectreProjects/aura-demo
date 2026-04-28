import { Plus } from 'lucide-react'
import { useState } from 'react'
import RewardCard from '../components/RewardCard'

const initialForm = {
  name: '',
  description: '',
  pointsRequired: '',
  staffRole: '',
}

export default function Rewards({ rewards, setRewards }) {
  const [form, setForm] = useState(initialForm)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function addReward(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.description.trim() || !form.pointsRequired) return

    setRewards((current) => [
      {
        id: `reward-${Date.now()}`,
        name: form.name.trim(),
        description: form.description.trim(),
        pointsRequired: Number(form.pointsRequired),
        staffRole: form.staffRole.trim() || 'All staff',
      },
      ...current,
    ])
    setForm(initialForm)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <section className="aura-card h-fit p-5">
        <h2 className="text-xl font-bold text-slate-950">Create reward</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Rewards save to localStorage for this browser.
        </p>
        <form className="mt-6 space-y-4" onSubmit={addReward}>
          <input
            className="aura-input"
            placeholder="Reward name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
          <textarea
            className="aura-input min-h-28 resize-none"
            placeholder="Description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
          <input
            className="aura-input"
            min="1"
            placeholder="Points required"
            type="number"
            value={form.pointsRequired}
            onChange={(event) => updateField('pointsRequired', event.target.value)}
          />
          <input
            className="aura-input"
            placeholder="Optional staff role"
            value={form.staffRole}
            onChange={(event) => updateField('staffRole', event.target.value)}
          />
          <button className="aura-button w-full" type="submit">
            <Plus size={18} />
            Add reward
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Reward catalogue</h2>
            <p className="text-sm text-slate-500">{rewards.length} active rewards</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </div>
      </section>
    </div>
  )
}
