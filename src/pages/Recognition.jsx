import { Download, MessageCircle, Sparkles, Star, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

const rewardThreshold = 50
const roleByStaff = {
  Caitlin: 'Reception',
  Emma: 'Front Desk',
  Daniel: 'Breakfast Team',
  Sophie: 'Guest Experience',
  John: 'Concierge',
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="aura-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function getWeeklyChange(staffMentions, name) {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  return staffMentions
    .filter((mention) => mention.staffName === name)
    .filter((mention) => {
      if (!mention.date) return true
      const date = new Date(mention.date)
      return Number.isNaN(date.getTime()) || date >= sevenDaysAgo
    })
    .reduce((total, mention) => total + mention.points, 0)
}

function StaffPerformanceCard({ rank, staff, staffMentions }) {
  const latestMention = staff.latestMention
  const weeklyChange = getWeeklyChange(staffMentions, staff.name)
  const progress = Math.min((staff.points / rewardThreshold) * 100, 100)

  return (
    <article className="aura-card p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-4">
            <div className="pt-1 text-sm font-bold text-slate-300">#{rank + 1}</div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
              {staff.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold tracking-tight text-slate-950">{staff.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {roleByStaff[staff.name] || 'Team member'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <p className="font-semibold text-slate-600">
                {staff.points} / {rewardThreshold} pts to next reward
              </p>
              <p className="font-bold text-violet-700">{Math.round(progress)}%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Mentions count</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{staff.mentions}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">5-star mentions</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{staff.fiveStarMentions}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Latest mention
            </p>
            {latestMention ? (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {latestMention.text.length > 150
                    ? `${latestMention.text.slice(0, 150)}...`
                    : latestMention.text}
                </p>
                <p className="mt-3 text-sm font-bold text-slate-950">
                  {latestMention.reviewAuthor}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No guest mention yet.</p>
            )}
          </div>
        </div>

        <div className="min-w-44 text-left lg:text-right">
          <p className="text-sm font-semibold text-slate-500">Total points</p>
          <p className="mt-2 text-5xl font-bold tracking-tight text-slate-950">{staff.points}</p>
          <p className="mt-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">
            +{weeklyChange} pts this week
          </p>
        </div>
      </div>
    </article>
  )
}

export default function Recognition({ staffRecognition, staffMentions }) {
  const [dateRange, setDateRange] = useState('30 Days')
  const [staffFilter, setStaffFilter] = useState('All Staff')
  const [mentionType, setMentionType] = useState('All Mentions')

  const sortedStaff = useMemo(
    () => [...staffRecognition].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
    [staffRecognition],
  )

  const filteredStaff = useMemo(
    () =>
      sortedStaff.filter((staff) => staffFilter === 'All Staff' || staff.name === staffFilter),
    [sortedStaff, staffFilter],
  )

  const stats = useMemo(
    () => ({
      totalMentions: staffMentions.length,
      positiveMentions: staffMentions.filter((mention) => mention.rating >= 4).length,
      pointsAwarded: staffRecognition.reduce((total, staff) => total + staff.points, 0),
      staffRecognised: staffRecognition.filter((staff) => staff.mentions > 0).length,
    }),
    [staffMentions, staffRecognition],
  )

  function exportPdfPlaceholder() {
    console.info('[AURA Recognition PDF placeholder]', {
      dateRange,
      staffFilter,
      mentionType,
      staff: filteredStaff,
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            People notice. We recognise it.
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              className="aura-input max-w-40"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              <option>7 Days</option>
              <option>30 Days</option>
              <option>This Month</option>
              <option>All Time</option>
            </select>
            <select
              className="aura-input max-w-44"
              value={staffFilter}
              onChange={(event) => setStaffFilter(event.target.value)}
            >
              <option>All Staff</option>
              {sortedStaff.map((staff) => (
                <option key={staff.name}>{staff.name}</option>
              ))}
            </select>
            <select
              className="aura-input max-w-48"
              value={mentionType}
              onChange={(event) => setMentionType(event.target.value)}
            >
              <option>All Mentions</option>
              <option>Positive Mentions</option>
              <option>5-Star Mentions</option>
            </select>
          </div>
        </div>
        <button className="aura-button-secondary" type="button" onClick={exportPdfPlaceholder}>
          <Download size={17} />
          Export PDF
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MessageCircle} label="Total mentions" value={stats.totalMentions} />
        <StatCard icon={Star} label="Positive mentions" value={stats.positiveMentions} />
        <StatCard icon={Sparkles} label="Points awarded" value={stats.pointsAwarded} />
        <StatCard icon={Users} label="Staff recognised" value={stats.staffRecognised} />
      </section>

      <section className="space-y-4">
        {filteredStaff.map((staff, index) => (
          <StaffPerformanceCard
            key={staff.name}
            rank={index}
            staff={staff}
            staffMentions={staffMentions}
          />
        ))}
      </section>
    </div>
  )
}
