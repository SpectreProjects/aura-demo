import {
  Archive,
  BadgeCheck,
  Edit3,
  Gift,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import StaffModal from './components/StaffModal'
import { useDashboard } from './useDashboard'

function ModalShell({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0a0e] p-6 text-white shadow-[0_34px_140px_rgba(0,0,0,0.6)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200">Private manager action</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
          </div>
          <button
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function PointsModal({ onClose, onSave, person }) {
  const [operation, setOperation] = useState('add')
  const [amount, setAmount] = useState(5)
  const [reason, setReason] = useState('Manager recognition award')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await onSave({
        amount: operation === 'deduct' ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
        reason,
        staffId: person.id,
      })
      onClose()
    } catch {
      setError('The points could not be updated. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} title={`Manage ${person.name}'s points`}>
      <div className="grid grid-cols-3 gap-3">
        {[
          ['This month', person.monthly_points],
          ['Lifetime', person.lifetime_points],
          ['Private balance', person.redeemable_points],
        ].map(([label, value]) => (
          <div className="rounded-xl border border-white/[0.07] bg-[#060607] p-3" key={label}>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.07] bg-[#060607] p-1.5">
          {['add', 'deduct'].map((value) => (
            <button
              className={`rounded-lg px-4 py-2.5 text-sm font-black capitalize transition ${
                operation === value ? 'bg-violet-300 text-[#100722]' : 'text-slate-400 hover:text-white'
              }`}
              key={value}
              onClick={() => setOperation(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
        <input
          className="aura-field"
          min="1"
          onChange={(event) => setAmount(event.target.value)}
          required
          type="number"
          value={amount}
        />
        <input
          className="aura-field"
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason for this adjustment"
          required
          value={reason}
        />
        {error && <p className="text-sm font-bold text-rose-300">{error}</p>}
        <button
          className="w-full rounded-xl bg-violet-300 px-5 py-3.5 text-sm font-black text-[#100722] transition hover:bg-violet-200 disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? 'Saving...' : `${operation === 'add' ? 'Add' : 'Deduct'} points`}
        </button>
      </form>
    </ModalShell>
  )
}

function RewardModal({ onClose, onRedeem, person, rewards }) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const activeRewards = rewards.filter((reward) => reward.is_active)

  async function redeem(reward) {
    setError('')
    setIsSaving(true)
    try {
      await onRedeem({ rewardId: reward.id, staffId: person.id })
      onClose()
    } catch {
      setError('The reward could not be redeemed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} title={`Reward ${person.name}`}>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-violet-300/15 bg-violet-300/[0.06] p-4">
        <div>
          <p className="text-xs font-bold text-slate-400">Private redeemable balance</p>
          <p className="mt-1 text-3xl font-black text-white">{person.redeemable_points} points</p>
        </div>
        <Gift className="text-violet-200" size={24} />
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {activeRewards.map((reward) => {
          const canRedeem = person.redeemable_points >= Number(reward.points_required)
          return (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#060607] p-4" key={reward.id}>
              <div className="min-w-0">
                <p className="truncate font-black text-white">{reward.title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{reward.points_required} points</p>
              </div>
              <button
                className="rounded-lg bg-violet-300 px-3 py-2 text-xs font-black text-[#100722] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-600"
                disabled={!canRedeem || isSaving}
                onClick={() => redeem(reward)}
                type="button"
              >
                {canRedeem ? 'Confirm given' : 'Not enough'}
              </button>
            </div>
          )
        })}
      </div>
      {error && <p className="mt-4 text-sm font-bold text-rose-300">{error}</p>}
    </ModalShell>
  )
}

export default function Staff() {
  const { actions, categories, rewards, staff } = useDashboard()
  const [activeCategory, setActiveCategory] = useState('All')
  const [categoryName, setCategoryName] = useState('')
  const [editorState, setEditorState] = useState(null)
  const [pointsPerson, setPointsPerson] = useState(null)
  const [query, setQuery] = useState('')
  const [rewardPerson, setRewardPerson] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const visibleStaff = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase()
    return staff.filter((person) => {
      const matchesCategory = activeCategory === 'All' || person.job_category === activeCategory
      const matchesStatus = showArchived ? true : person.is_active
      const matchesQuery =
        !normalisedQuery ||
        [person.name, person.job_title, person.job_category].some((value) =>
          String(value || '').toLowerCase().includes(normalisedQuery),
        )
      return matchesCategory && matchesStatus && matchesQuery
    })
  }, [activeCategory, query, showArchived, staff])

  async function handleAddCategory(event) {
    event.preventDefault()
    await actions.addCategory(categoryName)
    setCategoryName('')
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.22)] lg:flex-row lg:items-end">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
            Team management
          </p>
          <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white">Keep your team list organised.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Add, edit or archive staff. Private point adjustments and reward fulfilment live here too.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-300 px-5 py-3.5 text-sm font-black text-[#100722] shadow-[0_0_32px_rgba(167,139,250,0.12)] transition hover:-translate-y-0.5 hover:bg-violet-200"
          onClick={() => setEditorState({})}
          type="button"
        >
          Add Staff
          <Plus size={18} />
        </button>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 p-4 shadow-[0_22px_90px_rgba(0,0,0,0.18)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#060607] px-4">
            <Search className="text-slate-500" size={17} />
            <input
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search staff, role or department"
              value={query}
            />
          </label>
          <button
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition ${
              showArchived
                ? 'border-violet-300/20 bg-violet-300/[0.08] text-violet-100'
                : 'border-white/[0.07] bg-[#060607] text-slate-400 hover:text-white'
            }`}
            onClick={() => setShowArchived((current) => !current)}
            type="button"
          >
            <Archive size={16} />
            {showArchived ? 'Showing archived' : 'Show archived'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {['All', ...categories].map((category) => (
            <button
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                activeCategory === category
                  ? 'bg-violet-300 text-[#100722]'
                  : 'border border-white/[0.07] bg-white/[0.025] text-slate-400 hover:text-white'
              }`}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <form className="mt-4 flex max-w-md gap-2" onSubmit={handleAddCategory}>
          <input
            className="aura-field py-2.5"
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Add a department"
            value={categoryName}
          />
          <button className="shrink-0 rounded-xl border border-violet-300/15 bg-violet-300/[0.07] px-4 text-xs font-black text-violet-100" type="submit">
            Add
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 shadow-[0_22px_90px_rgba(0,0,0,0.18)]">
        <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.6fr_1.5fr] gap-4 border-b border-white/[0.07] bg-white/[0.025] px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 md:grid">
          <span>Staff member</span>
          <span>Role</span>
          <span>Department</span>
          <span>Status</span>
          <span className="text-right">Manager actions</span>
        </div>

        {visibleStaff.length ? (
          visibleStaff.map((person) => (
            <article
              className="grid gap-4 border-b border-white/[0.055] px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_1fr_0.6fr_1.5fr] md:items-center"
              key={person.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-300/20 bg-violet-300/[0.08] text-sm font-black text-violet-100">
                  {person.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-black text-white">{person.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Staff profile</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-300">{person.job_title || 'Team member'}</p>
              <p className="text-sm font-semibold text-slate-400">{person.job_category}</p>
              <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${
                person.is_active ? 'bg-violet-300/10 text-violet-200' : 'bg-white/[0.06] text-slate-500'
              }`}>
                {person.is_active ? 'Active' : 'Archived'}
              </span>
              <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                <button className="manager-action" onClick={() => setEditorState(person)} type="button">
                  <Edit3 size={14} /> Edit
                </button>
                <button className="manager-action" onClick={() => setPointsPerson(person)} type="button">
                  <SlidersHorizontal size={14} /> Points
                </button>
                <button className="manager-action" onClick={() => setRewardPerson(person)} type="button">
                  <Gift size={14} /> Reward
                </button>
                <button
                  className="manager-action"
                  onClick={() => actions.setStaffActive(person.id, !person.is_active)}
                  type="button"
                >
                  {person.is_active ? <Archive size={14} /> : <RotateCcw size={14} />}
                  {person.is_active ? 'Archive' : 'Restore'}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="p-10 text-center">
            <Users className="mx-auto text-violet-200" size={28} />
            <p className="mt-4 font-black text-white">No matching staff</p>
            <p className="mt-2 text-sm text-slate-500">Try another filter or add a staff member.</p>
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <BadgeCheck size={15} />
        Archived staff keep their history but disappear from the leaderboard.
      </div>

      {editorState && (
        <StaffModal
          categories={categories}
          initialStaff={editorState.id ? editorState : null}
          key={editorState.id || 'add-staff'}
          onAddCategory={actions.addCategory}
          onClose={() => setEditorState(null)}
          onSave={actions.addStaff}
          title={editorState.id ? `Edit ${editorState.name}` : 'Add Staff'}
        />
      )}
      {pointsPerson && (
        <PointsModal
          onClose={() => setPointsPerson(null)}
          onSave={actions.adjustPoints}
          person={pointsPerson}
        />
      )}
      {rewardPerson && (
        <RewardModal
          onClose={() => setRewardPerson(null)}
          onRedeem={actions.redeemReward}
          person={rewardPerson}
          rewards={rewards}
        />
      )}
    </div>
  )
}
