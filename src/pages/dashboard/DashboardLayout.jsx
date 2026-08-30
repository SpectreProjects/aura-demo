import {
  BarChart3,
  Gift,
  Home,
  LogOut,
  MessageSquareText,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  defaultCategories,
  defaultPointsRules,
  defaultReviews,
  defaultRewards,
  defaultStaff,
} from '../../data/mvpData'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import {
  applyReviewToStaff,
  createStaffRecord,
  getPointsForRating,
} from '../../utils/mvpRecognition'

const STORAGE_KEY = 'aura-dashboard-state-v1'
const DEV_ACCOUNT_EMAIL = 'info@spectreprojects.co.uk'

const navItems = [
  { end: true, href: '/dashboard', icon: BarChart3, label: 'Overview' },
  { href: '/dashboard/reviews', icon: MessageSquareText, label: 'Reviews' },
  { href: '/dashboard/staff', icon: Users, label: 'Team' },
  { href: '/dashboard/rewards', icon: Gift, label: 'Rewards' },
]

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function uniqueNames(names) {
  return Array.from(new Set(names.filter(Boolean)))
}

function toSlug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function normalizeCategories(categories) {
  const source = categories?.length ? categories : defaultCategories
  return uniqueNames(source.map((category) => String(category.name || category).trim()).filter(Boolean))
}

function normalizePointsRules(pointsRules) {
  const source = Array.isArray(pointsRules)
    ? Object.fromEntries(pointsRules.map((rule) => [Number(rule.rating), Number(rule.points)]))
    : pointsRules || {}

  return {
    1: 0,
    2: 0,
    3: 0,
    4: Number(source[4] ?? defaultPointsRules[4] ?? 0),
    5: Number(source[5] ?? defaultPointsRules[5] ?? 0),
  }
}

function normalizeStaff(staff) {
  const source = staff?.length ? staff : defaultStaff
  const byName = new Map()

  defaultStaff.forEach((person) => byName.set(person.name.toLowerCase(), person))
  source.forEach((person) => {
    if (person?.name) byName.set(person.name.toLowerCase(), person)
  })

  return Array.from(byName.values())
    .map((person) => ({
      ...createStaffRecord(person.name),
      ...person,
      id: person.id || toSlug(person.name),
      job_title: person.job_title || '',
      job_category: person.job_category || 'Front of House',
      employment_type: person.employment_type || '',
      contractual_hours: person.contractual_hours || '',
      points: Number(person.points || 0),
      total_mentions: Number(person.total_mentions || 0),
      positive_mentions: Number(person.positive_mentions || 0),
      neutral_mentions: Number(person.neutral_mentions || 0),
      negative_mentions: Number(person.negative_mentions || 0),
      latest_excerpt: person.latest_excerpt || 'No reviews mentioning this team member yet.',
      created_at: person.created_at || new Date().toISOString(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function normalizeRewards(rewards) {
  const source = rewards?.length ? rewards : defaultRewards

  return source
    .map((reward) => ({
      ...reward,
      id: reward.id || createId('reward'),
      points_required: Number(reward.points_required || 0),
      is_active: Boolean(reward.is_active),
      created_at: reward.created_at || new Date().toISOString(),
    }))
    .sort((a, b) => Number(a.points_required) - Number(b.points_required))
}

function normalizeReviews(reviews) {
  return (reviews || [])
    .map((review) => ({
      ...review,
      id: review.id || createId('review'),
      rating: Number(review.rating || 0),
      mentioned_staff: Array.isArray(review.mentioned_staff) ? review.mentioned_staff : [],
      created_at: review.created_at || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function normalizeNameApprovals(approvals) {
  return (approvals || [])
    .map((approval) => ({
      ...approval,
      id: approval.id || createId('name'),
      rating: Number(approval.rating || 0),
      created_at: approval.created_at || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function normalizePointEvents(pointEvents) {
  return (pointEvents || [])
    .map((event) => ({
      ...event,
      id: event.id || createId('point'),
      staff_id: event.staff_id || toSlug(event.staff_name || 'staff'),
      staff_name: event.staff_name || 'Team member',
      review_id: event.review_id || '',
      points_awarded: Number(event.points_awarded || 0),
      rating: Number(event.rating || 0),
      reason: event.reason || `${event.rating || ''} star review mention`.trim(),
      created_at: event.created_at || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function findStaffByName(staff, name) {
  return staff.find((person) => person.name.toLowerCase() === String(name || '').toLowerCase())
}

function createPointEventsForReview(review, staff, pointsRules) {
  const pointsAwarded = getPointsForRating(review.rating, pointsRules)
  if (pointsAwarded <= 0) return []

  return uniqueNames(review.mentioned_staff || []).map((name) => {
    const person = findStaffByName(staff, name)
    const staffName = person?.name || name

    return {
      id: createId('point'),
      staff_id: person?.id || toSlug(staffName),
      staff_name: staffName,
      review_id: review.id,
      points_awarded: pointsAwarded,
      rating: Number(review.rating),
      reason: `${review.rating} star review mention`,
      created_at: new Date().toISOString(),
    }
  })
}

function buildDemoDashboardState(reviews) {
  let demoStaff = normalizeStaff(defaultStaff)
  const demoPointEvents = []

  reviews
    .slice()
    .reverse()
    .forEach((review) => {
      demoStaff = normalizeStaff(applyReviewToStaff(demoStaff, review, defaultPointsRules))
      demoPointEvents.push(...createPointEventsForReview(review, demoStaff, defaultPointsRules))
    })

  return {
    pointEvents: normalizePointEvents(demoPointEvents),
    reviews: normalizeReviews(reviews),
    staff: demoStaff,
  }
}

function readLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) throw new Error('No saved dashboard state')

    return {
      categories: normalizeCategories(saved.categories),
      nameApprovals: normalizeNameApprovals(saved.nameApprovals),
      pointEvents: normalizePointEvents(saved.pointEvents),
      pointsRules: normalizePointsRules(saved.pointsRules),
      rewards: normalizeRewards(saved.rewards),
      reviews: [],
      staff: normalizeStaff(saved.staff),
    }
  } catch {
    return {
      categories: defaultCategories,
      nameApprovals: [],
      pointEvents: [],
      pointsRules: defaultPointsRules,
      rewards: defaultRewards,
      reviews: [],
      staff: defaultStaff,
    }
  }
}

function isThisMonth(dateValue) {
  const date = new Date(dateValue)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function buildStaffRecord(form) {
  const base = createStaffRecord(form.name)

  return {
    ...base,
    id: form.id || base.id || createId('staff'),
    name: base.name,
    job_title: form.job_title?.trim() || '',
    job_category: form.job_category || 'Front of House',
    employment_type: form.employment_type || '',
    contractual_hours: form.contractual_hours?.toString().trim() || '',
  }
}

function Sidebar({ nameApprovalsCount }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/[0.07] bg-[#070908]/95 px-4 py-5 text-white backdrop-blur-2xl lg:flex lg:flex-col">
      <Link to="/" className="mb-9 flex items-center gap-3 rounded-xl px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200/20 bg-violet-300 text-[#100722] shadow-[0_0_36px_rgba(167,139,250,0.24)]">
          <Sparkles size={20} />
        </span>
        <span>
          <span className="block text-base font-black tracking-[0.12em]">AURA</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Review intelligence</span>
        </span>
      </Link>

      <nav className="space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-violet-300/45 ${
                isActive
                  ? 'border-violet-300/20 bg-violet-300/10 text-violet-200 shadow-[0_0_32px_rgba(167,139,250,0.08)]'
                  : 'border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-white'
              }`
            }
            end={item.end}
            key={item.href}
            to={item.href}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] text-current transition group-hover:bg-white/[0.06]">
              <item.icon size={17} />
            </span>
            {item.label}
            {item.href === '/dashboard/reviews' && nameApprovalsCount > 0 && (
              <span className="ml-auto rounded-full bg-violet-300 px-2 py-0.5 text-xs font-black text-[#100722]">
                {nameApprovalsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-200">
          <span className="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(167,139,250,0.85)]" />
          Workspace active
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Review monitoring will appear here once Google is connected.</p>
      </div>
    </aside>
  )
}

function MobileNav({ nameApprovalsCount }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-white/10 bg-[#070908]/95 p-2 text-white shadow-[0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:hidden">
      {navItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-violet-300/45 ${
              isActive ? 'bg-violet-300 text-[#100722]' : 'text-slate-400'
            }`
          }
          end={item.end}
          key={item.href}
          to={item.href}
        >
          <item.icon size={17} />
          {item.label}
          {item.href === '/dashboard/reviews' && nameApprovalsCount > 0 && (
            <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-violet-300" />
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isOverviewRoute = location.pathname === '/dashboard'
  const isLocalPreview = import.meta.env.DEV
  const initialState = useMemo(() => {
    if (!isLocalPreview) return readLocalState()

    const demoState = buildDemoDashboardState(defaultReviews)
    return {
      categories: defaultCategories,
      nameApprovals: [],
      pointEvents: demoState.pointEvents,
      pointsRules: defaultPointsRules,
      rewards: defaultRewards,
      reviews: demoState.reviews,
      staff: demoState.staff,
    }
  }, [isLocalPreview])
  const [businessProfile, setBusinessProfile] = useState(
    isLocalPreview ? { business_name: 'Hilton Glasgow Demo' } : null,
  )
  const [categories, setCategories] = useState(initialState.categories)
  const [nameApprovals, setNameApprovals] = useState(initialState.nameApprovals)
  const [pointEvents, setPointEvents] = useState(initialState.pointEvents)
  const [pointsRules, setPointsRules] = useState(initialState.pointsRules)
  const [rewards, setRewards] = useState(initialState.rewards)
  const [reviews, setReviews] = useState(initialState.reviews)
  const [staff, setStaff] = useState(initialState.staff)
  const [connectionStatus, setConnectionStatus] = useState(supabase ? 'checking' : 'demo')
  const [technicalNotice, setTechnicalNotice] = useState(
    supabase
      ? ''
      : 'The dashboard is running in demo mode because environment variables have not been added yet.',
  )
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return undefined

    let isMounted = true

    async function loadAccountDashboard() {
      setConnectionStatus('checking')

      try {
        const isDevAccount = user.email?.toLowerCase() === DEV_ACCOUNT_EMAIL
        const fallbackBusinessName = isDevAccount
          ? 'Hilton Glasgow Demo'
          : user.user_metadata?.business_name || 'My Business'
        const { data: existingProfile, error: profileLoadError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileLoadError) throw profileLoadError

        let profile = existingProfile

        if (!profile) {
          const { data: createdProfile, error: profileCreateError } = await supabase
            .from('business_profiles')
            .insert({
              business_name: fallbackBusinessName,
              user_id: user.id,
            })
            .select('*')
            .single()

          if (profileCreateError) throw profileCreateError
          profile = createdProfile
        }

        const visibleReviews = isDevAccount ? normalizeReviews(defaultReviews) : []
        const demoState = isDevAccount ? buildDemoDashboardState(visibleReviews) : null

        if (!isMounted) return
        setBusinessProfile(profile)
        setReviews(visibleReviews)
        setConnectionStatus('connected')
        setTechnicalNotice('')
        setCategories(defaultCategories)
        setNameApprovals([])
        setPointEvents(demoState?.pointEvents || [])
        setPointsRules(defaultPointsRules)
        setRewards(defaultRewards)
        setStaff(demoState?.staff || defaultStaff)
      } catch (error) {
        if (!isMounted) return
        console.error('[AURA dashboard] Account data connection failed:', error)
        setBusinessProfile(null)
        setConnectionStatus('demo')
        setReviews([])
        setTechnicalNotice(
          'AURA could not load your account workspace. Please refresh and try again.',
        )
      }
    }

    loadAccountDashboard()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categories, nameApprovals, pointEvents, pointsRules, rewards, reviews, staff }),
    )
  }, [categories, nameApprovals, pointEvents, pointsRules, rewards, reviews, staff])

  const overview = useMemo(() => {
    const reviewsThisMonth = reviews.filter((review) => isThisMonth(review.created_at))
    const pointsThisMonth = pointEvents
      .filter((event) => isThisMonth(event.created_at))
      .reduce((total, event) => total + Number(event.points_awarded || 0), 0)
    const totalMentions = staff.reduce(
      (total, person) => total + Number(person.total_mentions || 0),
      0,
    )

    return {
      activeRewards: rewards.filter((reward) => reward.is_active).length,
      nameApprovals: nameApprovals.length,
      pointsThisMonth,
      reviewsThisMonth: reviewsThisMonth.length,
      totalMentions,
    }
  }, [nameApprovals.length, pointEvents, rewards, reviews, staff])

  const leaderboard = useMemo(
    () =>
      staff
        .slice()
        .sort(
          (a, b) =>
            Number(b.points) - Number(a.points) ||
            Number(b.total_mentions) - Number(a.total_mentions) ||
            a.name.localeCompare(b.name),
        ),
    [staff],
  )

  async function addStaff(form) {
    const record = buildStaffRecord(form)
    const nextStaff = normalizeStaff([...staff.filter((person) => person.id !== record.id), record])

    setStaff(nextStaff)
    if (!categories.includes(record.job_category)) setCategories((current) => [...current, record.job_category])

    return record
  }

  async function approveName(approval, form) {
    const review = reviews.find((item) => item.id === approval.review_id)
    const record = buildStaffRecord({ ...form, name: form.name || approval.name })
    const existing = staff.find((person) => person.name.toLowerCase() === record.name.toLowerCase())
    const staffRecord = existing
      ? {
          ...existing,
          name: record.name,
          job_title: record.job_title,
          job_category: record.job_category,
          employment_type: record.employment_type,
          contractual_hours: record.contractual_hours,
        }
      : record
    const baseStaff = existing
      ? staff.map((person) =>
          person.name.toLowerCase() === record.name.toLowerCase() ? staffRecord : person,
        )
      : [...staff, staffRecord]
    let nextStaff = normalizeStaff(baseStaff)
    let nextReviews = reviews
    let nextPointEvents = []

    if (review) {
      const alreadyMentioned = review.mentioned_staff.some(
        (name) => name.toLowerCase() === staffRecord.name.toLowerCase(),
      )
      const reviewForAward = { ...review, mentioned_staff: [staffRecord.name] }

      if (!alreadyMentioned) {
        nextStaff = normalizeStaff(applyReviewToStaff(nextStaff, reviewForAward, pointsRules))
        nextPointEvents = createPointEventsForReview(reviewForAward, nextStaff, pointsRules)
      }

      const nextReview = {
        ...review,
        mentioned_staff: uniqueNames([...review.mentioned_staff, staffRecord.name]),
      }
      nextReviews = normalizeReviews(reviews.map((item) => (item.id === review.id ? nextReview : item)))
    }

    const nextApprovals = nameApprovals.filter((item) => item.id !== approval.id)
    const allPointEvents = normalizePointEvents([...nextPointEvents, ...pointEvents])

    setStaff(nextStaff)
    setReviews(nextReviews)
    setNameApprovals(nextApprovals)
    setPointEvents(allPointEvents)
    if (!categories.includes(staffRecord.job_category)) {
      setCategories((current) => [...current, staffRecord.job_category])
    }

  }

  async function ignoreName(approvalId) {
    setNameApprovals((current) => current.filter((approval) => approval.id !== approvalId))
  }

  async function addCategory(name) {
    const cleanName = name.trim()
    if (!cleanName || categories.includes(cleanName)) return

    setCategories((current) => [...current, cleanName])
  }

  async function saveReward(reward) {
    const nextReward = {
      ...reward,
      id: reward.id || createId('reward'),
      points_required: Number(reward.points_required || 1),
      is_active: Boolean(reward.is_active),
      created_at: reward.created_at || new Date().toISOString(),
    }
    setRewards((current) =>
      normalizeRewards([
        ...current.filter((item) => item.id !== nextReward.id),
        nextReward,
      ]),
    )
  }

  async function deleteReward(rewardId) {
    setRewards((current) => current.filter((reward) => reward.id !== rewardId))
  }

  async function updatePointsRule(rating, points) {
    const normalisedRating = Number(rating)
    const normalisedPoints = normalisedRating >= 4 ? Math.max(0, Number(points) || 0) : 0
    const nextRules = normalizePointsRules({
      ...pointsRules,
      [normalisedRating]: normalisedPoints,
    })

    setPointsRules(nextRules)
  }

  async function handleSignOut() {
    if (!supabase) return

    setIsSigningOut(true)
    const { error } = await supabase.auth.signOut()
    setIsSigningOut(false)

    if (error) {
      console.error('[Supabase Auth] Sign out failed:', error)
      setTechnicalNotice('We could not log you out just now. Please try again.')
      return
    }

    navigate('/login', { replace: true })
  }

  const dashboard = {
    actions: {
      addCategory,
      addStaff,
      approveName,
      deleteReward,
      ignoreName,
      saveReward,
      updatePointsRule,
    },
    account: {
      businessProfile,
      email: user?.email || '',
      user,
    },
    categories,
    connectionStatus,
    leaderboard,
    nameApprovals,
    overview,
    pointEvents,
    pointsRules,
    rewards,
    reviews,
    staff,
    technicalNotice,
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#000000] text-white">
      <div className="relative flex">
        <Sidebar nameApprovalsCount={nameApprovals.length} />

        <div className="min-w-0 flex-1 pb-28 lg:pb-0">
          {!isOverviewRoute && (
            <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#000000]/82 px-5 py-4 backdrop-blur-2xl sm:px-8 lg:px-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">Recognition workspace</p>
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    AURA Command Centre
                  </h1>
                </div>
                <Link
                  className="hidden h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/12 sm:inline-flex"
                  to="/"
                >
                  <Home size={17} />
                </Link>
              </div>
            </header>
          )}

          <section
            className={
              isOverviewRoute
                ? 'mx-auto max-w-[1680px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8'
                : 'mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8'
            }
          >
            <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black text-violet-200">
                  {businessProfile?.business_name || 'AURA workspace'}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{user?.email}</p>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-violet-300/20 hover:bg-violet-300/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSigningOut}
                onClick={handleSignOut}
                type="button"
              >
                <LogOut size={17} />
                {isSigningOut ? 'Logging out...' : 'Log out'}
              </button>
            </div>
            <Outlet context={dashboard} />
          </section>
        </div>
      </div>
      <MobileNav nameApprovalsCount={nameApprovals.length} />
    </main>
  )
}
