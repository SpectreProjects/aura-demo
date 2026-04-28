export function generateReply(review, businessName = 'our hotel', tone = 'Warm and professional') {
  const signature = `- ${businessName}`
  const opener =
    tone === 'Friendly and concise'
      ? 'Thanks'
      : tone === 'Formal and reassuring'
        ? 'Thank you for taking the time to share your feedback'
        : 'Thank you'

  if (review.rating === 5) {
    return `${opener} so much, ${review.author}. We are delighted you had such a brilliant experience with us. Your kind words mean a lot to the team. ${signature}`
  }

  if (review.rating === 4) {
    return `${opener}, ${review.author}. We really appreciate your lovely feedback and are glad you enjoyed your stay. We hope to welcome you back soon. ${signature}`
  }

  if (review.rating === 3) {
    return `Thank you for sharing this, ${review.author}. We appreciate the balanced feedback and will use it to improve the experience for future guests. ${signature}`
  }

  if (review.rating === 2) {
    return `We are sorry your experience fell short, ${review.author}. This is not the standard we want to deliver, and we will review what happened so we can improve. ${signature}`
  }

  return `We are very sorry to read this, ${review.author}. Please contact us directly so we can understand what happened and work to put things right. ${signature}`
}

export function getToneHint(tone) {
  return tone || 'Warm and professional'
}
