import { Plus, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import StaffModal from './components/StaffModal'
import { useDashboard } from './useDashboard'

function rewardsEarned(person, rewards) {
  return rewards.filter((reward) => reward.is_active && Number(person.points || 0) >= Number(reward.points_required)).length
}

export default function Staff() {
  const { actions, categories, rewards, staff } = useDashboard()
  const [activeCategory, setActiveCategory] = useState('All')
  const [categoryName, setCategoryName] = useState('')
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)

  const visibleStaff = useMemo(
    () =>
      activeCategory === 'All'
        ? staff
        : staff.filter((person) => person.job_category === activeCategory),
    [activeCategory, staff],
  )

  async function handleAddCategory(event) {
    event.preventDefault()
    await actions.addCategory(categoryName)
    setCategoryName('')
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-[2rem] border border-white/10 bg-white/[0.065] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:flex-row lg:items-end">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
            Team
          </p>
          <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white">
            Manage the people who create memorable service.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Track mentions, sentiment, points and rewards across your whole team.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200"
          onClick={() => setIsStaffModalOpen(true)}
          type="button"
        >
          Add Staff
          <Plus size={18} />
        </button>
      </section>

      <section className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-white">Job categories</h3>
            <p className="mt-1 text-sm text-slate-400">Filter your team or add the categories your business uses.</p>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleAddCategory}>
            <input
              className="aura-field"
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="New category"
              value={categoryName}
            />
            <button className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200" type="submit">
              Add category
            </button>
          </form>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {['All', ...categories].map((category) => (
            <button
              className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                activeCategory === category
                  ? 'bg-white text-slate-950'
                  : 'border border-white/10 bg-white/8 text-slate-300 hover:bg-white/12 hover:text-white'
              }`}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {visibleStaff.length === 0 ? (
          <div className="rounded-[1.7rem] border border-dashed border-white/10 bg-white/[0.045] p-8 text-center">
            <Search className="mx-auto text-cyan-100" size={28} />
            <p className="mt-4 font-black text-white">No team members in this category</p>
            <p className="mt-2 text-sm text-slate-400">Add staff or choose a different category.</p>
          </div>
        ) : (
          visibleStaff.map((person) => (
            <article
              className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.09]"
              key={person.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950">
                    {person.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-2xl font-black tracking-tight text-white">{person.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-cyan-100">{person.job_title || 'Team member'}</p>
                    <p className="text-sm text-slate-400">
                      {person.job_category}
                      {person.employment_type ? ` · ${person.employment_type}` : ''}
                      {person.contractual_hours ? ` · ${person.contractual_hours} hrs` : ''}
                    </p>
                  </div>
                </div>
                <Users className="shrink-0 text-cyan-100" size={22} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ['Mentions', person.total_mentions],
                  ['Points', person.points],
                  ['Positive', person.positive_mentions],
                  ['Rewards', rewardsEarned(person, rewards)],
                ].map(([label, value]) => (
                  <div className="rounded-2xl border border-white/10 bg-[#050816]/72 p-3" key={label}>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-black text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Neutral reviews</p>
                  <p className="mt-2 text-2xl font-black text-white">{person.neutral_mentions}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Negative reviews</p>
                  <p className="mt-2 text-2xl font-black text-white">{person.negative_mentions}</p>
                </div>
              </div>

              <p className="mt-5 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm leading-6 text-slate-300">
                "{person.latest_excerpt}"
              </p>
            </article>
          ))
        )}
      </section>

      {isStaffModalOpen && (
        <StaffModal
          categories={categories}
          key="add-staff"
          onClose={() => setIsStaffModalOpen(false)}
          onSave={actions.addStaff}
          title="Add Staff"
        />
      )}
    </div>
  )
}
