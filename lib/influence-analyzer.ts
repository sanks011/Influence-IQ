import type { InfluenceScore, InfluenceMetric } from "./types"
import { getYouTubeChannelInfo, getChannelVideos, getYouTubeComments } from "./api/youtube"
import { getWikipediaPageInfo } from "./api/wikipedia"
import { getNewsArticles } from "./api/news"
import { getRedditEngagement } from "./api/reddit"
import { analyzeSentiment } from "./sentiment-analysis"
import { getStoredCreatorInfluence, saveCreatorInfluence } from "./db-service"
import { analyzeWithGemini } from "./api/gemini"

export async function getCreatorInfluence(query: string): Promise<InfluenceScore | null> {
  try {
    // Get channel info from YouTube API
    const channelInfo = await getYouTubeChannelInfo(query)
    if (!channelInfo) {
      throw new Error("Could not retrieve channel information.")
    }

    // Check if we already have cached data for this channel
    const cachedData = await getStoredCreatorInfluence(channelInfo.id)
    if (cachedData && isDataFresh(cachedData.updatedAt)) {
      console.log(`Using cached data for channel ${channelInfo.id}`)
      return cachedData
    }

    // Get recent videos from the channel
    const videoIds = await getChannelVideos(channelInfo.id, 5)

    // Get comments from the videos
    let allComments: string[] = []
    for (const videoId of videoIds) {
      try {
        const comments = await getYouTubeComments(videoId, 50)
        allComments = [...allComments, ...comments]
      } catch (error) {
        console.error(`Error fetching comments for video ${videoId}:`, error)
        // Continue with other videos if one fails
      }
    }

    // Perform API calls for different data sources
    // Use Promise.allSettled to continue even if some APIs fail
    const [wikipediaResult, newsResult, redditResult] = await Promise.allSettled([
      getWikipediaPageInfo(channelInfo.title),
      getNewsArticles(channelInfo.title),
      getRedditEngagement(channelInfo.title),
    ])

    // Extract results or use fallbacks
    const wikipediaInfo = wikipediaResult.status === "fulfilled" ? wikipediaResult.value : { exists: false }
    const hasWikipedia = wikipediaInfo.exists
    const wikipediaQuality = wikipediaInfo.quality || "low"
    const newsArticles = newsResult.status === "fulfilled" ? newsResult.value : []
    const redditPosts = redditResult.status === "fulfilled" ? redditResult.value : []

    // Analyze sentiment from comments
    const sentimentResult = analyzeSentiment(allComments)

    // Prepare data for Gemini analysis
    const channelData = {
      channelTitle: channelInfo.title,
      channelDescription: channelInfo.description,
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
      comments: allComments,
      hasWikipedia,
      newsArticles,
      redditPosts,
      sentimentAnalysis: {
        positive: sentimentResult.positive,
        negative: sentimentResult.negative,
        neutral: sentimentResult.neutral,
      },
    }

    // Get comprehensive analysis from Gemini
    const geminiAnalysis = await analyzeWithGemini(channelData)

    // Convert Gemini metrics to our standard format
    const metrics: InfluenceMetric[] = [
      {
        type: "sentiment",
        label: "Audience Sentiment",
        score: geminiAnalysis.metrics.audienceSentiment.score,
        description: geminiAnalysis.metrics.audienceSentiment.description,
      },
      {
        type: "quality",
        label: "Content Quality",
        score: geminiAnalysis.metrics.contentQuality.score,
        description: geminiAnalysis.metrics.contentQuality.description,
      },
      {
        type: "credibility",
        label: "Credibility",
        score: geminiAnalysis.metrics.credibility.score,
        description: geminiAnalysis.metrics.credibility.description,
      },
      {
        type: "relevance",
        label: "Field Relevance",
        score: geminiAnalysis.metrics.relevance.score,
        description: geminiAnalysis.metrics.relevance.description,
      },
      {
        type: "appropriateness",
        label: "Content Appropriateness",
        score: geminiAnalysis.metrics.appropriateness.score,
        description: geminiAnalysis.metrics.appropriateness.description,
      },
      {
        type: "engagement",
        label: "Audience Engagement",
        score: geminiAnalysis.metrics.engagement.score,
        description: geminiAnalysis.metrics.engagement.description,
      },
    ]

    const result: InfluenceScore = {
      channelId: channelInfo.id,
      channelTitle: channelInfo.title,
      channelDescription: channelInfo.description,
      channelThumbnail: channelInfo.thumbnail,
      subscriberCount: formatSubscriberCount(channelInfo.subscriberCount),
      overallScore: geminiAnalysis.overallScore,
      metrics,
      geminiAnalysis: {
        audienceSentiment: geminiAnalysis.metrics.audienceSentiment,
        contentQuality: geminiAnalysis.metrics.contentQuality,
        credibility: geminiAnalysis.metrics.credibility,
        relevance: geminiAnalysis.metrics.relevance,
        appropriateness: geminiAnalysis.metrics.appropriateness,
        engagement: geminiAnalysis.metrics.engagement,
        analysis: geminiAnalysis.analysis,
        recommendations: geminiAnalysis.recommendations,
      },
      updatedAt: new Date().toISOString(),
    }

    // Save to Firebase for future use
    try {
      await saveCreatorInfluence(result)
    } catch (error) {
      console.error("Error saving to Firebase:", error)
      // Continue even if saving fails
    }

    return result
  } catch (error) {
    console.error("Error analyzing creator influence:", error)
    throw error
  }
}

// Helper function to format subscriber count
function formatSubscriberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

// Helper function to check if data is fresh (less than 24 hours old)
function isDataFresh(updatedAt: string): boolean {
  const lastUpdate = new Date(updatedAt).getTime()
  const now = new Date().getTime()
  const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60)

  return hoursDiff < 24
}

