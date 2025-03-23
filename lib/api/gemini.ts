import axios from "axios"
import type { NewsArticle } from "./news"
import type { RedditPost } from "./reddit"

interface GeminiAnalysisResult {
  overallScore: number
  metrics: {
    audienceSentiment: {
      score: number
      description: string
    }
    contentQuality: {
      score: number
      description: string
    }
    credibility: {
      score: number
      description: string
    }
    relevance: {
      score: number
      description: string
    }
    appropriateness: {
      score: number
      description: string
    }
    engagement: {
      score: number
      description: string
    }
  }
  analysis: string
  recommendations: string[]
}

interface ChannelData {
  channelTitle: string
  channelDescription: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  comments: string[]
  hasWikipedia: boolean
  newsArticles: NewsArticle[]
  redditPosts: RedditPost[]
  sentimentAnalysis: {
    positive: number
    negative: number
    neutral: number
  }
}

export async function analyzeWithGemini(channelData: ChannelData): Promise<GeminiAnalysisResult> {
  try {
    const API_KEY = process.env.GEMINI_API_KEY

    if (!API_KEY) {
      console.warn("Gemini API key not found, using fallback analysis")
      return generateFallbackAnalysis(channelData)
    }

    // Prepare the prompt for Gemini with comprehensive data
    const prompt = `
      You are an expert YouTube creator analyst with extremely high standards. Analyze this YouTube creator based on the following comprehensive data and provide detailed metrics with high sensitivity to differentiate quality.
      
      CHANNEL INFORMATION:
      Channel Name: ${channelData.channelTitle}
      Channel Description: ${channelData.channelDescription}
      Subscriber Count: ${channelData.subscriberCount.toLocaleString()}
      Video Count: ${channelData.videoCount}
      Total View Count: ${channelData.viewCount.toLocaleString()}
      
      CREDIBILITY INDICATORS:
      Has Wikipedia Page: ${channelData.hasWikipedia ? "Yes" : "No"}
      News Articles Found: ${channelData.newsArticles.length}
      ${channelData.newsArticles.length > 0 ? "Sample News Headlines:" : ""}
      ${channelData.newsArticles
        .slice(0, 5)
        .map((article) => `- "${article.title}" (${article.source})`)
        .join("\n")}
      
      AUDIENCE ENGAGEMENT:
      Reddit Posts Found: ${channelData.redditPosts.length}
      ${channelData.redditPosts.length > 0 ? "Sample Reddit Discussions:" : ""}
      ${channelData.redditPosts
        .slice(0, 5)
        .map((post) => `- "${post.title}" (${post.subreddit}, Score: ${post.score}, Comments: ${post.commentCount})`)
        .join("\n")}
      
      AUDIENCE SENTIMENT:
      Positive Comments: ${channelData.sentimentAnalysis.positive.toFixed(1)}%
      Negative Comments: ${channelData.sentimentAnalysis.negative.toFixed(1)}%
      Neutral Comments: ${channelData.sentimentAnalysis.neutral.toFixed(1)}%
      
      SAMPLE COMMENTS (${Math.min(channelData.comments.length, 15)} of ${channelData.comments.length}):
      ${channelData.comments
        .slice(0, 15)
        .map((comment) => `- "${comment}"`)
        .join("\n")}
      
      ANALYSIS INSTRUCTIONS:
      1. Analyze all the data above to provide a comprehensive assessment with extreme sensitivity - truly excellent creators should score 95+ while problematic creators should score below 30.
      2. Be objective and data-driven in your analysis.
      3. CRITICAL: Base content quality assessment primarily on Wikipedia presence. If the creator has NO Wikipedia page, their content quality score MUST be reduced by at least 40 points.
      4. Significantly deduct points for any indication of adult content (18+), excessive vulgarity, misinformation, or harmful content.
      5. Consider the creator's niche and audience when evaluating their influence.
      6. Provide specific, actionable recommendations for improvement.
      
      RESPONSE FORMAT:
      Provide your response in the following JSON format:
      {
        "overallScore": number (0-100),
        "metrics": {
          "audienceSentiment": {
            "score": number (0-100),
            "description": "detailed explanation"
          },
          "contentQuality": {
            "score": number (0-100, MUST be reduced by at least 40 points if no Wikipedia page exists),
            "description": "detailed explanation focusing on Wikipedia presence and news coverage"
          },
          "credibility": {
            "score": number (0-100),
            "description": "detailed explanation"
          },
          "relevance": {
            "score": number (0-100),
            "description": "detailed explanation"
          },
          "appropriateness": {
            "score": number (0-100, higher means more appropriate, deduct points for 18+ or harmful content)",
            "description": "detailed explanation"
          },
          "engagement": {
            "score": number (0-100)",
            "description": "detailed explanation"
          }
        },
        "analysis": "2-3 paragraph overall analysis",
        "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4"]
      }
      
      Ensure your JSON is valid and properly formatted.
    `

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      },
    )

    // Extract the text response from Gemini
    const textResponse = response.data.candidates[0].content.parts[0].text

    // Extract the JSON part from the response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.warn("Failed to parse Gemini response as JSON, using fallback")
      return generateFallbackAnalysis(channelData)
    }

    try {
      const result = JSON.parse(jsonMatch[0]) as GeminiAnalysisResult

      // Validate and normalize scores
      result.overallScore = normalizeScore(result.overallScore)
      result.metrics.audienceSentiment.score = normalizeScore(result.metrics.audienceSentiment.score)

      // Ensure content quality is reduced by 40 if no Wikipedia page
      if (!channelData.hasWikipedia) {
        const originalScore = result.metrics.contentQuality.score
        result.metrics.contentQuality.score = Math.max(0, originalScore - 40)
        result.metrics.contentQuality.description = `Score reduced from ${originalScore} to ${result.metrics.contentQuality.score} due to lack of Wikipedia page. ${result.metrics.contentQuality.description}`
      } else {
        result.metrics.contentQuality.score = normalizeScore(result.metrics.contentQuality.score)
      }

      result.metrics.credibility.score = normalizeScore(result.metrics.credibility.score)
      result.metrics.relevance.score = normalizeScore(result.metrics.relevance.score)
      result.metrics.appropriateness.score = normalizeScore(result.metrics.appropriateness.score)
      result.metrics.engagement.score = normalizeScore(result.metrics.engagement.score)

      // Recalculate overall score to ensure it reflects the content quality reduction
      const avgScore =
        (result.metrics.audienceSentiment.score +
          result.metrics.contentQuality.score +
          result.metrics.credibility.score +
          result.metrics.relevance.score +
          result.metrics.appropriateness.score +
          result.metrics.engagement.score) /
        6

      // Adjust overall score with higher weight to content quality and credibility
      result.overallScore = Math.round(
        result.metrics.audienceSentiment.score * 0.15 +
          result.metrics.contentQuality.score * 0.25 +
          result.metrics.credibility.score * 0.25 +
          result.metrics.relevance.score * 0.15 +
          result.metrics.appropriateness.score * 0.1 +
          result.metrics.engagement.score * 0.1,
      )

      return result
    } catch (parseError) {
      console.error("Error parsing Gemini JSON response:", parseError)
      return generateFallbackAnalysis(channelData)
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return generateFallbackAnalysis(channelData)
  }
}

// Helper function to normalize scores to 0-100 range
function normalizeScore(score: number): number {
  if (isNaN(score)) return 50
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Generate fallback analysis when Gemini API fails
function generateFallbackAnalysis(channelData: ChannelData): GeminiAnalysisResult {
  // Calculate a basic sentiment score from the provided sentiment analysis with increased sensitivity
  const sentimentScore = Math.round(
    50 + (channelData.sentimentAnalysis.positive - channelData.sentimentAnalysis.negative) * 0.9,
  )

  // Calculate content quality based primarily on Wikipedia presence
  // Start with a base score
  let contentQualityScore = 70 // Higher base score for more sensitivity

  // If no Wikipedia page, reduce by 40 points as requested
  if (!channelData.hasWikipedia) {
    contentQualityScore -= 40 // Major reduction for no Wikipedia presence
  }

  // Add points for news coverage with increased sensitivity
  contentQualityScore += Math.min(channelData.newsArticles.length * 3, 30)

  // Calculate credibility score with increased sensitivity
  const hasWikipedia = channelData.hasWikipedia ? 60 : 0 // Increased impact
  const newsScore = Math.min(channelData.newsArticles.length * 6, 35) // Increased impact
  const credibilityScore = Math.min(hasWikipedia + newsScore + 5, 100) // Base 5 points

  // Calculate engagement score with increased sensitivity
  const redditScore = Math.min(channelData.redditPosts.length * 8, 60) // Increased impact
  const commentScore = Math.min(channelData.comments.length * 1.5, 60) // Increased impact
  const engagementScore = Math.round((redditScore + commentScore) / 2)

  // Calculate relevance score with increased sensitivity
  let relevanceScore = 40 // Lower base score for more sensitivity
  if (channelData.hasWikipedia) {
    relevanceScore += 30 // Increased boost for Wikipedia presence
  }
  if (channelData.newsArticles.length > 5) {
    relevanceScore += 20
  } else if (channelData.newsArticles.length > 0) {
    relevanceScore += 10
  }
  if (channelData.redditPosts.length > 10) {
    relevanceScore += 15
  } else if (channelData.redditPosts.length > 0) {
    relevanceScore += 10
  }

  // Default appropriateness score
  const appropriatenessScore = 75

  // Calculate overall score with increased sensitivity and higher weight to content quality and credibility
  const overallScore = Math.round(
    sentimentScore * 0.15 +
      contentQualityScore * 0.25 +
      credibilityScore * 0.25 +
      engagementScore * 0.1 +
      relevanceScore * 0.15 +
      appropriatenessScore * 0.1,
  )

  return {
    overallScore,
    metrics: {
      audienceSentiment: {
        score: sentimentScore,
        description: `Based on comment analysis showing ${channelData.sentimentAnalysis.positive.toFixed(1)}% positive and ${channelData.sentimentAnalysis.negative.toFixed(1)}% negative sentiment.`,
      },
      contentQuality: {
        score: contentQualityScore,
        description: `Based primarily on ${channelData.hasWikipedia ? "presence of Wikipedia page" : "lack of Wikipedia presence (40 point reduction)"} and ${channelData.newsArticles.length} news mentions. Wikipedia presence is a critical indicator of quality content.`,
      },
      credibility: {
        score: credibilityScore,
        description: `Based on ${channelData.hasWikipedia ? "presence of" : "lack of"} Wikipedia page and ${channelData.newsArticles.length} news mentions.`,
      },
      relevance: {
        score: relevanceScore,
        description: `Estimated based on Wikipedia presence, news coverage, and community discussions. ${channelData.hasWikipedia ? "Having a Wikipedia page significantly increases relevance score." : "Lack of Wikipedia presence suggests limited relevance in the broader context."}`,
      },
      appropriateness: {
        score: appropriatenessScore,
        description: `Default appropriateness score. No detailed content analysis available.`,
      },
      engagement: {
        score: engagementScore,
        description: `Based on ${channelData.redditPosts.length} Reddit discussions and comment activity.`,
      },
    },
    analysis: `${channelData.channelTitle} is a YouTube creator with ${channelData.subscriberCount.toLocaleString()} subscribers and ${channelData.videoCount} videos. The channel shows ${overallScore >= 80 ? "a high" : overallScore >= 60 ? "a moderate" : "a relatively low"} level of influence based on available metrics, with particular strengths in ${contentQualityScore > 70 ? "content quality" : credibilityScore > 70 ? "credibility" : engagementScore > 70 ? "audience engagement" : sentimentScore > 70 ? "audience sentiment" : "some areas, though significant improvement is possible"}.

    ${channelData.hasWikipedia ? "The channel has achieved notable status with Wikipedia presence, which strongly indicates quality content and credibility." : "The channel has not yet achieved Wikipedia notable status, which significantly reduces its content quality score. This suggests substantial room for improvement in content quality and credibility."} The audience appears to be ${sentimentScore > 70 ? "highly positive" : sentimentScore > 50 ? "generally positive" : "somewhat mixed"} based on comment analysis. The channel has ${channelData.newsArticles.length > 10 ? "significant" : channelData.newsArticles.length > 0 ? "some" : "minimal"} coverage in news media and ${channelData.redditPosts.length > 10 ? "strong" : channelData.redditPosts.length > 0 ? "some" : "limited"} community discussions on platforms like Reddit.`,
    recommendations: [
      `${channelData.hasWikipedia ? "Maintain Wikipedia presence by continuing to create notable content" : "Work toward establishing notability for Wikipedia inclusion by creating higher quality, more impactful content - this is critical for improving your content quality score"}`,
      "Increase media coverage by creating newsworthy content and reaching out to relevant publications",
      "Engage more actively with audience comments to improve sentiment metrics",
      "Create more shareable content to increase community discussions on platforms like Reddit",
    ],
  }
}

