import { defaultPointsRules } from '../data/mvpData'

export function getPointsForRating(rating, pointsRules = defaultPointsRules) {
  const normalisedRating = Number(rating)
  if (normalisedRating < 4) return 0
  return Number(pointsRules?.[normalisedRating] ?? defaultPointsRules[normalisedRating] ?? 0)
}

export function detectMentionedStaff(reviewText, staff) {
  const text = String(reviewText || '')
  const matches = new Map()

  staff.forEach((person) => {
    if (!person?.name) return
    const escapedName = person.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(^|[^a-z0-9])${escapedName}([^a-z0-9]|$)`, 'i')
    if (pattern.test(text)) matches.set(person.name.toLowerCase(), person.name)
  })

  return Array.from(matches.values())
}

const nameStopWords = new Set([
  'a',
  'an',
  'and',
  'at',
  'bar',
  'breakfast',
  'cafe',
  'check',
  'dinner',
  'food',
  'front',
  'great',
  'guest',
  'hotel',
  'i',
  'lobby',
  'lovely',
  'manager',
  'our',
  'poor',
  'review',
  'really',
  'reception',
  'restaurant',
  'room',
  'service',
  'staff',
  'stay',
  'table',
  'team',
  'the',
  'they',
  'this',
  'very',
  'we',
  'was',
  'were',
  'who',
])

const departmentSignals = [
  {
    category: 'Housekeeping',
    terms: ['housekeeper', 'housekeeping', 'room attendant', 'cleaner', 'cleaning team'],
  },
  {
    category: 'Reception',
    terms: ['front desk', 'front office', 'reception', 'receptionist', 'check-in', 'checked us in'],
  },
  {
    category: 'Waiting Staff',
    terms: ['waiter', 'waitress', 'server', 'waiting staff', 'table service'],
  },
  {
    category: 'Bar',
    terms: ['bartender', 'barman', 'barmaid', 'bar staff'],
  },
  {
    category: 'Kitchen',
    terms: ['chef', 'cook', 'kitchen team'],
  },
  {
    category: 'Management',
    terms: ['duty manager', 'general manager', 'manager', 'supervisor'],
  },
  {
    category: 'Front of House',
    terms: ['front of house', 'hostess', 'host', 'guest services', 'concierge'],
  },
]

function titleCaseName(name) {
  return name
    .trim()
    .replace(/^[^a-z]+|[^a-z]+$/gi, '')
    .toLowerCase()
    .replace(/(^|[-'])\w/g, (letter) => letter.toUpperCase())
}

function isPossibleName(name, knownNames) {
  const normalised = titleCaseName(name)
  const key = normalised.toLowerCase()

  return normalised.length > 1 && !nameStopWords.has(key) && !knownNames.has(key)
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractExplicitNames(reviewText) {
  const candidates = new Map()
  const text = String(reviewText || '')
  const patterns = [
    /\b(?:shout\s*out(?:\s+to)?|special\s+thank\s+you\s+to|thanks\s+to|thank\s+you(?:\s+to)?|served\s+by|helped\s+by|looked\s+after\s+by|checked\s+in\s+by|welcomed\s+by)\s+([a-z][a-z'-]{1,24})\b/gi,
    /\b(?:housekeeper|room\s+attendant|cleaner|front\s+desk(?:\s+worker)?|receptionist|waiter|waitress|server|host|hostess|manager|supervisor|bartender|barman|barmaid|chef|cook|concierge)\s+(?:(?:called|named)\s+)?([a-z][a-z'-]{1,24})\b/gi,
  ]

  patterns.forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      const name = titleCaseName(match[1])
      if (isPossibleName(name, new Set())) candidates.set(name.toLowerCase(), name)
    }
  })

  return Array.from(candidates.values())
}

export function inferReviewDepartment(reviewText, categories = []) {
  const text = String(reviewText || '').toLowerCase()
  const signal = departmentSignals.find((item) => item.terms.some((term) => text.includes(term)))
  if (!signal) return ''

  return (
    categories.find((category) => category.toLowerCase() === signal.category.toLowerCase()) ||
    signal.category
  )
}

export function getReviewRecognitionSuggestions(reviewText, staff = [], categories = []) {
  const text = String(reviewText || '')
  const inferredCategory = inferReviewDepartment(text, categories)
  const candidates = new Map(
    extractExplicitNames(text).map((name) => [name.toLowerCase(), name]),
  )

  staff.forEach((person) => {
    if (!person?.name) return
    const firstName = person.name.trim().split(/\s+/)[0]
    const fullNamePattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(person.name)}([^a-z0-9]|$)`, 'i')
    if (fullNamePattern.test(text)) {
      candidates.delete(firstName.toLowerCase())
      candidates.set(person.name.toLowerCase(), person.name)
      return
    }

    const firstNamePattern = new RegExp(`(^|[^A-Za-z])${escapeRegExp(firstName)}([^A-Za-z]|$)`)
    if (firstNamePattern.test(text)) candidates.set(firstName.toLowerCase(), titleCaseName(firstName))
  })

  return Array.from(candidates.values()).map((candidateName) => {
    const candidateKey = candidateName.toLowerCase()
    const exactMatches = staff.filter((person) => person.name.toLowerCase() === candidateKey)
    const firstNameMatches = staff.filter(
      (person) => person.name.trim().split(/\s+/)[0]?.toLowerCase() === candidateKey,
    )
    let matches = exactMatches.length ? exactMatches : firstNameMatches

    if (matches.length > 1 && inferredCategory) {
      const departmentMatches = matches.filter(
        (person) => person.job_category?.toLowerCase() === inferredCategory.toLowerCase(),
      )
      if (departmentMatches.length) matches = departmentMatches
    }

    const status = matches.length === 1 ? 'matched' : matches.length > 1 ? 'ambiguous' : 'new'

    return {
      confidence: status === 'matched' ? (exactMatches.length ? 'high' : inferredCategory ? 'high' : 'medium') : 'medium',
      matched_staff_ids: matches.map((person) => person.id),
      matched_staff_names: matches.map((person) => person.name),
      name: candidateName,
      status,
      suggested_category: inferredCategory,
    }
  })
}

export function detectUnresolvedStaffNames(reviewText, staff) {
  const knownNames = new Set(staff.map((person) => person.name.toLowerCase()))
  return extractExplicitNames(reviewText).filter((name) => isPossibleName(name, knownNames))
}

export function createExcerpt(text, maxLength = 118) {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength - 1).trim()}...`
}

export function getReviewSentiment(rating) {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}

export function applyReviewToStaff(staff, review, pointsRules = defaultPointsRules) {
  const awardedPoints = getPointsForRating(review.rating, pointsRules)
  const sentiment = getReviewSentiment(review.rating)
  const excerpt = createExcerpt(review.text)
  const mentionedNames = new Set((review.mentioned_staff || []).map((name) => name.toLowerCase()))

  return staff.map((person) => {
    if (!mentionedNames.has(person.name.toLowerCase())) return person

    return {
      ...person,
      points: Number(person.points || 0) + awardedPoints,
      total_mentions: Number(person.total_mentions || 0) + 1,
      positive_mentions: Number(person.positive_mentions || 0) + (sentiment === 'positive' ? 1 : 0),
      neutral_mentions: Number(person.neutral_mentions || 0) + (sentiment === 'neutral' ? 1 : 0),
      negative_mentions: Number(person.negative_mentions || 0) + (sentiment === 'negative' ? 1 : 0),
      latest_excerpt: excerpt,
    }
  })
}

export function getNextReward(person, rewards) {
  const activeRewards = rewards
    .filter((reward) => reward.is_active)
    .slice()
    .sort((a, b) => Number(a.points_required) - Number(b.points_required))

  return (
    activeRewards.find((reward) => Number(reward.points_required) > Number(person.points || 0)) ||
    activeRewards[activeRewards.length - 1] ||
    null
  )
}

export function createStaffRecord(name) {
  const displayName = titleCaseName(name)

  return {
    id: displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: displayName,
    job_title: '',
    job_category: 'Front of House',
    employment_type: '',
    contractual_hours: '',
    points: 0,
    total_mentions: 0,
    positive_mentions: 0,
    neutral_mentions: 0,
    negative_mentions: 0,
    latest_excerpt: 'No reviews mentioning this team member yet.',
    created_at: new Date().toISOString(),
  }
}
