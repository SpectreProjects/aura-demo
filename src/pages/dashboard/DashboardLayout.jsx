import {
  BarChart3,
  Gift,
  Home,
  MessageSquareText,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  defaultCategories,
  defaultPointsRules,
  defaultRewards,
  defaultReviews,
  defaultStaff,
} from '../../data/mvpData'
import { supabase } from '../../lib/supabaseClient'
import {
  applyReviewToStaff,
  createExcerpt,
  createStaffRecord,
  detectMentionedStaff,
  detectUnresolvedStaffNames,
  getPointsForRating,
} from '../../utils/mvpRecognition'

const STORAGE_KEY = 'aura-dashboard-state-v1'

const navItems = [
  { end: true, href: '/dashboard', icon: BarChart3, label: 'Overview' },
  { href: '/dashboard/reviews', icon: MessageSquareText, label: 'Reviews' },
  { href: '/dashboard/staff', icon: Users, label: 'Team' },
  { href: '/dashboard/rewards', icon: Gift, label: 'Rewards' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
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

function pointRuleRows(pointsRules) {
  return [4, 5].map((rating) => ({
    rating,
    points: getPointsForRating(rating, pointsRules),
    updated_at: new Date().toISOString(),
  }))
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
      reviews: normalizeReviews(saved.reviews),
      staff: normalizeStaff(saved.staff),
    }
  } catch {
    return {
      categories: defaultCategories,
      nameApprovals: [],
      pointEvents: [],
      pointsRules: defaultPointsRules,
      rewards: defaultRewards,
      reviews: defaultReviews,
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
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-[#050816]/95 px-5 py-6 text-white shadow-[24px_0_100px_rgba(2,6,23,0.28)] backdrop-blur-2xl lg:block">
      <Link to="/" className="mb-8 flex items-center gap-3 rounded-2xl px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.14)]">
          <Sparkles size={20} />
        </span>
        <span>
          <span className="block text-lg font-black tracking-tight">AURA</span>
          <span className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Customer dashboard</span>
        </span>
      </Link>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                isActive
                  ? 'bg-white text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,0.18)]'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
            end={item.end}
            key={item.href}
            to={item.href}
          >
            <item.icon size={18} />
            {item.label}
            {item.href === '/dashboard/reviews' && nameApprovalsCount > 0 && (
              <span className="ml-auto rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-black text-slate-950">
                {nameApprovalsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-[1.7rem] border border-cyan-300/15 bg-cyan-400/10 p-4">
        <p className="text-sm font-black text-cyan-100">Recognition workspace</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          4 and 5 star mentions become points, rewards and team momentum.
        </p>
      </div>
    </aside>
  )
}

function MobileNav({ nameApprovalsCount }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-3xl border border-white/10 bg-[#050816]/95 p-2 text-white shadow-[0_24px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:hidden">
      {navItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-bold transition ${
              isActive ? 'bg-white text-slate-950' : 'text-slate-400'
            }`
          }
          end={item.end}
          key={item.href}
          to={item.href}
        >
          <item.icon size={17} />
          {item.label}
          {item.href === '/dashboard/reviews' && nameApprovalsCount > 0 && (
            <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-cyan-300" />
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function DashboardLayout() {
  const location = useLocation()
  const isOverviewRoute = location.pathname === '/dashboard'
  const initialState = useMemo(() => readLocalState(), [])
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

  useEffect(() => {
    if (!supabase) return undefined

    let isMounted = true

    async function loadSupabaseData() {
      try {
        const [
          staffResult,
          rewardsResult,
          reviewsResult,
          approvalsResult,
          categoriesResult,
          pointEventsResult,
          pointRulesResult,
        ] =
          await Promise.all([
            supabase.from('staff').select('*').order('name', { ascending: true }),
            supabase.from('rewards').select('*').order('points_required', { ascending: true }),
            supabase.from('reviews').select('*').order('created_at', { ascending: false }),
            supabase.from('unresolved_mentions').select('*').order('created_at', { ascending: false }),
            supabase.from('job_categories').select('*').order('name', { ascending: true }),
            supabase.from('point_events').select('*').order('created_at', { ascending: false }),
            supabase.from('point_rules').select('*').order('rating', { ascending: true }),
          ])

        const loadError =
          staffResult.error ||
          rewardsResult.error ||
          reviewsResult.error ||
          approvalsResult.error ||
          categoriesResult.error ||
          pointEventsResult.error ||
          pointRulesResult.error

        if (loadError) throw loadError

        let nextStaff = normalizeStaff(staffResult.data)
        let nextRewards = normalizeRewards(rewardsResult.data)
        let nextCategories = normalizeCategories(categoriesResult.data)
        let nextPointsRules = normalizePointsRules(pointRulesResult.data)

        if (!staffResult.data?.length) {
          const { error } = await supabase.from('staff').insert(defaultStaff)
          if (error) throw error
          nextStaff = defaultStaff
        }

        if (!rewardsResult.data?.length) {
          const { error } = await supabase.from('rewards').insert(defaultRewards)
          if (error) throw error
          nextRewards = defaultRewards
        }

        if (!categoriesResult.data?.length) {
          const rows = defaultCategories.map((name) => ({ id: toSlug(name), name }))
          const { error } = await supabase.from('job_categories').insert(rows)
          if (error) throw error
          nextCategories = defaultCategories
        }

        const existingRuleRatings = new Set((pointRulesResult.data || []).map((rule) => Number(rule.rating)))
        const missingPointRuleRows = pointRuleRows(defaultPointsRules).filter(
          (rule) => !existingRuleRatings.has(rule.rating),
        )

        if (missingPointRuleRows.length) {
          const { error } = await supabase.from('point_rules').insert(missingPointRuleRows)
          if (error) throw error
          nextPointsRules = normalizePointsRules([...(pointRulesResult.data || []), ...missingPointRuleRows])
        }

        if (!isMounted) return
        setCategories(nextCategories)
        setNameApprovals(normalizeNameApprovals(approvalsResult.data))
        setPointEvents(normalizePointEvents(pointEventsResult.data))
        setPointsRules(nextPointsRules)
        setRewards(nextRewards)
        setReviews(normalizeReviews(reviewsResult.data))
        setStaff(nextStaff)
        setConnectionStatus('connected')
        setTechnicalNotice('')
      } catch (error) {
        if (!isMounted) return
        console.error('[AURA dashboard] Data connection failed:', error)
        setConnectionStatus('demo')
        setTechnicalNotice(
          'The app could not load the dashboard tables. It is using demo data in this browser. Run the SQL in SUPABASE_SETUP.md when you want shared data.',
        )
      }
    }

    loadSupabaseData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categories, nameApprovals, pointEvents, pointsRules, rewards, reviews, staff }),
    )
  }, [categories, nameApprovals, pointEvents, pointsRules, rewards, reviews, staff])

  async function saveToSupabase(action) {
    if (!supabase || connectionStatus !== 'connected') return

    try {
      const { error } = await action()
      if (error) throw error
    } catch (error) {
      console.error('[AURA dashboard] Save failed:', error)
      setConnectionStatus('demo')
      setTechnicalNotice(
        'A save failed against the shared tables. The dashboard has switched to demo data in this browser.',
      )
    }
  }

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

  async function publishReview(form) {
    const rating = Number(form.rating)
    const mentionedStaff = detectMentionedStaff(form.text, staff)
    const newNames = detectUnresolvedStaffNames(form.text, staff)
    const createdAt = new Date(`${form.date || new Date().toISOString().slice(0, 10)}T12:00:00`).toISOString()
    const review = {
      id: createId('review'),
      customer_name: form.customer_name.trim(),
      rating,
      text: form.text.trim(),
      mentioned_staff: mentionedStaff,
      created_at: createdAt,
    }
    const nextApprovals = newNames.map((name) => ({
      id: createId('name'),
      name,
      review_id: review.id,
      review_excerpt: createExcerpt(review.text),
      rating,
      created_at: new Date().toISOString(),
    }))
    const nextStaff = applyReviewToStaff(staff, review, pointsRules)
    const nextPointEvents = createPointEventsForReview(review, nextStaff, pointsRules)
    const nextReviews = normalizeReviews([review, ...reviews])
    const allApprovals = normalizeNameApprovals([...nextApprovals, ...nameApprovals])
    const allPointEvents = normalizePointEvents([...nextPointEvents, ...pointEvents])

    setReviews(nextReviews)
    setStaff(nextStaff)
    setNameApprovals(allApprovals)
    setPointEvents(allPointEvents)

    await saveToSupabase(async () => {
      const reviewResult = await supabase.from('reviews').insert(review)
      if (reviewResult.error) return reviewResult

      const staffResult = await supabase.from('staff').upsert(nextStaff)
      if (staffResult.error) return staffResult

      if (nextPointEvents.length) {
        const pointEventsResult = await supabase.from('point_events').insert(nextPointEvents)
        if (pointEventsResult.error) return pointEventsResult
      }

      if (nextApprovals.length) return supabase.from('unresolved_mentions').insert(nextApprovals)
      return { error: null }
    })

    return {
      matchedNames: mentionedStaff,
      newNames,
      pointsAwarded: nextPointEvents.reduce(
        (total, event) => total + Number(event.points_awarded || 0),
        0,
      ),
    }
  }

  async function addStaff(form) {
    const record = buildStaffRecord(form)
    const nextStaff = normalizeStaff([...staff.filter((person) => person.id !== record.id), record])

    setStaff(nextStaff)
    if (!categories.includes(record.job_category)) setCategories((current) => [...current, record.job_category])

    await saveToSupabase(() => supabase.from('staff').upsert(record))
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

    await saveToSupabase(async () => {
      const staffResult = await supabase.from('staff').upsert(nextStaff)
      if (staffResult.error) return staffResult

      if (review) {
        const updatedReview = nextReviews.find((item) => item.id === review.id)
        const reviewResult = await supabase
          .from('reviews')
          .update({ mentioned_staff: updatedReview.mentioned_staff })
          .eq('id', updatedReview.id)
        if (reviewResult.error) return reviewResult
      }

      if (nextPointEvents.length) {
        const pointEventsResult = await supabase.from('point_events').insert(nextPointEvents)
        if (pointEventsResult.error) return pointEventsResult
      }

      return supabase.from('unresolved_mentions').delete().eq('id', approval.id)
    })
  }

  async function ignoreName(approvalId) {
    setNameApprovals((current) => current.filter((approval) => approval.id !== approvalId))
    await saveToSupabase(() => supabase.from('unresolved_mentions').delete().eq('id', approvalId))
  }

  async function addCategory(name) {
    const cleanName = name.trim()
    if (!cleanName || categories.includes(cleanName)) return

    setCategories((current) => [...current, cleanName])
    await saveToSupabase(() => supabase.from('job_categories').upsert({ id: toSlug(cleanName), name: cleanName }))
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
    await saveToSupabase(() => supabase.from('rewards').upsert(nextReward))
  }

  async function deleteReward(rewardId) {
    setRewards((current) => current.filter((reward) => reward.id !== rewardId))
    await saveToSupabase(() => supabase.from('rewards').delete().eq('id', rewardId))
  }

  async function updatePointsRule(rating, points) {
    const normalisedRating = Number(rating)
    const normalisedPoints = normalisedRating >= 4 ? Math.max(0, Number(points) || 0) : 0
    const nextRules = normalizePointsRules({
      ...pointsRules,
      [normalisedRating]: normalisedPoints,
    })

    setPointsRules(nextRules)

    if (normalisedRating >= 4) {
      await saveToSupabase(() =>
        supabase.from('point_rules').upsert({
          rating: normalisedRating,
          points: normalisedPoints,
          updated_at: new Date().toISOString(),
        }),
      )
    }
  }

  const dashboard = {
    actions: {
      addCategory,
      addStaff,
      approveName,
      deleteReward,
      ignoreName,
      publishReview,
      saveReward,
      updatePointsRule,
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
    <main className="min-h-screen overflow-hidden bg-[#030711] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_28%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(124,58,237,0.13),transparent_30%),linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:auto,auto,72px_72px,72px_72px]" />
      <div className="relative flex">
        <Sidebar nameApprovalsCount={nameApprovals.length} />

        <div className="min-w-0 flex-1 pb-28 lg:pb-0">
          {!isOverviewRoute && (
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#030711]/72 px-5 py-4 backdrop-blur-2xl sm:px-8 lg:px-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-cyan-100">Recognition workspace</p>
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
            <Outlet context={dashboard} />
          </section>
        </div>
      </div>
      <MobileNav nameApprovalsCount={nameApprovals.length} />
    </main>
  )
}
