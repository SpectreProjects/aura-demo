import { Award, Search, Share2, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

function initials(name) {
  return String(name || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function scoreFor(person, period) {
  return Number(period === 'lifetime' ? person.lifetime_points : person.monthly_points) || 0
}

function PodiumPlace({ person, period, rank }) {
  const stageHeight = {
    1: 'h-28 sm:h-32',
    2: 'h-20 sm:h-24',
    3: 'h-16 sm:h-20',
  }[rank]
  const avatarSize = rank === 1 ? 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]' : 'h-12 w-12 sm:h-14 sm:w-14'
  const mentionCount = Number(person?.mentions ?? person?.total_mentions ?? 0)

  return (
    <article className={`relative z-10 min-w-0 text-center text-[#f4f0ec] ${person ? '' : 'opacity-55'}`}>
      <span
        className={`mx-auto flex ${avatarSize} items-center justify-center rounded-full border-2 border-white/25 text-base font-black shadow-[0_12px_32px_rgba(0,0,0,0.42)] backdrop-blur sm:text-lg ${
          rank === 1 && person ? 'bg-[#d18a62] text-[#160f0b]' : 'bg-white/[0.08] text-white'
        }`}
      >
        {person ? initials(person.name) : '—'}
      </span>
      <h3 className="mt-2 truncate text-sm font-black tracking-[-0.02em] sm:mt-3 sm:text-base">
        {person?.name || `Place ${rank} open`}
      </h3>
      <p className="mt-1 truncate text-[10px] font-semibold text-white/55 sm:text-xs">
        {person?.job_title || person?.job_category || 'Awaiting recognition'}
      </p>
      <p className="mt-1.5 text-[10px] font-black text-white/90 sm:text-xs">
        {person ? scoreFor(person, period) : 0} pts · {mentionCount} {mentionCount === 1 ? 'mention' : 'mentions'}
      </p>
      <div className={`mt-3 flex ${stageHeight} items-center justify-center rounded-t-2xl border border-b-0 border-white/10 bg-gradient-to-b from-[#a96847]/35 to-white/[0.035] shadow-[inset_0_1px_rgba(255,255,255,0.10)]`}>
        <span className="text-4xl font-medium tracking-[-0.06em] text-white sm:text-5xl">{rank}</span>
      </div>
    </article>
  )
}

function Podium({ people, period }) {
  const places = [
    { person: people[1], rank: 2 },
    { person: people[0], rank: 1 },
    { person: people[2], rank: 3 },
  ]

  return (
    <section className="relative grid min-h-[310px] grid-cols-3 items-end gap-3 overflow-hidden bg-[radial-gradient(circle_at_50%_4%,rgba(209,138,98,0.22),transparent_34%),linear-gradient(135deg,#15110f_0%,#211710_54%,#0d0d0d_100%)] px-5 pt-7 sm:gap-5 sm:px-7 sm:pt-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.32)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />
      {places.map(({ person, rank }) => (
        <PodiumPlace key={person?.id || rank} period={period} person={person} rank={rank} />
      ))}
    </section>
  )
}

function RankingsList({ people, period, query, setQuery }) {
  const normalisedQuery = query.trim().toLowerCase()
  const visiblePeople = people.filter((person) =>
    !normalisedQuery || [person.name, person.job_title, person.job_category]
      .some((value) => String(value || '').toLowerCase().includes(normalisedQuery)),
  )

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between sm:px-5">
        <h3 className="text-lg font-medium tracking-[-0.025em] text-[#f4f0ec]">Full team ranking</h3>
        <label className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[#8e8883] transition focus-within:border-[#d18a62] focus-within:ring-4 focus-within:ring-[#a96847]/10 min-[520px]:w-[235px]">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Search staff or department"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#f4f0ec] outline-none placeholder:text-[#716c68]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff or department"
            type="search"
            value={query}
          />
        </label>
      </div>

      {visiblePeople.length ? (
        <div>
          {visiblePeople.map((person) => {
            const mentions = Number(person.mentions ?? person.total_mentions ?? 0)
            return (
              <article
                className="grid min-h-[80px] grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.07] px-4 py-3 last:border-b-0 min-[520px]:grid-cols-[2.5rem_minmax(0,1fr)_5.8rem_5.6rem] min-[520px]:gap-3 sm:px-5"
                key={person.id}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${person.rank === 1 ? 'bg-[#a96847]/20 text-[#d18a62]' : 'bg-white/[0.05] text-[#938d88]'}`}>
                  {person.rank}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${person.rank === 1 ? 'bg-[#d18a62] text-[#160f0b]' : 'bg-white/[0.07] text-[#b9b2ad]'}`}>
                    {initials(person.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#f4f0ec]">{person.name}</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-[#8f8984]">
                      {person.job_title || person.job_category || 'Team member'}
                    </p>
                  </div>
                </div>
                <div className="hidden min-[520px]:block">
                  <p className="text-sm font-black text-[#cbc5c0]">{mentions} {mentions === 1 ? 'mention' : 'mentions'}</p>
                  <p className="mt-1 text-[10px] font-semibold text-[#7d7772]">Guest reviews</p>
                </div>
                <div className="text-right min-[520px]:text-left">
                  <p className="whitespace-nowrap text-sm font-black text-[#d18a62]">{scoreFor(person, period)} points</p>
                  <p className="mt-1 text-[10px] font-semibold text-[#7d7772]">
                    {period === 'lifetime' ? `+${scoreFor(person, 'month')} this month` : 'This month'}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <Search className="mx-auto text-[#8e8883]" size={24} />
          <p className="mt-3 text-sm font-black text-[#f4f0ec]">No staff match that search</p>
          <p className="mt-1 text-xs font-semibold text-[#8e8883]">Try their name, job title or department.</p>
        </div>
      )}
    </div>
  )
}

export default function LeaderboardExperience({ businessName = 'your team', leaderboardUrl = '', people = [] }) {
  const [period, setPeriod] = useState('month')
  const [query, setQuery] = useState('')
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    if (!shareMessage) return undefined
    const timeoutId = window.setTimeout(() => setShareMessage(''), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [shareMessage])

  const rankedPeople = useMemo(
    () =>
      people
        .slice()
        .sort(
          (a, b) =>
            scoreFor(b, period) - scoreFor(a, period) ||
            Number(b.mentions ?? b.total_mentions ?? 0) - Number(a.mentions ?? a.total_mentions ?? 0) ||
            String(a.name).localeCompare(String(b.name)),
        )
        .map((person, index) => ({ ...person, rank: index + 1 })),
    [people, period],
  )

  async function copyLeaderboardLink() {
    if (!leaderboardUrl) return
    try {
      await navigator.clipboard.writeText(leaderboardUrl)
      setShareMessage('Leaderboard link copied.')
    } catch {
      setShareMessage('Your share link is available below.')
    }
  }

  if (!rankedPeople.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.035] p-12 text-center text-[#f4f0ec]">
        <Award className="mx-auto text-[#d18a62]" size={30} />
        <p className="mt-4 text-lg font-black">The leaderboard is ready for its first name</p>
        <p className="mt-2 text-sm font-semibold text-[#8e8883]">Active staff will appear here as review mentions and points arrive.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-leaderboard-experience w-full">
      <div className="mb-5 flex flex-col items-start justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#938d88]">
            <span className="h-2 w-2 rounded-full bg-[#d18a62] shadow-[0_0_0_5px_rgba(169,104,71,0.12)]" />
            Live recognition
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-[#f4f0ec] lg:text-[3.75rem]">
            {period === 'lifetime' ? 'All-time standings.' : 'This month’s standings.'}
          </h2>
          <p className="mt-3 text-sm font-semibold text-[#938d88]">Recognition from approved guest reviews at {businessName}.</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
          <div className="flex flex-1 gap-1 rounded-xl border border-white/10 bg-white/[0.035] p-1 sm:flex-none">
            {[
              ['month', 'This month'],
              ['lifetime', 'All time'],
            ].map(([value, label]) => (
              <button
                aria-pressed={period === value}
                className={`h-10 flex-1 rounded-lg px-4 text-xs font-black transition sm:flex-none ${period === value ? 'bg-[#d18a62] text-[#160f0b] shadow-[0_8px_20px_rgba(169,104,71,0.18)]' : 'text-[#938d88] hover:bg-white/[0.06]'}`}
                key={value}
                onClick={() => setPeriod(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-xs font-black text-[#f4f0ec] transition hover:-translate-y-0.5 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            disabled={!leaderboardUrl}
            onClick={copyLeaderboardLink}
            type="button"
          >
            <Share2 size={16} />
            Share leaderboard
          </button>
        </div>
      </div>

      <p aria-live="polite" className="mb-2 min-h-5 text-right text-xs font-bold text-[#d18a62]">{shareMessage}</p>

      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d0d0d] shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
        <Podium people={rankedPeople} period={period} />
        <RankingsList people={rankedPeople} period={period} query={query} setQuery={setQuery} />
      </section>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-[#8e8883]">
        <Star size={13} /> Rankings use points, then guest mentions, then name to settle ties.
      </p>
    </div>
  )
}
