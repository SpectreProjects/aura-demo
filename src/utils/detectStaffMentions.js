export function pointsForRating(rating) {
  if (rating === 5) return 5
  if (rating === 4) return 3
  return 0
}

export function detectStaffMentions(reviews, staffNames) {
  return reviews.flatMap((review) => {
    const text = review.text.toLowerCase()

    return staffNames
      .filter((name) => text.includes(name.toLowerCase()))
      .map((name) => ({
        id: `${review.id}-${name}`,
        staffName: name,
        reviewId: review.id,
        reviewAuthor: review.author,
        rating: review.rating,
        text: review.text,
        date: review.date,
        points: pointsForRating(review.rating),
      }))
  })
}

export function getStaffRecognition(reviews, staffNames) {
  const mentions = detectStaffMentions(reviews, staffNames)

  return staffNames
    .map((name) => {
      const staffMentions = mentions.filter((mention) => mention.staffName === name)
      const points = staffMentions.reduce((total, mention) => total + mention.points, 0)

      return {
        name,
        points,
        mentions: staffMentions.length,
        fiveStarMentions: staffMentions.filter((mention) => mention.rating === 5).length,
        latestMention: staffMentions[0] || null,
      }
    })
    .sort((a, b) => b.points - a.points || b.mentions - a.mentions || a.name.localeCompare(b.name))
}
