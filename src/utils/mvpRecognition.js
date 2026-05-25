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
])

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

export function detectUnresolvedStaffNames(reviewText, staff) {
  const knownNames = new Set(staff.map((person) => person.name.toLowerCase()))
  const candidates = new Map()
  const text = String(reviewText || '')
  const patterns = [
    /\b(?:thanks to|thank you|shoutout to|shout out to|served by|helped by|looked after by|checked in by|welcomed by|from|with|by)\s+([a-z][a-z'-]{1,24})\b/gi,
    /\b([a-z][a-z'-]{1,24})\s+(?:was|is|were|helped|served|welcomed|greeted|made|handled|resolved|recommended|checked|took)\b/gi,
  ]

  patterns.forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      const name = titleCaseName(match[1])
      if (isPossibleName(name, knownNames)) candidates.set(name.toLowerCase(), name)
    }
  })

  return Array.from(candidates.values())
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
