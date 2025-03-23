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

    // Simplify the Gemini prompt
    const prompt = `
      Analyze this YouTube creator based on the following data and provide metrics on a scale of 0-100:
      
      CHANNEL: ${channelData.channelTitle}
      DESCRIPTION: ${channelData.channelDescription}
      SUBSCRIBERS: ${channelData.subscriberCount.toLocaleString()}
      VIDEOS: ${channelData.videoCount}
      VIEWS: ${channelData.viewCount.toLocaleString()}
      
      CREDIBILITY: 
      - Wikipedia: ${channelData.hasWikipedia ? "Yes" : "No"}
      - News Articles: ${channelData.newsArticles.length}
      ${channelData.newsArticles.slice(0, 3).map(article => `  - "${article.title}"`).join("\n")}
      
      AUDIENCE ENGAGEMENT:
      - Reddit Posts: ${channelData.redditPosts.length}
      - Sentiment: ${channelData.sentimentAnalysis.positive.toFixed(1)}% positive, ${channelData.sentimentAnalysis.negative.toFixed(1)}% negative
      
      CONTENT ANALYSIS:
      - Educational Terms: ${countEducationalTerms(channelData.comments)}
      - Inappropriate Terms: ${countInappropriateTerms(channelData.comments)}
      
      SAMPLE COMMENTS (5 of ${channelData.comments.length}):
      ${channelData.comments.slice(0, 5).map(comment => `- "${comment}"`).join("\n")}
      
      Provide a valid JSON response with this exact structure:
      {
        "overallScore": number (0-100),
        "metrics": {
          "audienceSentiment": {"score": number, "description": "string"},
          "contentQuality": {"score": number, "description": "string"},
          "credibility": {"score": number, "description": "string"},
          "relevance": {"score": number, "description": "string"},
          "appropriateness": {"score": number, "description": "string"},
          "engagement": {"score": number, "description": "string"}
        },
        "analysis": "string",
        "recommendations": ["string", "string", "string", "string"]
      }
      
      IMPORTANT SCORING RULES:
      - No Wikipedia page reduces content quality by 40 points
      - Educational terms should increase content quality
      - Inappropriate terms should decrease appropriateness
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

    try {
      // First try to parse the entire response if it's already JSON
      const result = JSON.parse(textResponse) as GeminiAnalysisResult;
      return validateAndNormalizeScores(result, channelData);
    } catch (error) {
      // If that fails, try to extract JSON using a more robust regex
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]) as GeminiAnalysisResult;
          return validateAndNormalizeScores(result, channelData);
        } catch (parseError) {
          console.error("Error parsing extracted JSON:", parseError);
          return generateFallbackAnalysis(channelData);
        }
      } else {
        console.warn("No JSON found in Gemini response");
        return generateFallbackAnalysis(channelData);
      }
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return generateFallbackAnalysis(channelData)
  }
}

// Add this new function to validate and normalize scores
function validateAndNormalizeScores(result: GeminiAnalysisResult, channelData: ChannelData): GeminiAnalysisResult {
  // Validate and normalize scores
  result.overallScore = normalizeScore(result.overallScore);
  result.metrics.audienceSentiment.score = normalizeScore(result.metrics.audienceSentiment.score);
  result.metrics.contentQuality.score = normalizeScore(result.metrics.contentQuality.score);
  result.metrics.credibility.score = normalizeScore(result.metrics.credibility.score);
  result.metrics.relevance.score = normalizeScore(result.metrics.relevance.score);
  result.metrics.appropriateness.score = normalizeScore(result.metrics.appropriateness.score);
  result.metrics.engagement.score = normalizeScore(result.metrics.engagement.score);
  
  // Apply Wikipedia penalty consistently
  if (!channelData.hasWikipedia) {
    const originalScore = result.metrics.contentQuality.score;
    result.metrics.contentQuality.score = Math.max(0, originalScore - 40);
    result.metrics.contentQuality.description = 
      `Score reduced from ${originalScore} to ${result.metrics.contentQuality.score} due to lack of Wikipedia page. ${result.metrics.contentQuality.description}`;
  }
  
  // Recalculate overall score with weighted contributions
  result.overallScore = Math.round(
    result.metrics.audienceSentiment.score * 0.15 +
    result.metrics.contentQuality.score * 0.25 +
    result.metrics.credibility.score * 0.25 +
    result.metrics.relevance.score * 0.15 +
    result.metrics.appropriateness.score * 0.1 +
    result.metrics.engagement.score * 0.1
  );
  
  return result;
}

// Helper functions for term counting
function countEducationalTerms(comments: string[]): number {
  const educationalPattern = /(learn|educational|informative|taught|study|knowledge|science|math|physics|chemistry|biology|history|literature|academic|research|professor|teacher|lecture|curriculum|education|university|college|school|classroom|student|scholar|learning|teaching|tutor|lesson|course|workshop|training|expert|phd|master|degree)/gi;
  
  return comments.join(' ').match(educationalPattern)?.length || 0;
}

function countInappropriateTerms(comments: string[]): number {
  // More focused pattern for truly inappropriate content
  const inappropriatePattern = /(\bporn\b|\bxxx\b|obscene|explicit adult|hardcore|x-rated|nude|naked|erotic|\bmasturbat|\bf[*u]ck(?!ing amazing)|\bsh[*i]t(?!ting)|\bd[*i]ck\b|\bp[*u]ssy\b|\bc[*u]nt\b|\bslut\b|\bwhore\b|kill yourself|suicide instruction|racial slur|\bn[*-]word\b|antisemit|gore|self harm|comedian|भोजपुरी|comedy| Kallu)/gi;
  
  // Excluded terms that were causing false positives
  const excludedContextPattern = /(\bcoding\b|\bprogramming\b|\btutorial\b|\btech\b|\blearning\b|\beducational\b|\bjavascript\b|\bhtml\b|\bcss\b|\bweb dev\b|\bsoftware\b|\breact\b|\bangular\b|\bnode\b|\bpython\b)/i;
  
  let count = 0;
  
  for (const comment of comments) {
    // Skip comments in educational or tech context
    if (excludedContextPattern.test(comment)) {
      continue;
    }
    
    // Count truly inappropriate terms
    const matches = comment.match(inappropriatePattern);
    if (matches) {
      count += matches.length;
    }
  }
  
  return count;
}

// Helper function to normalize scores to 0-100 range
function normalizeScore(score: number): number {
  if (isNaN(score)) return 50
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Replace the existing generateFallbackAnalysis function with this more balanced version
function generateFallbackAnalysis(channelData: ChannelData): GeminiAnalysisResult {
  // Count educational and inappropriate terms
  const educationalTerms = countEducationalTerms(channelData.comments);
  const inappropriateTerms = countInappropriateTerms(channelData.comments);
  
  // Calculate content quality score
  let contentQualityScore = 70; // Start with a moderate score
  
  // Apply Wikipedia penalty
  if (!channelData.hasWikipedia) {
    contentQualityScore -= 40;
  }
  
  // Add points for educational content
  contentQualityScore += Math.min(educationalTerms * 2, 30);
  
  // Calculate appropriateness score with stricter penalties
  let appropriatenessScore = 80; // Start high

  // Apply significant penalty for ANY inappropriate content
  if (inappropriateTerms > 0) {
    // Apply an immediate -40 penalty for any inappropriate content
    appropriatenessScore -= 45;
    
    // Additional penalties for more instances
    if (inappropriateTerms > 1) {
      appropriatenessScore -= Math.min((inappropriateTerms - 1) * 5, 30);
    }
    
    // Cap the minimum score
    appropriatenessScore = Math.max(appropriatenessScore, 10);
  }
  
  // Calculate sentiment score
  const sentimentScore = Math.round(
    50 + (channelData.sentimentAnalysis.positive - channelData.sentimentAnalysis.negative) * 0.5
  );
  
  // Calculate credibility score
  const credibilityScore = channelData.hasWikipedia ? 65 : 35;
  
  // Calculate engagement score
  const engagementScore = 60 + Math.min(channelData.redditPosts.length * 2, 30);
  
  // Calculate relevance score
  const relevanceScore = 50 + Math.min(educationalTerms, 40);
  
  // Calculate overall score
  const overallScore = Math.round(
    sentimentScore * 0.15 +
    contentQualityScore * 0.25 +
    credibilityScore * 0.25 +
    relevanceScore * 0.15 +
    appropriatenessScore * 0.1 +
    engagementScore * 0.1
  );
  
  return {
    overallScore,
    metrics: {
      audienceSentiment: {
        score: sentimentScore,
        description: `Audience sentiment shows ${channelData.sentimentAnalysis.positive.toFixed(1)}% positive engagement.`
      },
      contentQuality: {
        score: contentQualityScore,
        description: `${channelData.hasWikipedia ? 'Wikipedia presence indicates notable content.' : 'Lack of Wikipedia presence (-40 points)'} with ${educationalTerms} educational mentions.`
      },
      credibility: {
        score: credibilityScore,
        description: `Based on ${channelData.hasWikipedia ? 'Wikipedia presence' : 'absence of Wikipedia'} and ${channelData.newsArticles.length} news mentions.`
      },
      relevance: {
        score: relevanceScore,
        description: `Relevance based on educational terms (${educationalTerms}) and overall impact.`
      },
      appropriateness: {
        score: appropriatenessScore,
        description: `Content appropriateness shows ${inappropriateTerms} concerning mentions.`
      },
      engagement: {
        score: engagementScore,
        description: `Engagement from ${channelData.redditPosts.length} Reddit posts and comment patterns.`
      }
    },
    analysis: `${channelData.channelTitle} shows ${overallScore >= 80 ? 'strong' : overallScore >= 60 ? 'moderate' : 'limited'} influence. ${channelData.hasWikipedia ? 'Wikipedia presence boosts credibility' : 'Lack of Wikipedia impacts content quality assessment'}. Educational value (${educationalTerms} mentions) and content appropriateness (${inappropriateTerms} flags) are key factors.`,
    recommendations: [
      channelData.hasWikipedia ? 
        "Continue building on established credibility" : 
        "Work toward Wikipedia inclusion through notable content",
      educationalTerms > 10 ?
        "Expand educational focus for increased relevance" :
        "Increase educational content for better quality scores",
      inappropriateTerms > 0 ?
        "Address content appropriateness for improved scores" :
        "Maintain high content standards while expanding reach",
      "Develop more engagement through Reddit and other platforms"
    ]
  };
}

