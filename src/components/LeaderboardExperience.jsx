import { Award, Gift, LayoutGrid, List, Medal, Sparkles, Star, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'

const medalStyles = [
  {
    avatar: 'border-amber-300/35 bg-amber-300/12 text-amber-200 shadow-[0_0_46px_rgba(251,191,36,0.12)]',
    text: 'text-amber-300',
  },
  {
    avatar: 'border-slate-300/30 bg-slate-200/10 text-slate-200 shadow-[0_0_42px_rgba(226,232,240,0.08)]',
    text: 'text-slate-300',
  },
  {
    avatar: 'border-orange-400/30 bg-orange-400/10 text-orange-300 shadow-[0_0_42px_rgba(251,146,60,0.08)]',
    text: 'text-orange-400',
  },
]

function initials(name) {
  return String(name || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function achievementsFor(person, rank) {
  const achievements = []
  if (Number(person.mentions ?? person.total_mentions ?? 0) > 0) achievements.push('First recognition')
  if (Number(person.positive_mentions || 0) > 0) achievements.push('Guest favourite')
  if (rank <= 3) achievements.push('Podium performer')
  if (Number(person.lifetime_points || 0) >= 25) achievements.push('25 point club')
  return achievements.slice(0, 3)
}

function rewardSummary(person) {
  const earnedRewards = person.earned_rewards || []
  if (earnedRewards.length) return `Earned: ${earnedRewards[0].title}`
  if (person.next_reward?.title) return `Next: ${person.next_reward.title}`
  return 'No active reward'
}

function Progress({ value = 0 }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-300"
          style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }}
        />
      </div>
      <span className="text-[10px] font-black text-violet-200">{Number(value) || 0}%</span>
    </div>
  )
}

function Podium({ people }) {
  const topThree = people.slice(0, 3)

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#09080b] px-5 pb-6 pt-16 shadow-[0_30px_130px_rgba(0,0,0,0.38)] lg:px-8 lg:pt-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[100px]" />
      <div className="relative grid gap-4 lg:grid-cols-3 lg:items-end">
        {topThree.map((person, index) => {
          const medal = medalStyles[index]
          const achievements = achievementsFor(person, index + 1)
          return (
            <article
              className={`relative rounded-2xl border bg-[#0d0b11]/95 p-5 text-center ${
                index === 0
                  ? 'border-amber-300/20 lg:order-2 lg:-translate-y-8 lg:pb-8'
                  : index === 1
                    ? 'border-slate-300/15 lg:order-1'
                    : 'border-orange-400/15 lg:order-3'
              }`}
              key={person.id}
            >
              <span className="absolute right-4 top-4 rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[10px] font-black text-slate-400">
                Lifetime {Number(person.lifetime_points || 0)}
              </span>
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border text-2xl font-black ${medal.avatar}`}>
                {initials(person.name)}
              </div>
              <div className={`mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${medal.text}`}>
                {index === 0 ? <Trophy size={15} /> : <Medal size={15} />}
                Rank {index + 1}
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{person.name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {person.job_title || person.job_category || 'Team member'}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 border-y border-white/[0.07] py-4">
                <div>
                  <p className="text-3xl font-black text-white">{Number(person.monthly_points || 0)}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Monthly points</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{Number(person.mentions ?? person.total_mentions ?? 0)}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Mentions</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {achievements.map((achievement) => (
                  <span className="rounded-full border border-violet-300/15 bg-violet-300/[0.06] px-2.5 py-1 text-[10px] font-black text-violet-100" key={achievement}>
                    {achievement}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/25 p-3 text-left">
                <p className="flex items-center gap-2 text-xs font-black text-slate-300">
                  <Gift className="text-violet-200" size={14} />
                  {rewardSummary(person)}
                </p>
                {person.next_reward && <Progress value={person.next_reward.progress_percent} />}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function RankingsList({ people }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09090c] shadow-[0_24px_100px_rgba(0,0,0,0.3)]">
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[4rem_1.35fr_0.65fr_0.75fr_1.35fr_1.25fr_0.7fr] gap-4 border-b border-white/[0.07] bg-white/[0.025] px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            <span>Rank</span>
            <span>Team member</span>
            <span>Mentions</span>
            <span>This month</span>
            <span>Achievements</span>
            <span>Reward progress</span>
            <span className="text-right">Lifetime</span>
          </div>
          {people.map((person, index) => {
            const rank = Number(person.rank || index + 1)
            const medal = medalStyles[rank - 1]
            const achievements = achievementsFor(person, rank)
            return (
              <article
                className="grid grid-cols-[4rem_1.35fr_0.65fr_0.75fr_1.35fr_1.25fr_0.7fr] items-center gap-4 border-b border-white/[0.055] px-5 py-4 last:border-b-0"
                key={person.id}
              >
                <span className={`text-lg font-black ${medal?.text || 'text-slate-500'}`}>#{rank}</span>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-black ${medal?.avatar || 'border-white/10 bg-white/[0.04] text-slate-300'}`}>
                    {initials(person.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{person.name}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {person.job_title || person.job_category || 'Team member'}
                    </p>
                  </div>
                </div>
                <p className="font-black text-white">{Number(person.mentions ?? person.total_mentions ?? 0)}</p>
                <p className="font-black text-violet-200">{Number(person.monthly_points || 0)} pts</p>
                <div className="flex flex-wrap gap-1.5">
                  {achievements.slice(0, 2).map((achievement) => (
                    <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[9px] font-black text-slate-300" key={achievement}>
                      {achievement}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="truncate text-xs font-black text-slate-300">{rewardSummary(person)}</p>
                  {person.next_reward && <Progress value={person.next_reward.progress_percent} />}
                </div>
                <p className="text-right font-black text-slate-300">{Number(person.lifetime_points || 0)} pts</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function LeaderboardExperience({ people = [] }) {
  const [view, setView] = useState('list')
  const rankedPeople = useMemo(
    () =>
      people
        .slice()
        .sort(
          (a, b) =>
            Number(a.rank || Number.MAX_SAFE_INTEGER) - Number(b.rank || Number.MAX_SAFE_INTEGER) ||
            Number(b.monthly_points || 0) - Number(a.monthly_points || 0) ||
            String(a.name).localeCompare(String(b.name)),
        )
        .map((person, index) => ({ ...person, rank: person.rank || index + 1 })),
    [people],
  )

  if (!rankedPeople.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#09090c] p-12 text-center">
        <Award className="mx-auto text-violet-200" size={30} />
        <p className="mt-4 text-lg font-black text-white">The leaderboard is ready for its first name</p>
        <p className="mt-2 text-sm text-slate-500">Active staff will appear here as review mentions and points arrive.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
            <Sparkles size={14} /> Live recognition
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">This month&apos;s standings</h2>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.07] bg-[#09090c] p-1.5">
          {[
            ['list', List, 'List'],
            ['podium', LayoutGrid, 'Podium'],
          ].map(([value, Icon, label]) => (
            <button
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition ${
                view === value ? 'bg-violet-300 text-[#100722]' : 'text-slate-400 hover:text-white'
              }`}
              key={value}
              onClick={() => setView(value)}
              type="button"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'podium' && <Podium people={rankedPeople} />}
      <RankingsList people={rankedPeople} />

      <p className="flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-slate-600">
        <Star size={13} /> Rankings use monthly points, then mentions, then name to settle ties.
      </p>
    </div>
  )
}
