import {
  Archive,
  BadgeCheck,
  Edit3,
  Gift,
  ListFilter,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import TypewriterIntro from '../../components/TypewriterIntro'
import PointsModal from './components/PointsModal'
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
  const { account, actions, categories, rewards, staff } = useDashboard()
  const [activeCategory, setActiveCategory] = useState('All')
  const [editorState, setEditorState] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [pointsPerson, setPointsPerson] = useState(null)
  const [query, setQuery] = useState('')
  const [rewardPerson, setRewardPerson] = useState(null)
  const [statusFilter, setStatusFilter] = useState('current')

  const businessName = String(account?.businessProfile?.business_name || 'your business').replace(/\s+Demo$/i, '')
  const intro = `Here’s everyone making ${businessName} what it is.`

  const visibleStaff = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase()
    return staff.filter((person) => {
      const matchesCategory = activeCategory === 'All' || person.job_category === activeCategory
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'current' ? person.is_active : !person.is_active)
      const matchesQuery =
        !normalisedQuery ||
        [person.name, person.job_title, person.job_category].some((value) =>
          String(value || '').toLowerCase().includes(normalisedQuery),
        )
      return matchesCategory && matchesStatus && matchesQuery
    })
  }, [activeCategory, query, staff, statusFilter])

  return (
    <div className="space-y-9 pb-12">
      <section className="flex h-28 items-center overflow-hidden border-b border-white/[0.055]">
        <TypewriterIntro key={intro} text={intro} />
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <label className="flex h-12 min-w-0 basis-full items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0b0a0e]/90 px-4 sm:flex-1 sm:basis-auto">
          <Search className="text-slate-500" size={17} />
          <input
            aria-label="Search staff, role or department"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff, role or department"
            type="search"
            value={query}
          />
        </label>
        <div className="relative">
          <button
            aria-expanded={filterOpen}
            aria-haspopup="menu"
            aria-label="Filter team"
            className={`relative inline-flex h-12 w-12 items-center justify-center rounded-xl border transition ${filterOpen || activeCategory !== 'All' || statusFilter !== 'current' ? 'border-[#3867F4]/40 bg-[#3867F4]/10 text-[#3867F4]' : 'border-white/[0.07] bg-[#0b0a0e]/90 text-slate-400 hover:text-white'}`}
            onClick={() => setFilterOpen((current) => !current)}
            type="button"
          >
            <ListFilter size={18} />
            {(activeCategory !== 'All' || statusFilter !== 'current') && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#3867F4]" />}
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-14 z-30 w-64 rounded-2xl border border-white/[0.1] bg-[#111315] p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]" role="menu">
              <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Department</p>
              <div className="max-h-52 space-y-1 overflow-y-auto">
                {['All', ...categories].map((category) => (
                  <button
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-bold transition ${activeCategory === category ? 'bg-[#3867F4] text-white' : 'text-slate-300 hover:bg-white/[0.06]'}`}
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    role="menuitemradio"
                    aria-checked={activeCategory === category}
                    type="button"
                  >
                    {category}
                    {activeCategory === category ? <BadgeCheck size={15} /> : null}
                  </button>
                ))}
              </div>
              <div className="my-3 border-t border-white/[0.08]" />
              <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Staff status</p>
              <div className="grid grid-cols-3 gap-1">
                {[['current', 'Current'], ['archived', 'Archived'], ['all', 'All']].map(([value, label]) => (
                  <button
                    className={`rounded-lg px-2 py-2 text-[11px] font-black transition ${statusFilter === value ? 'bg-[#3867F4] text-white' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#3867F4] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2f5be0]"
          onClick={() => setEditorState({})}
          type="button"
        >
          Add Staff
          <Plus size={18} />
        </button>
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
