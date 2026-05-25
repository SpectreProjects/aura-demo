export const defaultCategories = [
  'Front of House',
  'Kitchen',
  'Waiting Staff',
  'Bar',
  'Reception',
  'Housekeeping',
  'Management',
]

export const defaultPointsRules = {
  1: 0,
  2: 0,
  3: 0,
  4: 3,
  5: 5,
}

export const defaultStaff = [
  {
    id: 'caitlin',
    name: 'Caitlin',
    job_title: 'Reception Manager',
    job_category: 'Reception',
    employment_type: 'Full time',
    contractual_hours: '40',
  },
  {
    id: 'emma',
    name: 'Emma',
    job_title: 'Guest Experience Lead',
    job_category: 'Front of House',
    employment_type: 'Full time',
    contractual_hours: '37.5',
  },
  {
    id: 'daniel',
    name: 'Daniel',
    job_title: 'Restaurant Supervisor',
    job_category: 'Waiting Staff',
    employment_type: 'Full time',
    contractual_hours: '40',
  },
  {
    id: 'sophie',
    name: 'Sophie',
    job_title: 'Housekeeping Lead',
    job_category: 'Housekeeping',
    employment_type: 'Part time',
    contractual_hours: '24',
  },
  {
    id: 'john',
    name: 'John',
    job_title: 'Bar Manager',
    job_category: 'Bar',
    employment_type: 'Full time',
    contractual_hours: '40',
  },
].map((person) => ({
  ...person,
  points: 0,
  total_mentions: 0,
  positive_mentions: 0,
  neutral_mentions: 0,
  negative_mentions: 0,
  latest_excerpt: 'No reviews mentioning this team member yet.',
  created_at: new Date().toISOString(),
}))

export const defaultRewards = [
  {
    id: 'free-coffee',
    title: 'Free coffee',
    description: 'A barista coffee from the hotel lounge or restaurant bar.',
    points_required: 20,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'meal-voucher',
    title: '£10 meal voucher',
    description: 'A voucher toward lunch or dinner during shift.',
    points_required: 40,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'extra-break',
    title: 'Extra break',
    description: 'A 20 minute wellbeing break approved by the duty manager.',
    points_required: 30,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'recognition-badge',
    title: 'Team recognition badge',
    description: 'A monthly recognition badge for standout customer feedback.',
    points_required: 50,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dinner-voucher',
    title: 'Dinner voucher',
    description: 'A dinner voucher for the team member and a guest.',
    points_required: 80,
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

export const defaultReviews = []
