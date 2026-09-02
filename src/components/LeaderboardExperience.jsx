import { Award, Gift, Medal, Sparkles, Star, Trophy } from 'lucide-react'
import { useMemo } from 'react'

const medalStyles = [
  {
    avatar: 'border-amber-300/35 bg-amber-300/12 text-amber-200 shadow-[0_0_46px_rgba(251,191,36,0.12)]',
    text: 'text-amber-300',
    glow: 'shadow-[0_-32px_110px_rgba(245,158,11,0.18)]',
    podium: 'border-amber-300/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(55,26,83,0.28)_52%,rgba(10,7,14,0.98))]',
    face: 'border-amber-300/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(124,58,237,0.18))]',
  },
  {
    avatar: 'border-slate-300/30 bg-slate-200/10 text-slate-200 shadow-[0_0_42px_rgba(226,232,240,0.08)]',
    text: 'text-slate-300',
    glow: 'shadow-[0_-25px_100px_rgba(196,181,253,0.13)]',
    podium: 'border-slate-200/15 bg-[linear-gradient(180deg,rgba(226,232,240,0.09),rgba(76,29,149,0.2)_50%,rgba(9,7,13,0.98))]',
    face: 'border-slate-200/20 bg-[linear-gradient(135deg,rgba(226,232,240,0.13),rgba(109,40,217,0.16))]',
  },
  {
    avatar: 'border-orange-400/30 bg-orange-400/10 text-orange-300 shadow-[0_0_42px_rgba(251,146,60,0.08)]',
    text: 'text-orange-400',
    glow: 'shadow-[0_-22px_90px_rgba(251,146,60,0.1)]',
    podium: 'border-orange-300/15 bg-[linear-gradient(180deg,rgba(251,146,60,0.1),rgba(67,25,111,0.2)_50%,rgba(9,7,13,0.98))]',
    face: 'border-orange-300/20 bg-[linear-gradient(135deg,rgba(251,146,60,0.14),rgba(109,40,217,0.15))]',
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
  const podium = [
    {
      person: people[1],
      rank: 2,
      height: 'lg:min-h-[268px]',
      avatarSize: 'h-16 w-16 lg:h-[4.5rem] lg:w-[4.5rem]',
      nameSize: 'text-xl',
    },
    {
      person: people[0],
      rank: 1,
      height: 'lg:min-h-[310px]',
      avatarSize: 'h-20 w-20 lg:h-[5.25rem] lg:w-[5.25rem]',
      nameSize: 'text-2xl',
    },
    {
      person: people[2],
      rank: 3,
      height: 'lg:min-h-[252px]',
      avatarSize: 'h-16 w-16 lg:h-[4.5rem] lg:w-[4.5rem]',
      nameSize: 'text-xl',
    },
  ].filter(({ person }) => Boolean(person))

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-violet-300/[0.09] bg-[#050407] px-5 pb-5 pt-5 shadow-[0_30px_130px_rgba(0,0,0,0.5)] lg:min-h-[590px] lg:px-8 lg:pb-5 lg:pt-6">
      <div className="pointer-events-none absolute inset-x-[8%] top-0 h-[78%] rounded-[50%] bg-violet-700/[0.13] blur-[110px]" />
      <div className="pointer-events-none absolute left-1/2 top-[42%] h-56 w-56 -translate-x-1/2 rounded-full bg-amber-400/[0.09] blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.11] [background-image:radial-gradient(rgba(196,181,253,0.4)_0.7px,transparent_0.7px)] [background-size:8px_8px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <div className="relative flex flex-col gap-2 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
            <Sparkles size={13} /> Monthly recognition
          </p>
          <h3 className="mt-1.5 text-xl font-black tracking-tight text-white">The AURA podium</h3>
        </div>
        <p className="max-w-sm text-xs font-semibold leading-5 text-slate-500 sm:text-right">
          The team members making the biggest impression on guests this month.
        </p>
      </div>

      <div className="relative mx-auto mt-6 grid max-w-6xl gap-5 lg:grid-cols-3 lg:items-end lg:gap-0">
        {podium.map(({ person, rank, height, avatarSize, nameSize }) => {
          const medal = medalStyles[rank - 1]
          const achievements = achievementsFor(person, rank)
          return (
            <article
              className={`relative flex flex-col justify-end text-center ${rank === 1 ? 'lg:z-20' : 'lg:z-10'}`}
              key={person.id}
            >
              <div className={`relative z-10 mx-auto mb-4 ${rank === 1 ? 'lg:mb-5' : 'lg:mb-3'}`}>
                <span className="absolute -right-10 -top-2 rounded-full border border-white/[0.08] bg-black/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 backdrop-blur">
                  Lifetime {Number(person.lifetime_points || 0)}
                </span>
                <div className={`mx-auto flex ${avatarSize} items-center justify-center rounded-[1.35rem] border text-xl font-black ${medal.avatar}`}>
                  {initials(person.name)}
                </div>
                <h4 className={`mt-3 ${nameSize} font-black tracking-tight text-white`}>{person.name}</h4>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {person.job_title || person.job_category || 'Team member'}
                </p>
              </div>

              <div className={`relative min-h-[250px] overflow-hidden rounded-t-[1.7rem] border border-b-0 px-4 pb-4 pt-10 ${height} ${medal.podium} ${medal.glow}`}>
                <div className={`absolute inset-x-[-1px] top-0 h-8 border-b ${medal.face} [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)]`} />
                <div className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-current/20 bg-black/35 ${medal.text}`}>
                  {rank === 1 ? <Trophy size={20} /> : <Medal size={19} />}
                </div>
                <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.2em] ${medal.text}`}>Rank {rank}</p>

                <div className="mt-3 grid grid-cols-2 divide-x divide-white/[0.07] border-y border-white/[0.07] py-3">
                  <div>
                    <p className="text-xl font-black text-white">{Number(person.monthly_points || 0)}</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Monthly points</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{Number(person.mentions ?? person.total_mentions ?? 0)}</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Mentions</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {achievements.slice(0, 2).map((achievement) => (
                    <span className="rounded-full border border-violet-300/10 bg-violet-300/[0.06] px-2 py-1 text-[9px] font-black text-violet-100" key={achievement}>
                      {achievement}
                    </span>
                  ))}
                </div>

                <div className="mt-3 text-left">
                  <p className="flex items-center justify-center gap-2 text-[11px] font-black text-slate-300">
                    <Gift className="text-violet-200" size={13} />
                    {rewardSummary(person)}
                  </p>
                  {person.next_reward && <Progress value={person.next_reward.progress_percent} />}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="relative mx-auto mt-4 hidden w-fit items-center gap-2 rounded-xl border border-violet-300/10 bg-[#0b0710]/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-violet-100 shadow-[0_0_40px_rgba(124,58,237,0.16)] lg:flex">
        <Star size={13} /> Recognition earned from real guest reviews
      </div>
    </section>
  )
}

function RankingsList({ people }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-violet-300/[0.09] bg-[#08070a] shadow-[0_24px_100px_rgba(0,0,0,0.36)]">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-white">Team standings</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Every active team member, ranked for this month.</p>
        </div>
        <span className="w-fit rounded-full border border-violet-300/15 bg-violet-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-violet-200">
          {people.length} team members
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[4rem_1.35fr_0.65fr_0.75fr_1.35fr_1.25fr_0.7fr] gap-4 border-b border-violet-300/[0.08] bg-violet-950/[0.13] px-6 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
                className="grid grid-cols-[4rem_1.35fr_0.65fr_0.75fr_1.35fr_1.25fr_0.7fr] items-center gap-4 border-b border-white/[0.055] px-6 py-4 transition hover:bg-violet-300/[0.025] last:border-b-0"
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
    <div className="space-y-4">
      <div>
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
            <Sparkles size={14} /> Live recognition
          </p>
          <h2 className="mt-2 text-4xl font-medium leading-[1.08] tracking-[-0.045em] text-white lg:text-[3.35rem]">This month&apos;s standings</h2>
        </div>
      </div>

      <Podium people={rankedPeople} />
      <RankingsList people={rankedPeople} />

      <p className="flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-slate-600">
        <Star size={13} /> Rankings use monthly points, then mentions, then name to settle ties.
      </p>
    </div>
  )
}
