export const staffNames = ['Caitlin', 'Emma', 'Daniel', 'Sophie', 'John']

export const mockBusiness = {
  name: 'Hilton Glasgow Demo',
}

export const mockReviews = [
  {
    id: 'rev-001',
    author: 'Sarah M',
    rating: 5,
    date: '2026-04-24',
    text: 'Amazing stay at Hilton Glasgow. Caitlin on reception was brilliant and made everything so easy.',
  },
  {
    id: 'rev-002',
    author: 'James R',
    rating: 4,
    date: '2026-04-23',
    text: 'Lovely hotel and great service from Daniel at breakfast. Room was clean and comfortable.',
  },
  {
    id: 'rev-003',
    author: 'Priya K',
    rating: 5,
    date: '2026-04-22',
    text: 'Emma was so helpful during check-in. Really friendly team and great location.',
  },
  {
    id: 'rev-004',
    author: 'Mark T',
    rating: 2,
    date: '2026-04-21',
    text: 'Room was not ready on time and no one explained what was happening. Disappointing.',
  },
  {
    id: 'rev-005',
    author: 'Fiona L',
    rating: 1,
    date: '2026-04-20',
    text: "Poor experience overall. Had to wait ages and the issue wasn't resolved.",
  },
  {
    id: 'rev-006',
    author: 'Andrew B',
    rating: 5,
    date: '2026-04-19',
    text: 'Sophie and John were both excellent. Really welcoming and professional.',
  },
]

export const defaultRewards = [
  {
    id: 'reward-001',
    name: 'Free coffee',
    description: 'A barista coffee from the hotel lounge.',
    pointsRequired: 20,
    staffRole: 'All staff',
  },
  {
    id: 'reward-002',
    name: '£10 meal voucher',
    description: 'A voucher toward lunch or dinner during shift.',
    pointsRequired: 40,
    staffRole: 'All staff',
  },
  {
    id: 'reward-003',
    name: 'Extra break',
    description: 'A 20 minute wellbeing break approved by the duty manager.',
    pointsRequired: 30,
    staffRole: 'Operations',
  },
  {
    id: 'reward-004',
    name: 'Team lunch entry',
    description: 'Entry into the monthly team lunch draw.',
    pointsRequired: 50,
    staffRole: 'All staff',
  },
]

export const defaultSettings = {
  businessName: mockBusiness.name,
  replyTone: 'Warm and professional',
  autoReply: true,
  negativeApprovalRequired: true,
  staffNames,
}
