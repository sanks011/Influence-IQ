interface SentimentResult {
  score: number
  positive: number
  negative: number
  neutral: number
}

// Simple word-based sentiment analysis
export function analyzeSentiment(comments: string[]): SentimentResult {
  // Lists of positive and negative words
  const positiveWords = [
    "good",
    "great",
    "awesome",
    "excellent",
    "amazing",
    "love",
    "best",
    "fantastic",
    "helpful",
    "informative",
    "interesting",
    "insightful",
    "useful",
    "brilliant",
    "perfect",
    "wonderful",
    "outstanding",
    "superb",
    "impressive",
    "thank",
    "thanks",
    "appreciate",
    "enjoyed",
    "enjoy",
    "like",
    "liked",
    "quality",
    "valuable",
  ]

  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "poor",
    "worst",
    "waste",
    "boring",
    "useless",
    "disappointing",
    "disappointed",
    "dislike",
    "hate",
    "stupid",
    "wrong",
    "misleading",
    "clickbait",
    "annoying",
    "irritating",
    "garbage",
    "trash",
    "rubbish",
    "nonsense",
    "scam",
    "fake",
    "false",
    "error",
    "mistake",
    "problem",
    "issue",
  ]

  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0

  comments.forEach((comment) => {
    const lowerComment = comment.toLowerCase()
    let isPositive = false
    let isNegative = false

    // Check for positive words
    for (const word of positiveWords) {
      if (lowerComment.includes(word)) {
        isPositive = true
        break
      }
    }

    // Check for negative words
    for (const word of negativeWords) {
      if (lowerComment.includes(word)) {
        isNegative = true
        break
      }
    }

    // Determine sentiment
    if (isPositive && !isNegative) {
      positiveCount++
    } else if (isNegative && !isPositive) {
      negativeCount++
    } else if (isPositive && isNegative) {
      // If both positive and negative words are found, check which has more
      let posMatches = 0
      let negMatches = 0

      for (const word of positiveWords) {
        const regex = new RegExp(`\\b${word}\\b`, "gi")
        const matches = lowerComment.match(regex)
        if (matches) posMatches += matches.length
      }

      for (const word of negativeWords) {
        const regex = new RegExp(`\\b${word}\\b`, "gi")
        const matches = lowerComment.match(regex)
        if (matches) negMatches += matches.length
      }

      if (posMatches > negMatches) {
        positiveCount++
      } else if (negMatches > posMatches) {
        negativeCount++
      } else {
        neutralCount++
      }
    } else {
      neutralCount++
    }
  })

  const total = comments.length
  if (total === 0) {
    return { score: 50, positive: 0, negative: 0, neutral: 0 }
  }

  // Calculate percentages
  const positivePercent = (positiveCount / total) * 100
  const negativePercent = (negativeCount / total) * 100
  const neutralPercent = (neutralCount / total) * 100

  // Calculate sentiment score (0-100)
  // Formula: 50 + (positive% - negative%) * 0.5
  // This gives a neutral score of 50, and adjusts up or down based on sentiment
  const sentimentScore = Math.round(50 + (positivePercent - negativePercent) * 0.5)

  return {
    score: Math.max(0, Math.min(100, sentimentScore)),
    positive: positivePercent,
    negative: negativePercent,
    neutral: neutralPercent,
  }
}

