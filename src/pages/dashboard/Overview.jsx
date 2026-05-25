import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  Gift,
  MessageSquareText,
  SearchCheck,
  Star,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNextReward } from '../../utils/mvpRecognition'
import { useDashboard } from './useDashboard'

const periodOptions = ['Day', 'Week', 'Month', 'Quarter', 'Year']

const accentStyles = {
  cyan: {
    glow: 'shadow-[0_0_52px_rgba(34,211,238,0.16)]',
    icon: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200',
    text: 'text-cyan-200',
    stroke: '#22d3ee',
  },
  emerald: {
    glow: 'shadow-[0_0_52px_rgba(16,185,129,0.14)]',
    icon: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
    text: 'text-emerald-200',
    stroke: '#10b981',
  },
  violet: {
    glow: 'shadow-[0_0_52px_rgba(168,85,247,0.16)]',
    icon: 'border-violet-300/20 bg-violet-400/10 text-violet-200',
    text: 'text-violet-200',
    stroke: '#a855f7',
  },
  amber: {
    glow: 'shadow-[0_0_52px_rgba(245,158,11,0.16)]',
    icon: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
    text: 'text-amber-200',
    stroke: '#f59e0b',
  },
}

const sparklineSets = {
  reviews: [15, 18, 22, 21, 27, 34, 31, 40, 37, 42, 39, 47],
  mentions: [10, 12, 11, 18, 24, 28, 29, 23, 27, 31, 38, 45],
  approvals: [4, 5, 8, 6, 7, 6, 9, 8, 11, 10, 12, 16],
  points: [12, 18, 18, 24, 22, 20, 27, 32, 30, 36, 41, 44],
  staffA: [8, 10, 9, 13, 15, 12, 17, 14, 16, 20],
  staffB: [6, 9, 12, 11, 14, 13, 18, 15, 19, 23],
  staffC: [5, 7, 6, 9, 8, 11, 10, 13, 12, 16],
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function getPeriodRange(period) {
  const now = new Date()
  const end = endOfDay(now)

  if (period === 'Day') {
    return { end, start: startOfDay(now) }
  }

  if (period === 'Week') {
    const start = startOfDay(now)
    start.setDate(start.getDate() - 6)
    return { end, start }
  }

  if (period === 'Quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
    return { end, start: new Date(now.getFullYear(), quarterStartMonth, 1) }
  }

  if (period === 'Year') {
    return { end, start: new Date(now.getFullYear(), 0, 1) }
  }

  return { end, start: new Date(now.getFullYear(), now.getMonth(), 1) }
}

function isWithinRange(dateValue, range) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  return date >= range.start && date <= range.end
}

function formatRangeDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatDateRange(range) {
  const start = formatRangeDate(range.start)
  const end = formatRangeDate(range.end)
  return start === end ? start : `${start} - ${end}`
}

function periodLabel(period) {
  if (period === 'Day') return 'today'
  return `this ${period.toLowerCase()}`
}

function guestFeedbackLabel(period) {
  if (period === 'Day') return "Based on today's guest feedback"
  return `Based on ${periodLabel(period)}'s guest feedback`
}

function comparisonLabel(value, period) {
  return `${value} vs previous ${period.toLowerCase()}`
}

function initials(name) {
  return String(name || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatRelativeTime(dateValue) {
  const date = new Date(dateValue)
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000))

  if (Number.isNaN(date.getTime())) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}

function Sparkline({ accent = 'cyan', data = sparklineSets.reviews }) {
  const stroke = accentStyles[accent]?.stroke || accentStyles.cyan.stroke
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 92 + 2
      const y = 44 - ((value - min) / range) * 34
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg aria-hidden="true" className="h-14 w-28 overflow-visible" viewBox="0 0 96 48">
      <defs>
        <linearGradient id={`sparkline-${accent}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.36" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        points={points}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.7"
      />
      <polygon fill={`url(#sparkline-${accent})`} points={`2,46 ${points} 94,46`} />
      <circle cx="94" cy={points.split(' ').at(-1)?.split(',')[1] || 12} fill={stroke} r="2.8" />
    </svg>
  )
}

function MetricCard({ accent, comparison, icon: Icon, label, sparkline, value }) {
  const style = accentStyles[accent]

  return (
    <article className={`relative h-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#07111f]/78 p-5 ${style.glow}`}>
      <div
        className="pointer-events-none absolute -right-10 top-4 h-28 w-28 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: style.stroke }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${style.icon}`}>
          <Icon size={23} />
        </span>
        <Sparkline accent={accent} data={sparkline} />
      </div>
      <div className="relative mt-4">
        <p className="text-sm font-bold text-slate-300">{label}</p>
        <p className="mt-2 text-4xl font-black leading-none tracking-tight text-white">{value}</p>
        <p className={`mt-3 text-sm font-black ${style.text}`}>{comparison}</p>
      </div>
    </article>
  )
}

function Panel({ action, children, icon: Icon, iconAccent = 'cyan', subtitle, title }) {
  const style = accentStyles[iconAccent]

  return (
    <section className="rounded-[1.35rem] border border-white/10 bg-[#07111f]/78 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${style.icon}`}>
              <Icon size={23} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-2xl font-black tracking-tight text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-sm font-semibold text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function DonutChart({ counts }) {
  const total = counts.positive + counts.neutral + counts.negative
  const safeTotal = total || 1
  const positivePercent = Math.round((counts.positive / safeTotal) * 100)
  const segments = [
    { color: '#10b981', value: counts.positive },
    { color: '#f59e0b', value: counts.neutral },
    { color: '#ef4444', value: counts.negative },
  ]
  const radius = 54
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-center">
      <div className="relative mx-auto h-64 w-64">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" fill="none" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="17" />
          {segments.map((segment) => {
            const length = total ? (segment.value / safeTotal) * circumference : 0
            const dashOffset = -offset
            offset += length

            return (
              <circle
                cx="70"
                cy="70"
                fill="none"
                key={segment.color}
                r={radius}
                stroke={segment.color}
                strokeDasharray={`${length} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                strokeWidth="17"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-5xl font-black tracking-tight text-white">{positivePercent}%</p>
          <p className="mt-1 text-sm font-bold text-slate-400">Guest satisfaction</p>
        </div>
      </div>

      <div className="space-y-5">
        {[
          ['Positive', counts.positive, positivePercent, 'bg-emerald-400'],
          ['Neutral', counts.neutral, Math.round((counts.neutral / safeTotal) * 100), 'bg-amber-400'],
          ['Negative', counts.negative, Math.round((counts.negative / safeTotal) * 100), 'bg-rose-400'],
        ].map(([label, count, percent, dotClass]) => (
          <div className="flex items-center justify-between gap-4 text-sm" key={label}>
            <span className="flex items-center gap-3 font-bold text-slate-300">
              <span className={`h-3 w-3 rounded-full ${dotClass}`} />
              {label}
            </span>
            <span className="font-black text-slate-200">
              {percent}% ({count})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionButton({ children, to }) {
  return (
    <Link
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.08] hover:text-white"
      to={to}
    >
      {children}
      <ChevronRight size={17} />
    </Link>
  )
}

function TopPerformerCard({ person, rank }) {
  const accents = ['amber', 'cyan', 'violet']
  const accent = accents[rank] || 'cyan'
  const style = accentStyles[accent]
  const changes = [35, 18, 12]
  const sparkline = [sparklineSets.staffA, sparklineSets.staffB, sparklineSets.staffC][rank]

  return (
    <article
      className={`rounded-[1.2rem] border bg-[#081422]/88 p-5 text-center ${
        rank === 0 ? 'border-amber-300/50 shadow-[0_0_42px_rgba(245,158,11,0.16)]' : 'border-white/10'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-slate-950 ${rank === 0 ? 'bg-amber-300' : 'bg-white/70'}`}>
          {rank + 1}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${style.icon}`}>
          +{changes[rank] || 8} pts
        </span>
      </div>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl font-black text-white">
        {initials(person.name)}
      </div>
      <h4 className="mt-4 truncate text-2xl font-black text-white">{person.name}</h4>
      <p className="mt-1 truncate text-sm font-semibold text-slate-400">{person.job_title || person.job_category}</p>
      <p className={`mt-5 text-5xl font-black tracking-tight ${style.text}`}>
        {Number(person.points || 0)}
        <span className="ml-1 text-lg">pts</span>
      </p>
      <p className="mt-1 text-sm font-bold text-slate-400">{Number(person.total_mentions || 0)} mentions</p>
      <div className="mt-4 flex justify-center">
        <Sparkline accent={accent} data={sparkline} />
      </div>
      <p className={`mt-1 text-sm font-black ${style.text}`}>+ {changes[rank] || 8} pts vs last month</p>
    </article>
  )
}

function ActivityRow({ accent = 'cyan', detail, icon: Icon, label, meta, pill, title }) {
  const style = accentStyles[accent]

  return (
    <div className="grid grid-cols-[3rem_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${style.icon}`}>
        <Icon size={21} />
      </span>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{detail}</p>
          </div>
          {pill && (
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${style.icon}`}>{pill}</span>
          )}
        </div>
        <p className="mt-2 text-xs font-bold text-slate-500">{meta}</p>
        {label && <p className={`mt-1 text-xs font-black ${style.text}`}>{label}</p>}
      </div>
    </div>
  )
}

function PendingApprovalRow({ approval }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[12rem_1fr_auto] sm:items-center">
      <div>
        <p className="text-base font-black text-white">{approval.name}</p>
        <p className="mt-1 text-sm font-bold text-violet-200">{approval.count} mention{approval.count === 1 ? '' : 's'}</p>
      </div>
      <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-400">"{approval.excerpt}"</p>
      <Link
        className="inline-flex h-11 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 px-5 text-sm font-black text-violet-100 transition hover:bg-violet-400/16"
        to="/dashboard/reviews"
      >
        Review
      </Link>
    </div>
  )
}

function RewardProgressRow({ accent, item }) {
  const style = accentStyles[accent]

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-base font-black text-white">
          {initials(item.person.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-base font-black text-white">{item.person.name}</p>
              <p className="truncate text-sm font-semibold text-slate-400">{item.reward.title}</p>
            </div>
            <p className="shrink-0 text-right text-sm font-black text-slate-200">
              {item.current} / {item.required} pts
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ backgroundColor: style.stroke, width: `${item.progress}%` }}
            />
          </div>
        </div>
      </div>
      <p className={`text-right text-sm font-black ${style.text}`}>{item.toGo} pts to go</p>
    </div>
  )
}

export default function Overview() {
  const [activePeriod, setActivePeriod] = useState('Month')
  const {
    leaderboard = [],
    nameApprovals = [],
    pointEvents = [],
    rewards = [],
    reviews = [],
  } = useDashboard()
  const selectedRange = useMemo(() => getPeriodRange(activePeriod), [activePeriod])
  const periodReviews = useMemo(
    () => reviews.filter((review) => isWithinRange(review.created_at, selectedRange)),
    [reviews, selectedRange],
  )
  const periodPointEvents = useMemo(
    () => pointEvents.filter((event) => isWithinRange(event.created_at, selectedRange)),
    [pointEvents, selectedRange],
  )
  const periodApprovals = useMemo(
    () => nameApprovals.filter((approval) => isWithinRange(approval.created_at, selectedRange)),
    [nameApprovals, selectedRange],
  )
  const periodOverview = useMemo(
    () => ({
      nameApprovals: periodApprovals.length,
      points: periodPointEvents.reduce((total, event) => total + Number(event.points_awarded || 0), 0),
      reviews: periodReviews.length,
      totalMentions: periodReviews.reduce(
        (total, review) => total + Number(review.mentioned_staff?.length || 0),
        0,
      ),
    }),
    [periodApprovals.length, periodPointEvents, periodReviews],
  )
  const sentimentCounts = {
    positive: periodReviews.filter((review) => Number(review.rating) >= 4).length,
    neutral: periodReviews.filter((review) => Number(review.rating) === 3).length,
    negative: periodReviews.filter((review) => Number(review.rating) <= 2).length,
  }
  const topStaff = leaderboard.slice(0, 3)
  const pendingApprovals = Object.values(
    periodApprovals.reduce((groups, approval) => {
      const key = approval.name.toLowerCase()
      const current = groups[key] || { count: 0, excerpt: approval.review_excerpt, name: approval.name }
      return {
        ...groups,
        [key]: {
          ...current,
          count: current.count + 1,
          excerpt: current.excerpt || approval.review_excerpt,
        },
      }
    }, {}),
  ).slice(0, 3)
  const activityRows = [
    ...periodPointEvents.slice(0, 2).map((event) => ({
      accent: event.rating === 5 ? 'emerald' : 'cyan',
      created_at: event.created_at,
      detail: `Mentioned in a ${event.rating} star review`,
      icon: Star,
      meta: formatRelativeTime(event.created_at),
      pill: `+${event.points_awarded} pts`,
      title: `${event.staff_name} earned points`,
    })),
    ...periodApprovals.slice(0, 1).map((approval) => ({
      accent: 'violet',
      created_at: approval.created_at,
      detail: `"${approval.name}" found in a review`,
      icon: UserPlus,
      meta: formatRelativeTime(approval.created_at),
      pill: 'New',
      title: 'New name detected',
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const visibleActivityRows = activityRows.length
    ? activityRows.slice(0, 4)
    : [
        {
          accent: 'cyan',
          detail: '4 and 5 star mentions will appear here',
          icon: Star,
          meta: 'No point activity yet',
          pill: '0 pts',
          title: 'Points earned',
        },
        {
          accent: 'violet',
          detail: 'Unknown names from reviews will appear here',
          icon: UserPlus,
          meta: 'No pending names yet',
          pill: 'New',
          title: 'New name detected',
        },
        {
          accent: 'amber',
          detail: 'Reward unlocks will appear when staff qualify',
          icon: Gift,
          meta: 'No unlocks yet',
          pill: 'Reward',
          title: 'Reward unlocked',
        },
      ]
  const rewardProgress = leaderboard
    .map((person) => {
      const reward = getNextReward(person, rewards)
      const current = Number(person.points || 0)
      const required = Number(reward?.points_required || 0)
      return reward && required
        ? {
            current,
            person,
            progress: Math.min(100, Math.round((current / required) * 100)),
            required,
            reward,
            toGo: Math.max(0, required - current),
          }
        : null
    })
    .filter(Boolean)
    .sort((a, b) => a.toGo - b.toGo)
    .slice(0, 3)

  return (
    <div className="space-y-8 pb-12">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Overview</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-white lg:text-5xl">
            AURA Command Centre
          </h2>
          <p className="mt-3 text-lg font-semibold text-slate-400">Your review recognition hub.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-wrap rounded-2xl border border-white/10 bg-[#07111f]/78 p-1 shadow-[0_18px_70px_rgba(0,0,0,0.22)]">
            {periodOptions.map((period) => {
              const isActive = activePeriod === period

              return (
                <button
                  className={`h-10 rounded-xl px-4 text-sm font-black transition ${
                    isActive
                      ? 'bg-emerald-300 text-slate-950 shadow-[0_0_26px_rgba(16,185,129,0.22)]'
                      : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                  }`}
                  key={period}
                  onClick={() => setActivePeriod(period)}
                  type="button"
                >
                  {period}
                </button>
              )
            })}
          </div>
          <button
            className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#07111f]/78 px-5 text-sm font-black text-slate-200 shadow-[0_18px_70px_rgba(0,0,0,0.22)] transition hover:bg-white/[0.07]"
            type="button"
          >
            <CalendarDays size={18} />
            {formatDateRange(selectedRange)}
            <ChevronDown size={17} />
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#07111f]/78 px-5 text-sm font-black text-slate-200 shadow-[0_18px_70px_rgba(0,0,0,0.22)] transition hover:bg-white/[0.07]"
            type="button"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accent="cyan"
          comparison={comparisonLabel('+12%', activePeriod)}
          icon={MessageSquareText}
          label={`Reviews ${periodLabel(activePeriod)}`}
          sparkline={sparklineSets.reviews}
          value={periodOverview.reviews}
        />
        <MetricCard
          accent="emerald"
          comparison={comparisonLabel('+15%', activePeriod)}
          icon={Users}
          label="Total mentions"
          sparkline={sparklineSets.mentions}
          value={periodOverview.totalMentions}
        />
        <MetricCard
          accent="violet"
          comparison="New names found"
          icon={UserPlus}
          label="Pending approvals"
          sparkline={sparklineSets.approvals}
          value={periodOverview.nameApprovals}
        />
        <MetricCard
          accent="amber"
          comparison={comparisonLabel('+22%', activePeriod)}
          icon={Star}
          label={`Points ${periodLabel(activePeriod)}`}
          sparkline={sparklineSets.points}
          value={periodOverview.points}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel icon={Activity} iconAccent="cyan" subtitle={guestFeedbackLabel(activePeriod)} title="Customer Experience Score">
          <DonutChart counts={sentimentCounts} />
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-base font-black text-white">Great work. Guests are recognising the service your team is delivering.</p>
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel
            action={<Activity className="text-slate-400" size={23} />}
            iconAccent="cyan"
            title="Recent activity"
          >
            <div className="space-y-3">
              {visibleActivityRows.slice(0, 4).map((row, index) => (
                <ActivityRow key={`${row.title}-${index}`} {...row} />
              ))}
            </div>
            <div className="mt-4">
              <ActionButton to="/dashboard/reviews">View all activity</ActionButton>
            </div>
          </Panel>

          <Panel
            action={<ActionButton to="/dashboard/reviews">View all pending</ActionButton>}
            icon={SearchCheck}
            iconAccent="violet"
            subtitle="Names found in reviews but not yet on your team"
            title="Pending approvals"
          >
            <div className="space-y-3">
              {pendingApprovals.length ? (
                pendingApprovals
                  .slice(0, 2)
                  .map((approval) => <PendingApprovalRow approval={approval} key={approval.name} />)
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-slate-400">
                  No pending names need approval right now.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </section>

      <section>
        <Panel
          action={<ActionButton to="/dashboard/staff">View all team</ActionButton>}
          icon={Trophy}
          iconAccent="amber"
          subtitle="Based on points earned from recognised review mentions"
          title="Top performers this month"
        >
          <div className="grid gap-5 lg:grid-cols-3">
            {topStaff.map((person, index) => (
              <TopPerformerCard key={person.id} person={person} rank={index} />
            ))}
          </div>
        </Panel>
      </section>

      <section>
        <Panel
          action={<ActionButton to="/dashboard/rewards">View all rewards</ActionButton>}
          icon={Gift}
          iconAccent="violet"
          subtitle="See who's close to unlocking rewards"
          title="Rewards progress"
        >
          <div className="space-y-4">
            {rewardProgress.length ? (
              rewardProgress.map((item, index) => (
                <RewardProgressRow
                  accent={['emerald', 'amber', 'violet'][index] || 'cyan'}
                  item={item}
                  key={`${item.person.id}-${item.reward.id}`}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-slate-400">
                Add active rewards to show progress here.
              </div>
            )}
          </div>
        </Panel>
      </section>
    </div>
  )
}
