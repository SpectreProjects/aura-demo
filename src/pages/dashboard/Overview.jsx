import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  Gift,
  MessageSquareText,
  Plus,
  SearchCheck,
  Star,
  UserPlus,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from './useDashboard'

const periodOptions = ['Day', 'Week', 'Month', 'Quarter', 'Year']

const accentStyles = {
  cyan: {
    glow: 'shadow-[0_0_52px_rgba(167,139,250,0.10)]',
    icon: 'border-violet-300/15 bg-violet-300/[0.07] text-violet-200',
    text: 'text-violet-200',
    stroke: '#c4b5fd',
  },
  emerald: {
    glow: 'shadow-[0_0_52px_rgba(167,139,250,0.10)]',
    icon: 'border-violet-300/15 bg-violet-300/[0.07] text-violet-200',
    text: 'text-violet-200',
    stroke: '#a78bfa',
  },
  violet: {
    glow: 'shadow-[0_0_52px_rgba(167,139,250,0.08)]',
    icon: 'border-violet-300/15 bg-violet-300/[0.07] text-violet-200',
    text: 'text-violet-200',
    stroke: '#8b5cf6',
  },
  amber: {
    glow: 'shadow-[0_0_52px_rgba(167,139,250,0.08)]',
    icon: 'border-violet-300/15 bg-violet-300/[0.07] text-violet-200',
    text: 'text-violet-200',
    stroke: '#7c3aed',
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
    <svg aria-hidden="true" className="h-12 w-24 overflow-visible" viewBox="0 0 96 48">
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
    <article className={`relative h-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0a0e] p-4 ${style.glow}`}>
      <div
        className="pointer-events-none absolute -right-10 top-4 h-28 w-28 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: style.stroke }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${style.icon}`}>
          <Icon size={18} />
        </span>
        <Sparkline accent={accent} data={sparkline} />
      </div>
      <div className="relative mt-4">
        <p className="text-xs font-bold text-slate-300">{label}</p>
        <p className="mt-2 text-3xl font-black leading-none tracking-tight text-white">{value}</p>
        <p className={`mt-3 text-xs font-black ${style.text}`}>{comparison}</p>
      </div>
    </article>
  )
}

function Panel({ action, children, icon: Icon, iconAccent = 'cyan', subtitle, title }) {
  const style = accentStyles[iconAccent]

  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#09090c] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${style.icon}`}>
              <Icon size={18} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-xs font-semibold text-slate-400">{subtitle}</p>}
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
    { color: '#8b5cf6', value: counts.positive },
    { color: '#f59e0b', value: counts.neutral },
    { color: '#ef4444', value: counts.negative },
  ]
  const radius = 54
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_1fr] lg:items-center">
      <div className="relative mx-auto h-56 w-56">
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
          <p className="text-4xl font-black tracking-tight text-white">{positivePercent}%</p>
          <p className="mt-1 text-xs font-bold text-slate-400">Guest satisfaction</p>
        </div>
      </div>

      <div className="space-y-5">
        {[
          ['Positive', counts.positive, positivePercent, 'bg-violet-400'],
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
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.035] px-3 text-xs font-black text-slate-200 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-violet-300/[0.06] hover:text-white"
      to={to}
    >
      {children}
      <ChevronRight size={15} />
    </Link>
  )
}

function ActivityRow({ accent = 'cyan', detail, icon: Icon, label, meta, pill, title }) {
  const style = accentStyles[accent]

  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${style.icon}`}>
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">{title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{detail}</p>
          </div>
          {pill && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${style.icon}`}>{pill}</span>
          )}
        </div>
        <p className="mt-2 text-[10px] font-bold text-slate-500">{meta}</p>
        {label && <p className={`mt-1 text-xs font-black ${style.text}`}>{label}</p>}
      </div>
    </div>
  )
}

function PendingApprovalRow({ approval }) {
  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-black text-white">{approval.name}</p>
        <p className="mt-1 text-xs font-bold text-violet-200">{approval.count} mention{approval.count === 1 ? '' : 's'}</p>
      </div>
      <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-400">"{approval.excerpt}"</p>
      <Link
        className="inline-flex h-9 items-center justify-center rounded-lg border border-violet-300/15 bg-violet-300/[0.07] px-4 text-xs font-black text-violet-100 transition hover:bg-violet-300/[0.12]"
        to="/dashboard/reviews"
      >
        Review
      </Link>
    </div>
  )
}

export default function Overview() {
  const [activePeriod, setActivePeriod] = useState('Month')
  const {
    account,
    nameApprovals = [],
    pointEvents = [],
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
  const businessName = String(account?.businessProfile?.business_name || 'Hilton Glasgow').replace(
    /\s+Demo$/i,
    '',
  )
  const hour = new Date().getHours()
  const greeting = hour >= 5 && hour < 12 ? 'Good Morning' : hour >= 12 && hour < 17 ? 'Good Afternoon' : 'Good Evening'
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
      accent: event.rating === 5 ? 'violet' : 'cyan',
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
  return (
    <div className="space-y-5 pb-12">
      <section className="border-b border-white/[0.055] pb-5">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white lg:text-[3.35rem]">
              {greeting}, let&apos;s get you up to speed on {businessName}.
            </h2>
            <p className="mt-5 text-lg font-normal text-slate-400">Your review recognition hub</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 lg:pt-14">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-300 px-4 text-xs font-black text-slate-950 shadow-[0_0_24px_rgba(167,139,250,0.16)] transition hover:bg-violet-200"
              to="/dashboard/staff"
            >
              Add Staff
              <Plus size={14} />
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-300 px-4 text-xs font-black text-slate-950 shadow-[0_0_24px_rgba(167,139,250,0.16)] transition hover:bg-violet-200"
              to="/dashboard/rewards"
            >
              Add reward
              <Plus size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-start gap-2 lg:justify-end">
          <div className="flex flex-wrap rounded-lg border border-white/[0.07] bg-[#0b0a0e] p-1">
            {periodOptions.map((period) => {
              const isActive = activePeriod === period

              return (
                <button
                  className={`h-9 rounded-lg px-4 text-xs font-black transition ${
                    isActive
                      ? 'bg-violet-300 text-slate-950'
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
            className="inline-flex h-11 items-center justify-center gap-3 rounded-lg border border-white/[0.07] bg-[#0b0a0e] px-4 text-xs font-black text-slate-200 transition hover:border-violet-300/20 hover:bg-violet-300/[0.05]"
            type="button"
          >
            <CalendarDays size={16} />
            {formatDateRange(selectedRange)}
            <ChevronDown size={15} />
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-[#0b0a0e] px-4 text-xs font-black text-slate-200 transition hover:border-violet-300/20 hover:bg-violet-300/[0.05]"
            type="button"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accent="cyan"
          comparison={comparisonLabel('+12%', activePeriod)}
          icon={MessageSquareText}
          label={`Reviews ${periodLabel(activePeriod)}`}
          sparkline={sparklineSets.reviews}
          value={periodOverview.reviews}
        />
        <MetricCard
          accent="violet"
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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel icon={Activity} iconAccent="cyan" subtitle={guestFeedbackLabel(activePeriod)} title="Customer Experience Score">
          <DonutChart counts={sentimentCounts} />
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm font-black text-white">Great work. Guests are recognising the service your team is delivering.</p>
          </div>
        </Panel>

        <div className="grid gap-4">
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
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs font-semibold text-slate-400">
                  No pending names need approval right now.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </section>

    </div>
  )
}
