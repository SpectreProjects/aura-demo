import {
  BarChart3,
  Gift,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sparkles,
  Star,
  Trophy,
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
const defaultAutoReplySettings = { delayUnit: 'hours', delayValue: 2, enabled: true }

const navItems = [
  { end: true, href: '/dashboard', icon: BarChart3, label: 'Overview' },
  { href: '/dashboard/reviews', icon: Star, label: 'Reviews' },
  { href: '/dashboard/staff', icon: Users, label: 'Team' },
  { href: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/dashboard/rewards', icon: Gift, label: 'Rewards' },
  { href: '/dashboard/settings', icon: Settings2, label: 'Settings' },
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
  const source = Array.isArray(staff) ? staff : []
  const byName = new Map()

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
      is_active: person.is_active !== false,
      points: Number(person.points || 0),
      monthly_points: Number(person.monthly_points ?? person.points ?? 0),
      lifetime_points: Number(person.lifetime_points ?? person.points ?? 0),
      redeemable_points: Number(person.redeemable_points ?? person.points ?? 0),
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

function normalizeAutoReplySettings(settings) {
  const delayUnit = ['minutes', 'hours', 'days'].includes(settings?.delayUnit)
    ? settings.delayUnit
    : defaultAutoReplySettings.delayUnit

  return {
    delayUnit,
    delayValue: Math.max(0, Number(settings?.delayValue ?? defaultAutoReplySettings.delayValue)),
    enabled: settings?.enabled !== false,
  }
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
      points_delta: Number(event.points_delta ?? event.points_awarded ?? 0),
      points_awarded: Number(event.points_delta ?? event.points_awarded ?? 0),
      event_type: event.event_type || 'review_award',
      include_in_monthly: event.include_in_monthly !== false,
      include_in_lifetime: event.include_in_lifetime !== false,
      include_in_balance: event.include_in_balance !== false,
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
      autoReplySettings: normalizeAutoReplySettings(saved.autoReplySettings),
      categories: normalizeCategories(saved.categories),
      nameApprovals: normalizeNameApprovals(saved.nameApprovals),
      pointEvents: normalizePointEvents(saved.pointEvents),
      pointsRules: normalizePointsRules(saved.pointsRules),
      redemptions: Array.isArray(saved.redemptions) ? saved.redemptions : [],
      rewards: normalizeRewards(saved.rewards),
      reviews: [],
      staff: normalizeStaff(saved.staff),
    }
  } catch {
    return {
      autoReplySettings: defaultAutoReplySettings,
      categories: defaultCategories,
      nameApprovals: [],
      pointEvents: [],
      pointsRules: defaultPointsRules,
      redemptions: [],
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
    created_at: form.created_at || base.created_at,
    id: form.id || base.id || createId('staff'),
    latest_excerpt: form.latest_excerpt || base.latest_excerpt,
    name: base.name,
    job_title: form.job_title?.trim() || '',
    job_category: form.job_category || 'Front of House',
    is_active: form.is_active !== false,
    negative_mentions: Number(form.negative_mentions || 0),
    neutral_mentions: Number(form.neutral_mentions || 0),
    points: Number(form.points || 0),
    positive_mentions: Number(form.positive_mentions || 0),
    total_mentions: Number(form.total_mentions || 0),
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ''),
  )
}

function addPointTotals(staff, pointEvents) {
  return staff.map((person) => {
    const events = pointEvents.filter(
      (event) => event.staff_id === person.id || event.staff_name?.toLowerCase() === person.name.toLowerCase(),
    )
    const fallbackPoints = Number(person.points || 0)
    const monthlyPoints = events.length
      ? events
          .filter((event) => event.include_in_monthly && isThisMonth(event.created_at))
          .reduce((total, event) => total + Number(event.points_delta || 0), 0)
      : fallbackPoints
    const lifetimePoints = events.length
      ? events
          .filter((event) => event.include_in_lifetime)
          .reduce((total, event) => total + Number(event.points_delta || 0), 0)
      : Number(person.lifetime_points ?? fallbackPoints)
    const redeemablePoints = events.length
      ? Math.max(
          0,
          events
            .filter((event) => event.include_in_balance)
            .reduce((total, event) => total + Number(event.points_delta || 0), 0),
        )
      : Number(person.redeemable_points ?? fallbackPoints)

    return {
      ...person,
      lifetime_points: lifetimePoints,
      monthly_points: monthlyPoints,
      points: monthlyPoints,
      redeemable_points: redeemablePoints,
    }
  })
}

function DesktopSidebar({ collapsed, isSigningOut, nameApprovalsCount, onCollapse, onSignOut }) {
  return (
    <aside
      className={`dashboard-desktop-sidebar hidden h-full shrink-0 flex-col border-r border-black/[0.07] bg-white/10 px-3 py-5 transition-[width] duration-300 lg:flex ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
        <Link to="/" aria-label="AURA home" className="flex items-center gap-3 rounded-xl">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[#3867F4] text-white">
            <Sparkles size={19} strokeWidth={2.2} />
          </span>
          {!collapsed && <span className="text-base font-black tracking-[0.12em] text-[#17201e]">AURA</span>}
        </Link>
        {!collapsed && (
          <button
            aria-label="Collapse sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5e706b] transition hover:bg-white/45 hover:text-[#17201e]"
            onClick={onCollapse}
            type="button"
          >
            <PanelLeftClose size={17} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          aria-label="Expand sidebar"
          className="mx-auto mt-4 flex h-9 w-9 items-center justify-center rounded-xl text-[#5e706b] transition hover:bg-white/45 hover:text-[#17201e]"
          onClick={onCollapse}
          type="button"
        >
          <PanelLeftOpen size={17} />
        </button>
      )}

      <nav className="mt-12 space-y-2">
        {navItems.map((item) => (
          <NavLink
            aria-label={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative flex h-12 items-center rounded-xl text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#17201e]/20 ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} ${
                isActive
                  ? 'bg-white/65 text-[#17201e] shadow-[0_8px_24px_rgba(59,82,77,0.06)]'
                  : 'text-[#60716d] hover:bg-white/35 hover:text-[#17201e]'
              }`
            }
            end={item.end}
            key={item.href}
            to={item.href}
          >
            <item.icon size={17} />
            {!collapsed && item.label}
            {item.href === '/dashboard/reviews' && nameApprovalsCount > 0 && (
              <span className={`${collapsed ? 'absolute right-1.5 top-1.5 h-2 w-2' : 'ml-auto flex h-5 min-w-5 items-center justify-center px-1 text-[10px]'} rounded-full bg-[#3867F4] font-black text-white`}>
                {!collapsed && nameApprovalsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <button
        aria-label={collapsed ? 'Log out' : undefined}
        className={`mt-auto flex h-12 items-center rounded-xl border border-black/[0.07] bg-white/25 text-sm font-semibold text-[#52645f] transition hover:bg-white/55 hover:text-[#17201e] disabled:opacity-50 ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'}`}
        disabled={isSigningOut}
        onClick={onSignOut}
        type="button"
      >
        <LogOut size={17} />
        {!collapsed && <span>{isSigningOut ? 'Logging out…' : 'Log out'}</span>}
      </button>
    </aside>
  )
}

function MobileNav({ nameApprovalsCount }) {
  return (
    <nav className="dashboard-mobile-nav fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 rounded-2xl border border-black/10 bg-[#d8e8e4]/95 p-2 text-[#53635f] shadow-[0_22px_65px_rgba(32,49,45,0.18)] backdrop-blur-xl lg:hidden">
      {navItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#17201e]/20 ${
              isActive ? 'bg-[#3867F4] text-white' : 'text-[#53635f]'
            }`
          }
          end={item.end}
          key={item.href}
          to={item.href}
        >
          <item.icon size={17} />
          {item.label}
          {item.href === '/dashboard/reviews' && nameApprovalsCount > 0 && (
            <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-[#3867F4]" />
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const initialState = useMemo(() => {
    if (!isLocalPreview) return readLocalState()

    const demoState = buildDemoDashboardState(defaultReviews)
    return {
      autoReplySettings: defaultAutoReplySettings,
      categories: defaultCategories,
      nameApprovals: [],
      pointEvents: demoState.pointEvents,
      pointsRules: defaultPointsRules,
      redemptions: [],
      rewards: defaultRewards,
      reviews: demoState.reviews,
      staff: demoState.staff,
    }
  }, [isLocalPreview])
  const [businessProfile, setBusinessProfile] = useState(
    isLocalPreview
      ? { business_name: 'Hilton Glasgow Demo', public_slug: 'hilton-glasgow-demo-9663c5f4' }
      : null,
  )
  const [autoReplySettings, setAutoReplySettings] = useState(initialState.autoReplySettings)
  const [categories, setCategories] = useState(initialState.categories)
  const [nameApprovals, setNameApprovals] = useState(initialState.nameApprovals)
  const [pointEvents, setPointEvents] = useState(initialState.pointEvents)
  const [pointsRules, setPointsRules] = useState(initialState.pointsRules)
  const [redemptions, setRedemptions] = useState(initialState.redemptions)
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
  const [leaderboardPinEnabled, setLeaderboardPinEnabled] = useState(false)

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
          .select('id,user_id,business_name,public_slug,leaderboard_public,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
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
            .select('id,user_id,business_name,public_slug,leaderboard_public,created_at')
            .single()

          if (profileCreateError) throw profileCreateError
          profile = createdProfile
        }

        const publicSlug =
          profile.public_slug || `${toSlug(profile.business_name || fallbackBusinessName)}-${profile.id.slice(0, 8)}`

        if (!profile.public_slug || !profile.leaderboard_public) {
          const { data: updatedProfile, error: profileUpdateError } = await supabase
            .from('business_profiles')
            .update({ leaderboard_public: true, public_slug: publicSlug })
            .eq('id', profile.id)
            .select('id,user_id,business_name,public_slug,leaderboard_public,created_at')
            .single()

          if (profileUpdateError) throw profileUpdateError
          profile = updatedProfile
        }

        const [staffResult, rewardsResult, pointEventsResult, redemptionsResult] = await Promise.all([
          supabase
            .from('aura_staff')
            .select('*')
            .eq('business_profile_id', profile.id)
            .order('name'),
          supabase
            .from('aura_rewards')
            .select('*')
            .eq('business_profile_id', profile.id)
            .order('points_required'),
          supabase
            .from('aura_point_events')
            .select('*')
            .eq('business_profile_id', profile.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('aura_reward_redemptions')
            .select('*')
            .eq('business_profile_id', profile.id)
            .order('redeemed_at', { ascending: false }),
        ])

        const dataError =
          staffResult.error || rewardsResult.error || pointEventsResult.error || redemptionsResult.error
        if (dataError) throw dataError

        let rewardRows = rewardsResult.data || []
        if (!rewardRows.length) {
          const { data: createdRewards, error: rewardsCreateError } = await supabase
            .from('aura_rewards')
            .insert(
              defaultRewards.map((reward) => ({
                business_profile_id: profile.id,
                description: reward.description,
                is_active: reward.is_active,
                points_required: reward.points_required,
                title: reward.title,
              })),
            )
            .select('*')

          if (rewardsCreateError) throw rewardsCreateError
          rewardRows = createdRewards || []
        }

        const staffRows = normalizeStaff(staffResult.data || [])
        const staffNames = new Map(staffRows.map((person) => [person.id, person.name]))
        const eventRows = normalizePointEvents(
          (pointEventsResult.data || []).map((event) => ({
            ...event,
            staff_name: staffNames.get(event.staff_id) || 'Team member',
          })),
        )
        const visibleReviews = isDevAccount ? normalizeReviews(defaultReviews) : []
        const { data: publicAccess } = await supabase.rpc('get_aura_public_leaderboard', {
          p_pin: null,
          p_slug: profile.public_slug,
        })

        if (!isMounted) return
        setBusinessProfile(profile)
        setReviews(visibleReviews)
        setConnectionStatus('connected')
        setTechnicalNotice('')
        setCategories(
          normalizeCategories([
            ...defaultCategories,
            ...staffRows.map((person) => person.job_category),
          ]),
        )
        setNameApprovals([])
        setPointEvents(eventRows)
        setPointsRules(defaultPointsRules)
        setRedemptions(redemptionsResult.data || [])
        setRewards(normalizeRewards(rewardRows))
        setStaff(staffRows)
        setLeaderboardPinEnabled(publicAccess?.status === 'pin_required')
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
      JSON.stringify({ autoReplySettings, categories, nameApprovals, pointEvents, pointsRules, redemptions, rewards, reviews, staff }),
    )
  }, [autoReplySettings, categories, nameApprovals, pointEvents, pointsRules, redemptions, rewards, reviews, staff])

  const overview = useMemo(() => {
    const reviewsThisMonth = reviews.filter((review) => isThisMonth(review.created_at))
    const pointsThisMonth = pointEvents
      .filter((event) => event.include_in_monthly && isThisMonth(event.created_at))
      .reduce((total, event) => total + Number(event.points_delta || 0), 0)
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

  const staffWithPoints = useMemo(() => addPointTotals(staff, pointEvents), [pointEvents, staff])

  const leaderboard = useMemo(
    () =>
      staffWithPoints
        .filter((person) => person.is_active)
        .slice()
        .sort(
          (a, b) =>
            Number(b.monthly_points) - Number(a.monthly_points) ||
            Number(b.total_mentions) - Number(a.total_mentions) ||
            a.name.localeCompare(b.name),
        ),
    [staffWithPoints],
  )

  async function addStaff(form) {
    let record = buildStaffRecord(form)

    if (supabase && businessProfile) {
      const payload = {
        business_profile_id: businessProfile.id,
        is_active: record.is_active,
        job_category: record.job_category,
        job_title: record.job_title,
        name: record.name,
      }
      const query = isUuid(record.id)
        ? supabase.from('aura_staff').update(payload).eq('id', record.id)
        : supabase.from('aura_staff').insert(payload)
      const { data, error } = await query.select('*').single()

      if (error) throw error
      record = normalizeStaff([data])[0]
    }

    const nextStaff = normalizeStaff([
      ...staff.filter(
        (person) => person.id !== record.id && person.name.toLowerCase() !== record.name.toLowerCase(),
      ),
      record,
    ])

    setStaff(nextStaff)
    if (!categories.includes(record.job_category)) setCategories((current) => [...current, record.job_category])

    return record
  }

  async function setStaffActive(staffId, isActive) {
    if (supabase && businessProfile && isUuid(staffId)) {
      const { error } = await supabase
        .from('aura_staff')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', staffId)
        .eq('business_profile_id', businessProfile.id)

      if (error) throw error
    }

    setStaff((current) =>
      current.map((person) => (person.id === staffId ? { ...person, is_active: isActive } : person)),
    )
  }

  async function adjustPoints({ amount, reason, staffId }) {
    const person = staffWithPoints.find((item) => item.id === staffId)
    const pointsDelta = Number(amount)
    if (!person || !pointsDelta || !reason.trim()) return

    let nextEvent = normalizePointEvents([
      {
        created_at: new Date().toISOString(),
        event_type: 'manual_adjustment',
        id: createId('point'),
        include_in_balance: true,
        include_in_lifetime: true,
        include_in_monthly: true,
        points_delta: pointsDelta,
        reason: reason.trim(),
        staff_id: staffId,
        staff_name: person.name,
      },
    ])[0]

    if (supabase && businessProfile && isUuid(staffId)) {
      const { data, error } = await supabase
        .from('aura_point_events')
        .insert({
          business_profile_id: businessProfile.id,
          created_by: user?.id || null,
          event_type: 'manual_adjustment',
          include_in_balance: true,
          include_in_lifetime: true,
          include_in_monthly: true,
          points_delta: pointsDelta,
          reason: reason.trim(),
          staff_id: staffId,
        })
        .select('*')
        .single()

      if (error) throw error
      nextEvent = normalizePointEvents([{ ...data, staff_name: person.name }])[0]
    }

    setPointEvents((current) => normalizePointEvents([nextEvent, ...current]))
  }

  async function redeemReward({ note = '', rewardId, staffId }) {
    const person = staffWithPoints.find((item) => item.id === staffId)
    const reward = rewards.find((item) => item.id === rewardId)
    if (!person || !reward || person.redeemable_points < Number(reward.points_required)) return

    if (supabase && businessProfile && isUuid(staffId) && isUuid(rewardId)) {
      const { error: redemptionError } = await supabase.rpc('redeem_aura_reward', {
        p_note: note,
        p_reward_id: rewardId,
        p_staff_id: staffId,
      })
      if (redemptionError) throw redemptionError

      const [eventsResult, redemptionsResult] = await Promise.all([
        supabase
          .from('aura_point_events')
          .select('*')
          .eq('business_profile_id', businessProfile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('aura_reward_redemptions')
          .select('*')
          .eq('business_profile_id', businessProfile.id)
          .order('redeemed_at', { ascending: false }),
      ])
      if (eventsResult.error) throw eventsResult.error
      if (redemptionsResult.error) throw redemptionsResult.error

      const staffNames = new Map(staff.map((item) => [item.id, item.name]))
      setPointEvents(
        normalizePointEvents(
          (eventsResult.data || []).map((event) => ({
            ...event,
            staff_name: staffNames.get(event.staff_id) || 'Team member',
          })),
        ),
      )
      setRedemptions(redemptionsResult.data || [])
      return
    }

    const now = new Date().toISOString()
    setPointEvents((current) =>
      normalizePointEvents([
        {
          created_at: now,
          event_type: 'reward_redemption',
          include_in_balance: true,
          include_in_lifetime: false,
          include_in_monthly: false,
          points_delta: -Number(reward.points_required),
          reason: `Redeemed ${reward.title}`,
          staff_id: staffId,
          staff_name: person.name,
        },
        ...current,
      ]),
    )
    setRedemptions((current) => [
      {
        id: createId('redemption'),
        note,
        points_spent: Number(reward.points_required),
        redeemed_at: now,
        reward_id: rewardId,
        staff_id: staffId,
      },
      ...current,
    ])
  }

  async function setLeaderboardPin(pin) {
    if (!supabase) return
    const { error } = await supabase.rpc('set_aura_leaderboard_pin', {
      p_pin: pin.trim() || null,
    })
    if (error) throw error
    setLeaderboardPinEnabled(Boolean(pin.trim()))
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

  async function updateAutoReplySettings(settings) {
    setAutoReplySettings(normalizeAutoReplySettings(settings))
  }

  async function updateReviewReply(reviewId, reply) {
    const cleanReply = reply.trim()
    if (!cleanReply) return

    setReviews((current) =>
      current.map((review) =>
        review.id === reviewId
          ? { ...review, aura_reply: cleanReply, aura_reply_updated_at: new Date().toISOString() }
          : review,
      ),
    )
  }

  async function saveReward(reward) {
    let nextReward = {
      ...reward,
      id: reward.id || createId('reward'),
      points_required: Number(reward.points_required || 1),
      is_active: Boolean(reward.is_active),
      created_at: reward.created_at || new Date().toISOString(),
    }

    if (supabase && businessProfile) {
      const payload = {
        business_profile_id: businessProfile.id,
        description: nextReward.description,
        is_active: nextReward.is_active,
        points_required: nextReward.points_required,
        title: nextReward.title,
        updated_at: new Date().toISOString(),
      }
      const query = isUuid(nextReward.id)
        ? supabase.from('aura_rewards').update(payload).eq('id', nextReward.id)
        : supabase.from('aura_rewards').insert(payload)
      const { data, error } = await query.select('*').single()

      if (error) throw error
      nextReward = normalizeRewards([data])[0]
    }

    setRewards((current) =>
      normalizeRewards([
        ...current.filter((item) => item.id !== nextReward.id),
        nextReward,
      ]),
    )
  }

  async function deleteReward(rewardId) {
    if (supabase && businessProfile && isUuid(rewardId)) {
      const { error } = await supabase
        .from('aura_rewards')
        .delete()
        .eq('id', rewardId)
        .eq('business_profile_id', businessProfile.id)

      if (error) throw error
    }
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
      adjustPoints,
      approveName,
      deleteReward,
      ignoreName,
      redeemReward,
      saveReward,
      setLeaderboardPin,
      setStaffActive,
      updateAutoReplySettings,
      updatePointsRule,
      updateReviewReply,
    },
    account: {
      businessProfile,
      email: user?.email || '',
      user,
    },
    autoReplySettings,
    categories,
    connectionStatus,
    leaderboard,
    leaderboardPinEnabled,
    nameApprovals,
    overview,
    pointEvents,
    pointsRules,
    redemptions,
    rewards,
    reviews,
    staff: staffWithPoints,
    technicalNotice,
  }

  return (
    <main className="dashboard-shell h-screen overflow-hidden bg-[#d8e8e4] text-[#17201e]">
      <div className="dashboard-frame relative flex h-full overflow-hidden bg-[#d8e8e4]">
        <DesktopSidebar
          collapsed={isSidebarCollapsed}
          isSigningOut={isSigningOut}
          nameApprovalsCount={nameApprovals.length}
          onCollapse={() => setIsSidebarCollapsed((value) => !value)}
          onSignOut={handleSignOut}
        />

        <div className="h-full min-w-0 flex-1 overflow-y-auto overscroll-contain pb-28 lg:pb-0">
          {!isOverviewRoute && (
            <header className="dashboard-topbar sticky top-0 z-20 border-b border-black/[0.07] bg-[#d8e8e4]/85 px-5 py-4 backdrop-blur-2xl sm:px-8 lg:px-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#667873]">Workspace</p>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#17201e] sm:text-3xl">
                    AURA dashboard
                  </h1>
                </div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/[0.07] bg-white/45 px-4 text-sm font-semibold text-[#33433f] transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60 lg:hidden"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  type="button"
                >
                  <LogOut size={17} />
                  <span className="hidden sm:inline">{isSigningOut ? 'Logging out...' : 'Log out'}</span>
                </button>
              </div>
            </header>
          )}

          <section
            className={
              isOverviewRoute
                ? 'mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-7 lg:py-10 xl:px-9'
                : 'mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8'
            }
          >
            <Outlet context={dashboard} />
          </section>
        </div>
      </div>
      <MobileNav nameApprovalsCount={nameApprovals.length} />
    </main>
  )
}
